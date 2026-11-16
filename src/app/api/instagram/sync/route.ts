import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { decryptToken, encryptToken } from "@/lib/crypto/token";
import {
  exchangeForLongLivedToken,
  fetchIgUserProfile,
  getInstagramProfile,
  refreshLongLivedToken,
} from "@/lib/meta/instagram";
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
    .select("id, workspace_id, platform_account_id, is_active, encrypted_access_token, token_iv, username, avatar_url")
    .eq("id", parsed.data.accountId)
    .single();

  const row = account as {
    id: string;
    workspace_id: string;
    platform_account_id: string;
    is_active: boolean;
    encrypted_access_token?: string;
    token_iv?: string;
    username?: string | null;
    avatar_url?: string | null;
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

  // Attempt to refresh profile details and upgrade token if short-lived
  if (row.encrypted_access_token && row.token_iv) {
    try {
      const tokenHex = row.encrypted_access_token.replace(/\\x/g, "");
      const ivHex = row.token_iv.replace(/\\x/g, "");
      const accessToken = decryptToken(Buffer.from(tokenHex, "hex"), Buffer.from(ivHex, "hex"));

      let profileUsername: string | undefined;
      let profilePic: string | undefined;

      try {
        const profile = await getInstagramProfile(accessToken, row.platform_account_id);
        profileUsername = profile.username;
        profilePic = profile.profile_picture_url;
      } catch (profErr) {
        console.warn("[sync] getInstagramProfile error, trying fetchIgUserProfile:", (profErr as Error).message);
        try {
          const userProf = await fetchIgUserProfile(row.platform_account_id, accessToken);
          profileUsername = userProf.username;
          profilePic = userProf.profile_pic;
        } catch {
          // ignore
        }
      }

      const updates: Record<string, unknown> = {};
      if (profileUsername && (!row.username || row.username.startsWith("user_") || row.username.startsWith("ig_"))) {
        updates.username = profileUsername;
      }
      if (profilePic && !row.avatar_url) {
        updates.avatar_url = profilePic;
      }

      // If token is short-lived or expiring, upgrade to 60-day long-lived token
      try {
        let refreshed: { access_token: string; expires_in: number } | null = null;
        try {
          refreshed = await exchangeForLongLivedToken(accessToken);
        } catch {
          try {
            refreshed = await refreshLongLivedToken(accessToken);
          } catch {
            // keep existing
          }
        }

        if (refreshed && refreshed.access_token) {
          const { ciphertext, iv } = encryptToken(refreshed.access_token);
          updates.encrypted_access_token = `\\x${ciphertext.toString("hex")}`;
          updates.token_iv = `\\x${iv.toString("hex")}`;
          updates.token_expires_at = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
        }
      } catch (tokenErr) {
        console.warn("[sync] Token upgrade attempt error:", (tokenErr as Error).message);
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("connected_accounts").update(updates).eq("id", row.id);
        console.log(`[sync] Refreshed profile/token for account=${row.id}:`, updates);
      }
    } catch (err) {
      console.warn("[sync] Profile refresh error:", (err as Error).message);
    }
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
