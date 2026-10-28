"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";
import type { DelayNode as DelayNodeData } from "@/lib/engine/schema";

export function DelayNode({ data, selected }: NodeProps & { data: DelayNodeData }) {
  return (
    <div
      className={`relative w-56 rounded-xl border bg-card transition-all duration-150 ${
        selected
          ? "border-orange-500 ring-2 ring-orange-500/20"
          : "border-border/60"
      }`}
    >
      {/* Exec in */}
      <Handle className="handle-exec" type="target" position={Position.Top} isConnectable />

      <div className="flex items-center gap-2 rounded-t-[11px] bg-orange-500/10 px-3 py-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-500/20">
          <Clock className="h-3 w-3 text-orange-600 dark:text-orange-400" />
        </div>
        <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
          Delay
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-foreground">
          Wait {data.duration} {data.unit}
        </p>
      </div>

      {/* Exec out */}
      <Handle className="handle-exec" type="source" position={Position.Bottom} isConnectable />
    </div>
  );
}
