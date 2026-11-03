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
