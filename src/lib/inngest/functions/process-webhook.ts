import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/crypto/token";
import { step as engineStep, type FlowRunState, type IncomingEvent, type Action } from "@/lib/engine/step";
import { matchFlows, type MatchableEvent } from "@/lib/engine/match";
import { executeAction, type SendContext } from "@/lib/meta/send";
import type { FlowDefinition } from "@/lib/engine/schema";

type WebhookEventData = {
  webhookEventId: string;
  eventType: string;
  igAccountId: string;
  senderId: string;
};

function buildMatchableEvent(eventType: string, payload: Record<string, unknown>): MatchableEvent {
  const message = payload.message as Record<string, unknown> | undefined;
  const change = payload as Record<string, unknown>;

  return {
    eventType: eventType as MatchableEvent["eventType"],
    text: (message?.text as string) ?? (change.text as string) ?? undefined,
    postbackPayload: (payload.postback as Record<string, unknown>)?.payload as string | undefined,
    commentId: eventType === "comment" ? (change.id as string) : undefined,
    mediaId: (change.media as Record<string, unknown>)?.id as string | undefined,
  };
}

function buildIncomingEvent(
  eventType: string,
  payload: Record<string, unknown>,
  contact: { email?: string; phone?: string; tags: string[] },
): IncomingEvent {
  const message = payload.message as Record<string, unknown> | undefined;
  const change = payload as Record<string, unknown>;

  return {
    type: eventType === "comment" || eventType === "mention" ? "trigger" : (eventType as IncomingEvent["type"]),
    text: (message?.text as string) ?? (change.text as string) ?? undefined,
    payload: (payload.postback as Record<string, unknown>)?.payload as string | undefined,
    commentId: eventType === "comment" ? (change.id as string) : undefined,
    senderId: (payload.sender as Record<string, unknown>)?.id as string ?? (change.from as Record<string, unknown>)?.id as string ?? undefined,
    contactEmail: contact.email,
    contactPhone: contact.phone,
    contactTags: contact.tags,
  };
}

async function getDecryptedToken(
  supabase: ReturnType<typeof createAdminClient>,
  accountId: string,
): Promise<string> {
  const { data } = await supabase
    .from("connected_accounts")
    .select("encrypted_access_token, token_iv")
    .eq("id", accountId)
    .single();

  const row = data as { encrypted_access_token: string; token_iv: string } | null;
  if (!row) throw new Error("Account not found");

  const tokenHex = row.encrypted_access_token.replace("\\x", "");
  const ivHex = row.token_iv.replace("\\x", "");
  return decryptToken(Buffer.from(tokenHex, "hex"), Buffer.from(ivHex, "hex"));
}

async function writeAutomationLogs(
  supabase: ReturnType<typeof createAdminClient>,
  actions: Action[],
  workspaceId: string,
  flowId: string,
  flowRunId: string,
  metaResponses: Map<number, { success: boolean; response?: Record<string, unknown>; error?: string }>,
) {
  const logRows = actions
    .filter((a): a is Extract<Action, { type: "log" }> => a.type === "log")
    .map((a, i) => {
      const meta = metaResponses.get(i);
      return {
        workspace_id: workspaceId,
        flow_run_id: flowRunId,
        flow_id: flowId,
        node_id: a.nodeId,
        action: a.action,
        success: meta ? meta.success : a.success,
        error_message: meta?.error ?? a.error ?? null,
        meta_response: meta?.response ?? null,
      };
    });

  if (logRows.length > 0) {
    await supabase.from("automation_logs").insert(logRows as Record<string, unknown>[]);
  }
}

async function executeActions(
  actions: Action[],
  ctx: SendContext,
  supabase: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  flowId: string,
  contactId: string,
) {
  const metaResponses = new Map<number, { success: boolean; response?: Record<string, unknown>; error?: string }>();

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]!;

    if (action.type === "send_dm" || action.type === "send_comment_reply" || action.type === "send_private_reply") {
      const result = await executeAction(action, ctx);
      metaResponses.set(i, result);

      if (!result.success && result.statusCode === 429) {
        break;
      }
    }

    if (action.type === "capture_lead") {
      await supabase.from("captured_leads").insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        flow_id: flowId,
        field_name: action.field,
        field_value: action.value,
      } as Record<string, unknown>);

      const updateField = action.field === "email" ? "email" : "phone";
      await supabase
        .from("contacts")
        .update({ [updateField]: action.value } as Record<string, unknown>)
        .eq("id", contactId);
    }
  }

  return metaResponses;
}

