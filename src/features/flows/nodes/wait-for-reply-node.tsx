"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Timer } from "lucide-react";
import type { WaitForReplyNode as WaitForReplyNodeData } from "@/lib/engine/schema";

export function WaitForReplyNode({ data, selected }: NodeProps & { data: WaitForReplyNodeData }) {
  return (
    <div
      className={`relative w-56 rounded-xl border bg-card transition-all duration-150 ${
        selected
          ? "border-teal-500 ring-2 ring-teal-500/20"
          : "border-border/60"
      }`}
    >
      {/* Exec in */}
      <Handle className="handle-exec" type="target" position={Position.Top} isConnectable />

      <div className="flex items-center gap-2 rounded-t-[11px] bg-teal-500/10 px-3 py-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-500/20">
          <Timer className="h-3 w-3 text-teal-600 dark:text-teal-400" />
        </div>
        <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
          Wait for Reply
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-foreground">
          Wait {data.timeoutMinutes}m for reply
        </p>
      </div>

      {/* Data port label */}
      <div className="flex items-center justify-end border-t border-border/30 px-3 py-1">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground/70">Reply</span>
          <div className="h-1.5 w-1.5 rounded-[2px] bg-primary/60" />
        </div>
      </div>

      {/* Data out */}
      <Handle className="handle-data" id="data-out" type="source" position={Position.Right} isConnectable />

      <div className="flex justify-between px-4 pb-2">
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          Reply
        </span>
        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          Timeout
        </span>
      </div>

      {/* Branch handles — semantic colors */}
      <Handle
        className="handle-exec handle-branch"
        id="reply"
        type="source"
        position={Position.Bottom}
        style={{ background: "#10b981", left: "25%" }}
        isConnectable
      />
      <Handle
        className="handle-exec handle-branch"
        id="timeout"
        type="source"
        position={Position.Bottom}
        style={{ background: "#f59e0b", left: "75%" }}
        isConnectable
      />
    </div>
  );
}
