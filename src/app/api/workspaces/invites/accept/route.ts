import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashInviteToken } from "@/lib/workspace/rbac";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const acceptSchema = z.object({
  token: z.string().min(32),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { token } = acceptSchema.parse(json);
    const tokenHash = hashInviteToken(token);

    const adminClient = createAdminClient();

    // 1. Fetch and validate invite
    const { data: invite, error: fetchErr } = await adminClient
      .from("workspace_invitations")
      .select("id, workspace_id, email, role, status, expires_at")
      .eq("token_hash", tokenHash)
      .single();

    if (fetchErr || !invite) {
      return NextResponse.json(
        { error: "Invitation not found or invalid" },
        { status: 404 },
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: `This invitation is no longer valid (status: ${invite.status})` },
        { status: 410 },
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 },
      );
    }

    // 2. Add or update membership in workspace_members
    const { error: memberErr } = await adminClient
      .from("workspace_members")
      .upsert(
        {
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: invite.role,
        },
        { onConflict: "workspace_id,user_id" },
      );

    if (memberErr) {
      return NextResponse.json(
        { error: "Failed to join workspace" },
        { status: 500 },
      );
    }

    // 3. Mark invite as accepted
    await adminClient
      .from("workspace_invitations")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    // 4. Audit log
    await writeAuditLog({
      workspace_id: invite.workspace_id,
      actor_id: user.id,
      action: "workspace.member_joined",
      entity_type: "workspace_member",
      entity_id: user.id,
      metadata: { role: invite.role, invitedEmail: invite.email },
    });

    // 5. Set active_workspace_id cookie
    const cookieStore = await cookies();
    cookieStore.set("active_workspace_id", invite.workspace_id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      workspaceId: invite.workspace_id,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
