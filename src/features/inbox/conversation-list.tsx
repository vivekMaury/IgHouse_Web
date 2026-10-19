"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { MessageSquare, Bot, UserRound } from "lucide-react";
import Image from "next/image";

type Conversation = {
  id: string;
  status: string;
  bot_paused: boolean;
  bot_paused_until: string | null;
  assigned_to: string | null;
  last_message_at: string | null;
  unread_count: number;
  contact_id: string;
  contacts: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    platform_scoped_id: string;
  } | null;
};

type Filter = "all" | "unread" | "bot_active" | "bot_paused";

function sanitizeText(text: string): string {
  return text.replace(/[<>"'&]/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;" };
    return map[c] ?? c;
  });
}

export function ConversationList({
  workspaceId,
  selectedId,
  onSelect,
}: {
  workspaceId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/conversations?filter=${filter}&limit=50`);
      if (res.ok) {
        const data = (await res.json()) as { conversations: Conversation[] };
        setConversations(data.conversations);
      }
      setLoading(false);
    }
    load();
  }, [filter]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversations:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          fetch(`/api/conversations?filter=${filter}&limit=50`)
            .then((res) => res.json())
            .then((data: { conversations: Conversation[] }) =>
              setConversations(data.conversations)
            );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, filter]);

  const FILTERS: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread" },
    { label: "Bot Active", value: "bot_active" },
    { label: "Paused", value: "bot_paused" },
  ];

  return (
    <div className="flex h-full flex-col border-r border-border/60">
      <div className="flex items-center gap-1 border-b border-border/60 px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Loading…</div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-xs text-muted-foreground">No conversations</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const username = conv.contacts?.username ?? conv.contacts?.platform_scoped_id ?? "Unknown";

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`flex w-full items-center gap-3 border-b border-border/40 px-3 py-3 text-left transition-colors ${
                  selectedId === conv.id ? "bg-accent/50" : "hover:bg-muted/30"
                }`}
              >
                {conv.contacts?.avatar_url ? (
                  <Image
                    src={conv.contacts.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">
                      {sanitizeText(username)}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {conv.bot_paused ? (
                      <UserRound className="h-3 w-3 text-amber-500" />
                    ) : (
                      <Bot className="h-3 w-3 text-emerald-500" />
                    )}
                    <span>{conv.bot_paused ? "Human" : "Bot active"}</span>
                    {conv.last_message_at && (
                      <>
                        <span>&middot;</span>
                        <span>{formatTimeAgo(conv.last_message_at)}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
