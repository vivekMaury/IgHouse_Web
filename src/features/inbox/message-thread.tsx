"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Send, AlertTriangle, Bot, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  source: "automation" | "human" | "system";
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
};

function sanitize(text: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text.replace(/[<>"'&]/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;" };
    return map[c] ?? c;
  });
}

export function MessageThread({
  conversationId,
}: {
  conversationId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windowClosed, setWindowClosed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/conversations/${conversationId}/messages?limit=50`);
    if (res.ok) {
      const data = (await res.json()) as { messages: Message[] };
      setMessages(data.messages);

      const lastInbound = [...data.messages]
        .reverse()
        .find((m) => m.direction === "inbound");
      if (lastInbound?.sent_at) {
        const hours = (Date.now() - new Date(lastInbound.sent_at).getTime()) / (1000 * 60 * 60);
        setWindowClosed(hours >= 24);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;
    async function fetchInitial() {
      const res = await fetch(`/api/conversations/${conversationId}/messages?limit=50`);
      if (res.ok && !cancelled) {
        const data = (await res.json()) as { messages: Message[] };
        setMessages(data.messages);
        const lastInbound = [...data.messages]
          .reverse()
          .find((m) => m.direction === "inbound");
        if (lastInbound?.sent_at) {
          const hours = (Date.now() - new Date(lastInbound.sent_at).getTime()) / (1000 * 60 * 60);
          setWindowClosed(hours >= 24);
        }
      }
    }
    fetchInitial();
    return () => { cancelled = true; };
  }, [conversationId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setError(null);
    setSending(true);

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });

    if (res.ok) {
      setText("");
      loadMessages();
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to send");
      if (data.error?.includes("24-hour")) {
        setWindowClosed(true);
      }
    }

    setSending(false);
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                msg.direction === "outbound"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.content && (
                <p className="whitespace-pre-wrap break-words">
                  {sanitize(msg.content)}
                </p>
              )}
              {msg.media_url && (
                <div className="mt-1">
                  {msg.media_type === "image" ? (
                    <Image src={msg.media_url} alt="" width={300} height={200} className="max-w-full rounded" unoptimized />
                  ) : (
                    <a
                      href={msg.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline"
                    >
                      View media
                    </a>
                  )}
                </div>
              )}
              <div className="mt-1 flex items-center gap-1 text-[10px] opacity-60">
                {msg.source === "automation" ? (
                  <Bot className="h-2.5 w-2.5" />
                ) : msg.source === "human" ? (
                  <UserRound className="h-2.5 w-2.5" />
                ) : null}
                <span>
                  {msg.sent_at
                    ? new Date(msg.sent_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {windowClosed && (
        <div className="flex items-center gap-2 border-t border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          24-hour messaging window has closed. Cannot send new messages.
        </div>
      )}

      {error && (
        <div className="px-4 py-1 text-xs text-destructive">{error}</div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border/60 px-4 py-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={windowClosed ? "Window closed" : "Type a message…"}
          disabled={windowClosed || sending}
          className="flex-1 rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          maxLength={2000}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!text.trim() || sending || windowClosed}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
