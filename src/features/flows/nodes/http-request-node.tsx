"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe } from "lucide-react";
import type { HttpRequestNode as HttpRequestNodeData } from "@/lib/engine/schema";

const handleStyle = {
  width: 10,
  height: 10,
  background: "#6366f1",
  border: "2px solid white",
};

export function HttpRequestNode({ data, selected }: NodeProps & { data: HttpRequestNodeData }) {
  const truncatedUrl = data.url.length > 30 ? data.url.slice(0, 30) + "…" : data.url;

  return (
    <div
      className={`w-56 rounded-xl border bg-card transition-all duration-150 ${
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/20"
          : "border-border/60"
      }`}
    >
      <Handle type="target" position={Position.Top} style={handleStyle} isConnectable={true} />
      <div className="flex items-center gap-2 rounded-t-[11px] bg-indigo-500/10 px-3 py-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/20">
          <Globe className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
        </div>
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
          HTTP Request
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-foreground">
          {data.method} {truncatedUrl || "No URL set"}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} style={handleStyle} isConnectable={true} />
    </div>
  );
}
