import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hasPermission,
  type WorkspaceRole,
  type WorkspacePermission,
} from "./rbac";

export interface WorkspaceContext {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  workspace: {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
  };
}

export async function getActiveWorkspace(
  userId: string,
): Promise<WorkspaceContext | null> {
  const cookieStore = await cookies();
  const activeWsId = cookieStore.get("active_workspace_id")?.value;
  const supabase = await createClient();

  if (activeWsId) {
    const { data: member } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, workspaces(id, name, slug, owner_id)")
      .eq("workspace_id", activeWsId)
      .eq("user_id", userId)
      .maybeSingle();

    if (member && member.workspaces) {
      const ws = member.workspaces as unknown as {
        id: string;
        name: string;
        slug: string;
        owner_id: string;
      };
      return {
        userId,
        workspaceId: member.workspace_id,
        role: member.role as WorkspaceRole,
        workspace: ws,
      };
    }
  }

  // Fallback to the user's first available workspace
  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(id, name, slug, owner_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  const firstMember = members?.[0];
  if (firstMember && firstMember.workspaces) {
    const ws = firstMember.workspaces as unknown as {
      id: string;
      name: string;
      slug: string;
      owner_id: string;
    };
    return {
      userId,
      workspaceId: firstMember.workspace_id,
      role: firstMember.role as WorkspaceRole,
      workspace: ws,
    };
  }

  return null;
}

export async function requireWorkspaceAccess(
  workspaceId: string,
  requiredPermissions: WorkspacePermission[] = [],
): Promise<WorkspaceContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(id, name, slug, owner_id)")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member || !member.workspaces) {
    throw new Error("FORBIDDEN");
  }

  const role = member.role as WorkspaceRole;
  for (const perm of requiredPermissions) {
    if (!hasPermission(role, perm)) {
      throw new Error(`FORBIDDEN_PERMISSION_${perm.toUpperCase()}`);
    }
  }

  const ws = member.workspaces as unknown as {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
  };

  return {
    userId: user.id,
    workspaceId: member.workspace_id,
    role,
    workspace: ws,
  };
}
