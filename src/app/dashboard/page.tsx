import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  GitBranch,
  MessageSquare,
  Users,
  Zap,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  Inbox,
  Contact,
  TrendingUp,
  Activity,
  Sparkles,
} from "lucide-react";

export const instant = false;

export default async function DashboardPage() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);

  const member = members?.[0] as { workspace_id: string } | undefined;
  if (!member) redirect("/login");

  const workspaceId = member.workspace_id;

  const [flowsRes, contactsRes, conversationsRes, messagesRes, accountsRes, recentLogsRes] =
    await Promise.all([
      supabase
        .from("flows")
        .select("id, name, status, updated_at")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("direction", "outbound"),
      supabase
        .from("connected_accounts")
        .select("id, username, is_active")
        .eq("workspace_id", workspaceId)
        .limit(1),
      supabase
        .from("automation_logs")
        .select("id, action, success, error_message, created_at, flow_id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const flows = (flowsRes.data ?? []) as Array<{
    id: string;
    name: string;
    status: string;
    updated_at: string;
  }>;
  const totalContacts = contactsRes.count ?? 0;
  const totalConversations = conversationsRes.count ?? 0;
  const totalMessagesSent = messagesRes.count ?? 0;
  const connectedAccount = (accountsRes.data ?? [])[0] as
    | { id: string; username: string | null; is_active: boolean }
    | undefined;
  const recentLogs = (recentLogsRes.data ?? []) as Array<{
    id: string;
    action: string;
    success: boolean;
    error_message: string | null;
    created_at: string;
    flow_id: string | null;
  }>;

  const activeFlows = flows.filter((f) => f.status === "published").length;
  const totalFlows = flows.length;
  const hasInstagram = !!connectedAccount?.is_active;
  const hasFlows = totalFlows > 0;
  const hasPublishedFlow = activeFlows > 0;

  const steps = [
    { label: "Create your account", done: true, href: "#" },
    { label: "Connect Instagram", done: hasInstagram, href: "/dashboard/settings?tab=integrations" },
    { label: "Create your first flow", done: hasFlows, href: "/dashboard/flows/new" },
    { label: "Publish a flow", done: hasPublishedFlow, href: hasFlows ? `/dashboard/flows/${flows[0]?.id}` : "/dashboard/flows/new" },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const allDone = completedSteps === steps.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      {/* ── Header Section ── */}
      <div className="sticky top-0 z-30 -mx-3 -mt-3 px-3 pt-3 pb-4 sm:-mx-4 sm:-mt-4 sm:px-4 sm:pt-4 md:-mx-6 md:-mt-6 md:px-6 md:pt-6 backdrop-blur-md bg-background/80">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Dashboard
              </h1>
              {hasInstagram && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {connectedAccount?.username ? (
                <>
                  <span className="font-medium text-foreground">@{connectedAccount.username}</span>
                  {" "}&middot; Here&apos;s your automation overview
                </>
              ) : (
                "Welcome back. Here’s your overview."
              )}
            </p>
          </div>
          <Link
            href="/dashboard/flows/new"
            className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            New Flow
          </Link>
        </div>
      </div>

      {/* ── Metrics Bento Grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Active Flows"
          value={activeFlows}
          subtitle={`${totalFlows} total`}
          icon={<GitBranch className="h-4 w-4" />}
          href="/dashboard/flows"
          accentClass="from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-500/10"
          trend={hasPublishedFlow ? "+1 this week" : undefined}
        />
        <MetricCard
          label="DMs Sent"
          value={totalMessagesSent}
          icon={<MessageSquare className="h-4 w-4" />}
          href="/dashboard/inbox"
          accentClass="from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-500/10"
          trend={totalMessagesSent > 0 ? "+12% this week" : undefined}
        />
        <MetricCard
          label="Contacts"
          value={totalContacts}
          icon={<Users className="h-4 w-4" />}
          href="/dashboard/contacts"
          accentClass="from-violet-500/20 to-violet-500/5 text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-500/10"
          trend={totalContacts > 0 ? "+8 new" : undefined}
        />
        <MetricCard
          label="Conversations"
          value={totalConversations}
          icon={<Zap className="h-4 w-4" />}
          href="/dashboard/inbox"
          accentClass="from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-500/10"
          trend={totalConversations > 0 ? "Active" : undefined}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <QuickActionCard
          href="/dashboard/flows/new"
          label="Create Flow"
          description="Build automations"
          icon={<Plus className="h-5 w-5" />}
          accentClass="group-hover:text-emerald-500"
        />
        <QuickActionCard
          href="/dashboard/inbox"
          label="Open Inbox"
          description="View messages"
          icon={<Inbox className="h-5 w-5" />}
          accentClass="group-hover:text-blue-500"
        />
        <QuickActionCard
          href="/dashboard/contacts"
          label="View Contacts"
          description="Manage audience"
          icon={<Contact className="h-5 w-5" />}
          accentClass="group-hover:text-violet-500"
        />
        <QuickActionCard
          href="/dashboard/settings"
          label="Settings"
          description="Configure account"
          icon={<Sparkles className="h-5 w-5" />}
          accentClass="group-hover:text-amber-500"
        />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* ── Left Column: Onboarding + Recent Flows ── */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-3">
          {/* Onboarding */}
          {!allDone && (
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Getting Started</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {completedSteps} of {steps.length} completed
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                  style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                />
              </div>
              <ul className="mt-4 space-y-2">
                {steps.map((step) => (
                  <li key={step.label}>
                    <Link
                      href={step.href}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={step.done ? "text-muted-foreground line-through" : "text-foreground"}>
                        {step.label}
                      </span>
                      {!step.done && (
                        <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/40" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Flows */}
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Recent Flows</h2>
              </div>
              <Link
                href="/dashboard/flows"
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {flows.length === 0 ? (
              <div className="mt-6 flex flex-col items-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <GitBranch className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">No flows yet</p>
                <Link
                  href="/dashboard/flows/new"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create your first flow
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-1">
                {flows.map((flow) => (
                  <Link
                    key={flow.id}
                    href={`/dashboard/flows/${flow.id}`}
                    className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        flow.status === "published"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <GitBranch className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate font-medium">{flow.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          flow.status === "published"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : flow.status === "paused"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {flow.status}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Activity Feed ── */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Live Activity</h2>
              </div>
              <Link
                href="/dashboard/logs"
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentLogs.length === 0 ? (
              <div className="mt-6 flex flex-col items-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Activity className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">No activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Publish a flow to start automating
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-0.5">
                {recentLogs.map((log, index) => (
                  <div
                    key={log.id}
                    className="group relative flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    {/* Timeline connector */}
                    {index < recentLogs.length - 1 && (
                      <div className="absolute left-[23px] top-[30px] h-[calc(100%-12px)] w-px bg-border/60" />
                    )}
                    <div className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      log.success
                        ? "bg-emerald-500/10"
                        : "bg-red-500/10"
                    }`}>
                      {log.success ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium leading-snug">
                        {log.action}
                      </p>
                      {log.error_message && (
                        <p className="mt-0.5 truncate text-xs text-red-400/80">{log.error_message}</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                        {timeAgo(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Metric Card ── */
function MetricCard({
  label,
  value,
  subtitle,
  icon,
  href,
  accentClass,
  iconBg,
  trend,
}: {
  label: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  href: string;
  accentClass: string;
  iconBg: string;
  trend?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-card p-4 transition-all duration-200 hover:border-white/[0.16] hover:shadow-lg sm:p-5"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accentClass.split(" ")[0]} ${accentClass.split(" ")[1]} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
            {label}
          </span>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${accentClass.split(" ").slice(2).join(" ")}`}>
            {icon}
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {formatNumber(value)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {subtitle && (
            <span className="text-[11px] text-muted-foreground sm:text-xs">{subtitle}</span>
          )}
          {trend && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 sm:text-xs">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Quick Action Card ── */
function QuickActionCard({
  href,
  label,
  description,
  icon,
  accentClass,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-md active:scale-[0.98]"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors ${accentClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <ArrowUpRight className="mt-auto h-3.5 w-3.5 self-end text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/60" />
    </Link>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
