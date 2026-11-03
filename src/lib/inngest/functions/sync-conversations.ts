import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/crypto/token";
import {
  fetchConversations,
  fetchConversationMessages,
  type FetchedMessage,
} from "@/lib/meta/conversations";

type SyncEventData = {
  workspaceId: string;
  connectedAccountId: string;
  igUserId: string;
};

export const syncConversations = inngest.createFunction(
  {
    id: "sync-instagram-conversations",
    retries: 3,
    concurrency: [{ limit: 5 }],
    triggers: [{ event: "instagram/account.connected" }],
  },
  async ({ event, step }) => {
    const { workspaceId, connectedAccountId, igUserId } =
      event.data as SyncEventData;

    const supabase = createAdminClient();

    const accessToken = await step.run("decrypt-token", async () => {
      const { data } = await supabase
        .from("connected_accounts")
        .select("encrypted_access_token, token_iv")
        .eq("id", connectedAccountId)
        .single();

      const row = data as {
        encrypted_access_token: string;
        token_iv: string;
      } | null;
      if (!row) throw new Error("Connected account not found");

      const tokenHex = row.encrypted_access_token.replace(/\\x/g, "");
      const ivHex = row.token_iv.replace(/\\x/g, "");
      return decryptToken(
        Buffer.from(tokenHex, "hex"),
        Buffer.from(ivHex, "hex"),
      );
    });

    const conversations = await step.run("fetch-conversations", async () => {
      return fetchConversations(igUserId, accessToken, 50);
    });

    if (conversations.length === 0) {
      return { synced: 0, reason: "no conversations found" };
    }

    let totalMessages = 0;

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i]!;

      const result = await step.run(`sync-thread-${i}`, async () => {
        const otherParticipant = conv.participants.find(
          (p) => p.id !== igUserId,
        );
        if (!otherParticipant) {
          return { skipped: true, reason: "no other participant" };
        }

        const { data: contactData } = await supabase
          .from("contacts")
          .upsert(
            {
              workspace_id: workspaceId,
              platform_scoped_id: otherParticipant.id,
              username: otherParticipant.username ?? null,
            } as Record<string, unknown>,
            { onConflict: "workspace_id,platform_scoped_id" },
          )
          .select("id")
          .single();

        const contact = contactData as { id: string } | null;
        if (!contact) return { skipped: true, reason: "contact upsert failed" };

        const { data: convData } = await supabase
          .from("conversations")
          .upsert(
            {
              workspace_id: workspaceId,
              contact_id: contact.id,
              connected_account_id: connectedAccountId,
              status: "open",
              last_message_at: conv.updatedTime,
            } as Record<string, unknown>,
            { onConflict: "workspace_id,contact_id,connected_account_id" },
          )
          .select("id")
          .single();

        const conversation = convData as { id: string } | null;
        if (!conversation)
          return { skipped: true, reason: "conversation upsert failed" };

        let messages: FetchedMessage[];
        try {
          messages = await fetchConversationMessages(
            conv.igConversationId,
            accessToken,
            20,
          );
        } catch (err) {
          console.error(
            `[sync] Failed to fetch messages for thread ${i}:`,
            err,
          );
          return { skipped: false, messagesInserted: 0 };
        }

        if (messages.length === 0) {
          return { skipped: false, messagesInserted: 0 };
        }

        const existingIds = new Set<string>();
        const { data: existingMsgs } = await supabase
          .from("messages")
          .select("platform_message_id")
          .eq("conversation_id", conversation.id)
          .not("platform_message_id", "is", null);

        for (const row of existingMsgs ?? []) {
          const r = row as { platform_message_id: string | null };
          if (r.platform_message_id) existingIds.add(r.platform_message_id);
        }

        const newMessages = messages.filter(
          (m) => !existingIds.has(m.igMessageId),
        );

        if (newMessages.length > 0) {
          const rows = newMessages.map((m) => ({
            workspace_id: workspaceId,
            conversation_id: conversation.id,
            direction:
              m.fromId === igUserId
                ? ("outbound" as const)
                : ("inbound" as const),
            source: "system" as const,
            content: m.text,
            platform_message_id: m.igMessageId,
            sent_at: m.createdTime,
          }));

          await supabase
            .from("messages")
            .insert(rows as Record<string, unknown>[]);
        }

        const inboundCount = newMessages.filter(
          (m) => m.fromId !== igUserId,
        ).length;

        if (inboundCount > 0) {
          await supabase
            .from("conversations")
            .update({
              unread_count: inboundCount,
            } as Record<string, unknown>)
            .eq("id", conversation.id);
        }

        return { skipped: false, messagesInserted: newMessages.length };
      });

      if (!result.skipped && "messagesInserted" in result) {
        totalMessages += result.messagesInserted;
      }
    }

    return {
      synced: conversations.length,
      totalMessages,
      workspaceId,
    };
  },
);
