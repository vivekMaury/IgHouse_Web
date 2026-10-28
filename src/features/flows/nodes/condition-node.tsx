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

export function ConditionNode({ data, selected }: NodeProps & { data: ConditionNodeData }) {
  return (
    <div
      className={`relative w-56 rounded-xl border bg-card transition-all duration-150 ${
        selected
          ? "border-purple-500 ring-2 ring-purple-500/20"
          : "border-border/60"
      }`}
    >
      {/* Exec in */}
      <Handle className="handle-exec" id="exec-in" type="target" position={Position.Top} isConnectable />

      <div className="flex items-center gap-2 rounded-t-[11px] bg-purple-500/10 px-3 py-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/20">
          <GitBranch className="h-3 w-3 text-purple-600 dark:text-purple-400" />
        </div>
        <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
          Condition
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-foreground">
          {FIELD_LABELS[data.field] ?? data.field}
        </p>
        {data.value && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.operator}: {data.value}
          </p>
        )}
      </div>
      <div className="flex justify-between px-4 pb-2">
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          Yes
        </span>
        <span className="text-[10px] font-semibold text-red-500 dark:text-red-400">
          No
        </span>
      </div>

      {/* Branch handles — semantic colors */}
      <Handle
        className="handle-exec handle-branch"
        id="true"
        type="source"
        position={Position.Bottom}
        style={{ background: "#10b981", left: "25%" }}
        isConnectable
      />
      <Handle
        className="handle-exec handle-branch"
        id="false"
        type="source"
        position={Position.Bottom}
        style={{ background: "#ef4444", left: "75%" }}
        isConnectable
      />
    </div>
  );
}
