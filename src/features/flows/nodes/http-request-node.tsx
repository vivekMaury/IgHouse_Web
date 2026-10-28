"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe } from "lucide-react";
import type { HttpRequestNode as HttpRequestNodeData } from "@/lib/engine/schema";

export function HttpRequestNode({ data, selected }: NodeProps & { data: HttpRequestNodeData }) {
  const truncatedUrl = data.url.length > 30 ? data.url.slice(0, 30) + "…" : data.url;

  return (
    <div
      className={`relative w-56 rounded-xl border bg-card transition-all duration-150 ${
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/20"
          : "border-border/60"
      }`}
    >
      {/* Exec in */}
      <Handle className="handle-exec" id="exec-in" type="target" position={Position.Top} isConnectable />

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

      {/* Data port labels */}
      <div className="flex items-center justify-between border-t border-border/30 px-3 py-1">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-[2px] bg-primary/60" />
          <span className="text-[9px] text-muted-foreground/70">Body</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground/70">Response</span>
          <div className="h-1.5 w-1.5 rounded-[2px] bg-primary/60" />
        </div>
      </div>

      {/* Data in / out */}
      <Handle className="handle-data" id="data-in" type="target" position={Position.Left} isConnectable />
      <Handle className="handle-data" id="data-out" type="source" position={Position.Right} isConnectable />

      {/* Exec out */}
      <Handle className="handle-exec" id="exec-out" type="source" position={Position.Bottom} isConnectable />
    </div>
  );
}
