import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/workspace/context";
import { generateInviteToken } from "@/lib/workspace/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; inviteId: string }> },
) {
  try {
    const { workspaceId, inviteId } = await params;
    const ctx = await requireWorkspaceAccess(workspaceId, ["manage_members"]);

    const adminClient = createAdminClient();

    const { data: invite, error } = await adminClient
      .from("workspace_invitations")
      .update({ status: "revoked" })
      .eq("id", inviteId)
      .eq("workspace_id", workspaceId)
      .select("id, email")
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    await writeAuditLog({
      workspace_id: workspaceId,
      actor_id: ctx.userId,
      action: "workspace.invitation_revoked",
      entity_type: "workspace_invitation",
      entity_id: inviteId,
      metadata: { email: invite.email },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to revoke invitation" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; inviteId: string }> },
) {
  try {
    const { workspaceId, inviteId } = await params;
    const ctx = await requireWorkspaceAccess(workspaceId, ["manage_members"]);

    const adminClient = createAdminClient();

    // 1. Fetch existing invite
    const { data: existingInvite } = await adminClient
      .from("workspace_invitations")
      .select("id, email, role")
      .eq("id", inviteId)
      .eq("workspace_id", workspaceId)
      .single();

    if (!existingInvite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // 2. Generate new token and 7-day expiration
    const { rawToken, tokenHash } = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateErr } = await adminClient
      .from("workspace_invitations")
      .update({
        token_hash: tokenHash,
        status: "pending",
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    const inviteUrl = `${origin}/invite?token=${rawToken}`;

    return NextResponse.json({
      success: true,
      inviteUrl,
      expiresAt,
    });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 });
  }
}
