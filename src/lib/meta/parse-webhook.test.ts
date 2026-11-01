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
});
