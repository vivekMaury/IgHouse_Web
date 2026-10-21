import { describe, it, expect } from "vitest";
import { matchFlows, type MatchableEvent, type MatchableFlow } from "./match";
import type { FlowDefinition } from "./schema";

function makeFlow(
  id: string,
  triggerType: string,
  keywords?: string[],
  opts?: { matchAll?: boolean; postIds?: string[] },
): MatchableFlow {
  const definition: FlowDefinition = {
    nodes: [
      {
        id: "trigger-1",
        data: {
          type: "trigger" as const,
          triggerType: triggerType as "comment_keyword",
          keywords,
          matchAll: opts?.matchAll,
          postIds: opts?.postIds,
          cooldownHours: 24,
        },
      },
      {
        id: "msg-1",
        data: { type: "message" as const, messageType: "dm" as const, text: "Hello!" },
      },
    ],
    edges: [{ id: "e1", source: "trigger-1", target: "msg-1" }],
  };
  return { id, definition };
}

describe("matchFlows", () => {
  it("matches comment_keyword trigger on keyword match", () => {
    const flows = [makeFlow("f1", "comment_keyword", ["INFO"])];
    const event: MatchableEvent = { eventType: "comment", text: "I want INFO please" };
    const results = matchFlows(event, flows);
    expect(results).toHaveLength(1);
    expect(results[0]!.flowId).toBe("f1");
  });

  it("does not match when keyword is absent", () => {
    const flows = [makeFlow("f1", "comment_keyword", ["INFO"])];
    const event: MatchableEvent = { eventType: "comment", text: "Hello world" };
    expect(matchFlows(event, flows)).toHaveLength(0);
  });

  it("case-insensitive keyword matching", () => {
    const flows = [makeFlow("f1", "comment_keyword", ["info"])];
    const event: MatchableEvent = { eventType: "comment", text: "Send me INFO" };
    expect(matchFlows(event, flows)).toHaveLength(1);
  });

  it("matches dm_keyword trigger", () => {
    const flows = [makeFlow("f1", "dm_keyword", ["pricing"])];
    const event: MatchableEvent = { eventType: "message", text: "What is the pricing?" };
    expect(matchFlows(event, flows)).toHaveLength(1);
  });

  it("does not match dm_keyword on comment event", () => {
    const flows = [makeFlow("f1", "dm_keyword", ["pricing"])];
    const event: MatchableEvent = { eventType: "comment", text: "pricing" };
    expect(matchFlows(event, flows)).toHaveLength(0);
  });

  it("matches story_mention trigger", () => {
    const flows = [makeFlow("f1", "story_mention")];
    const event: MatchableEvent = { eventType: "mention" };
    expect(matchFlows(event, flows)).toHaveLength(1);
  });

  it("matchAll requires all keywords present", () => {
    const flows = [makeFlow("f1", "comment_keyword", ["hello", "world"], { matchAll: true })];
    const partial: MatchableEvent = { eventType: "comment", text: "hello there" };
    expect(matchFlows(partial, flows)).toHaveLength(0);

    const full: MatchableEvent = { eventType: "comment", text: "hello world" };
    expect(matchFlows(full, flows)).toHaveLength(1);
  });

  it("matches any keyword when matchAll is false", () => {
    const flows = [makeFlow("f1", "comment_keyword", ["hello", "world"], { matchAll: false })];
    const event: MatchableEvent = { eventType: "comment", text: "hello there" };
    expect(matchFlows(event, flows)).toHaveLength(1);
  });

  it("no keywords means match all comments", () => {
    const flows = [makeFlow("f1", "comment_keyword", [])];
    const event: MatchableEvent = { eventType: "comment", text: "anything" };
    expect(matchFlows(event, flows)).toHaveLength(1);
  });

  it("filters by postIds when specified", () => {
    const flows = [makeFlow("f1", "comment_keyword", ["INFO"], { postIds: ["post-123"] })];
    const wrong: MatchableEvent = { eventType: "comment", text: "INFO", mediaId: "post-456" };
    expect(matchFlows(wrong, flows)).toHaveLength(0);

    const right: MatchableEvent = { eventType: "comment", text: "INFO", mediaId: "post-123" };
    expect(matchFlows(right, flows)).toHaveLength(1);
  });

  it("matches multiple flows", () => {
    const flows = [
      makeFlow("f1", "comment_keyword", ["INFO"]),
      makeFlow("f2", "comment_keyword", ["HELP"]),
    ];
    const event: MatchableEvent = { eventType: "comment", text: "INFO HELP me" };
    expect(matchFlows(event, flows)).toHaveLength(2);
  });

  it("skips flows without trigger node", () => {
    const noTrigger: MatchableFlow = {
      id: "f1",
      definition: {
        nodes: [{ id: "msg-1", data: { type: "message", messageType: "dm", text: "hi" } }],
        edges: [],
      },
    };
    const event: MatchableEvent = { eventType: "message", text: "hello" };
    expect(matchFlows(event, [noTrigger])).toHaveLength(0);
  });
});
