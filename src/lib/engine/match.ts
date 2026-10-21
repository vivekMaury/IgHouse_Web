import type { FlowDefinition, TriggerNode } from "./schema";

export type MatchableEvent = {
  eventType: "message" | "comment" | "postback" | "mention";
  text?: string;
  postbackPayload?: string;
  commentId?: string;
  mediaId?: string;
};

export type MatchableFlow = {
  id: string;
  definition: FlowDefinition;
};

export type MatchResult = {
  flowId: string;
  triggerNodeId: string;
};

function getTriggerNode(
  def: FlowDefinition,
): { id: string; data: TriggerNode } | null {
  const node = def.nodes.find((n) => n.data.type === "trigger");
  if (!node || node.data.type !== "trigger") return null;
  return { id: node.id, data: node.data };
}

function eventTypeMatchesTrigger(
  eventType: MatchableEvent["eventType"],
  triggerType: TriggerNode["triggerType"],
): boolean {
  switch (triggerType) {
    case "comment_keyword":
    case "live_comment":
      return eventType === "comment";
    case "dm_keyword":
      return eventType === "message";
    case "story_mention":
      return eventType === "mention";
    case "story_reply":
      return eventType === "message";
    case "ice_breaker":
      return eventType === "postback";
    default:
      return false;
  }
}

function keywordsMatch(
  text: string | undefined,
  keywords: string[] | undefined,
  matchAll: boolean | undefined,
): boolean {
  if (!keywords || keywords.length === 0) return true;
  if (!text) return false;

  const lower = text.toLowerCase();

  if (matchAll) {
    return keywords.every((kw) => lower.includes(kw.toLowerCase()));
  }
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

export function matchFlows(
  event: MatchableEvent,
  flows: MatchableFlow[],
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const flow of flows) {
    const trigger = getTriggerNode(flow.definition);
    if (!trigger) continue;

    if (!eventTypeMatchesTrigger(event.eventType, trigger.data.triggerType)) {
      continue;
    }

    const needsKeywords =
      trigger.data.triggerType === "comment_keyword" ||
      trigger.data.triggerType === "dm_keyword" ||
      trigger.data.triggerType === "live_comment";

    if (needsKeywords) {
      if (
        !keywordsMatch(event.text, trigger.data.keywords, trigger.data.matchAll)
      ) {
        continue;
      }
    }

    if (
      trigger.data.triggerType === "comment_keyword" &&
      trigger.data.postIds?.length &&
      event.mediaId
    ) {
      if (!trigger.data.postIds.includes(event.mediaId)) {
        continue;
      }
    }

    results.push({ flowId: flow.id, triggerNodeId: trigger.id });
  }

  return results;
}
