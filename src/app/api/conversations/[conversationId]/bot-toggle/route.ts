import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";

const toggleSchema = z.object({
  paused: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    bot_paused: parsed.data.paused,
  };

  if (parsed.data.paused) {
    update["bot_paused_until"] = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  } else {
    update["bot_paused"] = false;
    update["bot_paused_until"] = null;
  }

  const { error } = await supabase
    .from("conversations")
    .update(update)
    .eq("id", conversationId);

  if (error) {
    console.error("[inbox] bot toggle error:", error.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  const { data: conv } = await supabase
    .from("conversations")
    .select("workspace_id")
    .eq("id", conversationId)
    .single();

  const conversation = conv as { workspace_id: string } | null;
  if (conversation) {
    await supabase.from("automation_logs").insert({
      workspace_id: conversation.workspace_id,
      action: parsed.data.paused ? "human_takeover" : "bot_resumed",
      success: true,
      node_id: null,
    } as Record<string, unknown>);
  }

  return NextResponse.json({ ok: true, bot_paused: parsed.data.paused });
}
