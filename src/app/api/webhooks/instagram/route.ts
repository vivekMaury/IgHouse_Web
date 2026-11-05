import { NextResponse } from "next/server";
import { verifyWebhookSignature, verifyGetChallenge } from "@/lib/meta/webhook-verify";
import { parseWebhookPayload, type ParsedEvent, type WebhookPayload } from "@/lib/meta/parse-webhook";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { fetchIgUserProfile } from "@/lib/meta/instagram";
import { decryptToken } from "@/lib/crypto/token";
import { syncConversationHistory } from "@/lib/meta/sync-history";
import { matchFlows, type MatchableEvent, type MatchResult } from "@/lib/engine/match";
import { step as engineStep, type FlowRunState, type IncomingEvent, type Action } from "@/lib/engine/step";
import { executeAction, type SendContext } from "@/lib/meta/send";
import type { FlowDefinition } from "@/lib/engine/schema";

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

type FlowContext = {
  workspaceId: string;
  connectedAccountId: string;
  contactId: string;
  contactEmail: string | null;
  contactPhone: string | null;
  senderId: string;
  eventType: string;
  payload: Record<string, unknown>;
  webhookEventId: string;
  accessToken: string;
  commentId?: string;
};

const VALID_EVENT_TYPES = new Set<string>(["message", "comment", "postback", "mention", "story_reply"]);

function buildMatchableEvent(eventType: string, payload: Record<string, unknown>): MatchableEvent | null {
  if (!VALID_EVENT_TYPES.has(eventType)) return null;

  const message = payload.message as Record<string, unknown> | undefined;
  const isComment = eventType === "comment";
  const isMention = eventType === "mention";
  const isStoryReply = eventType === "story_reply";

  let text: string | undefined;
  if (isComment || isMention) {
    text = (payload.text as string) ?? undefined;
  } else {
    text = (message?.text as string) ?? undefined;
  }

  const replyTo = message?.reply_to as { story?: { id: string } } | undefined;

  return {
    eventType: eventType as MatchableEvent["eventType"],
    text,
    postbackPayload: (payload.postback as Record<string, unknown>)?.payload as string | undefined,
    commentId: isComment ? (payload.id as string) : undefined,
    mediaId: isMention ? (payload.media as Record<string, unknown>)?.id as string ?? (payload.id as string) : (payload.media as Record<string, unknown>)?.id as string | undefined,
    storyId: isStoryReply ? replyTo?.story?.id : isMention ? (payload.id as string) : undefined,
  };
}

