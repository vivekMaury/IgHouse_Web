import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";

export const processWebhookEvent = inngest.createFunction(
  {
    id: "process-instagram-webhook",
    retries: 5,
    triggers: [{ event: "instagram/webhook.received" }],
  },
  async ({ event, step }) => {
    const { webhookEventId, eventType, igAccountId, senderId } = event.data as {
      webhookEventId: string;
      eventType: string;
      igAccountId: string;
      senderId: string;
    };

    const supabase = createAdminClient();

    const webhookEvent = await step.run("load-webhook-event", async () => {
      const { data, error } = await supabase
        .from("webhook_events")
        .select("*")
        .eq("platform_event_id", webhookEventId)
        .single();

      if (error) throw error;

      if ((data as Record<string, unknown>).status === "processed") {
        return null;
      }

      await supabase
        .from("webhook_events")
        .update({ status: "processing", attempts: ((data as Record<string, unknown>).attempts as number) + 1 } as Record<string, unknown>)
        .eq("id", (data as Record<string, unknown>).id);

      return data as Record<string, unknown>;
    });

    if (!webhookEvent) {
      return { skipped: true, reason: "already processed" };
    }

    const account = await step.run("resolve-account", async () => {
      const { data } = await supabase
        .from("connected_accounts")
        .select("id, workspace_id, is_active")
        .eq("platform_account_id", igAccountId)
        .eq("is_active", true)
        .limit(1);

      const row = (data ?? [])[0] as
        | { id: string; workspace_id: string; is_active: boolean }
        | undefined;

      if (!row) {
        await supabase
          .from("webhook_events")
          .update({ status: "failed", last_error: "No active account found" } as Record<string, unknown>)
          .eq("platform_event_id", webhookEventId);
        return null;
      }

      await supabase
        .from("webhook_events")
        .update({ workspace_id: row.workspace_id } as Record<string, unknown>)
        .eq("platform_event_id", webhookEventId);

      return row;
    });

    if (!account) {
      return { skipped: true, reason: "no active account" };
    }

    const contact = await step.run("upsert-contact", async () => {
      const { data } = await supabase
        .from("contacts")
        .upsert(
          {
            workspace_id: account.workspace_id,
            platform_scoped_id: senderId,
          } as Record<string, unknown>,
          { onConflict: "workspace_id,platform_scoped_id" }
        )
        .select("id, opted_out")
        .single();

      return data as { id: string; opted_out: boolean } | null;
    });

    if (!contact || contact.opted_out) {
      await step.run("mark-skipped", async () => {
        await supabase
          .from("webhook_events")
          .update({ status: "processed" } as Record<string, unknown>)
          .eq("platform_event_id", webhookEventId);
      });
      return { skipped: true, reason: contact ? "opted out" : "contact error" };
    }

    if (eventType === "message" || eventType === "postback") {
      await step.run("upsert-conversation-and-message", async () => {
        const { data: conversations } = await supabase
          .from("conversations")
          .upsert(
            {
              workspace_id: account.workspace_id,
              contact_id: contact.id,
              connected_account_id: account.id,
              last_message_at: new Date().toISOString(),
              status: "open",
            } as Record<string, unknown>,
            { onConflict: "workspace_id,contact_id,connected_account_id" }
          )
          .select("id, bot_paused")
          .single();

        const conversation = conversations as {
          id: string;
          bot_paused: boolean;
        } | null;

        if (!conversation) return;

        const payload = webhookEvent.payload as Record<string, unknown>;
        const message = payload.message as Record<string, unknown> | undefined;

        await supabase.from("messages").insert({
          workspace_id: account.workspace_id,
          conversation_id: conversation.id,
          direction: "inbound",
          source: "system",
          content: (message?.text as string) ?? null,
          platform_message_id: webhookEventId,
          sent_at: new Date().toISOString(),
        } as Record<string, unknown>);

        await supabase.rpc("increment_unread", {
          conversation_id: conversation.id,
        } as Record<string, unknown>).then(() => {});
      });
    }

    await step.run("mark-processed", async () => {
      await supabase
        .from("webhook_events")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("platform_event_id", webhookEventId);
    });

    return {
      processed: true,
      eventType,
      contactId: contact.id,
      workspaceId: account.workspace_id,
    };
  }
);
