import { afterEach, describe, expect, it, vi } from "vitest";
import { executeAction, sendCommentReply, sendDm, sendPrivateReply } from "./send";

describe("Meta send utilities (send.ts)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const ctx = {
    accessToken: "test-token-123",
    recipientId: "recipient-ig-id-456",
  };

  it("sends a DM to recipient via Graph API v22.0", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ recipient_id: "recipient-ig-id-456", message_id: "mid.123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendDm(ctx, "Hello world!");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://graph.instagram.com/v22.0/me/messages");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: "Bearer test-token-123",
      "Content-Type": "application/json",
    });

    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      recipient: { id: "recipient-ig-id-456" },
      message: { text: "Hello world!" },
    });
    expect(result.success).toBe(true);
  });

  it("formats quick replies correctly in DM", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message_id: "mid.456" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendDm(ctx, "Pick an option:", {
      quickReplies: [
        { title: "Pricing", payload: "PAYLOAD_PRICING" },
        { title: "Support", payload: "PAYLOAD_SUPPORT" },
      ],
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.message.quick_replies).toEqual([
      { content_type: "text", title: "Pricing", payload: "PAYLOAD_PRICING" },
      { content_type: "text", title: "Support", payload: "PAYLOAD_SUPPORT" },
    ]);
    expect(result.success).toBe(true);
  });

  it("handles media attachments in DM", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message_id: "mid.789" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await sendDm(ctx, "Check this video:", {
      mediaUrl: "https://example.com/video.mp4",
      mediaType: "video",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.message.attachment).toEqual({
      type: "video",
      payload: { url: "https://example.com/video.mp4" },
    });
  });

  it("handles Graph API error responses gracefully", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { message: "Cannot send message to this user", type: "IGApiException", code: 551 },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendDm(ctx, "Hello");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Cannot send message to this user");
    expect(result.statusCode).toBe(400);
  });

  it("sends a public comment reply via v22.0", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "reply_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendCommentReply("test-token-123", "comment_999", "Thanks for your comment!");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://graph.instagram.com/v22.0/comment_999/replies");
    expect(JSON.parse(init.body as string)).toEqual({ message: "Thanks for your comment!" });
    expect(result.success).toBe(true);
  });

  it("sends a private reply to a comment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message_id: "mid.private" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendPrivateReply(ctx, "comment_888", "Sent you a DM!");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://graph.instagram.com/v22.0/me/messages");
    expect(JSON.parse(init.body as string)).toEqual({
      recipient: { comment_id: "comment_888" },
      message: { text: "Sent you a DM!" },
    });
    expect(result.success).toBe(true);
  });

  it("executes send_dm via executeAction", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message_id: "mid.action" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await executeAction(
      { type: "send_dm", text: "Action DM" },
      ctx,
    );

    expect(result.success).toBe(true);
  });
});
