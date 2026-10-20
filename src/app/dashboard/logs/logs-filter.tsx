"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, Search } from "lucide-react";

type LogEntry = {
  id: string;
  flow_run_id: string | null;
  flow_id: string | null;
  node_id: string | null;
  action: string;
  success: boolean;
  error_message: string | null;
  meta_response: Record<string, unknown> | null;
  created_at: string;
  flowName: string | null;
  runStatus: string | null;
};

type StatusFilter = "all" | "success" | "failed";

export function LogsFilter({ logs }: { logs: LogEntry[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = logs;

    if (statusFilter === "success") {
      result = result.filter((l) => l.success);
    } else if (statusFilter === "failed") {
      result = result.filter((l) => !l.success);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.flowName?.toLowerCase().includes(q) ||
          l.error_message?.toLowerCase().includes(q) ||
          l.node_id?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, statusFilter, query]);

  const successCount = logs.filter((l) => l.success).length;
  const failedCount = logs.filter((l) => !l.success).length;

  const filters: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: logs.length },
    { key: "success", label: "Success", count: successCount },
    { key: "failed", label: "Failed", count: failedCount },
  ];

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="font-medium">{successCount}</span>
          <span className="text-muted-foreground">succeeded</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="font-medium">{failedCount}</span>
          <span className="text-muted-foreground">failed</span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by action, flow, or error..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-border/60 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {logs.length} log entries
      </p>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No logs match your search.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className="rounded-lg border border-border/60 transition-colors hover:bg-muted/20">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  {log.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{log.action}</span>
                      {log.flowName && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {log.flowName}
                        </span>
                      )}
                      {log.node_id && (
                        <span className="text-[10px] text-muted-foreground/50">
                          node: {log.node_id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    {log.error_message && (
                      <p className="mt-0.5 truncate text-xs text-red-400">{log.error_message}</p>
                    )}
                  </div>

                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDate(log.created_at)}
                  </span>

                  {(log.error_message || log.meta_response) && (
                    isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (log.error_message || log.meta_response) && (
                  <div className="border-t border-border/40 px-4 py-3">
                    {log.error_message && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-red-400">Error</p>
                        <p className="mt-1 rounded bg-red-500/5 px-3 py-2 text-xs text-red-300 font-mono">
                          {log.error_message}
                        </p>
                      </div>
                    )}
                    {log.meta_response && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Meta API Response</p>
                        <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted/50 px-3 py-2 text-xs text-muted-foreground font-mono">
                          {JSON.stringify(log.meta_response, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div className="mt-3 flex gap-4 text-[10px] text-muted-foreground/60">
                      {log.flow_run_id && (
                        <span>Run: {log.flow_run_id.slice(0, 8)}…</span>
                      )}
                      {log.runStatus && (
                        <span>Status: {log.runStatus}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
