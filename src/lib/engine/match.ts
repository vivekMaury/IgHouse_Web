import type { FlowDefinition, TriggerNode } from "./schema";

export type MatchableEvent = {
  eventType: "message" | "comment" | "postback" | "mention" | "story_reply";
  text?: string;
  postbackPayload?: string;
  commentId?: string;
  mediaId?: string;
  storyId?: string;
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
      return eventType === "story_reply";
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

  console.log("[engine:match] Matching event against flows", {
    eventType: event.eventType,
    hasText: event.text !== undefined,
    flowCount: flows.length,
    flowIds: flows.map((flow) => flow.id),
  });

  for (const flow of flows) {
    const trigger = getTriggerNode(flow.definition);
    if (!trigger) {
      console.log("[engine:match] Skipping flow without trigger node", {
        flowId: flow.id,
      });
      continue;
    }

    const matchesEventType = eventTypeMatchesTrigger(
      event.eventType,
      trigger.data.triggerType,
    );
    const keywords = trigger.data.keywords?.filter((keyword) => keyword.trim().length > 0) ?? [];
    const matchesKeywords = keywordsMatch(event.text, keywords, trigger.data.matchAll);
    const matchesPost = !(
      trigger.data.triggerType === "comment_keyword" &&
      trigger.data.postIds?.length &&
      event.mediaId &&
      !trigger.data.postIds.includes(event.mediaId)
    );

    console.log("[engine:match] Evaluated flow", {
      flowId: flow.id,
      triggerType: trigger.data.triggerType,
      eventType: event.eventType,
      matchesEventType,
      keywords,
      matchAll: trigger.data.matchAll ?? false,
      matchesKeywords,
      postIds: trigger.data.postIds ?? [],
      eventMediaId: event.mediaId,
      matchesPost,
    });

    if (!matchesEventType) {
      continue;
    }

    // Keyword filtering: only applied when keywords are explicitly configured.
    // Empty/undefined keywords = catch-all (matches any text).
    if (keywords.length > 0 && !matchesKeywords) {
      continue;
    }

    if (!matchesPost) continue;

    results.push({ flowId: flow.id, triggerNodeId: trigger.id });
  }

  console.log("[engine:match] Match results", {
    eventType: event.eventType,
    matchedFlowIds: results.map((result) => result.flowId),
  });

  return results;
}
