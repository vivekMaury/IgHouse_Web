import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { createHmac, timingSafeEqual } from "node:crypto";
import { writeAuditLog } from "@/lib/audit";

function parseSignedRequest(signedRequest: string, appSecret: string): Record<string, unknown> | null {
  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) return null;

  const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const expectedSig = createHmac("sha256", appSecret).update(payload).digest();

  if (sig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(sig, expectedSig)) return null;

  const decoded = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
  return JSON.parse(decoded) as Record<string, unknown>;
}

export async function GET() {
  return NextResponse.json({
    service: "IgHouse",
    endpoint: "Meta Data Deletion Callback",
    method: "POST",
    description: "This endpoint receives data deletion requests from Meta. It is not meant to be accessed directly.",
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`meta-deletion:${ip}`, "api");
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl.remaining, rl.reset) });
  }

  const formData = await request.formData();
  const signedRequest = formData.get("signed_request");

  if (typeof signedRequest !== "string") {
    return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
  }

  const data = parseSignedRequest(signedRequest, env.META_APP_SECRET);
  if (!data) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const userId = data.user_id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const confirmationCode = `del_${Date.now()}_${userId}`;

  const { data: accounts } = await supabase
    .from("connected_accounts")
    .select("id, workspace_id")
    .eq("platform_account_id", userId)
    .eq("platform", "instagram");

  const accountList = (accounts ?? []) as { id: string; workspace_id: string }[];

  for (const account of accountList) {
    await supabase.from("messages")
      .delete()
      .eq("workspace_id", account.workspace_id);

    await supabase.from("conversations")
      .delete()
      .eq("workspace_id", account.workspace_id)
      .eq("connected_account_id", account.id);

    await supabase.from("contacts")
      .delete()
      .eq("workspace_id", account.workspace_id);

    await supabase.from("connected_accounts")
      .delete()
      .eq("id", account.id);

    await writeAuditLog({
      workspace_id: account.workspace_id,
      actor_id: "system",
      action: "data_deletion.meta_callback",
      entity_type: "connected_account",
      entity_id: account.id,
      metadata: { platform_user_id: userId, confirmation_code: confirmationCode },
      ip_address: ip,
    });
  }

  console.info("[meta-deletion] processed deletion for user:", userId, "accounts:", accountList.length);

  const reqUrl = new URL(request.url);
  const statusUrl = `${reqUrl.origin}/api/meta/data-deletion/status?code=${confirmationCode}`;

  return NextResponse.json({
    url: statusUrl,
    confirmation_code: confirmationCode,
  });
}
