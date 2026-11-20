import { NextResponse } from "next/server";
import { hashInviteToken } from "@/lib/workspace/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || token.length < 32) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const tokenHash = hashInviteToken(token);
    const adminClient = createAdminClient();

    const { data: invite, error } = await adminClient
      .from("workspace_invitations")
      .select("id, workspace_id, email, role, status, expires_at, workspaces(name, slug)")
      .eq("token_hash", tokenHash)
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: "Invitation not found or invalid" },
        { status: 404 },
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: `This invitation has already been ${invite.status}.` },
        { status: 410 },
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired. Please ask for a new invite." },
        { status: 410 },
      );
    }

    const ws = invite.workspaces as unknown as { name: string; slug: string };

    return NextResponse.json({
      valid: true,
      workspaceName: ws?.name ?? "Workspace",
      email: invite.email,
      role: invite.role,
    });
  } catch {
    return NextResponse.json({ error: "Failed to verify invitation" }, { status: 500 });
  }
}
