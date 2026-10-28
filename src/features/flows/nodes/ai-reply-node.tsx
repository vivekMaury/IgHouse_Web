"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import type { AiReplyNode as AiReplyNodeData } from "@/lib/engine/schema";

export function AiReplyNode({ data, selected }: NodeProps & { data: AiReplyNodeData }) {
  const truncatedPrompt = data.systemPrompt.length > 40
    ? data.systemPrompt.slice(0, 40) + "…"
    : data.systemPrompt;

  return (
    <div
      className={`relative w-56 rounded-xl border bg-card transition-all duration-150 ${
        selected
          ? "border-violet-500 ring-2 ring-violet-500/20"
          : "border-border/60"
      }`}
    >
      {/* Exec in */}
      <Handle className="handle-exec" type="target" position={Position.Top} isConnectable />

      <div className="flex items-center gap-2 rounded-t-[11px] bg-violet-500/10 px-3 py-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/20">
          <Sparkles className="h-3 w-3 text-violet-600 dark:text-violet-400" />
        </div>
        <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
          AI Reply
        </span>
      </div>
      <div className="px-3 py-2.5 space-y-0.5">
        <p className="text-xs font-medium text-foreground">
          {truncatedPrompt || "No prompt set"}
        </p>
        <p className="text-[10px] text-muted-foreground">
          Max {data.maxTokens} tokens
        </p>
      </div>

      {/* Data port labels */}
      <div className="flex items-center justify-between border-t border-border/30 px-3 py-1">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-[2px] bg-primary/60" />
          <span className="text-[9px] text-muted-foreground/70">Context</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground/70">AI Text</span>
          <div className="h-1.5 w-1.5 rounded-[2px] bg-primary/60" />
        </div>
      </div>

      {/* Data in / out */}
      <Handle className="handle-data" id="data-in" type="target" position={Position.Left} isConnectable />
      <Handle className="handle-data" id="data-out" type="source" position={Position.Right} isConnectable />

      {/* Exec out */}
      <Handle className="handle-exec" type="source" position={Position.Bottom} isConnectable />
    </div>
  );
}
