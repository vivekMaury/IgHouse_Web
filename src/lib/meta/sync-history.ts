import { fetchConversations, fetchConversationMessages } from "@/lib/meta/conversations";

type SyncParams = {
  supabase: {
    from: (table: string) => ReturnType<import("@supabase/supabase-js").SupabaseClient["from"]>;
  };
  workspaceId: string;
  conversationId: string;
  contactId: string;
  contactPlatformScopedId: string;
  igBusinessAccountId: string;
  accessToken: string;
};

export async function syncConversationHistory(params: SyncParams): Promise<{ synced: number; total: number }> {
  const {
    supabase,
    workspaceId,
    conversationId,
    contactId,
    contactPlatformScopedId,
    igBusinessAccountId,
    accessToken,
  } = params;

  const igConversations = await fetchConversations(igBusinessAccountId, accessToken, 50);

  const targetConv = igConversations.find((c) =>
    c.participants.some((p) => p.id === contactPlatformScopedId),
  );

  if (!targetConv) {
    return { synced: 0, total: 0 };
  }

  const messages = await fetchConversationMessages(targetConv.igConversationId, accessToken, 50);

  if (messages.length === 0) {
    return { synced: 0, total: 0 };
  }

  const igMessageIds = messages.map((m) => m.igMessageId);
  const { data: existingRows } = await supabase
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

    const direction = msg.fromId === contactPlatformScopedId ? "inbound" : "outbound";
    const source = direction === "inbound" ? "human" : "automation";

    const { error: insertErr } = await supabase.from("messages").insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      direction,
      source,
      content: msg.text,
      platform_message_id: msg.igMessageId,
      sent_at: new Date(msg.createdTime).toISOString(),
      metadata: {},
    } as Record<string, unknown>);

    if (!insertErr) synced++;

    if (msg.fromUsername && msg.fromId === contactPlatformScopedId) {
      contactUsername = msg.fromUsername;
    }
  }

  if (contactUsername) {
    await supabase
      .from("contacts")
      .update({ username: contactUsername } as Record<string, unknown>)
      .eq("id", contactId)
      .is("username", null);
  }

  return { synced, total: messages.length };
}
