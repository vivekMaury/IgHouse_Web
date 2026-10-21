"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MessageSquare } from "lucide-react";
import type { MessageNode as MessageNodeData } from "@/lib/engine/schema";

const TYPE_LABELS: Record<string, string> = {
  dm: "Send DM",
  comment_reply: "Comment Reply",
  private_reply: "Private Reply",
};

const sourceHandle = {
  width: 10,
  height: 10,
  background: "#3b82f6",
  border: "2px solid white",
};

const targetHandle = { ...sourceHandle };

export function MessageNode({ data, selected }: NodeProps & { data: MessageNodeData }) {
  const preview = data.text ?? data.variants?.[0] ?? "No message set";
  const truncated = preview.length > 60 ? preview.slice(0, 60) + "…" : preview;

  return (
    <div
      className={`w-56 rounded-xl border bg-card transition-all duration-150 ${
        selected
          ? "border-blue-500 ring-2 ring-blue-500/20"
          : "border-border/60"
      }`}
    >
      <Handle type="target" position={Position.Top} style={targetHandle} />
      <div className="flex items-center gap-2 rounded-t-[11px] bg-blue-500/10 px-3 py-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/20">
          <MessageSquare className="h-3 w-3 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
          {TYPE_LABELS[data.messageType] ?? "Message"}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs text-muted-foreground leading-relaxed">{truncated}</p>
        {data.quickReplies && data.quickReplies.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {data.quickReplies.map((qr) => (
              <span
                key={qr.payload}
                className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400"
              >
                {qr.title}
              </span>
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={sourceHandle} />
    </div>
  );
}
