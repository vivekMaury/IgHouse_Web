import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";

const updateSchema = z.object({
  accountId: z.string().uuid(),
  username: z.string().min(1).max(100),
});

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid accountId and username required" }, { status: 400 });
  }

  const cleanUsername = parsed.data.username.replace(/^@/, "").trim();

  // Verify ownership via workspace_members
  const { data: account, error: accountError } = await supabase
    .from("connected_accounts")
    .select("id, workspace_id")
    .eq("id", parsed.data.accountId)
    .single();

  if (accountError || !account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", account.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("connected_accounts")
    .update({ username: cleanUsername })
    .eq("id", account.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username: cleanUsername });
}
