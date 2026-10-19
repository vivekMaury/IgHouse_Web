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

  return NextResponse.json({ ok: true });
}
