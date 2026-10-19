import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";

const sendSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
  const before = searchParams.get("before");

  let query = supabase
    .from("messages")
    .select("id, direction, source, content, media_url, media_type, platform_message_id, sent_at, delivered_at, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[inbox] message load error:", error.message);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }

  return NextResponse.json({ messages: (data ?? []).reverse() });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, workspace_id, contact_id, connected_account_id, last_message_at")
    .eq("id", conversationId)
    .single();

  const conversation = conv as {
    id: string;
    workspace_id: string;
    contact_id: string;
    connected_account_id: string;
    last_message_at: string | null;
  } | null;

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const lastMessageTime = conversation.last_message_at
    ? new Date(conversation.last_message_at).getTime()
    : 0;
  const hoursSinceLastMessage = (Date.now() - lastMessageTime) / (1000 * 60 * 60);
  const windowOpen = hoursSinceLastMessage < 24;

  if (!windowOpen) {
    return NextResponse.json(
      { error: "24-hour messaging window has closed. Cannot send message." },
      { status: 403 }
    );
  }

  const { error: msgError } = await supabase.from("messages").insert({
    workspace_id: conversation.workspace_id,
    conversation_id: conversationId,
    direction: "outbound",
    source: "human",
    content: parsed.data.text,
    sent_at: new Date().toISOString(),
  } as Record<string, unknown>);

  if (msgError) {
    console.error("[inbox] send message error:", msgError.message);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  await supabase
    .from("conversations")
    .update({
      bot_paused: true,
      bot_paused_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      last_message_at: new Date().toISOString(),
      unread_count: 0,
    } as Record<string, unknown>)
    .eq("id", conversationId);

  await supabase.from("automation_logs").insert({
    workspace_id: conversation.workspace_id,
    action: "human_takeover",
    success: true,
    node_id: null,
  } as Record<string, unknown>);

  // TODO: Call Meta API to actually send the DM (requires connected account token decryption)

  return NextResponse.json({ ok: true, windowOpen });
}
