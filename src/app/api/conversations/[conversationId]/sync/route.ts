import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/crypto/token";
import { syncConversationHistory } from "@/lib/meta/sync-history";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`api:${ip}`, "api");
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl.remaining, rl.reset) });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, workspace_id, contact_id, connected_account_id")
    .eq("id", conversationId)
    .single();

  const conversation = conv as {
    id: string;
    workspace_id: string;
    contact_id: string;
    connected_account_id: string;
  } | null;

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const admin = createAdminClient();

  const { data: accountData } = await admin
    .from("connected_accounts")
    .select("encrypted_access_token, token_iv, platform_account_id")
    .eq("id", conversation.connected_account_id)
    .single();

  const account = accountData as {
    encrypted_access_token: string;
    token_iv: string;
    platform_account_id: string;
  } | null;

  if (!account) {
    return NextResponse.json({ error: "Connected account not found" }, { status: 404 });
  }

  const { data: contactData } = await admin
    .from("contacts")
    .select("platform_scoped_id")
    .eq("id", conversation.contact_id)
    .single();

  const contact = contactData as { platform_scoped_id: string } | null;
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  let accessToken: string;
  try {
    const tokenHex = account.encrypted_access_token.replace(/\\x/g, "");
    const ivHex = account.token_iv.replace(/\\x/g, "");
    accessToken = decryptToken(
      Buffer.from(tokenHex, "hex"),
      Buffer.from(ivHex, "hex"),
    );
  } catch {
    return NextResponse.json({ error: "Token decryption failed" }, { status: 500 });
  }

  try {
    const result = await syncConversationHistory({
      supabase: admin,
      workspaceId: conversation.workspace_id,
      conversationId,
      contactId: conversation.contact_id,
      contactPlatformScopedId: contact.platform_scoped_id,
      igBusinessAccountId: account.platform_account_id,
      accessToken,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[sync] Message history sync failed:", (err as Error).message);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
