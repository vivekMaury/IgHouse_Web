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
  CheckCircle2,
  Circle,
  AlertCircle,
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

  // Parallel data fetches
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

  // Onboarding checklist
  const steps = [
    { label: "Create your account", done: true, href: "#" },
    { label: "Connect Instagram", done: hasInstagram, href: "/dashboard/settings?tab=integrations" },
    { label: "Create your first flow", done: hasFlows, href: "/dashboard/flows/new" },
    { label: "Publish a flow", done: hasPublishedFlow, href: hasFlows ? `/dashboard/flows/${flows[0]?.id}` : "/dashboard/flows/new" },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const allDone = completedSteps === steps.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{connectedAccount?.username ? `, @${connectedAccount.username}` : ""}. Here&apos;s your overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Flows"
          value={`${activeFlows} / ${totalFlows}`}
          icon={<GitBranch className="h-4 w-4" />}
          href="/dashboard/flows"
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <StatCard
          label="DMs Sent"
          value={formatNumber(totalMessagesSent)}
          icon={<MessageSquare className="h-4 w-4" />}
          href="/dashboard/inbox"
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <StatCard
          label="Contacts"
          value={formatNumber(totalContacts)}
          icon={<Users className="h-4 w-4" />}
          href="/dashboard/contacts"
          color="text-purple-500"
          bg="bg-purple-500/10"
        />
        <StatCard
          label="Conversations"
          value={formatNumber(totalConversations)}
          icon={<Zap className="h-4 w-4" />}
          href="/dashboard/inbox"
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Onboarding / Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Onboarding */}
          {!allDone && (
            <div className="rounded-lg border border-border/60 p-5">
              <h2 className="text-sm font-semibold">Getting Started</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {completedSteps} of {steps.length} completed
              </p>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                />
              </div>
              <ul className="mt-4 space-y-2.5">
                {steps.map((step) => (
                  <li key={step.label}>
                    <Link
                      href={step.href}
                      className="flex items-center gap-2.5 text-sm transition-colors hover:text-foreground"
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={step.done ? "text-muted-foreground line-through" : "text-foreground"}>
                        {step.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-lg border border-border/60 p-5">
            <h2 className="text-sm font-semibold">Quick Actions</h2>
            <div className="mt-3 space-y-2">
              <QuickAction href="/dashboard/flows/new" label="Create new flow" icon={<GitBranch className="h-3.5 w-3.5" />} />
              <QuickAction href="/dashboard/inbox" label="Open inbox" icon={<MessageSquare className="h-3.5 w-3.5" />} />
              <QuickAction href="/dashboard/contacts" label="View contacts" icon={<Users className="h-3.5 w-3.5" />} />
              <QuickAction href="/dashboard/settings" label="Manage settings" icon={<Zap className="h-3.5 w-3.5" />} />
            </div>
          </div>
        </div>

        {/* Recent Flows + Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent flows */}
          <div className="rounded-lg border border-border/60 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent Flows</h2>
              <Link href="/dashboard/flows" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {flows.length === 0 ? (
              <div className="mt-6 flex flex-col items-center py-8">
                <GitBranch className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No flows yet</p>
                <Link
                  href="/dashboard/flows/new"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create your first flow
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-1.5">
                {flows.map((flow) => (
                  <Link
                    key={flow.id}
                    href={`/dashboard/flows/${flow.id}`}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{flow.name}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        flow.status === "published"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : flow.status === "paused"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {flow.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="rounded-lg border border-border/60 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent Activity</h2>
              <Link href="/dashboard/logs" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentLogs.length === 0 ? (
              <p className="mt-4 text-center text-sm text-muted-foreground py-6">
                No activity yet. Publish a flow to start automating.
              </p>
            ) : (
              <div className="mt-3 space-y-1.5">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2.5 rounded-md px-3 py-2 text-sm"
                  >
                    {log.success ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">
                        {log.action}
                      </p>
                      {log.error_message && (
                        <p className="mt-0.5 truncate text-xs text-red-400">{log.error_message}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {timeAgo(log.created_at)}
                    </span>
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

function StatCard({
  label,
  value,
  icon,
  href,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bg: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-border/60 p-5 transition-colors hover:bg-muted/30"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${color}`}>
          {icon}
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </Link>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
    >
      {icon}
      {label}
      <ArrowRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
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
