"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { UserPlus } from "lucide-react";
import type { LeadCaptureNode as LeadCaptureNodeData } from "@/lib/engine/schema";

export function LeadCaptureNode({ data }: NodeProps & { data: LeadCaptureNodeData }) {
  return (
    <div className="w-56 rounded-lg border border-emerald-500/40 bg-emerald-500/5 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-emerald-500 !h-2.5 !w-2.5" />
      <div className="flex items-center gap-2 rounded-t-lg border-b border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
        <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700">Lead Capture</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs font-medium capitalize">{data.field}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {data.promptText.length > 50
            ? data.promptText.slice(0, 50) + "…"
            : data.promptText}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !h-2.5 !w-2.5" />
    </div>
  );
}
