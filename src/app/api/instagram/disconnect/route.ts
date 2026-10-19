import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { accountId?: string };
  try {
    body = (await request.json()) as { accountId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("connected_accounts")
    .delete()
    .eq("id", body.accountId);

  if (error) {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);

  const member = members?.[0] as { workspace_id: string } | undefined;
  if (member) {
    await writeAuditLog({
      workspace_id: member.workspace_id,
      actor_id: user.id,
      action: "account.disconnected",
      entity_type: "connected_account",
      entity_id: body.accountId,
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
  }

  return NextResponse.json({ ok: true });
}
