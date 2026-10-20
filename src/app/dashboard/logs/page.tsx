import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { LogsFilter } from "./logs-filter";

export const instant = false;

export default async function LogsPage() {
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

  // Fetch automation logs
  const { data: logs } = await supabase
    .from("automation_logs")
    .select("id, flow_run_id, flow_id, node_id, action, success, error_message, meta_response, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(200);

  const logList = (logs ?? []) as Array<{
    id: string;
    flow_run_id: string | null;
    flow_id: string | null;
    node_id: string | null;
    action: string;
    success: boolean;
    error_message: string | null;
    meta_response: Record<string, unknown> | null;
    created_at: string;
  }>;

  // Fetch flow names for display
  const flowIds = [...new Set(logList.filter((l) => l.flow_id).map((l) => l.flow_id!))];
  const { data: flows } = flowIds.length > 0
    ? await supabase
        .from("flows")
        .select("id, name")
        .in("id", flowIds)
    : { data: [] };

  const flowMap = new Map(
    ((flows ?? []) as Array<{ id: string; name: string }>).map((f) => [f.id, f.name])
  );

  // Fetch flow_runs for status
  const runIds = [...new Set(logList.filter((l) => l.flow_run_id).map((l) => l.flow_run_id!))];
  const { data: runs } = runIds.length > 0
    ? await supabase
        .from("flow_runs")
        .select("id, status, contact_id")
        .in("id", runIds)
    : { data: [] };

  const runMap = new Map(
    ((runs ?? []) as Array<{ id: string; status: string; contact_id: string }>).map((r) => [r.id, r])
  );

  const serialized = logList.map((log) => ({
    ...log,
    flowName: log.flow_id ? flowMap.get(log.flow_id) ?? null : null,
    runStatus: log.flow_run_id ? runMap.get(log.flow_run_id)?.status ?? null : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Automation Logs</h1>
        <p className="text-sm text-muted-foreground">
          View all automation activity across your flows.
        </p>
      </div>

      {logList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-16">
          <Activity className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">No automation logs yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Logs appear when your published flows process events.
          </p>
        </div>
      ) : (
        <LogsFilter logs={serialized} />
      )}
    </div>
  );
}
