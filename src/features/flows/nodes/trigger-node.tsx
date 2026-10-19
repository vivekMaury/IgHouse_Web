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

export function TriggerNode({ data }: NodeProps & { data: TriggerNodeData }) {
  return (
    <div className="w-56 rounded-lg border border-amber-500/40 bg-amber-500/5 shadow-sm">
      <div className="flex items-center gap-2 rounded-t-lg border-b border-amber-500/20 bg-amber-500/10 px-3 py-2">
        <Zap className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-xs font-semibold text-amber-700">Trigger</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs font-medium">
          {TRIGGER_LABELS[data.triggerType] ?? data.triggerType}
        </p>
        {data.keywords && data.keywords.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Keywords: {data.keywords.join(", ")}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500 !h-2.5 !w-2.5" />
    </div>
  );
}
