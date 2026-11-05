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

  it("matches the DM keyword Hii case-insensitively", () => {
    const flows = [makeFlow("f1", "dm_keyword", ["Hii"])];
    const event: MatchableEvent = { eventType: "message", text: "hii" };
    expect(matchFlows(event, flows)).toHaveLength(1);
  });

  it("does not match dm_keyword on comment event", () => {
    const flows = [makeFlow("f1", "dm_keyword", ["pricing"])];
    const event: MatchableEvent = { eventType: "comment", text: "pricing" };
    expect(matchFlows(event, flows)).toHaveLength(0);
  });

  it("matches story_mention trigger on mention event", () => {
    const flows = [makeFlow("f1", "story_mention")];
    const event: MatchableEvent = { eventType: "mention", storyId: "story-123" };
    expect(matchFlows(event, flows)).toHaveLength(1);
  });

  it("story_mention trigger does not match message or comment events", () => {
    const flows = [makeFlow("f1", "story_mention")];
    expect(matchFlows({ eventType: "message", text: "hi" }, flows)).toHaveLength(0);
    expect(matchFlows({ eventType: "comment", text: "hi" }, flows)).toHaveLength(0);
    expect(matchFlows({ eventType: "story_reply", text: "hi" }, flows)).toHaveLength(0);
  });

  it("matches story_reply trigger on story_reply event", () => {
    const flows = [makeFlow("f1", "story_reply")];
    const event: MatchableEvent = { eventType: "story_reply", text: "Love this!", storyId: "story-456" };
    expect(matchFlows(event, flows)).toHaveLength(1);
  });

  it("story_reply trigger does not match regular message or comment events", () => {
    const flows = [makeFlow("f1", "story_reply")];
    expect(matchFlows({ eventType: "message", text: "hi" }, flows)).toHaveLength(0);
    expect(matchFlows({ eventType: "comment", text: "hi" }, flows)).toHaveLength(0);
    expect(matchFlows({ eventType: "mention" }, flows)).toHaveLength(0);
  });

  it("story_reply with keywords only matches when text contains keyword", () => {
    const flows = [makeFlow("f1", "story_reply", ["GUIDE"])];
    expect(matchFlows({ eventType: "story_reply", text: "send me the GUIDE" }, flows)).toHaveLength(1);
    expect(matchFlows({ eventType: "story_reply", text: "Love this!" }, flows)).toHaveLength(0);
  });

  it("story_reply without keywords acts as catch-all", () => {
    const flows = [makeFlow("f1", "story_reply")];
    expect(matchFlows({ eventType: "story_reply", text: "anything here" }, flows)).toHaveLength(1);
    expect(matchFlows({ eventType: "story_reply", text: "" }, flows)).toHaveLength(1);
    expect(matchFlows({ eventType: "story_reply" }, flows)).toHaveLength(1);
  });

  it("story_mention with keywords only matches when text contains keyword", () => {
    const flows = [makeFlow("f1", "story_mention", ["COLLAB"])];
    expect(matchFlows({ eventType: "mention", text: "COLLAB with me!" }, flows)).toHaveLength(1);
    expect(matchFlows({ eventType: "mention", text: "nice story" }, flows)).toHaveLength(0);
  });

  it("story_mention without keywords acts as catch-all", () => {
    const flows = [makeFlow("f1", "story_mention")];
    expect(matchFlows({ eventType: "mention" }, flows)).toHaveLength(1);
    expect(matchFlows({ eventType: "mention", text: "anything" }, flows)).toHaveLength(1);
  });

  it("keyword-filtered story_reply coexists with catch-all: specific wins when text matches", () => {
    const flows = [
      makeFlow("catch-all", "story_reply"),
      makeFlow("guide-flow", "story_reply", ["GUIDE"]),
    ];
    const guideReply: MatchableEvent = { eventType: "story_reply", text: "Send GUIDE" };
    const genericReply: MatchableEvent = { eventType: "story_reply", text: "cool story" };

    // Both match "GUIDE" text (catch-all + keyword)
    expect(matchFlows(guideReply, flows).map((r) => r.flowId)).toEqual(["catch-all", "guide-flow"]);
    // Only catch-all matches generic text
    expect(matchFlows(genericReply, flows).map((r) => r.flowId)).toEqual(["catch-all"]);
  });

  it("all trigger types coexist: each event matches only its trigger", () => {
    const flows = [
      makeFlow("dm-flow", "dm_keyword", ["hi"]),
      makeFlow("comment-flow", "comment_keyword", ["info"]),
      makeFlow("mention-flow", "story_mention"),
      makeFlow("reply-flow", "story_reply"),
    ];

    expect(matchFlows({ eventType: "message", text: "hi" }, flows).map((r) => r.flowId)).toEqual(["dm-flow"]);
    expect(matchFlows({ eventType: "comment", text: "info" }, flows).map((r) => r.flowId)).toEqual(["comment-flow"]);
    expect(matchFlows({ eventType: "mention" }, flows).map((r) => r.flowId)).toEqual(["mention-flow"]);
    expect(matchFlows({ eventType: "story_reply", text: "wow" }, flows).map((r) => r.flowId)).toEqual(["reply-flow"]);
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

  it("coexisting DM and comment flows: comment event only matches comment_keyword", () => {
    const flows = [
      makeFlow("dm-flow", "dm_keyword", ["INFO"]),
      makeFlow("comment-flow", "comment_keyword", ["INFO"]),
    ];
    const commentEvent: MatchableEvent = { eventType: "comment", text: "INFO please", commentId: "c123" };
    const results = matchFlows(commentEvent, flows);
    expect(results).toHaveLength(1);
    expect(results[0]!.flowId).toBe("comment-flow");
  });

  it("coexisting DM and comment flows: DM event only matches dm_keyword", () => {
    const flows = [
      makeFlow("dm-flow", "dm_keyword", ["INFO"]),
      makeFlow("comment-flow", "comment_keyword", ["INFO"]),
    ];
    const dmEvent: MatchableEvent = { eventType: "message", text: "INFO please" };
    const results = matchFlows(dmEvent, flows);
    expect(results).toHaveLength(1);
    expect(results[0]!.flowId).toBe("dm-flow");
  });

  it("coexisting flows with different keywords: each matches only its keyword", () => {
    const flows = [
      makeFlow("dm-pricing", "dm_keyword", ["pricing"]),
      makeFlow("dm-help", "dm_keyword", ["help"]),
      makeFlow("comment-info", "comment_keyword", ["info"]),
    ];

    const dmPricing: MatchableEvent = { eventType: "message", text: "pricing question" };
    expect(matchFlows(dmPricing, flows).map((r) => r.flowId)).toEqual(["dm-pricing"]);

    const dmHelp: MatchableEvent = { eventType: "message", text: "need help" };
    expect(matchFlows(dmHelp, flows).map((r) => r.flowId)).toEqual(["dm-help"]);

    const commentInfo: MatchableEvent = { eventType: "comment", text: "info", commentId: "c1" };
    expect(matchFlows(commentInfo, flows).map((r) => r.flowId)).toEqual(["comment-info"]);
  });

  it("story_mention flow does not match message or comment events", () => {
    const flows = [
      makeFlow("mention-flow", "story_mention"),
      makeFlow("dm-flow", "dm_keyword", ["hi"]),
    ];
    const dmEvent: MatchableEvent = { eventType: "message", text: "hi" };
    expect(matchFlows(dmEvent, flows).map((r) => r.flowId)).toEqual(["dm-flow"]);

    const commentEvent: MatchableEvent = { eventType: "comment", text: "hi" };
    expect(matchFlows(commentEvent, flows)).toHaveLength(0);
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
