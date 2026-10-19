import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`delete:${ip}`, "auth");
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl.remaining, rl.reset) });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .limit(1);

  const member = members?.[0] as { workspace_id: string; role: string } | undefined;
  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Only workspace owner can delete data" }, { status: 403 });
  }

  const admin = createAdminClient();
  const wid = member.workspace_id;

  await admin.from("automation_logs").delete().eq("workspace_id", wid);
  await admin.from("audit_logs").delete().eq("workspace_id", wid);
  await admin.from("webhook_events").delete().eq("workspace_id" as string, wid);
  await admin.from("flow_runs").delete().eq("workspace_id", wid);
  await admin.from("flow_versions").delete().eq("workspace_id" as string, wid);
  await admin.from("messages").delete().eq("workspace_id", wid);
  await admin.from("conversations").delete().eq("workspace_id", wid);
  await admin.from("captured_leads").delete().eq("workspace_id", wid);
  await admin.from("contact_tags").delete().eq("workspace_id" as string, wid);
  await admin.from("contacts").delete().eq("workspace_id", wid);
  await admin.from("tags").delete().eq("workspace_id", wid);
  await admin.from("flows").delete().eq("workspace_id", wid);
  await admin.from("connected_accounts").delete().eq("workspace_id", wid);

  await writeAuditLog({
    workspace_id: wid,
    actor_id: user.id,
    action: "workspace.data_deleted",
    entity_type: "workspace",
    entity_id: wid,
    ip_address: ip,
  });

  console.info("[account] data deletion completed for workspace:", wid, "by user:", user.id);

  return NextResponse.json({ ok: true, message: "All workspace data has been deleted." });
}
