import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/workspace/context";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    await requireWorkspaceAccess(workspaceId);

    const adminClient = createAdminClient();

    // 1. Fetch workspace members
    const { data: members, error } = await adminClient
      .from("workspace_members")
      .select("id, workspace_id, user_id, role, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Fetch user profile emails/metadata
    const userIds = members.map((m) => m.user_id);
    const { data: authUsers } = await adminClient.auth.admin.listUsers();
    const userMap = new Map<string, { email?: string; name?: string }>();

    for (const u of authUsers?.users ?? []) {
      if (userIds.includes(u.id)) {
        userMap.set(u.id, {
          email: u.email,
          name: (u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0]) as string,
        });
      }
    }

    const membersWithProfiles = members.map((m) => {
      const prof = userMap.get(m.user_id);
      return {
        id: m.id,
        workspaceId: m.workspace_id,
        userId: m.user_id,
        role: m.role,
        createdAt: m.created_at,
        email: prof?.email ?? "Unknown",
        name: prof?.name ?? "Team Member",
      };
    });

    return NextResponse.json({ members: membersWithProfiles });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
