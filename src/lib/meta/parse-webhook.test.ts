import { describe, expect, it } from "vitest";
import { parseWebhookPayload, type WebhookPayload } from "./parse-webhook";

describe("parseWebhookPayload", () => {
  it("parses an incoming Instagram DM with the business account and sender IDs", () => {
    const payload: WebhookPayload = {
      object: "instagram",
      entry: [
        {
          id: "business-account",
          time: 1_700_000_000,
          messaging: [
            {
              sender: { id: "customer-account" },
              recipient: { id: "business-account" },
              timestamp: 1_700_000_000,
              message: { mid: "message-1", text: "Hii" },
            },
          ],
        },
      ],
    };

    expect(parseWebhookPayload(payload)).toEqual([
      expect.objectContaining({
        platform_event_id: "message-1",
        event_type: "message",
        ig_account_id: "business-account",
        sender_id: "customer-account",
        payload: expect.objectContaining({
          message: { mid: "message-1", text: "Hii" },
        }),
      }),
    ]);
  });

  it("uses entry.id as ig_account_id, not recipient.id", () => {
    const payload: WebhookPayload = {
      object: "instagram",
      entry: [
        {
          id: "17841400000000001",
          time: 1_700_000_000,
          messaging: [
            {
              sender: { id: "customer-123" },
              recipient: { id: "different-recipient-id" },
              timestamp: 1_700_000_000,
              message: { mid: "msg-2", text: "Hello" },
            },
          ],
        },
      ],
    };

    const events = parseWebhookPayload(payload);
    expect(events).toHaveLength(1);
    expect(events[0]!.ig_account_id).toBe("17841400000000001");
  });

  it("parses a comment webhook event with text, from, and media", () => {
    const payload: WebhookPayload = {
      object: "instagram",
      entry: [
        {
          id: "17841400000000001",
          time: 1_700_000_000,
          changes: [
            {
              field: "comments",
              value: {
                id: "comment-123",
                from: { id: "user-456", username: "testuser" },
                text: "INFO please",
                media: { id: "media-789" },
              },
            },
          ],
        },
      ],
    };

    const events = parseWebhookPayload(payload);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        platform_event_id: "comment-123",
        event_type: "comment",
        ig_account_id: "17841400000000001",
        sender_id: "user-456",
      }),
    );
    const p = events[0]!.payload as Record<string, unknown>;
    expect(p.text).toBe("INFO please");
    expect((p.media as { id: string }).id).toBe("media-789");
  });

  it("parses a story mention webhook event", () => {
    const payload: WebhookPayload = {
      object: "instagram",
      entry: [
        {
          id: "17841400000000001",
          time: 1_700_000_000,
          changes: [
            {
              field: "mentions",
              value: {
                id: "story-media-111",
                from: { id: "user-222", username: "storyteller" },
                media: { id: "story-media-111" },
              },
            },
          ],
        },
      ],
    };

    const events = parseWebhookPayload(payload);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        platform_event_id: "17841400000000001_story-media-111",
        event_type: "mention",
        ig_account_id: "17841400000000001",
        sender_id: "user-222",
      }),
    );
  });

  it("parses a story reply as story_reply event type", () => {
    const payload: WebhookPayload = {
      object: "instagram",
      entry: [
        {
          id: "17841400000000001",
          time: 1_700_000_000,
          messaging: [
            {
              sender: { id: "user-333" },
              recipient: { id: "17841400000000001" },
              timestamp: 1_700_000_000,
              message: {
                mid: "reply-mid-444",
                text: "Love this!",
                reply_to: {
                  story: { id: "story-555", url: "https://example.com/story" },
                },
              },
            },
          ],
        },
      ],
    };

    const events = parseWebhookPayload(payload);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        platform_event_id: "reply-mid-444",
        event_type: "story_reply",
        ig_account_id: "17841400000000001",
        sender_id: "user-333",
      }),
    );
    const msg = (events[0]!.payload as Record<string, unknown>).message as Record<string, unknown>;
    expect(msg.text).toBe("Love this!");
    expect((msg.reply_to as Record<string, unknown>).story).toEqual(
      expect.objectContaining({ id: "story-555" }),
    );
  });

  it("regular DM without reply_to.story is still event_type message", () => {
    const payload: WebhookPayload = {
      object: "instagram",
      entry: [
        {
          id: "business-account",
          time: 1_700_000_000,
          messaging: [
            {
              sender: { id: "user-999" },
              recipient: { id: "business-account" },
              timestamp: 1_700_000_000,
              message: { mid: "normal-dm-1", text: "Hii" },
            },
          ],
        },
      ],
    };

    const events = parseWebhookPayload(payload);
    expect(events).toHaveLength(1);
    expect(events[0]!.event_type).toBe("message");
  });

  it("skips echo messages", () => {
    const payload: WebhookPayload = {
      object: "instagram",
      entry: [
        {
          id: "business-account",
          time: 1_700_000_000,
          messaging: [
            {
              sender: { id: "business-account" },
              recipient: { id: "customer-123" },
              timestamp: 1_700_000_000,
              message: { mid: "echo-1", text: "Sent by bot", is_echo: true },
            },
          ],
        },
      ],
    };

    expect(parseWebhookPayload(payload)).toEqual([]);
  });
});
