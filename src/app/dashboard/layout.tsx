import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";
import { getActiveWorkspace } from "@/lib/workspace/context";
import { type WorkspaceRole } from "@/lib/workspace/rbac";
import { type WorkspaceItem } from "./workspace-switcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch all workspaces user has access to
  const { data: memberList } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(id, name, slug, owner_id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  let workspaces: WorkspaceItem[] = [];
  if (memberList && memberList.length > 0) {
    workspaces = memberList
      .filter((m) => m.workspaces)
      .map((m) => {
        const ws = m.workspaces as unknown as { id: string; name: string; slug: string };
        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          role: m.role as WorkspaceRole,
        };
      });
  }

  // 2. If user has no workspace yet, auto-create their personal default workspace
  if (workspaces.length === 0) {
    const adminClient = createAdminClient();
    const defaultName = `${user.email?.split("@")[0] || "My"}'s Workspace`;
    const defaultSlug = `ws-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
    const { data: newWs } = await adminClient
      .from("workspaces")
      .insert({ name: defaultName, slug: defaultSlug, owner_id: user.id })
      .select("id, name, slug")
      .single();

    if (newWs) {
      await adminClient.from("workspace_members").insert({
        workspace_id: newWs.id,
        user_id: user.id,
        role: "owner",
      });
      workspaces = [{ id: newWs.id, name: newWs.name, slug: newWs.slug, role: "owner" }];
    }
  }

  const activeWs = await getActiveWorkspace(user.id);
  const activeWorkspaceId = activeWs?.workspaceId ?? workspaces[0]?.id ?? "";

  return (
    <DashboardShell
      user={user}
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
    >
      {children}
    </DashboardShell>
  );
}
