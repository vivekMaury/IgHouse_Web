"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";
import type { DelayNode as DelayNodeData } from "@/lib/engine/schema";

export function DelayNode({ data }: NodeProps & { data: DelayNodeData }) {
  return (
    <div className="w-56 rounded-lg border border-orange-500/40 bg-orange-500/5 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-orange-500 !h-2.5 !w-2.5" />
      <div className="flex items-center gap-2 rounded-t-lg border-b border-orange-500/20 bg-orange-500/10 px-3 py-2">
        <Clock className="h-3.5 w-3.5 text-orange-600" />
        <span className="text-xs font-semibold text-orange-700">Delay</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs font-medium">
          Wait {data.duration} {data.unit}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !h-2.5 !w-2.5" />
    </div>
  );
}
