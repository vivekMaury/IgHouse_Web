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
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: WebhookPayload;
  try {
    body = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.object !== "instagram") {
    return NextResponse.json({ error: "Not instagram" }, { status: 400 });
  }

  const events = parseWebhookPayload(body);

  if (events.length > 0) {
    const supabase = createAdminClient();

    for (const event of events) {
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
        console.error("Failed to insert webhook event:", error.message);
        continue;
      }

      await inngest.send({
        name: "instagram/webhook.received",
        data: {
          webhookEventId: event.platform_event_id,
          eventType: event.event_type,
          igAccountId: event.ig_account_id,
          senderId: event.sender_id,
        },
      });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