function buildIncomingEvent(
  eventType: string,
  payload: Record<string, unknown>,
  contact: { email?: string; phone?: string; tags: string[] },
): IncomingEvent {
  const message = payload.message as Record<string, unknown> | undefined;
  const isComment = eventType === "comment";
  const isMention = eventType === "mention";

  let text: string | undefined;
  if (isComment || isMention) {
    text = (payload.text as string) ?? undefined;
  } else {
    text = (message?.text as string) ?? undefined;
  }

  return {
    type: isComment || isMention || eventType === "story_reply" ? "trigger" : (eventType as IncomingEvent["type"]),
    text,
    payload: (payload.postback as Record<string, unknown>)?.payload as string | undefined,
    commentId: isComment ? (payload.id as string) : undefined,
    senderId: (payload.sender as Record<string, unknown>)?.id as string ?? undefined,
    contactEmail: contact.email,
    contactPhone: contact.phone,
    contactTags: contact.tags,
  };
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

async function runAutomationFlows(
  supabase: ReturnType<typeof createAdminClient>,
  ctx: FlowContext,
) {
  // 1. Check for existing waiting flow run (lead capture / wait-for-reply)
  const { data: waitingRunRows } = await supabase
    .from("flow_runs")
    .select("id, flow_id, flow_version_id, current_node_id, status, context")
    .eq("workspace_id", ctx.workspaceId)
    .eq("contact_id", ctx.contactId)
    .eq("status", "waiting")
    .order("created_at", { ascending: false })
    .limit(1);

  const waitingRun = (waitingRunRows ?? [])[0] as {
    id: string;
    flow_id: string;
    flow_version_id: string;
    current_node_id: string | null;
    status: string;
    context: Record<string, unknown>;
  } | undefined;

  if (waitingRun) {
    const { data: versionData } = await supabase
      .from("flow_versions")
      .select("definition")
      .eq("id", waitingRun.flow_version_id)
      .single();

    if (versionData) {
      const flowDef = (versionData as { definition: unknown }).definition as FlowDefinition;

      // Only resume if the incoming event type is compatible with the flow's trigger
      const triggerNode = flowDef.nodes.find((n) => n.data.type === "trigger");
      const triggerType = triggerNode?.data.type === "trigger" ? triggerNode.data.triggerType : null;
      const resumeAllowed =
        (ctx.eventType === "message" && triggerType === "dm_keyword") ||
        (ctx.eventType === "story_reply" && triggerType === "story_reply") ||
        (ctx.eventType === "comment" && (triggerType === "comment_keyword" || triggerType === "live_comment")) ||
        (ctx.eventType === "postback" && triggerType === "ice_breaker") ||
        (ctx.eventType === "mention" && triggerType === "story_mention");

      if (resumeAllowed) {
        console.log(`[webhook:flow] Resuming waiting flow run=${waitingRun.id} flow=${waitingRun.flow_id}`);
        const contactTags = await getContactTags(supabase, ctx.contactId);

        const runState: FlowRunState = {
          id: waitingRun.id,
          flowId: waitingRun.flow_id,
          contactId: ctx.contactId,
          currentNodeId: waitingRun.current_node_id,
          status: "running",
          context: {
            variables: (waitingRun.context.variables as Record<string, string>) ?? {},
            capturedFields: (waitingRun.context.capturedFields as Record<string, string>) ?? {},
            privateReplySent: (waitingRun.context.privateReplySent as Record<string, boolean>) ?? {},
            tags: (waitingRun.context.tags as string[]) ?? [],
          },
        };

        const incomingEvent = buildIncomingEvent(ctx.eventType, ctx.payload, {
          email: ctx.contactEmail ?? undefined,
          phone: ctx.contactPhone ?? undefined,
          tags: contactTags,
        });

        const result = engineStep(runState, incomingEvent, flowDef);

        const sendCtx: SendContext = { accessToken: ctx.accessToken, recipientId: ctx.senderId };
        const metaResponses = await executeFlowActions(result.actions, sendCtx, supabase, ctx);

        await writeAutomationLogs(supabase, result.actions, ctx.workspaceId, waitingRun.flow_id, waitingRun.id, metaResponses);
        await recordOutboundMessages(supabase, result.actions, metaResponses, ctx);

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

        console.log(`[webhook:flow] Resumed flow run=${waitingRun.id} newStatus=${result.nextState.status} actions=${result.actions.length}`);
        return;
      }

      console.log(
        `[webhook:flow] Waiting run=${waitingRun.id} trigger=${triggerType} incompatible with event=${ctx.eventType}, falling through to matcher`,
      );
    }
  }

  // 2. Match triggers against published flows
  const { data: flows } = await supabase
    .from("flows")
    .select("id, flow_versions!inner(id, definition)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("status", "published")
    .order("version", { referencedTable: "flow_versions", ascending: false });

  if (!flows?.length) {
    console.log("[webhook:flow] No published flows for workspace:", ctx.workspaceId);
    return;
  }

  const matchableEvent = buildMatchableEvent(ctx.eventType, ctx.payload);
  if (!matchableEvent) {
    console.log(`[webhook:flow] Unknown event type "${ctx.eventType}", skipping flow matching`);
    return;
  }

  const matchableFlows = (flows as Array<{ id: string; flow_versions: Array<{ id: string; definition: unknown }> }>)
    .filter((f) => f.flow_versions.length > 0)
    .map((f) => ({
      id: f.id,
      versionId: f.flow_versions[0]!.id,
      definition: f.flow_versions[0]!.definition as FlowDefinition,
    }));

  const matchResults = matchFlows(
    matchableEvent,
    matchableFlows.map((f) => ({ id: f.id, definition: f.definition })),
  );

  if (matchResults.length === 0) {
    console.log(`[webhook:flow] No matching flows for text="${matchableEvent.text?.slice(0, 40) ?? ""}" workspace=${ctx.workspaceId}`);
    return;
  }

  console.log(`[webhook:flow] Matched ${matchResults.length} flow(s) for text="${matchableEvent.text?.slice(0, 40) ?? ""}"`);

  // 3. Filter by cooldown, then pick the best match per trigger type
  const runnableMatches: typeof matchResults = [];

  for (const match of matchResults) {
    const flow = matchableFlows.find((f) => f.id === match.flowId)!;
    const triggerNode = flow.definition.nodes.find((n) => n.data.type === "trigger");
    const cooldownHours = triggerNode?.data.type === "trigger" ? (triggerNode.data.cooldownHours ?? 24) : 24;

    if (cooldownHours > 0) {
      const since = new Date(Date.now() - cooldownHours * 3600_000).toISOString();
      const { data: recentRuns } = await supabase
        .from("flow_runs")
        .select("id")
        .eq("flow_id", match.flowId)
        .eq("contact_id", ctx.contactId)
        .gte("started_at", since)
        .limit(1);

      if (recentRuns?.length) {
        console.log(`[webhook:flow] Cooldown active for flow=${match.flowId} contact=${ctx.contactId}`);
        continue;
      }
    }

    runnableMatches.push(match);
  }

  if (runnableMatches.length === 0) return;

  // Deduplicate: one flow per trigger type to prevent competing replies
  const bestPerTriggerType = new Map<string, MatchResult>();
  for (const match of runnableMatches) {
    const flow = matchableFlows.find((f) => f.id === match.flowId)!;
    const triggerNode = flow.definition.nodes.find((n) => n.data.type === "trigger");
    const triggerType = triggerNode?.data.type === "trigger" ? triggerNode.data.triggerType : "unknown";

    // First match wins (flows are ordered newest-version-first from the query)
    if (!bestPerTriggerType.has(triggerType)) {
      bestPerTriggerType.set(triggerType, match);
    }
  }

  const flowsToExecute = [...bestPerTriggerType.values()];
  console.log(`[webhook:flow] Executing ${flowsToExecute.length} flow(s) after dedup (from ${runnableMatches.length} runnable)`);

  // 4. Cancel existing runs per-flow (not globally) and execute
  for (const match of flowsToExecute) {
    const flow = matchableFlows.find((f) => f.id === match.flowId)!;

    // Cancel existing running/waiting runs for this contact in THIS flow only
    await supabase
      .from("flow_runs")
      .update({ status: "cancelled", completed_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("flow_id", match.flowId)
      .eq("contact_id", ctx.contactId)
      .in("status", ["running", "waiting"]);

    // Run the engine with fresh isolated context
    const contactTags = await getContactTags(supabase, ctx.contactId);

    const initialState: FlowRunState = {
      id: "",
      flowId: match.flowId,
      contactId: ctx.contactId,
      currentNodeId: null,
      status: "running",
      context: {
        variables: {},
        capturedFields: {},
        privateReplySent: {},
        tags: contactTags,
      },
    };

    const incomingEvent = buildIncomingEvent(ctx.eventType, ctx.payload, {
      email: ctx.contactEmail ?? undefined,
      phone: ctx.contactPhone ?? undefined,
      tags: contactTags,
    });

    const result = engineStep(initialState, incomingEvent, flow.definition);

    // Insert flow_run
    const { data: runData } = await supabase
      .from("flow_runs")
      .insert({
        workspace_id: ctx.workspaceId,
        flow_id: match.flowId,
        flow_version_id: flow.versionId,
        contact_id: ctx.contactId,
        current_node_id: result.nextState.currentNodeId,
        status: result.nextState.status,
        context: result.nextState.context,
        trigger_event_id: ctx.webhookEventId,
      } as Record<string, unknown>)
      .select("id")
      .single();

    const runId = (runData as { id: string } | null)?.id ?? "unknown";

    // Execute Meta API actions with isolated context
    const sendCtx: SendContext = { accessToken: ctx.accessToken, recipientId: ctx.senderId };
    const metaResponses = await executeFlowActions(result.actions, sendCtx, supabase, ctx);

    await writeAutomationLogs(supabase, result.actions, ctx.workspaceId, match.flowId, runId, metaResponses);
    await recordOutboundMessages(supabase, result.actions, metaResponses, ctx);

    if (result.nextState.status === "completed" || result.nextState.status === "failed") {
      await supabase
        .from("flow_runs")
        .update({ completed_at: new Date().toISOString() } as Record<string, unknown>)
        .eq("id", runId);
    }

    console.log(
      `[webhook:flow] Executed flow=${match.flowId} run=${runId} status=${result.nextState.status} ` +
      `actions=${result.actions.length} sends=${[...metaResponses.values()].filter((r) => r.success).length}`,
    );
  }
}

async function executeFlowActions(
  actions: Action[],
  sendCtx: SendContext,
  supabase: ReturnType<typeof createAdminClient>,
  ctx: FlowContext,
): Promise<Map<number, { success: boolean; response?: Record<string, unknown>; error?: string }>> {
  const metaResponses = new Map<number, { success: boolean; response?: Record<string, unknown>; error?: string }>();
  let privateReplySentForComment = false;

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]!;

    if (action.type === "send_dm" || action.type === "send_comment_reply" || action.type === "send_private_reply") {
      let effectiveAction = action;

      // Comment triggers have no messaging window — route send_dm through Private Reply API
      if (action.type === "send_dm" && ctx.commentId) {
        if (privateReplySentForComment) {
          console.log(`[webhook:flow] Skipping send_dm — already sent private reply for comment=${ctx.commentId}`);
          metaResponses.set(i, { success: true, response: { skipped: "one_private_reply_per_comment" } });
          continue;
        }
        effectiveAction = {
          type: "send_private_reply",
          text: action.text,
          commentId: ctx.commentId,
          quickReplies: action.quickReplies,
        };
        console.log(`[webhook:flow] Routing send_dm as private_reply via comment=${ctx.commentId}`);
      }

      if (effectiveAction.type === "send_private_reply") {
        if (privateReplySentForComment) {
          console.log(`[webhook:flow] Skipping duplicate private reply for comment=${ctx.commentId}`);
          metaResponses.set(i, { success: true, response: { skipped: "one_private_reply_per_comment" } });
          continue;
        }
      }

      const result = await executeAction(effectiveAction, sendCtx);
      metaResponses.set(i, result);

      if (result.success && (effectiveAction.type === "send_private_reply")) {
        privateReplySentForComment = true;
      }

      if (result.success) {
        console.log(`[webhook:flow] Sent ${effectiveAction.type}: "${effectiveAction.text.slice(0, 60)}"`);
      } else {
        console.error(`[webhook:flow] Failed ${effectiveAction.type}: ${result.error}`);
      }

      if (!result.success && result.statusCode === 429) {
        console.error("[webhook:flow] Rate limited by Meta API, stopping action execution");
        break;
      }
    }

    if (action.type === "capture_lead") {
      await supabase.from("captured_leads").insert({
        workspace_id: ctx.workspaceId,
        contact_id: ctx.contactId,
        flow_id: ctx.connectedAccountId,
        field_name: action.field,
        field_value: action.value,
      } as Record<string, unknown>);

      const updateField = action.field === "email" ? "email" : "phone";
      await supabase
        .from("contacts")
        .update({ [updateField]: action.value } as Record<string, unknown>)
        .eq("id", ctx.contactId);
    }
  }

  return metaResponses;
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
    const { error } = await supabase.from("automation_logs").insert(logRows as Record<string, unknown>[]);
    if (error) {
      console.error("[webhook:flow] Failed to write automation logs:", error.message);
    }
  }
}

async function recordOutboundMessages(
  supabase: ReturnType<typeof createAdminClient>,
  actions: Action[],
  metaResponses: Map<number, { success: boolean; response?: Record<string, unknown>; error?: string }>,
  ctx: FlowContext,
) {
  const msgRows: Record<string, unknown>[] = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]!;
    if (action.type !== "send_dm" && action.type !== "send_private_reply") continue;

    const meta = metaResponses.get(i);
    if (meta && !meta.success) continue;

    msgRows.push({
      workspace_id: ctx.workspaceId,
      direction: "outbound",
      source: "automation",
      content: action.text,
      sent_at: new Date().toISOString(),
      platform_message_id: (meta?.response?.message_id as string) ?? null,
    });
  }

  if (msgRows.length === 0) return;

  const { data: conv } = await supabase
    .from("conversations")
    .upsert(
      {
        workspace_id: ctx.workspaceId,
        contact_id: ctx.contactId,
        connected_account_id: ctx.connectedAccountId,
        last_message_at: new Date().toISOString(),
        status: "open",
      } as Record<string, unknown>,
      { onConflict: "workspace_id,contact_id,connected_account_id" },
    )
    .select("id")
    .single();

  if (!conv) return;
  const conversationId = (conv as { id: string }).id;

  for (const row of msgRows) {
    row.conversation_id = conversationId;
  }

  const { error } = await supabase.from("messages").insert(msgRows);
  if (error) {
    console.error("[webhook:flow] Failed to record outbound messages:", error.message);
  }
}

