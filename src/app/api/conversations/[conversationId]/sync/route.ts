import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/crypto/token";
import { fetchConversations, fetchConversationMessages } from "@/lib/meta/conversations";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`api:${ip}`, "api");
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl.remaining, rl.reset) });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const admin = createAdminClient();

  const { data: accountData } = await admin
    .from("connected_accounts")
    .select("encrypted_access_token, token_iv, platform_account_id")
    .eq("id", conversation.connected_account_id)
    .single();

  const account = accountData as {
    encrypted_access_token: string;
    token_iv: string;
    platform_account_id: string;
  } | null;

  if (!account) {
    return NextResponse.json({ error: "Connected account not found" }, { status: 404 });
  }

  const { data: contactData } = await admin
    .from("contacts")
    .select("platform_scoped_id")
    .eq("id", conversation.contact_id)
    .single();

  const contact = contactData as { platform_scoped_id: string } | null;
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  let accessToken: string;
  try {
    const tokenHex = account.encrypted_access_token.replace(/\\x/g, "");
    const ivHex = account.token_iv.replace(/\\x/g, "");
    accessToken = decryptToken(
      Buffer.from(tokenHex, "hex"),
      Buffer.from(ivHex, "hex"),
    );
  } catch {
    return NextResponse.json({ error: "Token decryption failed" }, { status: 500 });
  }

  try {
    const igConversations = await fetchConversations(account.platform_account_id, accessToken, 50);

    const targetConv = igConversations.find((c) =>
      c.participants.some((p) => p.id === contact.platform_scoped_id),
    );

    if (!targetConv) {
      return NextResponse.json({ synced: 0, message: "No matching conversation found on Instagram" });
    }

    const messages = await fetchConversationMessages(targetConv.igConversationId, accessToken, 50);

    const igMessageIds = messages.map((m) => m.igMessageId);
    const { data: existingRows } = await admin
      .from("messages")
      .select("platform_message_id")
      .eq("conversation_id", conversationId)
      .in("platform_message_id", igMessageIds);

    const existingIds = new Set(
      (existingRows ?? []).map((r) => (r as { platform_message_id: string }).platform_message_id),
    );

    let synced = 0;
    let contactUsername: string | null = null;

    for (const msg of messages) {
      if (existingIds.has(msg.igMessageId)) continue;

      const direction = msg.fromId === contact.platform_scoped_id ? "inbound" : "outbound";
      const source = direction === "inbound" ? "human" : "automation";

      const { error: insertErr } = await admin.from("messages").insert({
        workspace_id: conversation.workspace_id,
        conversation_id: conversationId,
        direction,
        source,
        content: msg.text,
        platform_message_id: msg.igMessageId,
        sent_at: new Date(msg.createdTime).toISOString(),
        metadata: {},
      } as Record<string, unknown>);

      if (!insertErr) synced++;

      if (msg.fromUsername && msg.fromId === contact.platform_scoped_id) {
        contactUsername = msg.fromUsername;
      }
    }

    if (contactUsername) {
      await admin
        .from("contacts")
        .update({ username: contactUsername } as Record<string, unknown>)
        .eq("id", conversation.contact_id)
        .is("username", null);
    }

    return NextResponse.json({ synced, total: messages.length });
  } catch (err) {
    console.error("[sync] Message history sync failed:", (err as Error).message);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
