import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch } from "lucide-react";

export const instant = false;

export default async function FlowsPage() {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);

  const member = members?.[0] as { workspace_id: string } | undefined;
  if (!member) redirect("/login");

  const { data: flows } = await supabase
    .from("flows")
    .select("id, name, status, trigger_type, updated_at")
    .eq("workspace_id", member.workspace_id)
    .order("updated_at", { ascending: false });

  const flowList = (flows ?? []) as Array<{
    id: string;
    name: string;
    status: string;
    trigger_type: string | null;
    updated_at: string;
  }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Flows</h1>
          <p className="text-sm text-muted-foreground">
            Build automation flows that respond to Instagram events.
          </p>
        </div>
        <Link href="/dashboard/flows/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Flow
          </Button>
        </Link>
      </div>

      {flowList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-16">
          <GitBranch className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">No flows yet</p>
          <Link href="/dashboard/flows/new" className="mt-3">
            <Button size="sm" variant="outline">
              Create your first flow
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {flowList.map((flow) => (
            <Link
              key={flow.id}
              href={`/dashboard/flows/${flow.id}`}
              className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{flow.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {flow.trigger_type ?? "No trigger"} &middot;{" "}
                    {new Date(flow.updated_at).toLocaleDateString()}
                  </p>
                </div>
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
  );
}