async function handleMessageEvent(
  supabase: ReturnType<typeof createAdminClient>,
  event: ParsedEvent,
) {
  const payload = event.payload as Record<string, unknown>;
  const message = payload.message as { mid: string; text?: string; attachments?: Array<{ type: string; payload: { url: string } }> } | undefined;
  const timestamp = payload.timestamp as number | undefined;

  const messageText = message?.text ?? null;
  const firstAttachment = message?.attachments?.[0];
  const mediaUrl = firstAttachment?.payload?.url ?? null;
  const mediaType = firstAttachment?.type ?? null;

  // 1. Look up connected account by the IG account ID that received the webhook
  const igAccountId = String(event.ig_account_id);
  const { data: account, error: accountErr } = await supabase
    .from("connected_accounts")
    .select("id, workspace_id, platform_account_id, encrypted_access_token, token_iv")
    .eq("platform_account_id", igAccountId)
    .eq("platform", "instagram")
    .eq("is_active", true)
    .maybeSingle();

  if (accountErr) {
    console.error("[webhook:sync] DB error looking up connected account for ig_account_id:", igAccountId, accountErr.message);
    return;
  }

  if (!account) {
    console.warn("[webhook:sync] No connected account found for ig_account_id:", igAccountId, "— skipping event");
    return;
  }

  const { workspace_id, id: connected_account_id } = account;

  // Decrypt access token once for profile enrichment + history sync
  let accessToken: string | null = null;
  try {
    const tokenHex = (account as Record<string, unknown>).encrypted_access_token as string;
    const ivHex = (account as Record<string, unknown>).token_iv as string;
    accessToken = decryptToken(
      Buffer.from(tokenHex.replace(/\\x/g, ""), "hex"),
      Buffer.from(ivHex.replace(/\\x/g, ""), "hex"),
    );
  } catch (err) {
    console.warn("[webhook:sync] Token decryption failed:", (err as Error).message);
  }

  // 2. Upsert the sender as a contact
  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .upsert(
      {
        workspace_id,
        platform_scoped_id: event.sender_id,
      },
      { onConflict: "workspace_id,platform_scoped_id" }
    )
    .select("id, opted_out, email, phone")
    .single();

  if (contactErr || !contact) {
    console.error("[webhook:sync] Failed to upsert contact:", contactErr?.message, "sender:", event.sender_id);
    return;
  }

  const typedContact = contact as { id: string; opted_out: boolean; email: string | null; phone: string | null };

  if (typedContact.opted_out) {
    console.log("[webhook:sync] Contact opted out, skipping:", event.sender_id);
    return;
  }

  // 2b. Enrich contact with Instagram profile
  if (accessToken) {
    try {
      const profile = await fetchIgUserProfile(event.sender_id, accessToken);
      const updates: Record<string, unknown> = {};
      if (profile.username) updates.username = profile.username;
      if (profile.name) updates.full_name = profile.name;
      if (profile.profile_pic) updates.avatar_url = profile.profile_pic;

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("contacts")
          .update(updates)
          .eq("id", contact.id);
      }
    } catch (err) {
      console.warn("[webhook:sync] Profile enrichment failed for sender:", event.sender_id, (err as Error).message);
    }
  }

  // 3. Get or create the conversation thread
  const { data: conversation, error: convoErr } = await supabase
    .from("conversations")
    .upsert(
      {
        workspace_id,
        contact_id: contact.id,
        connected_account_id,
        status: "open",
      },
      { onConflict: "workspace_id,contact_id,connected_account_id" }
    )
    .select("id, bot_paused, bot_paused_until")
    .single();

  if (convoErr || !conversation) {
    console.error("[webhook:sync] Failed to upsert conversation:", convoErr?.message, "contact:", contact.id);
    return;
  }

  const typedConversation = conversation as { id: string; bot_paused: boolean; bot_paused_until: string | null };

  // Auto-resume bot if pause has expired
  let botPaused = typedConversation.bot_paused;
  if (botPaused && typedConversation.bot_paused_until) {
    if (new Date(typedConversation.bot_paused_until) < new Date()) {
      await supabase
        .from("conversations")
        .update({ bot_paused: false, bot_paused_until: null } as Record<string, unknown>)
        .eq("id", typedConversation.id);
      botPaused = false;
    }
  }

  // 4. Insert the inbound message
  const sentAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

  const { error: msgErr } = await supabase.from("messages").insert({
    workspace_id,
    conversation_id: conversation.id,
    direction: "inbound" as const,
    source: "human" as const,
    content: messageText,
    media_url: mediaUrl,
    media_type: mediaType,
    platform_message_id: event.platform_event_id,
    metadata: {},
    sent_at: sentAt,
  });

  if (msgErr) {
    console.error("[webhook:sync] Failed to insert message:", msgErr.message, "mid:", event.platform_event_id);
    return;
  }

  // 5. Update conversation last_message_at and increment unread count
  await supabase
    .from("conversations")
    .update({ last_message_at: sentAt })
    .eq("id", conversation.id);

  await supabase.rpc("increment_unread", { conversation_id: conversation.id });

  // 6. Update last_webhook_at on the connected account
  await supabase
    .from("connected_accounts")
    .update({ last_webhook_at: new Date().toISOString() })
    .eq("id", connected_account_id);

  console.log(
    `[webhook:sync] Saved inbound message mid=${event.platform_event_id} contact=${contact.id} conversation=${conversation.id}`,
  );

  // 7. Execute automation flows (if bot not paused and token available)
  if (!botPaused && accessToken) {
    try {
      await runAutomationFlows(supabase, {
        workspaceId: workspace_id,
        connectedAccountId: connected_account_id,
        contactId: typedContact.id,
        contactEmail: typedContact.email,
        contactPhone: typedContact.phone,
        senderId: event.sender_id,
        eventType: event.event_type,
        payload: event.payload,
        webhookEventId: event.platform_event_id,
        accessToken,
      });
    } catch (err) {
      console.error("[webhook:flow] Unhandled error in flow execution:", (err as Error).message, "eventId:", event.platform_event_id);
    }
  } else if (botPaused) {
    console.log(`[webhook:flow] Skipping automation — bot paused for conversation=${conversation.id}`);
  }

  // 8. Auto-sync history for new conversations (fire-and-forget)
  if (accessToken) {
    const { data: msgCountRows } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversation.id);

    const isNewConversation = !msgCountRows || msgCountRows.length <= 1;

    if (isNewConversation) {
      const platformAccountId = (account as Record<string, unknown>).platform_account_id as string;
      void syncConversationHistory({
        supabase,
        workspaceId: workspace_id,
        conversationId: conversation.id,
        contactId: contact.id,
        contactPlatformScopedId: event.sender_id,
        igBusinessAccountId: platformAccountId,
        accessToken,
      }).then((result) => {
        console.log(`[webhook:sync] Auto-synced ${result.synced}/${result.total} historical messages for conversation=${conversation.id}`);
      }).catch((err) => {
        console.warn("[webhook:sync] Auto history sync failed:", (err as Error).message);
      });
    }
  }
}

