import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/crypto/token";
import { sendDm } from "@/lib/meta/send";
import { z } from "zod/v4";

const sendSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
  const before = searchParams.get("before");

  let query = supabase
    .from("messages")
    .select(
      "id, direction, source, content, media_url, media_type, platform_message_id, sent_at, delivered_at, read_at, created_at",
    )
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
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    .select("id, workspace_id, contact_id, connected_account_id")
    .eq("id", conversationId)
    .single();

  const conversation = conv as {
    id: string;
    workspace_id: string;
    contact_id: string;
    connected_account_id: string;
  } | null;

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  // 24-hour window check — must be based on last INBOUND message per Meta policy
  const { data: lastInboundRows } = await supabase
    .from("messages")
    .select("sent_at, created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1);

  const inboundMsg = (lastInboundRows ?? [])[0] as
    | { sent_at: string | null; created_at: string }
    | undefined;
  const lastInboundTime = inboundMsg
    ? new Date(inboundMsg.sent_at ?? inboundMsg.created_at).getTime()
    : 0;
  const hoursSinceInbound =
    (Date.now() - lastInboundTime) / (1000 * 60 * 60);
  const windowOpen = lastInboundTime > 0 && hoursSinceInbound < 24;

  if (!windowOpen) {
    return NextResponse.json(
      {
        error:
          "24-hour messaging window has closed. Cannot send message.",
      },
      { status: 403 },
    );
  }

  // Save message to DB (optimistic — appears in thread immediately via Realtime)
  const { data: savedMsg, error: msgError } = await supabase
    .from("messages")
    .insert({
      workspace_id: conversation.workspace_id,
      conversation_id: conversationId,
      direction: "outbound",
      source: "human",
      content: parsed.data.text,
      sent_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .select("id")
    .single();

  if (msgError) {
    console.error("[inbox] send message error:", msgError.message);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  // Update conversation state
  await supabase
    .from("conversations")
    .update({
      bot_paused: true,
      bot_paused_until: new Date(
        Date.now() + 2 * 60 * 60 * 1000,
      ).toISOString(),
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

  // Deliver DM via Meta Graph API
  let metaError: string | null = null;
  try {
    const admin = createAdminClient();

    const { data: accountData } = await admin
      .from("connected_accounts")
      .select("encrypted_access_token, token_iv")
      .eq("id", conversation.connected_account_id)
      .single();

    const { data: contactData } = await admin
      .from("contacts")
      .select("platform_scoped_id")
      .eq("id", conversation.contact_id)
      .single();

    const account = accountData as {
      encrypted_access_token: string;
      token_iv: string;
    } | null;
    const contact = contactData as {
      platform_scoped_id: string;
    } | null;

    if (account && contact) {
      const tokenHex = account.encrypted_access_token.replace(/\\x/g, "");
      const ivHex = account.token_iv.replace(/\\x/g, "");
      const accessToken = decryptToken(
        Buffer.from(tokenHex, "hex"),
        Buffer.from(ivHex, "hex"),
      );

      const result = await sendDm(
        { accessToken, recipientId: contact.platform_scoped_id },
        parsed.data.text,
      );

      if (!result.success) {
        metaError = result.error ?? "Meta API error";
        console.error("[inbox] Meta API send error:", result.error);
      } else {
        const platformMsgId = result.response?.message_id as
          | string
          | undefined;
        if (platformMsgId && savedMsg) {
          await supabase
            .from("messages")
            .update({
              platform_message_id: platformMsgId,
            } as Record<string, unknown>)
            .eq("id", (savedMsg as { id: string }).id);
        }
      }
    } else {
      metaError = "Could not load account or contact";
      console.error("[inbox] Missing account or contact for Meta API");
    }
  } catch (err) {
    metaError = err instanceof Error ? err.message : "Unknown error";
    console.error("[inbox] Meta API exception:", err);
  }

  return NextResponse.json({ ok: true, windowOpen, metaError });
}
