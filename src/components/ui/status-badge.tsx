import { cn } from "cn";

type Status = "active" | "published" | "paused" | "draft" | "error" | "archived" | "running" | "waiting" | "completed" | "failed" | "cancelled";

const statusConfig: Record<Status, { dot: string; bg: string; text: string }> = {
  active:    { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400" },
  published: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400" },
  running:   { dot: "bg-blue-500",    bg: "bg-blue-500/10",    text: "text-blue-700 dark:text-blue-400" },
  waiting:   { dot: "bg-amber-500",   bg: "bg-amber-500/10",   text: "text-amber-700 dark:text-amber-400" },
  paused:    { dot: "bg-amber-500",   bg: "bg-amber-500/10",   text: "text-amber-700 dark:text-amber-400" },
  draft:     { dot: "bg-zinc-400",    bg: "bg-zinc-400/10",    text: "text-zinc-600 dark:text-zinc-400" },
  completed: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400" },
  archived:  { dot: "bg-zinc-400",    bg: "bg-zinc-400/10",    text: "text-zinc-600 dark:text-zinc-400" },
  error:     { dot: "bg-red-500",     bg: "bg-red-500/10",     text: "text-red-700 dark:text-red-400" },
  failed:    { dot: "bg-red-500",     bg: "bg-red-500/10",     text: "text-red-700 dark:text-red-400" },
  cancelled: { dot: "bg-zinc-400",    bg: "bg-zinc-400/10",    text: "text-zinc-600 dark:text-zinc-400" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {status}
    </span>
  );
}
