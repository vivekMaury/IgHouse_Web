import type { Action } from "@/lib/engine/step";

const GRAPH_API = "https://graph.instagram.com/v21.0";

export type SendContext = {
  accessToken: string;
  recipientId: string;
};

type ApiResult = {
  success: boolean;
  response?: Record<string, unknown>;
  error?: string;
  statusCode?: number;
};

async function graphPost(
  path: string,
  body: Record<string, unknown>,
  token: string,
): Promise<ApiResult> {
  const res = await fetch(`${GRAPH_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const err = json.error as Record<string, unknown> | undefined;
    return {
      success: false,
      response: json,
      error: (err?.message as string) ?? `HTTP ${res.status}`,
      statusCode: res.status,
    };
  }

  return { success: true, response: json, statusCode: res.status };
}

export async function sendDm(
  ctx: SendContext,
  text: string,
  options?: {
    quickReplies?: Array<{ title: string; payload: string }>;
    buttons?: Array<{ type: string; title: string; value: string }>;
    mediaUrl?: string;
    mediaType?: string;
  },
): Promise<ApiResult> {
  const message: Record<string, unknown> = { text };

  if (options?.quickReplies?.length) {
    message.quick_replies = options.quickReplies.map((qr) => ({
      content_type: "text",
      title: qr.title,
      payload: qr.payload,
    }));
  }

  if (options?.mediaUrl) {
    message.attachment = {
      type: options.mediaType === "video" ? "video" : "image",
      payload: { url: options.mediaUrl },
    };
  }

  return graphPost(
    "/me/messages",
    { recipient: { id: ctx.recipientId }, message },
    ctx.accessToken,
  );
}

export async function sendCommentReply(
  token: string,
  commentId: string,
  text: string,
): Promise<ApiResult> {
  return graphPost(`/${commentId}/replies`, { message: text }, token);
}

export async function sendPrivateReply(
  ctx: SendContext,
  commentId: string,
  text: string,
  quickReplies?: Array<{ title: string; payload: string }>,
): Promise<ApiResult> {
  const message: Record<string, unknown> = { text };

  if (quickReplies?.length) {
    message.quick_replies = quickReplies.map((qr) => ({
      content_type: "text",
      title: qr.title,
      payload: qr.payload,
    }));
  }

  return graphPost(
    "/me/messages",
    { recipient: { comment_id: commentId }, message },
    ctx.accessToken,
  );
}

export async function executeAction(
  action: Action,
  ctx: SendContext,
): Promise<ApiResult> {
  switch (action.type) {
    case "send_dm":
      return sendDm(ctx, action.text, {
        quickReplies: action.quickReplies,
        buttons: action.buttons,
        mediaUrl: action.mediaUrl,
        mediaType: action.mediaType,
      });

    case "send_comment_reply":
      return sendCommentReply(ctx.accessToken, action.commentId, action.text);

    case "send_private_reply":
      return sendPrivateReply(
        ctx,
        action.commentId,
        action.text,
        action.quickReplies,
      );

    case "capture_lead":
    case "schedule_delay":
    case "request_reply":
    case "log":
      return { success: true };

    default:
      return { success: true };
  }
}
