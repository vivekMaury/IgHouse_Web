import type { FlowDefinition, FlowNode, NodeData } from "./schema";

export type FlowRunState = {
  id: string;
  flowId: string;
  contactId: string;
  currentNodeId: string | null;
  status: "running" | "waiting" | "completed" | "failed" | "cancelled";
  context: FlowRunContext;
};

export type FlowRunContext = {
  variables: Record<string, string>;
  capturedFields: Record<string, string>;
  privateReplySent: Record<string, boolean>;
  tags: string[];
};

export type IncomingEvent = {
  type: "trigger" | "message" | "postback" | "timeout";
  text?: string;
  payload?: string;
  commentId?: string;
  senderId?: string;
  isFollower?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  contactTags?: string[];
  customFields?: Record<string, string>;
};

export type Action =
  | { type: "send_dm"; text: string; quickReplies?: Array<{ title: string; payload: string }>; buttons?: Array<{ type: string; title: string; value: string }>; mediaUrl?: string; mediaType?: string }
  | { type: "send_comment_reply"; text: string; commentId: string }
  | { type: "send_private_reply"; text: string; commentId: string; quickReplies?: Array<{ title: string; payload: string }> }
  | { type: "capture_lead"; field: string; value: string }
  | { type: "schedule_delay"; durationMs: number }
  | { type: "request_reply"; promptText: string }
  | { type: "schedule_wait_timeout"; durationMs: number; timeoutText?: string }
  | { type: "http_request"; url: string; method: string; headers: Record<string, string>; body?: string; responseMapping: Array<{ jsonPath: string; variable: string }>; timeoutMs: number }
  | { type: "ai_reply"; systemPrompt: string; contactMessage: string; maxTokens: number; fallbackText: string }
  | { type: "log"; nodeId: string; action: string; success: boolean; error?: string };

export type StepResult = {
  actions: Action[];
  nextState: FlowRunState;
};

function getNode(flow: FlowDefinition, nodeId: string): FlowNode | undefined {
  return flow.nodes.find((n) => n.id === nodeId);
}

function getOutgoingEdges(flow: FlowDefinition, nodeId: string, handle?: string) {
  return flow.edges.filter(
    (e) => e.source === nodeId && (handle === undefined || e.sourceHandle === handle)
  );
}

function getNextNodeId(flow: FlowDefinition, nodeId: string, handle?: string): string | null {
  const edges = getOutgoingEdges(flow, nodeId, handle);
  return edges[0]?.target ?? null;
}

function interpolateVariables(text: string, context: FlowRunContext): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return context.variables[key] ?? context.capturedFields[key] ?? `{{${key}}}`;
  });
}

function durationToMs(duration: number, unit: "minutes" | "hours" | "days"): number {
  const multipliers = { minutes: 60_000, hours: 3_600_000, days: 86_400_000 };
  return duration * multipliers[unit];
}

function pickVariant(variants: string[]): string {
  return variants[Math.floor(Math.random() * variants.length)] ?? variants[0] ?? "";
}

function evaluateCondition(
  data: Extract<NodeData, { type: "condition" }>,
  event: IncomingEvent,
  context: FlowRunContext
): boolean {
  switch (data.field) {
    case "is_follower":
      return event.isFollower === true;
    case "has_email":
      return Boolean(event.contactEmail || context.capturedFields["email"]);
    case "has_phone":
      return Boolean(event.contactPhone || context.capturedFields["phone"]);
    case "has_tag":
      return (event.contactTags ?? context.tags).includes(data.value ?? "");
    case "custom_field": {
      const fieldValue = event.customFields?.[data.value ?? ""] ?? context.variables[data.value ?? ""];
      switch (data.operator) {
        case "equals":
          return fieldValue === data.value;
        case "not_equals":
          return fieldValue !== data.value;
        case "contains":
          return fieldValue?.includes(data.value ?? "") ?? false;
        case "exists":
          return fieldValue !== undefined && fieldValue !== "";
        default:
          return false;
      }
    }
    default:
      return false;
  }
}

