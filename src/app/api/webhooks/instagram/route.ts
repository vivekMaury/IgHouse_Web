import { NextResponse } from "next/server";
import { verifyWebhookSignature, verifyGetChallenge } from "@/lib/meta/webhook-verify";
import { parseWebhookPayload, type ParsedEvent, type WebhookPayload } from "@/lib/meta/parse-webhook";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const challenge = verifyGetChallenge(
    searchParams.get("hub.mode"),
    searchParams.get("hub.verify_token"),
    searchParams.get("hub.challenge")
  );

  if (challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function handleMessageEvent(
  supabase: ReturnType<typeof createAdminClient>,
  event: ParsedEvent,
) {
  const payload = event.payload as Record<string, unknown>;
  const message = payload.message as { mid: string; text?: string; attachments?: Array<{ type: string; payload: { url: string } }> } | undefined;
  const timestamp = payload.timestamp as number | undefined;

  const messageText = message?.text ?? null;
  const firstAttachment = message?.attachments?.[0];
  const mediaUrl = firstAttachment?.payload?.url ?? null;
  const mediaType = firstAttachment?.type ?? null;

  // 1. Look up connected account by the IG account ID that received the webhook
  const { data: account, error: accountErr } = await supabase
    .from("connected_accounts")
    .select("id, workspace_id")
    .eq("platform_account_id", event.ig_account_id)
    .eq("platform", "instagram")
    .eq("is_active", true)
    .single();

  if (accountErr || !account) {
    console.error("[webhook:sync] No connected account for ig_account_id:", event.ig_account_id, accountErr?.message);
    return;
  }

  const { workspace_id, id: connected_account_id } = account;

  // 2. Upsert the sender as a contact
  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .upsert(
      {
        workspace_id,
        platform_scoped_id: event.sender_id,
      },
      { onConflict: "workspace_id,platform_scoped_id" }
    )
    .select("id")
    .single();

  if (contactErr || !contact) {
    console.error("[webhook:sync] Failed to upsert contact:", contactErr?.message, "sender:", event.sender_id);
    return;
  }

  // 3. Get or create the conversation thread
  const { data: conversation, error: convoErr } = await supabase
    .from("conversations")
    .upsert(
      {
        workspace_id,
        contact_id: contact.id,
        connected_account_id,
        status: "open",
      },
      { onConflict: "workspace_id,contact_id,connected_account_id" }
    )
    .select("id")
    .single();

  if (convoErr || !conversation) {
    console.error("[webhook:sync] Failed to upsert conversation:", convoErr?.message, "contact:", contact.id);
    return;
  }

  // 4. Insert the inbound message
  const sentAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

  const { error: msgErr } = await supabase.from("messages").insert({
    workspace_id,
    conversation_id: conversation.id,
    direction: "inbound" as const,
    source: "human" as const,
    content: messageText,
    media_url: mediaUrl,
    media_type: mediaType,
    platform_message_id: event.platform_event_id,
    metadata: {},
    sent_at: sentAt,
  });

  if (msgErr) {
    console.error("[webhook:sync] Failed to insert message:", msgErr.message, "mid:", event.platform_event_id);
    return;
  }

  // 5. Update conversation last_message_at and increment unread count
  await supabase
    .from("conversations")
    .update({ last_message_at: sentAt })
    .eq("id", conversation.id);

  await supabase.rpc("increment_unread", { conversation_id: conversation.id });

  // 6. Update last_webhook_at on the connected account
  await supabase
    .from("connected_accounts")
    .update({ last_webhook_at: new Date().toISOString() })
    .eq("id", connected_account_id);

  console.log(
    `[webhook:sync] Saved inbound message mid=${event.platform_event_id} contact=${contact.id} conversation=${conversation.id}`,
  );
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`webhook:${ip}`, "webhook");
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl.remaining, rl.reset) });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("[webhook] Signature verification failed. signature:", signature?.slice(0, 20) + "...");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: WebhookPayload;
  try {
    body = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.object !== "instagram") {
    console.error("[webhook] Ignored non-instagram object:", body.object);
    return NextResponse.json({ error: "Not instagram" }, { status: 400 });
  }

  const events = parseWebhookPayload(body);
  console.log(`[webhook] Parsed ${events.length} event(s) from ${body.entry.length} entry/entries`);

  if (events.length === 0) {
    console.log("[webhook] No actionable events in payload (read/delivery receipts or echoes)");
  }

  if (events.length > 0) {
    const supabase = createAdminClient();

    for (const event of events) {
      console.log(
        `[webhook] Processing: type=${event.event_type} igAccount=${event.ig_account_id} sender=${event.sender_id} eventId=${event.platform_event_id}`,
      );

      // Log the raw webhook event for debugging
      const { error } = await supabase.from("webhook_events").upsert(
        {
          platform_event_id: event.platform_event_id,
          event_type: event.event_type,
          payload: event.payload,
          status: "received",
        } as Record<string, unknown>,
        { onConflict: "platform_event_id", ignoreDuplicates: true }
      );

      if (error && !error.message.includes("duplicate")) {
        console.error("[webhook] Failed to insert webhook_event:", error.message, "eventId:", event.platform_event_id);
        continue;
      }

      // Synchronous processing: handle message events directly (bypassing Inngest)
      if (event.event_type === "message") {
        try {
          await handleMessageEvent(supabase, event);
        } catch (err) {
          console.error("[webhook:sync] Unhandled error processing message:", err, "eventId:", event.platform_event_id);
        }
      } else {
        console.log(`[webhook] Skipping non-message event type: ${event.event_type} (sync mode only handles messages)`);
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
