import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { z } from "zod/v4";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const syncSchema = z.object({
  accountId: z.string().uuid(),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`api:${ip}`, "api");
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rl.remaining, rl.reset) },
    );
  }

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

  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id, workspace_id, platform_account_id, is_active")
    .eq("id", parsed.data.accountId)
    .single();

  const row = account as {
    id: string;
    workspace_id: string;
    platform_account_id: string;
    is_active: boolean;
  } | null;

  if (!row) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (!row.is_active) {
    return NextResponse.json(
      { error: "Account is inactive. Reconnect to sync." },
      { status: 400 },
    );
  }

  await inngest.send({
    name: "instagram/account.connected",
    data: {
      workspaceId: row.workspace_id,
      connectedAccountId: row.id,
      igUserId: row.platform_account_id,
    },
  });

  return NextResponse.json({ ok: true });
}
