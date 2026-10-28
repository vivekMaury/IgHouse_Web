"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";
import type { TriggerNode as TriggerNodeData } from "@/lib/engine/schema";

const TRIGGER_LABELS: Record<string, string> = {
  comment_keyword: "Comment Keyword",
  dm_keyword: "DM Keyword",
  story_mention: "Story Mention",
  story_reply: "Story Reply",
  live_comment: "Live Comment",
  ice_breaker: "Ice Breaker",
};

const handleStyle = { background: "#f59e0b" };

export function TriggerNode({ data, selected }: NodeProps & { data: TriggerNodeData }) {
  const keywords = (data.keywords ?? []).filter((k) => k.trim());

  return (
    <div
      className={`relative w-56 rounded-xl border bg-card transition-all duration-150 ${
        selected
          ? "border-amber-500 ring-2 ring-amber-500/20"
          : "border-border/60"
      }`}
    >
      <div className="flex items-center gap-2 rounded-t-[11px] bg-amber-500/10 px-3 py-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20">
          <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          Trigger
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-foreground">
          {TRIGGER_LABELS[data.triggerType] ?? data.triggerType}
        </p>
        {keywords.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {keywords.slice(0, 3).map((kw, i) => (
              <span
                key={i}
                className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
              >
                {kw}
              </span>
            ))}
            {keywords.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{keywords.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={handleStyle} isConnectable={true} />
    </div>
  );
}