async function handleCommentEvent(
  supabase: ReturnType<typeof createAdminClient>,
  event: ParsedEvent,
) {
  const payload = event.payload as Record<string, unknown>;
  const commentId = payload.id as string;
  const commentText = (payload.text as string) ?? null;
  const from = payload.from as { id: string; username?: string } | undefined;
  const mediaId = (payload.media as { id: string } | undefined)?.id ?? null;

  if (!from) {
    console.warn("[webhook:comment] No 'from' field in comment payload, skipping:", commentId);
    return;
  }

  // Skip comments from our own account
  if (from.id === event.ig_account_id) {
    console.log("[webhook:comment] Ignoring own comment:", commentId);
    return;
  }

  // 1. Look up connected account
  const igAccountId = String(event.ig_account_id);
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id, workspace_id, platform_account_id, encrypted_access_token, token_iv")
    .eq("platform_account_id", igAccountId)
    .eq("platform", "instagram")
    .eq("is_active", true)
    .maybeSingle();

  if (!account) {
    console.warn("[webhook:comment] No connected account for ig_account_id:", igAccountId);
    return;
  }

  const { workspace_id, id: connected_account_id } = account;

  // Decrypt access token
  let accessToken: string | null = null;
  try {
    const tokenHex = (account as Record<string, unknown>).encrypted_access_token as string;
    const ivHex = (account as Record<string, unknown>).token_iv as string;
    accessToken = decryptToken(
      Buffer.from(tokenHex.replace(/\\x/g, ""), "hex"),
      Buffer.from(ivHex.replace(/\\x/g, ""), "hex"),
    );
  } catch (err) {
    console.warn("[webhook:comment] Token decryption failed:", (err as Error).message);
  }

  if (!accessToken) {
    console.warn("[webhook:comment] No access token, cannot run automations for comment:", commentId);
    return;
  }

  // 2. Upsert the commenter as a contact
  const contactUpsertData: Record<string, unknown> = {
    workspace_id,
    platform_scoped_id: from.id,
  };
  if (from.username) contactUpsertData.username = from.username;

  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .upsert(contactUpsertData, { onConflict: "workspace_id,platform_scoped_id" })
    .select("id, opted_out, email, phone")
    .single();

  if (contactErr || !contact) {
    console.error("[webhook:comment] Failed to upsert contact:", contactErr?.message);
    return;
  }

  const typedContact = contact as { id: string; opted_out: boolean; email: string | null; phone: string | null };

  if (typedContact.opted_out) {
    console.log("[webhook:comment] Contact opted out, skipping:", from.id);
    return;
  }

  // 3. Idempotency: check if we already processed this comment_id for private reply
  const { data: existingRuns } = await supabase
    .from("flow_runs")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("trigger_event_id", commentId)
    .limit(1);

  if (existingRuns && existingRuns.length > 0) {
    console.log(`[webhook:comment] Already processed comment=${commentId}, skipping duplicate`);
    return;
  }

  // 4. Update last_webhook_at
  await supabase
    .from("connected_accounts")
    .update({ last_webhook_at: new Date().toISOString() })
    .eq("id", connected_account_id);

  console.log(
    `[webhook:comment] Processing comment=${commentId} text="${commentText?.slice(0, 60) ?? ""}" from=${from.id} media=${mediaId}`,
  );

  // 5. Run automation flows for the comment trigger
  try {
    await runAutomationFlows(supabase, {
      workspaceId: workspace_id,
      connectedAccountId: connected_account_id,
      contactId: typedContact.id,
      contactEmail: typedContact.email,
      contactPhone: typedContact.phone,
      senderId: from.id,
      eventType: event.event_type,
      payload: event.payload,
      webhookEventId: commentId,
      accessToken,
      commentId,
    });
  } catch (err) {
    console.error("[webhook:comment] Flow execution error:", (err as Error).message, "commentId:", commentId);
  }
}

