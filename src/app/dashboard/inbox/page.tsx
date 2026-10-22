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
      <div className="-m-6 flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const contactName =
    selectedConv?.contacts?.username ??
    selectedConv?.contacts?.platform_scoped_id ??
    "Unknown";

  return (
    <div className="-m-6 flex" style={{ height: "100vh" }}>
      {/* Conversation list */}
      <div className="w-80 shrink-0">
        <ConversationList
          workspaceId={workspaceId}
          selectedId={selectedConv?.id ?? null}
          onSelect={handleSelect}
        />
      </div>

      {/* Message area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selectedConv ? (
          <>
            {/* Conversation header */}
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
              <div className="flex items-center gap-3">
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
                  <p className="text-sm font-medium">{contactName}</p>
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
              <Button variant="outline" size="sm" onClick={toggleBot}>
                {botPaused ? (
                  <>
                    <Play className="mr-1 h-3 w-3" /> Resume Bot
                  </>
                ) : (
                  <>
                    <Pause className="mr-1 h-3 w-3" /> Pause Bot
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
