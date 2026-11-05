import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { replayDeadLetterEvent } from "@/lib/dlq";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "failed";
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dead_letter_events")
    .select("id, workspace_id, event_type, platform_event_id, error_message, retry_count, status, created_at, replayed_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [], count: data?.length ?? 0 });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { eventId?: string };
  if (!body.eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const result = await replayDeadLetterEvent(body.eventId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true, eventId: body.eventId });
}