async function handleStoryMentionEvent(
  supabase: ReturnType<typeof createAdminClient>,
  event: ParsedEvent,
) {
  const payload = event.payload as Record<string, unknown>;
  const from = payload.from as { id: string; username?: string } | undefined;
  const mediaId = (payload.media as { id: string } | undefined)?.id ?? (payload.id as string);

  if (!from) {
    console.warn("[webhook:mention] No 'from' field in mention payload, skipping");
    return;
  }

  if (from.id === event.ig_account_id) {
    console.log("[webhook:mention] Ignoring own mention");
    return;
  }

  const igAccountId = String(event.ig_account_id);
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id, workspace_id, platform_account_id, encrypted_access_token, token_iv")
    .eq("platform_account_id", igAccountId)
    .eq("platform", "instagram")
    .eq("is_active", true)
    .maybeSingle();

  if (!account) {
    console.warn("[webhook:mention] No connected account for ig_account_id:", igAccountId);
    return;
  }

  const { workspace_id, id: connected_account_id } = account;

  let accessToken: string | null = null;
  try {
    const tokenHex = (account as Record<string, unknown>).encrypted_access_token as string;
    const ivHex = (account as Record<string, unknown>).token_iv as string;
    accessToken = decryptToken(
      Buffer.from(tokenHex.replace(/\\x/g, ""), "hex"),
      Buffer.from(ivHex.replace(/\\x/g, ""), "hex"),
    );
  } catch (err) {
    console.warn("[webhook:mention] Token decryption failed:", (err as Error).message);
  }

  if (!accessToken) {
    console.warn("[webhook:mention] No access token for mention event");
    return;
  }

  const contactUpsertData: Record<string, unknown> = {
    workspace_id,
    platform_scoped_id: from.id,
  };
  if (from.username) contactUpsertData.username = from.username;

  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .upsert(contactUpsertData, { onConflict: "workspace_id,platform_scoped_id" })
    .select("id, opted_out, email, phone")
    .single();

  if (contactErr || !contact) {
    console.error("[webhook:mention] Failed to upsert contact:", contactErr?.message);
    return;
  }

  const typedContact = contact as { id: string; opted_out: boolean; email: string | null; phone: string | null };

  if (typedContact.opted_out) {
    console.log("[webhook:mention] Contact opted out, skipping:", from.id);
    return;
  }

  // Idempotency check
  const { data: existingRuns } = await supabase
    .from("flow_runs")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("trigger_event_id", event.platform_event_id)
    .limit(1);

  if (existingRuns && existingRuns.length > 0) {
    console.log(`[webhook:mention] Already processed mention=${event.platform_event_id}, skipping`);
    return;
  }

  await supabase
    .from("connected_accounts")
    .update({ last_webhook_at: new Date().toISOString() })
    .eq("id", connected_account_id);

  console.log(`[webhook:mention] Processing mention from=${from.id} media=${mediaId}`);

  try {
    await runAutomationFlows(supabase, {
      workspaceId: workspace_id,
      connectedAccountId: connected_account_id,
      contactId: typedContact.id,
      contactEmail: typedContact.email,
      contactPhone: typedContact.phone,
      senderId: from.id,
      eventType: event.event_type,
      payload: event.payload,
      webhookEventId: event.platform_event_id,
      accessToken,
    });
  } catch (err) {
    console.error("[webhook:mention] Flow execution error:", (err as Error).message);
  }
}

