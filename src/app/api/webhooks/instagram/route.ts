import { NextResponse } from "next/server";
import { verifyWebhookSignature, verifyGetChallenge } from "@/lib/meta/webhook-verify";
import { parseWebhookPayload, type WebhookPayload } from "@/lib/meta/parse-webhook";
import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/lib/inngest/client";
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

      try {
        await inngest.send({
          name: "instagram/webhook.received",
          data: {
            webhookEventId: event.platform_event_id,
            eventType: event.event_type,
            igAccountId: event.ig_account_id,
            senderId: event.sender_id,
          },
        });
        console.log(`[webhook] Dispatched to Inngest: ${event.platform_event_id}`);
      } catch (err) {
        console.error("[webhook] Inngest dispatch failed:", err, "eventId:", event.platform_event_id);
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
