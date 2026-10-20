import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FlowDefinitionSchema } from "@/lib/engine/schema";
import { z } from "zod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const { flowId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: flow } = await supabase
    .from("flows")
    .select("id, name, status")
    .eq("id", flowId)
    .single();

  if (!flow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const flowRow = flow as { id: string; name: string; status: string };

  const { data: versions } = await supabase
    .from("flow_versions")
    .select("definition")
    .eq("flow_id", flowId)
    .order("version", { ascending: false })
    .limit(1);

  const latestVersion = (versions ?? [])[0] as { definition: unknown } | undefined;

  return NextResponse.json({
    id: flowRow.id,
    name: flowRow.name,
    status: flowRow.status,
    definition: latestVersion?.definition ?? null,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const { flowId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { definition?: unknown };
  try {
    body = (await request.json()) as { definition?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = FlowDefinitionSchema.safeParse(body.definition);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid flow definition", details: parsed.error },
      { status: 400 }
    );
  }

  const { data: flow } = await supabase
    .from("flows")
    .select("id, workspace_id")
    .eq("id", flowId)
    .single();

  if (!flow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const flowRow = flow as { id: string; workspace_id: string };

  const { data: versions } = await supabase
    .from("flow_versions")
    .select("version")
    .eq("flow_id", flowId)
    .order("version", { ascending: false })
    .limit(1);

  const latestVersion = (versions ?? [])[0] as { version: number } | undefined;
  const nextVersion = (latestVersion?.version ?? 0) + 1;

  await supabase.from("flow_versions").insert({
    workspace_id: flowRow.workspace_id,
    flow_id: flowId,
    version: nextVersion,
    definition: parsed.data,
  } as Record<string, unknown>);

  const triggerNode = parsed.data.nodes.find((n) => n.data.type === "trigger");
  const triggerType = triggerNode?.data.type === "trigger" ? triggerNode.data.triggerType : null;

  await supabase
    .from("flows")
    .update({
      trigger_type: triggerType,
    } as Record<string, unknown>)
    .eq("id", flowId);

  return NextResponse.json({ ok: true, version: nextVersion });
}

const StatusSchema = z.object({
  status: z.enum(["draft", "published", "paused", "archived"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const { flowId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = StatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status", details: parsed.error }, { status: 400 });
  }

  const { data: flow } = await supabase
    .from("flows")
    .select("id, workspace_id")
    .eq("id", flowId)
    .single();

  if (!flow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If publishing, ensure a flow version exists
  if (parsed.data.status === "published") {
    const { data: versions } = await supabase
      .from("flow_versions")
      .select("id")
      .eq("flow_id", flowId)
      .limit(1);

    if (!versions || versions.length === 0) {
      return NextResponse.json(
        { error: "Cannot publish a flow without a saved definition. Save the flow first." },
        { status: 400 }
      );
    }

    // Mark the latest version as published
    const { data: latestVersion } = await supabase
      .from("flow_versions")
      .select("id")
      .eq("flow_id", flowId)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (latestVersion) {
      await supabase
        .from("flow_versions")
        .update({ published_at: new Date().toISOString() } as Record<string, unknown>)
        .eq("id", (latestVersion as { id: string }).id);
    }
  }

  await supabase
    .from("flows")
    .update({ status: parsed.data.status } as Record<string, unknown>)
    .eq("id", flowId);

  return NextResponse.json({ ok: true, status: parsed.data.status });
}
