"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MessageSquare } from "lucide-react";
import type { MessageNode as MessageNodeData } from "@/lib/engine/schema";

const TYPE_LABELS: Record<string, string> = {
  dm: "Send DM",
  comment_reply: "Comment Reply",
  private_reply: "Private Reply",
};

export function MessageNode({ data }: NodeProps & { data: MessageNodeData }) {
  const preview = data.text ?? data.variants?.[0] ?? "No message set";
  const truncated = preview.length > 60 ? preview.slice(0, 60) + "…" : preview;

  return (
    <div className="w-56 rounded-lg border border-blue-500/40 bg-blue-500/5 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !h-2.5 !w-2.5" />
      <div className="flex items-center gap-2 rounded-t-lg border-b border-blue-500/20 bg-blue-500/10 px-3 py-2">
        <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
        <span className="text-xs font-semibold text-blue-700">
          {TYPE_LABELS[data.messageType] ?? "Message"}
        </span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-muted-foreground">{truncated}</p>
        {data.quickReplies && data.quickReplies.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {data.quickReplies.map((qr) => (
              <span
                key={qr.payload}
                className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700"
              >
                {qr.title}
              </span>
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !h-2.5 !w-2.5" />
    </div>
  );
}
