"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ConversationList,
  type Conversation,
} from "@/features/inbox/conversation-list";
import { MessageThread } from "@/features/inbox/message-thread";
import {
  Bot,
  UserRound,
  Play,
  Pause,
  Inbox,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function InboxPage() {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [botPaused, setBotPaused] = useState(false);

  useEffect(() => {
    fetch("/api/conversations?limit=1")
      .then((r) => r.json())
      .then((d: { workspaceId?: string }) => {
        if (d.workspaceId) setWorkspaceId(d.workspaceId);
      });
  }, []);

  const handleSelect = useCallback((conv: Conversation) => {
    setSelectedConv(conv);
    setBotPaused(conv.bot_paused);
    fetch(`/api/conversations/${conv.id}/read`, { method: "POST" });
  }, []);

  const toggleBot = useCallback(async () => {
    if (!selectedConv) return;
    const newPaused = !botPaused;

    const res = await fetch(
      `/api/conversations/${selectedConv.id}/bot-toggle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: newPaused }),
      },
    );

    if (res.ok) {
      setBotPaused(newPaused);
    }
  }, [selectedConv, botPaused]);

  if (!workspaceId) {
    return (
      <div className="-m-3 flex h-[calc(100dvh-3.5rem)] items-center justify-center sm:-m-4 md:-m-6 md:h-dvh">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const contactName =
    selectedConv?.contacts?.full_name ??
    selectedConv?.contacts?.username ??
    selectedConv?.contacts?.platform_scoped_id ??
    "Unknown";

  return (
    <div className="-m-3 flex h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden sm:-m-4 md:-m-6 md:h-dvh">
      {/* Conversation list */}
      <div className={`${selectedConv ? "hidden md:block" : "block"} w-full shrink-0 md:w-80`}>
        <ConversationList
          workspaceId={workspaceId}
          selectedId={selectedConv?.id ?? null}
          onSelect={handleSelect}
        />
      </div>

      {/* Message area */}
      <div className={`${selectedConv ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {selectedConv ? (
          <>
            {/* Conversation header */}
            <div className="flex min-h-14 items-center justify-between gap-2 border-b border-border/60 px-3 py-2 sm:px-4">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedConv(null)}
                  aria-label="Back to conversations"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
                >
                  <ArrowLeft className="size-4" />
                </button>
                {selectedConv.contacts?.avatar_url ? (
                  <Image
                    src={selectedConv.contacts.avatar_url}
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
                <div>
                  <p className="truncate text-sm font-medium">{contactName}</p>
                  <div className="flex items-center gap-1.5 text-xs">
                    {botPaused ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <UserRound className="h-3 w-3" />
                        Human takeover
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Bot className="h-3 w-3" />
                        Bot active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={toggleBot} className="shrink-0">
                {botPaused ? (
                  <>
                    <Play className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Resume Bot</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Pause Bot</span>
                  </>
                )}
              </Button>
            </div>
            <MessageThread conversationId={selectedConv.id} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Select a conversation
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