export const processWebhookEvent = inngest.createFunction(
  {
    id: "process-instagram-webhook",
    retries: 5,
    concurrency: [{ limit: 10 }],
    triggers: [{ event: "instagram/webhook.received" }],
  },
  async ({ event, step }) => {
    const { webhookEventId, eventType, igAccountId, senderId } = event.data as WebhookEventData;

    const supabase = createAdminClient();

    // 1. Load webhook event
    const webhookEvent = await step.run("load-webhook-event", async () => {
      const { data, error } = await supabase
        .from("webhook_events")
        .select("*")
        .eq("platform_event_id", webhookEventId)
        .single();

      if (error) throw error;
      const row = data as Record<string, unknown>;
      if (row.status === "processed") return null;

      await supabase
        .from("webhook_events")
        .update({ status: "processing", attempts: (row.attempts as number) + 1 } as Record<string, unknown>)
        .eq("id", row.id);

      return row;
    });

    if (!webhookEvent) return { skipped: true, reason: "already processed" };

    // 2. Resolve account
    const account = await step.run("resolve-account", async () => {
      const { data } = await supabase
        .from("connected_accounts")
        .select("id, workspace_id, is_active")
        .eq("platform_account_id", igAccountId)
        .eq("is_active", true)
        .limit(1);

      const row = (data ?? [])[0] as { id: string; workspace_id: string; is_active: boolean } | undefined;
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

    if (!account) return { skipped: true, reason: "no active account" };

    // 3. Upsert contact
    const contact = await step.run("upsert-contact", async () => {
      const { data } = await supabase
        .from("contacts")
        .upsert(
          { workspace_id: account.workspace_id, platform_scoped_id: senderId } as Record<string, unknown>,
          { onConflict: "workspace_id,platform_scoped_id" },
        )
        .select("id, opted_out, email, phone")
        .single();

      return data as { id: string; opted_out: boolean; email: string | null; phone: string | null } | null;
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

    // 4. Upsert conversation + inbound message (for DM/postback events)
    let conversationBotPaused = false;

    if (eventType === "message" || eventType === "postback") {
      const convResult = await step.run("upsert-conversation-and-message", async () => {
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
            { onConflict: "workspace_id,contact_id,connected_account_id" },
          )
          .select("id, bot_paused, bot_paused_until")
          .single();

        const conversation = conversations as { id: string; bot_paused: boolean; bot_paused_until: string | null } | null;
        if (!conversation) return { botPaused: false };

        // Auto-resume if pause has expired
        let paused = conversation.bot_paused;
        if (paused && conversation.bot_paused_until) {
          if (new Date(conversation.bot_paused_until) < new Date()) {
            await supabase
              .from("conversations")
              .update({ bot_paused: false, bot_paused_until: null } as Record<string, unknown>)
              .eq("id", conversation.id);
            paused = false;
          }
        }

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

        await supabase.rpc("increment_unread", { conversation_id: conversation.id } as Record<string, unknown>);

        return { botPaused: paused };
      });

      conversationBotPaused = convResult.botPaused;
    }

    // 5. Check bot_paused — skip automation if human has taken over
    if (conversationBotPaused) {
      await step.run("mark-processed-bot-paused", async () => {
        await supabase
          .from("webhook_events")
          .update({ status: "processed", processed_at: new Date().toISOString() } as Record<string, unknown>)
          .eq("platform_event_id", webhookEventId);
      });
      return { skipped: true, reason: "bot paused" };
    }

    // 6. Check for existing waiting flow run (lead capture / wait-for-reply)
    const waitingRun = await step.run("check-waiting-run", async () => {
      const { data } = await supabase
        .from("flow_runs")
        .select("id, flow_id, flow_version_id, current_node_id, status, context")
        .eq("workspace_id", account.workspace_id)
        .eq("contact_id", contact.id)
        .eq("status", "waiting")
        .order("created_at", { ascending: false })
        .limit(1);

      return (data ?? [])[0] as {
        id: string;
        flow_id: string;
        flow_version_id: string;
        current_node_id: string | null;
        status: string;
        context: Record<string, unknown>;
      } | undefined;
    });

    if (waitingRun && (eventType === "message" || eventType === "postback")) {
      // Resume existing flow run
      const resumeResult = await step.run("resume-waiting-run", async () => {
        const { data: versionData } = await supabase
          .from("flow_versions")
          .select("definition")
          .eq("id", waitingRun.flow_version_id)
          .single();

        if (!versionData) return { completed: false, error: "Version not found" };

        const flowDef = (versionData as { definition: unknown }).definition as FlowDefinition;
        const contactTags = await getContactTags(supabase, contact.id);

        const runState: FlowRunState = {
          id: waitingRun.id,
          flowId: waitingRun.flow_id,
          contactId: contact.id,
          currentNodeId: waitingRun.current_node_id,
          status: "running",
          context: {
            variables: (waitingRun.context.variables as Record<string, string>) ?? {},
            capturedFields: (waitingRun.context.capturedFields as Record<string, string>) ?? {},
            privateReplySent: (waitingRun.context.privateReplySent as Record<string, boolean>) ?? {},
            tags: (waitingRun.context.tags as string[]) ?? [],
          },
        };

        const incomingEvent = buildIncomingEvent(eventType, webhookEvent.payload as Record<string, unknown>, {
          email: contact.email ?? undefined,
          phone: contact.phone ?? undefined,
          tags: contactTags,
        });

        const result = engineStep(runState, incomingEvent, flowDef);

        // Execute side effects
        const token = await getDecryptedToken(supabase, account.id);
        const ctx: SendContext = { accessToken: token, recipientId: senderId };
        const metaResponses = await executeActions(result.actions, ctx, supabase, account.workspace_id, waitingRun.flow_id, contact.id);

        await writeAutomationLogs(supabase, result.actions, account.workspace_id, waitingRun.flow_id, waitingRun.id, metaResponses);

        // Update flow_run
        await supabase
          .from("flow_runs")
          .update({
            current_node_id: result.nextState.currentNodeId,
            status: result.nextState.status,
            context: result.nextState.context,
            completed_at: result.nextState.status === "completed" || result.nextState.status === "failed"
              ? new Date().toISOString()
              : null,
          } as Record<string, unknown>)
          .eq("id", waitingRun.id);

        return { completed: true, status: result.nextState.status };
      });

      // Handle delay in resumed run
      const delayAction = await step.run("check-resume-delay", async () => {
        const { data: versionData } = await supabase
          .from("flow_versions")
          .select("definition")
          .eq("id", waitingRun.flow_version_id)
          .single();

        if (!versionData) return null;

        const flowDef = (versionData as { definition: unknown }).definition as FlowDefinition;

        const { data: freshRun } = await supabase
          .from("flow_runs")
          .select("current_node_id, status, context")
          .eq("id", waitingRun.id)
          .single();

        if (!freshRun || (freshRun as Record<string, unknown>).status !== "waiting") return null;

        const row = freshRun as { current_node_id: string | null; status: string; context: Record<string, unknown> };
        const node = flowDef.nodes.find((n) => n.id === row.current_node_id);
        if (!node || node.data.type !== "delay") return null;

        return { durationMs: durationToMs(node.data.duration, node.data.unit) };
      });

      if (delayAction?.durationMs) {
        const delayStr = `${Math.ceil(delayAction.durationMs / 1000)}s`;
        await step.sleep("flow-delay-resume", delayStr);

        await step.run("continue-after-delay-resume", async () => {
          await continueFlowRun(supabase, waitingRun.id, senderId, account.id, account.workspace_id, contact);
        });
      }

      await step.run("mark-processed-resume", async () => {
        await supabase
          .from("webhook_events")
          .update({ status: "processed", processed_at: new Date().toISOString() } as Record<string, unknown>)
          .eq("platform_event_id", webhookEventId);
      });

      return { processed: true, action: "resumed", flowRunId: waitingRun.id, ...resumeResult };
    }

    // 7. Match triggers against published flows
    const matchResults = await step.run("match-triggers", async () => {
      const { data: flows } = await supabase
        .from("flows")
        .select("id, flow_versions!inner(id, definition)")
        .eq("workspace_id", account.workspace_id)
        .eq("status", "published")
        .not("flow_versions.published_at", "is", null)
        .order("created_at", { foreignTable: "flow_versions", ascending: false });

      if (!flows?.length) return [];

      const matchableEvent = buildMatchableEvent(eventType, webhookEvent.payload as Record<string, unknown>);

      const matchableFlows = (flows as Array<{ id: string; flow_versions: Array<{ id: string; definition: unknown }> }>)
        .filter((f) => f.flow_versions.length > 0)
        .map((f) => ({
          id: f.id,
          versionId: f.flow_versions[0]!.id,
          definition: f.flow_versions[0]!.definition as FlowDefinition,
        }));

      const results = matchFlows(
        matchableEvent,
        matchableFlows.map((f) => ({ id: f.id, definition: f.definition })),
      );

      return results.map((r) => {
        const flow = matchableFlows.find((f) => f.id === r.flowId)!;
        return { ...r, versionId: flow.versionId, definition: flow.definition };
      });
    });

    if (matchResults.length === 0) {
      await step.run("mark-processed-no-match", async () => {
        await supabase
          .from("webhook_events")
          .update({ status: "processed", processed_at: new Date().toISOString() } as Record<string, unknown>)
          .eq("platform_event_id", webhookEventId);
      });
      return { processed: true, action: "no matching flows", contactId: contact.id };
    }

    // 8. Execute matched flows
    for (const match of matchResults) {
      // Cooldown check
      const cooldownOk = await step.run(`cooldown-check-${match.flowId}`, async () => {
        const triggerNode = match.definition.nodes.find((n) => n.data.type === "trigger");
        const cooldownHours = triggerNode?.data.type === "trigger" ? (triggerNode.data.cooldownHours ?? 24) : 24;

        if (cooldownHours === 0) return true;

        const since = new Date(Date.now() - cooldownHours * 3600_000).toISOString();
        const { data: recentRuns } = await supabase
          .from("flow_runs")
          .select("id")
          .eq("flow_id", match.flowId)
          .eq("contact_id", contact.id)
          .gte("started_at", since)
          .limit(1);

        return !recentRuns?.length;
      });

      if (!cooldownOk) continue;

      // Cancel existing waiting runs for this contact (per PRD concurrency policy)
      await step.run(`cancel-existing-runs-${match.flowId}`, async () => {
        await supabase
          .from("flow_runs")
          .update({ status: "cancelled", completed_at: new Date().toISOString() } as Record<string, unknown>)
          .eq("workspace_id", account.workspace_id)
          .eq("contact_id", contact.id)
          .in("status", ["running", "waiting"]);
      });

      // 24-hour messaging window check (for DM actions)
      const windowOk = await step.run(`check-24h-window-${match.flowId}`, async () => {
        if (eventType === "message" || eventType === "postback") return true;

        // For comment/mention triggers that send DMs, check if contact messaged within 24h
        // Private replies don't need the window — they use comment_id recipient
        const hasDmNodes = match.definition.nodes.some(
          (n) => n.data.type === "message" && n.data.messageType === "dm",
        );
        if (!hasDmNodes) return true;

        const { data: convs } = await supabase
          .from("conversations")
          .select("last_message_at")
          .eq("workspace_id", account.workspace_id)
          .eq("contact_id", contact.id)
          .order("last_message_at", { ascending: false })
          .limit(1);

        const conv = (convs ?? [])[0] as { last_message_at: string | null } | undefined;
        if (!conv?.last_message_at) return false;

        const age = Date.now() - new Date(conv.last_message_at).getTime();
        return age < 24 * 3600_000;
      });

      // Create flow run
      const flowRunId = await step.run(`create-flow-run-${match.flowId}`, async () => {
        const contactTags = await getContactTags(supabase, contact.id);

        const initialState: FlowRunState = {
          id: "",
          flowId: match.flowId,
          contactId: contact.id,
          currentNodeId: null,
          status: "running",
          context: {
            variables: {},
            capturedFields: {},
            privateReplySent: {},
            tags: contactTags,
          },
        };

        const incomingEvent = buildIncomingEvent(eventType, webhookEvent.payload as Record<string, unknown>, {
          email: contact.email ?? undefined,
          phone: contact.phone ?? undefined,
          tags: contactTags,
        });

        const result = engineStep(initialState, incomingEvent, match.definition);

        // Filter out DM actions if 24h window closed
        const filteredActions = windowOk
          ? result.actions
          : result.actions.filter((a) => a.type !== "send_dm");

        // Insert flow_run
        const { data: runData } = await supabase
          .from("flow_runs")
          .insert({
            workspace_id: account.workspace_id,
            flow_id: match.flowId,
            flow_version_id: match.versionId,
            contact_id: contact.id,
            current_node_id: result.nextState.currentNodeId,
            status: result.nextState.status,
            context: result.nextState.context,
            trigger_event_id: webhookEventId,
          } as Record<string, unknown>)
          .select("id")
          .single();

        const runId = (runData as { id: string } | null)?.id ?? "unknown";

        // Execute Meta API actions
        const token = await getDecryptedToken(supabase, account.id);
        const ctx: SendContext = { accessToken: token, recipientId: senderId };
        const metaResponses = await executeActions(filteredActions, ctx, supabase, account.workspace_id, match.flowId, contact.id);

        await writeAutomationLogs(supabase, result.actions, account.workspace_id, match.flowId, runId, metaResponses);

        if (result.nextState.status === "completed" || result.nextState.status === "failed") {
          await supabase
            .from("flow_runs")
            .update({ completed_at: new Date().toISOString() } as Record<string, unknown>)
            .eq("id", runId);
        }

        return runId;
      });

      // Handle delay node — use Inngest step.sleep for durability
      const delayAction = await step.run(`check-delay-${match.flowId}`, async () => {
        const { data: runData } = await supabase
          .from("flow_runs")
          .select("status, current_node_id")
          .eq("id", flowRunId)
          .single();

        if (!runData || (runData as Record<string, unknown>).status !== "waiting") return null;

        const row = runData as { status: string; current_node_id: string | null };
        const node = match.definition.nodes.find((n) => n.id === row.current_node_id);
        if (!node || node.data.type !== "delay") return null;

        return { durationMs: durationToMs(node.data.duration, node.data.unit) };
      });

      if (delayAction?.durationMs) {
        const delayStr = `${Math.ceil(delayAction.durationMs / 1000)}s`;
        await step.sleep(`flow-delay-${match.flowId}`, delayStr);

        await step.run(`continue-after-delay-${match.flowId}`, async () => {
          await continueFlowRun(supabase, flowRunId, senderId, account.id, account.workspace_id, contact);
        });
      }
    }

    // 9. Mark event processed
    await step.run("mark-processed", async () => {
      await supabase
        .from("webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() } as Record<string, unknown>)
        .eq("platform_event_id", webhookEventId);
    });

    return {
      processed: true,
      eventType,
      contactId: contact.id,
      workspaceId: account.workspace_id,
      matchedFlows: matchResults.length,
    };
  },
);

function durationToMs(duration: number, unit: "minutes" | "hours" | "days"): number {
  const multipliers = { minutes: 60_000, hours: 3_600_000, days: 86_400_000 };
  return duration * multipliers[unit];
}

async function getContactTags(
  supabase: ReturnType<typeof createAdminClient>,
  contactId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("contact_tags")
    .select("tags!inner(name)")
    .eq("contact_id", contactId);

  return (data ?? []).map((row) => {
    const tag = row as unknown as { tags: { name: string } };
    return tag.tags.name;
  });
}

async function continueFlowRun(
  supabase: ReturnType<typeof createAdminClient>,
  flowRunId: string,
  senderId: string,
  accountId: string,
  workspaceId: string,
  contact: { id: string; email: string | null; phone: string | null },
) {
  const { data: runData } = await supabase
    .from("flow_runs")
    .select("id, flow_id, flow_version_id, current_node_id, status, context, contact_id")
    .eq("id", flowRunId)
    .single();

  if (!runData || (runData as Record<string, unknown>).status !== "waiting") return;

  const run = runData as {
    id: string;
    flow_id: string;
    flow_version_id: string;
    current_node_id: string | null;
    status: string;
    context: Record<string, unknown>;
    contact_id: string;
  };

  const { data: versionData } = await supabase
    .from("flow_versions")
    .select("definition")
    .eq("id", run.flow_version_id)
    .single();

  if (!versionData) return;

  const flowDef = (versionData as { definition: unknown }).definition as FlowDefinition;
  const contactTags = await getContactTags(supabase, contact.id);

  const runState: FlowRunState = {
    id: run.id,
    flowId: run.flow_id,
    contactId: run.contact_id,
    currentNodeId: run.current_node_id,
    status: "running",
    context: {
      variables: (run.context.variables as Record<string, string>) ?? {},
      capturedFields: (run.context.capturedFields as Record<string, string>) ?? {},
      privateReplySent: (run.context.privateReplySent as Record<string, boolean>) ?? {},
      tags: (run.context.tags as string[]) ?? [],
    },
  };

  const incomingEvent: IncomingEvent = {
    type: "timeout",
    contactEmail: contact.email ?? undefined,
    contactPhone: contact.phone ?? undefined,
    contactTags: contactTags,
  };

  const result = engineStep(runState, incomingEvent, flowDef);

  const token = await getDecryptedToken(supabase, accountId);
  const ctx: SendContext = { accessToken: token, recipientId: senderId };
  const metaResponses = await executeActions(result.actions, ctx, supabase, workspaceId, run.flow_id, contact.id);

  await writeAutomationLogs(supabase, result.actions, workspaceId, run.flow_id, run.id, metaResponses);

  await supabase
    .from("flow_runs")
    .update({
      current_node_id: result.nextState.currentNodeId,
      status: result.nextState.status,
      context: result.nextState.context,
      completed_at: result.nextState.status === "completed" || result.nextState.status === "failed"
        ? new Date().toISOString()
        : null,
    } as Record<string, unknown>)
    .eq("id", run.id);

  // If there's another delay, we can't recurse in Inngest step.run
  // The next webhook or a separate scheduled function will pick it up
}
