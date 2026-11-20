import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
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
    const { name, slug } = createWorkspaceSchema.parse(json);

    const adminClient = createAdminClient();

    // Check slug uniqueness
    const { data: existingSlug } = await adminClient
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json(
        { error: "A workspace with this URL slug already exists. Please choose another." },
        { status: 409 },
      );
    }

    // 1. Insert Workspace
    const { data: workspace, error: wsError } = await adminClient
      .from("workspaces")
      .insert({
        name,
        slug,
        owner_id: user.id,
      })
      .select("id, name, slug, owner_id")
      .single();

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: wsError?.message || "Failed to create workspace" },
        { status: 500 },
      );
    }

    // 2. Add creator as Owner in workspace_members
    const { error: memberError } = await adminClient
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      return NextResponse.json(
        { error: memberError.message || "Failed to assign workspace membership" },
        { status: 500 },
      );
    }

    // 3. Set active_workspace_id cookie
    const cookieStore = await cookies();
    cookieStore.set("active_workspace_id", workspace.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: "lax",
    });

    await writeAuditLog({
      workspace_id: workspace.id,
      actor_id: user.id,
      action: "workspace.created",
      entity_type: "workspace",
      entity_id: workspace.id,
      metadata: { name, slug },
    });

    return NextResponse.json({ success: true, workspace });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid workspace data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}
