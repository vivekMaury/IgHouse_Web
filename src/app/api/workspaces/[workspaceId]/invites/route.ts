import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/workspace/context";
import { generateInviteToken, type WorkspaceRole } from "@/lib/workspace/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    await requireWorkspaceAccess(workspaceId, ["manage_members"]);

    const adminClient = createAdminClient();

    const { data: invites, error } = await adminClient
      .from("workspace_invitations")
      .select("id, workspace_id, email, role, status, expires_at, created_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invites: invites ?? [] });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const ctx = await requireWorkspaceAccess(workspaceId, ["manage_members"]);

    // Rate limiting: max 15 invites per hour per workspace
    const rl = await checkRateLimit(`workspace-invite:${workspaceId}`, "api");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many invites sent recently. Please wait before sending more." },
        { status: 429 },
      );
    }

    const json = await request.json();
    const { email: rawEmail, role } = createInviteSchema.parse(json);
    const email = rawEmail.toLowerCase().trim();

    const adminClient = createAdminClient();

    // 1. Check if user with this email is already an active member of this workspace
    const { data: authUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = authUsers?.users?.find(
      (u) => u.email?.toLowerCase().trim() === email,
    );

    if (existingUser) {
      const { data: existingMember } = await adminClient
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json(
          { error: "This user is already a member of this workspace." },
          { status: 400 },
        );
      }
    }

    // 2. Revoke any existing pending invites for this email in this workspace
    await adminClient
      .from("workspace_invitations")
      .update({ status: "revoked" })
      .eq("workspace_id", workspaceId)
      .eq("email", email)
      .eq("status", "pending");

    // 3. Generate secure invite token
    const { rawToken, tokenHash } = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error: insertErr } = await adminClient
      .from("workspace_invitations")
      .insert({
        workspace_id: workspaceId,
        email,
        role,
        token_hash: tokenHash,
        invited_by: ctx.userId,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, email, role, status, expires_at, created_at")
      .single();

    if (insertErr || !invite) {
      return NextResponse.json(
        { error: insertErr?.message || "Failed to create invitation" },
        { status: 500 },
      );
    }

    await writeAuditLog({
      workspace_id: workspaceId,
      actor_id: ctx.userId,
      action: "workspace.member_invited",
      entity_type: "workspace_invitation",
      entity_id: invite.id,
      metadata: { email, role },
    });

    const origin = new URL(request.url).origin;
    const inviteUrl = `${origin}/invite?token=${rawToken}`;

    return NextResponse.json({
      success: true,
      invite: {
        ...invite,
        inviteUrl,
      },
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email or role" }, { status: 400 });
    }
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
