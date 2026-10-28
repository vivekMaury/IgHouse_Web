"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { UserPlus } from "lucide-react";
import type { LeadCaptureNode as LeadCaptureNodeData } from "@/lib/engine/schema";

export function LeadCaptureNode({ data, selected }: NodeProps & { data: LeadCaptureNodeData }) {
  const prompt =
    data.promptText.length > 50
      ? data.promptText.slice(0, 50) + "…"
      : data.promptText;

  return (
    <div
      className={`relative w-56 rounded-xl border bg-card transition-all duration-150 ${
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/20"
          : "border-border/60"
      }`}
    >
      {/* Exec in */}
      <Handle className="handle-exec" id="exec-in" type="target" position={Position.Top} isConnectable />

      <div className="flex items-center gap-2 rounded-t-[11px] bg-emerald-500/10 px-3 py-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20">
          <UserPlus className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          Lead Capture
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium capitalize text-foreground">{data.field}</p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          {prompt}
        </p>
      </div>

      {/* Data port label */}
      <div className="flex items-center justify-end border-t border-border/30 px-3 py-1">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground/70">Value</span>
          <div className="h-1.5 w-1.5 rounded-[2px] bg-primary/60" />
        </div>
      </div>

      {/* Data out */}
      <Handle className="handle-data" id="data-out" type="source" position={Position.Right} isConnectable />

      {/* Exec out */}
      <Handle className="handle-exec" id="exec-out" type="source" position={Position.Bottom} isConnectable />
    </div>
  );
}
