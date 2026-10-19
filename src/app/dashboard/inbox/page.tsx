"use client";

import { useEffect, useState } from "react";
import { ConversationList } from "@/features/inbox/conversation-list";
import { MessageThread } from "@/features/inbox/message-thread";
import { MessageSquare, Bot, UserRound, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [botPaused, setBotPaused] = useState(false);

  useEffect(() => {
    fetch("/api/conversations?limit=1")
      .then((r) => r.json())
      .then((d: { workspaceId?: string }) => {
        if (d.workspaceId) setWorkspaceId(d.workspaceId);
      });
  }, []);

  function handleSelect(id: string) {
    setSelectedId(id);
    fetch(`/api/conversations/${id}/read`, { method: "POST" });
  }

  async function toggleBot() {
    if (!selectedId) return;
    const newPaused = !botPaused;

    const res = await fetch(`/api/conversations/${selectedId}/bot-toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: newPaused }),
    });

    if (res.ok) {
      setBotPaused(newPaused);
    }
  }

  if (!workspaceId) {
    return (
      <div className="-m-6 flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="-m-6 flex" style={{ height: "100vh" }}>
      <div className="w-80 shrink-0">
        <ConversationList
          workspaceId={workspaceId}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      <div className="flex flex-1 flex-col">
        {selectedId ? (
          <>
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                {botPaused ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <UserRound className="h-3.5 w-3.5" />
                    Human takeover
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Bot className="h-3.5 w-3.5" />
                    Bot active
                  </span>
                )}
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
            <MessageThread conversationId={selectedId} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">
              Select a conversation to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