async function handleStoryReplyEvent(
  supabase: ReturnType<typeof createAdminClient>,
  event: ParsedEvent,
) {
  const payload = event.payload as Record<string, unknown>;
  const message = payload.message as { mid: string; text?: string; reply_to?: { story?: { id: string; url?: string } } } | undefined;
  const messageText = message?.text ?? null;
  const storyId = message?.reply_to?.story?.id ?? null;
  const timestamp = payload.timestamp as number | undefined;

  const igAccountId = String(event.ig_account_id);
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id, workspace_id, platform_account_id, encrypted_access_token, token_iv")
    .eq("platform_account_id", igAccountId)
    .eq("platform", "instagram")
    .eq("is_active", true)
    .maybeSingle();

  if (!account) {
    console.warn("[webhook:story-reply] No connected account for ig_account_id:", igAccountId);
    return;
  }

  const { workspace_id, id: connected_account_id } = account;

  let accessToken: string | null = null;
  try {
    const tokenHex = (account as Record<string, unknown>).encrypted_access_token as string;
    const ivHex = (account as Record<string, unknown>).token_iv as string;
    accessToken = decryptToken(
      Buffer.from(tokenHex.replace(/\\x/g, ""), "hex"),
      Buffer.from(ivHex.replace(/\\x/g, ""), "hex"),
    );
  } catch (err) {
    console.warn("[webhook:story-reply] Token decryption failed:", (err as Error).message);
  }

  // Upsert contact
  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .upsert(
      { workspace_id, platform_scoped_id: event.sender_id },
      { onConflict: "workspace_id,platform_scoped_id" },
    )
    .select("id, opted_out, email, phone")
    .single();

  if (contactErr || !contact) {
    console.error("[webhook:story-reply] Failed to upsert contact:", contactErr?.message);
    return;
  }

  const typedContact = contact as { id: string; opted_out: boolean; email: string | null; phone: string | null };

  if (typedContact.opted_out) {
    console.log("[webhook:story-reply] Contact opted out, skipping:", event.sender_id);
    return;
  }

  // Enrich contact profile
  if (accessToken) {
    try {
      const profile = await fetchIgUserProfile(event.sender_id, accessToken);
      const updates: Record<string, unknown> = {};
      if (profile.username) updates.username = profile.username;
      if (profile.name) updates.full_name = profile.name;
      if (profile.profile_pic) updates.avatar_url = profile.profile_pic;
      if (Object.keys(updates).length > 0) {
        await supabase.from("contacts").update(updates).eq("id", contact.id);
      }
    } catch {
      // non-critical
    }
  }

  // Upsert conversation and save the inbound story reply as a message
  const { data: conversation } = await supabase
    .from("conversations")
    .upsert(
      { workspace_id, contact_id: contact.id, connected_account_id, status: "open" },
      { onConflict: "workspace_id,contact_id,connected_account_id" },
    )
    .select("id, bot_paused, bot_paused_until")
    .single();

  if (!conversation) {
    console.error("[webhook:story-reply] Failed to upsert conversation");
    return;
  }

  const typedConversation = conversation as { id: string; bot_paused: boolean; bot_paused_until: string | null };
  const sentAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

  await supabase.from("messages").insert({
    workspace_id,
    conversation_id: conversation.id,
    direction: "inbound" as const,
    source: "human" as const,
    content: messageText,
    platform_message_id: event.platform_event_id,
    metadata: { story_id: storyId, type: "story_reply" },
    sent_at: sentAt,
  });

  await supabase.from("conversations").update({ last_message_at: sentAt }).eq("id", conversation.id);
  await supabase.rpc("increment_unread", { conversation_id: conversation.id });
  await supabase.from("connected_accounts").update({ last_webhook_at: new Date().toISOString() }).eq("id", connected_account_id);

  console.log(`[webhook:story-reply] Saved story reply mid=${event.platform_event_id} story=${storyId} text="${messageText?.slice(0, 40) ?? ""}"`);

  // Auto-resume bot if pause expired
  let botPaused = typedConversation.bot_paused;
  if (botPaused && typedConversation.bot_paused_until) {
    if (new Date(typedConversation.bot_paused_until) < new Date()) {
      await supabase
        .from("conversations")
        .update({ bot_paused: false, bot_paused_until: null } as Record<string, unknown>)
        .eq("id", typedConversation.id);
      botPaused = false;
    }
  }

  // Run automation flows — story replies open a 24h DM window so send_dm works directly
  if (!botPaused && accessToken) {
    try {
      await runAutomationFlows(supabase, {
        workspaceId: workspace_id,
        connectedAccountId: connected_account_id,
        contactId: typedContact.id,
        contactEmail: typedContact.email,
        contactPhone: typedContact.phone,
        senderId: event.sender_id,
        eventType: event.event_type,
        payload: event.payload,
        webhookEventId: event.platform_event_id,
        accessToken,
      });
    } catch (err) {
      console.error("[webhook:story-reply] Flow execution error:", (err as Error).message);
    }
  }
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
    console.error("[webhook] Signature verification failed. signature:", signature?.slice(0, 20) + "...");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: WebhookPayload;
  try {
    body = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.object !== "instagram") {
    console.error("[webhook] Ignored non-instagram object:", body.object);
    return NextResponse.json({ error: "Not instagram" }, { status: 400 });
  }

  const events = parseWebhookPayload(body);
  console.log(`[webhook] Parsed ${events.length} event(s) from ${body.entry.length} entry/entries`);

  if (events.length === 0) {
    console.log("[webhook] No actionable events in payload (read/delivery receipts or echoes)");
  }

  if (events.length > 0) {
    const supabase = createAdminClient();

    for (const event of events) {
      console.log(
        `[webhook] Processing: type=${event.event_type} igAccount=${event.ig_account_id} sender=${event.sender_id} eventId=${event.platform_event_id}`,
      );

      // Log the raw webhook event for debugging
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
        console.error("[webhook] Failed to insert webhook_event:", error.message, "eventId:", event.platform_event_id);
        continue;
      }

      // Synchronous processing: handle events directly (bypassing Inngest)
      if (event.event_type === "message") {
        try {
          await handleMessageEvent(supabase, event);
        } catch (err) {
          console.error("[webhook:sync] Unhandled error processing message:", err, "eventId:", event.platform_event_id);
        }
      } else if (event.event_type === "comment") {
        try {
          await handleCommentEvent(supabase, event);
        } catch (err) {
          console.error("[webhook:sync] Unhandled error processing comment:", err, "eventId:", event.platform_event_id);
        }
      } else if (event.event_type === "mention") {
        try {
          await handleStoryMentionEvent(supabase, event);
        } catch (err) {
          console.error("[webhook:sync] Unhandled error processing mention:", err, "eventId:", event.platform_event_id);
        }
      } else if (event.event_type === "story_reply") {
        try {
          await handleStoryReplyEvent(supabase, event);
        } catch (err) {
          console.error("[webhook:sync] Unhandled error processing story reply:", err, "eventId:", event.platform_event_id);
        }
      } else {
        console.log(`[webhook] Skipping event type: ${event.event_type} eventId: ${event.platform_event_id}`);
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
