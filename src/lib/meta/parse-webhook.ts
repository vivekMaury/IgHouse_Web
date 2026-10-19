export type WebhookEntry = {
  id: string;
  time: number;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      attachments?: Array<{ type: string; payload: { url: string } }>;
      quick_reply?: { payload: string };
      is_echo?: boolean;
    };
    postback?: { mid: string; payload: string; title: string };
    read?: { watermark: number };
    delivery?: { watermark: number };
  }>;
  changes?: Array<{
    field: string;
    value: {
      id: string;
      from: { id: string; username?: string };
      text?: string;
      media?: { id: string };
      parent_id?: string;
    };
  }>;
};

export type WebhookPayload = {
  object: string;
  entry: WebhookEntry[];
};

export type ParsedEvent = {
  platform_event_id: string;
  event_type: string;
  ig_account_id: string;
  sender_id: string;
  payload: Record<string, unknown>;
};

export function parseWebhookPayload(body: WebhookPayload): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  for (const entry of body.entry) {
    if (entry.messaging) {
      for (const msg of entry.messaging) {
        if (msg.message?.is_echo) continue;

        if (msg.message) {
          events.push({
            platform_event_id: msg.message.mid,
            event_type: "message",
            ig_account_id: msg.recipient.id,
            sender_id: msg.sender.id,
            payload: msg as unknown as Record<string, unknown>,
          });
        }

        if (msg.postback) {
          events.push({
            platform_event_id: msg.postback.mid,
            event_type: "postback",
            ig_account_id: msg.recipient.id,
            sender_id: msg.sender.id,
            payload: msg as unknown as Record<string, unknown>,
          });
        }
      }
    }

    if (entry.changes) {
      for (const change of entry.changes) {
        if (change.field === "comments") {
          events.push({
            platform_event_id: change.value.id,
            event_type: "comment",
            ig_account_id: entry.id,
            sender_id: change.value.from.id,
            payload: change.value as unknown as Record<string, unknown>,
          });
        }

        if (change.field === "mentions" || change.field === "story_insights") {
          events.push({
            platform_event_id: `${entry.id}_${change.value.id}`,
            event_type: "mention",
            ig_account_id: entry.id,
            sender_id: change.value.from.id,
            payload: change.value as unknown as Record<string, unknown>,
          });
        }
      }
    }
  }

  return events;
}
