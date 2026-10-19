import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);

  const member = members?.[0] as { workspace_id: string } | undefined;
  if (!member) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const { data: flow, error } = await supabase
    .from("flows")
    .insert({
      workspace_id: member.workspace_id,
      name: body.name.trim(),
      status: "draft",
    } as Record<string, unknown>)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const flowRow = flow as { id: string } | null;
  if (!flowRow) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }

  await supabase.from("flow_versions").insert({
    workspace_id: member.workspace_id,
    flow_id: flowRow.id,
    version: 1,
    definition: { nodes: [], edges: [] },
  } as Record<string, unknown>);

  return NextResponse.json({ id: flowRow.id }, { status: 201 });
}
