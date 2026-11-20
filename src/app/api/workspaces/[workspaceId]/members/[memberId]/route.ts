import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/workspace/context";
import { canManageRole, type WorkspaceRole } from "@/lib/workspace/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> },
) {
  try {
    const { workspaceId, memberId } = await params;
    const ctx = await requireWorkspaceAccess(workspaceId, ["manage_members"]);
    const json = await request.json();
    const { role: newRole } = updateRoleSchema.parse(json);

    const adminClient = createAdminClient();

    // Fetch target member
    const { data: targetMember } = await adminClient
      .from("workspace_members")
      .select("id, workspace_id, user_id, role")
      .eq("id", memberId)
      .eq("workspace_id", workspaceId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const targetRole = targetMember.role as WorkspaceRole;

    // Check if actor has authority to manage target role
    if (!canManageRole(ctx.role, targetRole) || !canManageRole(ctx.role, newRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions to change this role" },
        { status: 403 },
      );
    }

    // Last Owner Protection: Cannot demote the only owner
    if (targetRole === "owner" && newRole !== "owner") {
      const { count } = await adminClient
        .from("workspace_members")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("role", "owner");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the only owner of this workspace" },
          { status: 400 },
        );
      }
    }

    const { error } = await adminClient
      .from("workspace_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog({
      workspace_id: workspaceId,
      actor_id: ctx.userId,
      action: "workspace.member_role_updated",
      entity_type: "workspace_member",
      entity_id: memberId,
      metadata: { previousRole: targetRole, newRole },
    });

    return NextResponse.json({ success: true, role: newRole });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid role payload" }, { status: 400 });
    }
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> },
) {
  try {
    const { workspaceId, memberId } = await params;
    const ctx = await requireWorkspaceAccess(workspaceId, ["manage_members"]);

    const adminClient = createAdminClient();

    const { data: targetMember } = await adminClient
      .from("workspace_members")
      .select("id, workspace_id, user_id, role")
      .eq("id", memberId)
      .eq("workspace_id", workspaceId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const targetRole = targetMember.role as WorkspaceRole;

    if (!canManageRole(ctx.role, targetRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions to remove this member" },
        { status: 403 },
      );
    }

    // Last Owner Protection
    if (targetRole === "owner") {
      const { count } = await adminClient
        .from("workspace_members")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("role", "owner");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the only owner of this workspace" },
          { status: 400 },
        );
      }
    }

    const { error } = await adminClient
      .from("workspace_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog({
      workspace_id: workspaceId,
      actor_id: ctx.userId,
      action: "workspace.member_removed",
      entity_type: "workspace_member",
      entity_id: memberId,
      metadata: { removedUserId: targetMember.user_id, role: targetRole },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
