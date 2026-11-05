import { createAdminClient } from "@/lib/supabase/admin";
import { refreshLongLivedToken } from "@/lib/meta/instagram";
import { encryptToken, decryptToken } from "@/lib/crypto/token";

export type RefreshResult = {
  accountId: string;
  workspaceId: string;
  status: "refreshed" | "failed" | "deauthorized";
  error?: string;
};

const TOKEN_REFRESH_THRESHOLD_DAYS = 50;

/**
 * Refresh all Instagram tokens that are older than the threshold.
 * Returns a result per account processed.
 */
export async function refreshExpiringTokens(): Promise<RefreshResult[]> {
  const supabase = createAdminClient();
  const results: RefreshResult[] = [];

  const cutoff = new Date(
    Date.now() - TOKEN_REFRESH_THRESHOLD_DAYS * 24 * 3600_000,
  ).toISOString();

  // Find active accounts whose token was last updated before the cutoff,
  // OR whose token_expires_at is within 10 days from now
  const tenDaysFromNow = new Date(
    Date.now() + 10 * 24 * 3600_000,
  ).toISOString();

  const { data: accounts, error: queryError } = await supabase
    .from("connected_accounts")
    .select("id, workspace_id, encrypted_access_token, token_iv, token_expires_at, updated_at")
    .eq("platform", "instagram")
    .eq("is_active", true)
    .or(`updated_at.lt.${cutoff},token_expires_at.lt.${tenDaysFromNow}`);

  if (queryError) {
    console.error("[token-refresh] Failed to query accounts:", queryError.message);
    return [];
  }

  if (!accounts?.length) {
    console.log("[token-refresh] No accounts need refresh");
    return [];
  }

  console.log(`[token-refresh] Found ${accounts.length} account(s) to refresh`);

  for (const account of accounts) {
    const acct = account as {
      id: string;
      workspace_id: string;
      encrypted_access_token: string;
      token_iv: string;
      token_expires_at: string | null;
      updated_at: string;
    };

    try {
      const currentToken = decryptToken(
        Buffer.from(acct.encrypted_access_token.replace(/\\x/g, ""), "hex"),
        Buffer.from(acct.token_iv.replace(/\\x/g, ""), "hex"),
      );

      const { access_token: newToken, expires_in } =
        await refreshLongLivedToken(currentToken);

      const { ciphertext, iv } = encryptToken(newToken);
      const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

      await supabase
        .from("connected_accounts")
        .update({
          encrypted_access_token: `\\x${ciphertext.toString("hex")}`,
          token_iv: `\\x${iv.toString("hex")}`,
          token_expires_at: expiresAt,
        } as Record<string, unknown>)
        .eq("id", acct.id);

      console.log(
        `[token-refresh] Refreshed account=${acct.id} workspace=${acct.workspace_id} expiresAt=${expiresAt}`,
      );

      results.push({
        accountId: acct.id,
        workspaceId: acct.workspace_id,
        status: "refreshed",
      });
    } catch (err) {
      const message = (err as Error).message;
      const isDeauth =
        message.includes("190") ||
        message.includes("Invalid") ||
        message.includes("expired") ||
        message.includes("deauthorized");

      if (isDeauth) {
        await supabase
          .from("connected_accounts")
          .update({ is_active: false } as Record<string, unknown>)
          .eq("id", acct.id);

        console.error(
          `[token-refresh] Deauthorized account=${acct.id} workspace=${acct.workspace_id}: ${message}`,
        );

        results.push({
          accountId: acct.id,
          workspaceId: acct.workspace_id,
          status: "deauthorized",
          error: message,
        });
      } else {
        console.error(
          `[token-refresh] Failed account=${acct.id} workspace=${acct.workspace_id}: ${message}`,
        );

        results.push({
          accountId: acct.id,
          workspaceId: acct.workspace_id,
          status: "failed",
          error: message,
        });
      }
    }
  }

  const refreshed = results.filter((r) => r.status === "refreshed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const deauthed = results.filter((r) => r.status === "deauthorized").length;
  console.log(
    `[token-refresh] Done: ${refreshed} refreshed, ${failed} failed, ${deauthed} deauthorized`,
  );

  return results;
}
