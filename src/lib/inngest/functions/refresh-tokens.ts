import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken, encryptToken } from "@/lib/crypto/token";
import { refreshLongLivedToken } from "@/lib/meta/instagram";

export const refreshExpiredTokens = inngest.createFunction(
  {
    id: "refresh-instagram-tokens",
    retries: 3,
    triggers: [{ cron: "0 3 * * *" }],
  },
  async ({ step }) => {
    const supabase = createAdminClient();

    const accounts = await step.run("fetch-expiring-accounts", async () => {
      const sevenDaysFromNow = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from("connected_accounts")
        .select("id, encrypted_access_token, token_iv, token_expires_at")
        .eq("is_active", true)
        .lt("token_expires_at", sevenDaysFromNow);

      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        encrypted_access_token: string;
        token_iv: string;
        token_expires_at: string;
      }>;
    });

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const account of accounts) {
      const result = await step.run(
        `refresh-token-${account.id}`,
        async () => {
          try {
            const tokenHex = account.encrypted_access_token.replace("\\x", "");
            const ivHex = account.token_iv.replace("\\x", "");
            const currentToken = decryptToken(
              Buffer.from(tokenHex, "hex"),
              Buffer.from(ivHex, "hex")
            );

            const { access_token: newToken, expires_in } =
              await refreshLongLivedToken(currentToken);

            const { ciphertext, iv } = encryptToken(newToken);
            const expiresAt = new Date(
              Date.now() + expires_in * 1000
            ).toISOString();

            await supabase
              .from("connected_accounts")
              .update({
                encrypted_access_token: `\\x${ciphertext.toString("hex")}`,
                token_iv: `\\x${iv.toString("hex")}`,
                token_expires_at: expiresAt,
              } as Record<string, unknown>)
              .eq("id", account.id);

            return { id: account.id, success: true };
          } catch (err) {
            const message = (err as Error).message;

            if (message.includes("190") || message.includes("expired")) {
              await supabase
                .from("connected_accounts")
                .update({ is_active: false } as Record<string, unknown>)
                .eq("id", account.id);
            }

            return { id: account.id, success: false, error: message };
          }
        }
      );

      results.push(result);
    }

    return {
      total: accounts.length,
      refreshed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results,
    };
  }
);
