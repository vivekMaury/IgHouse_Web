"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import type { ConditionNode as ConditionNodeData } from "@/lib/engine/schema";

const FIELD_LABELS: Record<string, string> = {
  is_follower: "Is Follower",
  has_email: "Has Email",
  has_phone: "Has Phone",
  has_tag: "Has Tag",
  custom_field: "Custom Field",
};

export function ConditionNode({ data }: NodeProps & { data: ConditionNodeData }) {
  return (
    <div className="w-56 rounded-lg border border-purple-500/40 bg-purple-500/5 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !h-2.5 !w-2.5" />
      <div className="flex items-center gap-2 rounded-t-lg border-b border-purple-500/20 bg-purple-500/10 px-3 py-2">
        <GitBranch className="h-3.5 w-3.5 text-purple-600" />
        <span className="text-xs font-semibold text-purple-700">Condition</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs font-medium">
          {FIELD_LABELS[data.field] ?? data.field}
        </p>
        {data.value && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.operator}: {data.value}
          </p>
        )}
      </div>
      <div className="flex justify-between px-2 pb-2">
        <div className="relative">
          <span className="text-[10px] font-medium text-emerald-600">Yes</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!bg-emerald-500 !h-2.5 !w-2.5 !left-2"
          />
        </div>
        <div className="relative">
          <span className="text-[10px] font-medium text-red-500">No</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!bg-red-500 !h-2.5 !w-2.5 !left-2"
          />
        </div>
      </div>
    </div>
  );
}