function validateCapturedValue(
  value: string,
  field: "email" | "phone",
  regex?: string
): boolean {
  if (regex) {
    return new RegExp(regex).test(value);
  }
  if (field === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  if (field === "phone") {
    return /^\+?[\d\s\-()]{7,}$/.test(value);
  }
  return true;
}

export function step(
  run: FlowRunState,
  event: IncomingEvent,
  flow: FlowDefinition
): StepResult {
  const actions: Action[] = [];
  let currentNodeId = run.currentNodeId;
  const context: FlowRunContext = {
    variables: { ...run.context.variables },
    capturedFields: { ...run.context.capturedFields },
    privateReplySent: { ...run.context.privateReplySent },
    tags: [...run.context.tags],
  };

  if (!currentNodeId) {
    const triggerNode = flow.nodes.find((n) => n.data.type === "trigger");
    if (!triggerNode) {
      return {
        actions: [{ type: "log", nodeId: "none", action: "no_trigger", success: false, error: "No trigger node found" }],
        nextState: { ...run, status: "failed", context },
      };
    }
    currentNodeId = triggerNode.id;
  }

  let iterationsLeft = 50;

  while (currentNodeId && iterationsLeft > 0) {
    iterationsLeft--;
    const node = getNode(flow, currentNodeId);
    if (!node) {
      actions.push({ type: "log", nodeId: currentNodeId, action: "node_not_found", success: false, error: `Node ${currentNodeId} not found` });
      return {
        actions,
        nextState: { ...run, currentNodeId, status: "failed", context },
      };
    }

    const data = node.data;

    switch (data.type) {
      case "trigger": {
        actions.push({ type: "log", nodeId: node.id, action: "trigger_matched", success: true });
        currentNodeId = getNextNodeId(flow, node.id);
        break;
      }

      case "message": {
        const rawText = data.variants
          ? pickVariant(data.variants)
          : data.text ?? "";
        const text = interpolateVariables(rawText, context);

        if (data.messageType === "dm") {
          actions.push({
            type: "send_dm",
            text,
            quickReplies: data.quickReplies,
            buttons: data.buttons,
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType,
          });
        } else if (data.messageType === "comment_reply") {
          if (event.commentId) {
            actions.push({
              type: "send_comment_reply",
              text,
              commentId: event.commentId,
            });
          }
        } else if (data.messageType === "private_reply") {
          if (event.commentId && !context.privateReplySent[event.commentId]) {
            actions.push({
              type: "send_private_reply",
              text,
              commentId: event.commentId,
              quickReplies: data.quickReplies,
            });
            context.privateReplySent[event.commentId] = true;
          } else {
            actions.push({
              type: "log",
              nodeId: node.id,
              action: "private_reply_skipped",
              success: true,
              error: "Already sent private reply for this comment",
            });
          }
        }

        actions.push({ type: "log", nodeId: node.id, action: `send_${data.messageType}`, success: true });
        currentNodeId = getNextNodeId(flow, node.id);
        break;
      }

      case "condition": {
        const result = evaluateCondition(data, event, context);
        const handle = result ? "true" : "false";
        actions.push({ type: "log", nodeId: node.id, action: `condition_${handle}`, success: true });
        currentNodeId = getNextNodeId(flow, node.id, handle);
        break;
      }

      case "delay": {
        const ms = durationToMs(data.duration, data.unit);
        actions.push({ type: "schedule_delay", durationMs: ms });
        actions.push({ type: "log", nodeId: node.id, action: "delay_scheduled", success: true });
        const nextId = getNextNodeId(flow, node.id);
        return {
          actions,
          nextState: {
            ...run,
            currentNodeId: nextId,
            status: "waiting",
            context,
          },
        };
      }

      case "lead_capture": {
        if (event.type === "message" && event.text) {
          const isValid = validateCapturedValue(event.text, data.field, data.validationRegex);
          if (isValid) {
            context.capturedFields[data.field] = event.text;
            actions.push({
              type: "capture_lead",
              field: data.field,
              value: event.text,
            });
            actions.push({ type: "log", nodeId: node.id, action: "lead_captured", success: true });
            currentNodeId = getNextNodeId(flow, node.id);
          } else {
            const errorText = interpolateVariables(
              data.errorText ?? `Please provide a valid ${data.field}.`,
              context
            );
            actions.push({ type: "send_dm", text: errorText });
            actions.push({ type: "log", nodeId: node.id, action: "lead_validation_failed", success: false });
            return {
              actions,
              nextState: { ...run, currentNodeId: node.id, status: "waiting", context },
            };
          }
        } else {
          const promptText = interpolateVariables(data.promptText, context);
          actions.push({ type: "request_reply", promptText });
          actions.push({ type: "send_dm", text: promptText });
          actions.push({ type: "log", nodeId: node.id, action: "lead_prompt_sent", success: true });
          return {
            actions,
            nextState: { ...run, currentNodeId: node.id, status: "waiting", context },
          };
        }
        break;
      }

      case "wait_for_reply": {
        if (run.currentNodeId === node.id && run.status === "running") {
          if (event.type === "message") {
            actions.push({ type: "log", nodeId: node.id, action: "reply_received", success: true });
            currentNodeId = getNextNodeId(flow, node.id, "reply");
          } else if (event.type === "timeout") {
            if (data.timeoutText) {
              actions.push({ type: "send_dm", text: interpolateVariables(data.timeoutText, context) });
            }
            actions.push({ type: "log", nodeId: node.id, action: "wait_timed_out", success: true });
            currentNodeId = getNextNodeId(flow, node.id, "timeout");
          } else {
            return {
              actions,
              nextState: { ...run, currentNodeId: node.id, status: "waiting", context },
            };
          }
        } else {
          const durationMs = data.timeoutMinutes * 60_000;
          actions.push({ type: "schedule_wait_timeout", durationMs, timeoutText: data.timeoutText });
          actions.push({ type: "log", nodeId: node.id, action: "wait_started", success: true });
          return {
            actions,
            nextState: { ...run, currentNodeId: node.id, status: "waiting", context },
          };
        }
        break;
      }

      case "http_request": {
        const url = interpolateVariables(data.url, context);
        const body = data.bodyTemplate
          ? interpolateVariables(data.bodyTemplate, context)
          : undefined;
        actions.push({
          type: "http_request",
          url,
          method: data.method,
          headers: data.headers ?? {},
          body,
          responseMapping: data.responseMapping ?? [],
          timeoutMs: data.timeoutMs,
        });
        actions.push({ type: "log", nodeId: node.id, action: "http_request_emitted", success: true });
        currentNodeId = getNextNodeId(flow, node.id);
        break;
      }

      case "ai_reply": {
        const contactMessage = event.text ?? "";
        const systemPrompt = interpolateVariables(data.systemPrompt, context);
        actions.push({
          type: "ai_reply",
          systemPrompt,
          contactMessage,
          maxTokens: data.maxTokens,
          fallbackText: interpolateVariables(data.fallbackText, context),
        });
        actions.push({ type: "log", nodeId: node.id, action: "ai_reply_emitted", success: true });
        currentNodeId = getNextNodeId(flow, node.id);
        return {
          actions,
          nextState: { ...run, currentNodeId, status: "waiting", context },
        };
      }
    }
  }

  return {
    actions,
    nextState: {
      ...run,
      currentNodeId,
      status: currentNodeId ? "running" : "completed",
      context,
    },
  };
}
