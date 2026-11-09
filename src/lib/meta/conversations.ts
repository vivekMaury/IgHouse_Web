const GRAPH_API_BASE = "https://graph.instagram.com";
const GRAPH_API_VERSION = "v26.0";

type IgParticipant = {
  id: string;
  username?: string;
};

type IgConversation = {
  id: string;
  participants: { data: IgParticipant[] };
  updated_time: string;
};

type IgMessage = {
  id: string;
  message?: string;
  from: { id: string; username?: string };
  to: { data: Array<{ id: string; username?: string }> };
  created_time: string;
};

type ConversationsResponse = {
  data: IgConversation[];
  paging?: { cursors?: { after?: string }; next?: string };
};

type MessagesResponse = {
  messages: {
    data: Array<{ id: string; created_time: string }>;
    paging?: { cursors?: { after?: string }; next?: string };
  };
};

type MessageDetailResponse = IgMessage;

export type FetchedConversation = {
  igConversationId: string;
  participants: IgParticipant[];
  updatedTime: string;
};

export type FetchedMessage = {
  igMessageId: string;
  text: string | null;
  fromId: string;
  fromUsername: string | null;
  toIds: string[];
  createdTime: string;
};

export async function fetchConversations(
  igUserId: string,
  accessToken: string,
  maxConversations = 50,
): Promise<FetchedConversation[]> {
  const results: FetchedConversation[] = [];
  let url: string | null =
    `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${encodeURIComponent(igUserId)}/conversations` +
    `?fields=id,participants,updated_time&limit=20&access_token=${encodeURIComponent(accessToken)}`;

  while (url && results.length < maxConversations) {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error("[sync] fetchConversations failed:", res.status, text);
      break;
    }

    const json = (await res.json()) as ConversationsResponse;

    for (const conv of json.data) {
      if (results.length >= maxConversations) break;
      results.push({
        igConversationId: conv.id,
        participants: conv.participants.data,
        updatedTime: conv.updated_time,
      });
    }

    url = json.paging?.next ?? null;
  }

  return results;
}

export async function fetchConversationMessages(
  igConversationId: string,
  accessToken: string,
  maxMessages = 20,
): Promise<FetchedMessage[]> {
  const listUrl =
    `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${encodeURIComponent(igConversationId)}` +
    `?fields=messages{id,created_time}&access_token=${encodeURIComponent(accessToken)}`;

  const listRes = await fetch(listUrl);
  if (!listRes.ok) {
    const text = await listRes.text();
    console.error("[sync] fetchConversationMessages list failed:", listRes.status, text);
    return [];
  }

  const listJson = (await listRes.json()) as MessagesResponse;
  const messageStubs = (listJson.messages?.data ?? []).slice(0, maxMessages);

  const results: FetchedMessage[] = [];

  for (const stub of messageStubs) {
    const detailUrl =
      `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${encodeURIComponent(stub.id)}` +
      `?fields=id,message,from,to,created_time&access_token=${encodeURIComponent(accessToken)}`;

    const detailRes = await fetch(detailUrl);
    if (!detailRes.ok) {
      console.error("[sync] message detail fetch failed:", detailRes.status, stub.id);
      continue;
    }

    const msg = (await detailRes.json()) as MessageDetailResponse;
    results.push({
      igMessageId: msg.id,
      text: msg.message ?? null,
      fromId: msg.from.id,
      fromUsername: msg.from.username ?? null,
      toIds: msg.to.data.map((t) => t.id),
      createdTime: msg.created_time,
    });
  }

  return results;
}
