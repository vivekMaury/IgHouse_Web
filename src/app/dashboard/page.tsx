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
  Sparkles,
  Activity,
  Layout,
  TrendingUp,
  Clock,
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

  /* ── Setup Steps ── */
  const steps = [
    {
      label: "Create your account",
      description: "Sign up and verify your email",
      done: true,
      href: "#",
    },
    {
      label: "Connect Instagram",
      description: "Link your Instagram Business account",
      done: hasInstagram,
      href: "/dashboard/settings?tab=integrations",
    },
    {
      label: "Create your first flow",
      description: "Build a comment-to-DM automation",
      done: hasFlows,
      href: "/dashboard/flows/new",
    },
    {
      label: "Publish a flow",
      description: "Go live and start automating",
      done: hasPublishedFlow,
      href: hasFlows
        ? `/dashboard/flows/${flows[0]?.id}`
        : "/dashboard/flows/new",
    },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const allDone = completedSteps === steps.length;
  const currentStepIndex = steps.findIndex((s) => !s.done);
  const progressPercent = (completedSteps / steps.length) * 100;

  /* ── Are metrics all zero post-setup? ── */
  const metricsAllZero =
    allDone &&
    totalMessagesSent === 0 &&
    totalContacts === 0 &&
    totalConversations === 0 &&
    activeFlows === 0;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 -mx-4 -mt-4 px-4 pt-4 pb-4 sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5 md:-mx-6 md:-mt-6 md:px-6 md:pt-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8 backdrop-blur-xl bg-background/80">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Dashboard
              </h1>
              {hasInstagram ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live API Sync Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </span>
                  Setup Required
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {connectedAccount?.username ? (
                <>
                  <span className="font-medium text-foreground">
                    @{connectedAccount.username}
                  </span>{" "}
                  &middot; Here&apos;s your automation overview
                </>
              ) : (
                "Welcome back. Complete setup to start automating."
              )}
            </p>
          </div>
          <Link
            href="/dashboard/flows/new"
            className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            New Flow
          </Link>
        </div>
      </div>

      {/* ── Setup Wizard Banner (shown when setup incomplete) ── */}
      {!allDone && (
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
          {/* Decorative gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-brand-subtle opacity-50" />
          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">
                      Step {currentStepIndex + 1} of {steps.length}:{" "}
                      {steps[currentStepIndex]?.label ?? "Complete"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {steps[currentStepIndex]?.description}
                    </p>
                  </div>
                </div>
              </div>
              {currentStepIndex >= 0 && (
                <Link
                  href={steps[currentStepIndex]?.href ?? "#"}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  Continue Setup
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {completedSteps} of {steps.length} completed
                </span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-gradient-brand transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Step Checklist */}
            <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {steps.map((step, i) => {
                return (
                  <Link
                    key={step.label}
                    href={step.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                      i === currentStepIndex
                        ? "bg-primary/8 ring-1 ring-primary/20"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : i === currentStepIndex ? (
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary">
                        <span className="text-[9px] font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                      </div>
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-[13px] font-medium ${
                          step.done
                            ? "text-muted-foreground line-through"
                            : i === currentStepIndex
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {!step.done && i === currentStepIndex && (
                      <ArrowRight className="h-3 w-3 text-primary transition-transform group-hover:translate-x-0.5" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Metrics Bento Grid ── */}
      {metricsAllZero ? (
        /* Zero-state: Actionable starter cards instead of dead 0s */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <StarterCard
            href="/dashboard/flows/new"
            icon={<GitBranch className="h-5 w-5" />}
            title="Create your first flow"
            description="Build a comment-to-DM automation in minutes"
            accentClass="text-emerald-500"
            bgClass="bg-emerald-500/10"
          />
          <StarterCard
            href="/dashboard/inbox"
            icon={<MessageSquare className="h-5 w-5" />}
            title="Explore the inbox"
            description="View and manage all your conversations"
            accentClass="text-blue-500"
            bgClass="bg-blue-500/10"
          />
          <StarterCard
            href="/dashboard/contacts"
            icon={<Users className="h-5 w-5" />}
            title="Import contacts"
            description="Your audience will appear here automatically"
            accentClass="text-violet-500"
            bgClass="bg-violet-500/10"
          />
          <StarterCard
            href="/dashboard/flows"
            icon={<Layout className="h-5 w-5" />}
            title="Browse templates"
            description="Start with a pre-built automation template"
            accentClass="text-amber-500"
            bgClass="bg-amber-500/10"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            label="Active Flows"
            value={activeFlows}
            subtitle={`${totalFlows} total`}
            icon={<GitBranch className="h-4 w-4" />}
            href="/dashboard/flows"
            accentColor="emerald"
          />
          <MetricCard
            label="DMs Sent"
            value={totalMessagesSent}
            icon={<MessageSquare className="h-4 w-4" />}
            href="/dashboard/inbox"
            accentColor="blue"
          />
          <MetricCard
            label="Contacts"
            value={totalContacts}
            icon={<Users className="h-4 w-4" />}
            href="/dashboard/contacts"
            accentColor="violet"
          />
          <MetricCard
            label="Conversations"
            value={totalConversations}
            icon={<Zap className="h-4 w-4" />}
            href="/dashboard/inbox"
            accentColor="amber"
          />
        </div>
      )}

      {/* ── Quick Actions (only shown when there ARE metrics) ── */}
      {!metricsAllZero && (
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
      )}

      {/* ── Content Grid: Flows + Activity Feed ── */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
        {/* ── Left Column: Recent Flows ── */}
        <div className="space-y-4 lg:col-span-3">
          <GlassPanel>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <h2 className="text-sm font-semibold">Recent Flows</h2>
              </div>
              <Link
                href="/dashboard/flows"
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {flows.length === 0 ? (
              <div className="mt-6 flex flex-col items-center py-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <GitBranch className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">
                  No flows yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create your first automation to get started
                </p>
                <Link
                  href="/dashboard/flows/new"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create your first flow
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-0.5">
                {flows.map((flow) => (
                  <Link
                    key={flow.id}
                    href={`/dashboard/flows/${flow.id}`}
                    className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          flow.status === "published"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <GitBranch className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-medium">
                          {flow.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Updated {timeAgo(flow.updated_at)}
                        </span>
                      </div>
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
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>

        {/* ── Right Column: Activity Feed ── */}
        <div className="lg:col-span-2">
          <GlassPanel>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <h2 className="text-sm font-semibold">Live Activity</h2>
              </div>
              <Link
                href="/dashboard/logs"
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentLogs.length === 0 ? (
              <div className="mt-6 flex flex-col items-center py-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Activity className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">
                  No activity yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Publish a flow to start automating
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-0.5">
                {recentLogs.map((log, index) => (
                  <div
                    key={log.id}
                    className="group relative flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    {/* Timeline connector */}
                    {index < recentLogs.length - 1 && (
                      <div className="absolute left-[23px] top-[30px] h-[calc(100%-12px)] w-px bg-border/60" />
                    )}
                    <div
                      className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        log.success ? "bg-emerald-500/10" : "bg-red-500/10"
                      }`}
                    >
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
                        <p className="mt-0.5 truncate text-xs text-red-400/80">
                          {log.error_message}
                        </p>
                      )}
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/60">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

/* ── Glass Panel Wrapper ── */
function GlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-card/80 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.14] dark:bg-[#131316]/80">
      {children}
    </div>
  );
}

/* ── Metric Card (Glassmorphism) ── */
function MetricCard({
  label,
  value,
  subtitle,
  icon,
  href,
  accentColor,
}: {
  label: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  href: string;
  accentColor: "emerald" | "blue" | "violet" | "amber";
}) {
  const colorMap = {
    emerald: {
      gradient: "from-emerald-500/15 to-emerald-500/5",
      iconBg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/20",
    },
    blue: {
      gradient: "from-blue-500/15 to-blue-500/5",
      iconBg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      ring: "ring-blue-500/20",
    },
    violet: {
      gradient: "from-violet-500/15 to-violet-500/5",
      iconBg: "bg-violet-500/10",
      text: "text-violet-600 dark:text-violet-400",
      ring: "ring-violet-500/20",
    },
    amber: {
      gradient: "from-amber-500/15 to-amber-500/5",
      iconBg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/20",
    },
  } as const;

  const colors = colorMap[accentColor];

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/80 p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16] hover:shadow-lg dark:bg-[#131316]/80 sm:p-5"
    >
      {/* Hover gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
            {label}
          </span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl ${colors.iconBg} ${colors.text} transition-transform duration-200 group-hover:scale-110`}
          >
            {icon}
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {formatNumber(value)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {subtitle && (
            <span className="text-[11px] text-muted-foreground sm:text-xs">
              {subtitle}
            </span>
          )}
          {value > 0 && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${colors.text} sm:text-xs`}
            >
              <TrendingUp className="h-3 w-3" />
              Active
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Starter Card (Zero-state replacement) ── */
function StarterCard({
  href,
  icon,
  title,
  description,
  accentClass,
  bgClass,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accentClass: string;
  bgClass: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-card/80 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16] hover:shadow-lg active:scale-[0.98] dark:bg-[#131316]/80"
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${bgClass} ${accentClass} transition-transform duration-200 group-hover:scale-110`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <ArrowUpRight className="mt-auto h-4 w-4 self-end text-muted-foreground/20 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/50" />
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
      className="group flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-card/80 p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16] hover:shadow-md active:scale-[0.98] dark:bg-[#131316]/80"
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors ${accentClass}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <ArrowUpRight className="mt-auto h-3.5 w-3.5 self-end text-muted-foreground/20 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/50" />
    </Link>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
