import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock modules before any imports that use them
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/meta/instagram", () => ({
  refreshLongLivedToken: vi.fn(),
}));

vi.mock("@/lib/crypto/token", () => ({
  decryptToken: vi.fn(),
  encryptToken: vi.fn(),
}));

import { refreshExpiringTokens } from "./refresh-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshLongLivedToken } from "@/lib/meta/instagram";
import { decryptToken, encryptToken } from "@/lib/crypto/token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = any;

const OLD_DATE = new Date(Date.now() - 55 * 24 * 3600_000).toISOString();

function makeAccount(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: "acct-1",
    workspace_id: "ws-1",
    encrypted_access_token: "\\x" + "aa".repeat(32),
    token_iv: "\\x" + "bb".repeat(12),
    token_expires_at: null,
    updated_at: OLD_DATE,
    ...overrides,
  };
}

describe("refreshExpiringTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array when no accounts need refresh", async () => {
    const selectEqEq = vi.fn().mockReturnValue({
      or: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    const selectEq = vi.fn().mockReturnValue({ eq: selectEqEq });
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq });
    const supabase = {
      from: vi.fn().mockImplementation(() => ({ select: selectFn })),
    };
    vi.mocked(createAdminClient).mockReturnValue(supabase as AnyMock);

    const results = await refreshExpiringTokens();
    expect(results).toEqual([]);
  });

  it("refreshes a token successfully", async () => {
    const account = makeAccount();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
    const selectEqEq = vi.fn().mockReturnValue({
      or: vi.fn().mockResolvedValue({ data: [account], error: null }),
    });
    const selectEq = vi.fn().mockReturnValue({ eq: selectEqEq });
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq });

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "connected_accounts") {
          return { select: selectFn, update: updateFn };
        }
        return { select: selectFn, update: updateFn };
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(supabase as AnyMock);

    vi.mocked(decryptToken).mockReturnValue("old-token-plaintext");
    vi.mocked(refreshLongLivedToken).mockResolvedValue({
      access_token: "new-token-plaintext",
      expires_in: 5184000,
    });
    vi.mocked(encryptToken).mockReturnValue({
      ciphertext: Buffer.from("cc".repeat(32), "hex"),
      iv: Buffer.from("dd".repeat(12), "hex"),
    });

    const results = await refreshExpiringTokens();
    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe("refreshed");
    expect(results[0]!.accountId).toBe("acct-1");

    expect(decryptToken).toHaveBeenCalledOnce();
    expect(refreshLongLivedToken).toHaveBeenCalledWith("old-token-plaintext");
    expect(encryptToken).toHaveBeenCalledWith("new-token-plaintext");
    expect(updateFn).toHaveBeenCalled();
  });

  it("marks account as deauthorized on auth error", async () => {
    const account = makeAccount();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
    const selectEqEq = vi.fn().mockReturnValue({
      or: vi.fn().mockResolvedValue({ data: [account], error: null }),
    });
    const selectEq = vi.fn().mockReturnValue({ eq: selectEqEq });
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq });

    const supabase = {
      from: vi.fn().mockImplementation(() => ({
        select: selectFn,
        update: updateFn,
      })),
    };
    vi.mocked(createAdminClient).mockReturnValue(supabase as AnyMock);

    vi.mocked(decryptToken).mockReturnValue("expired-token");
    vi.mocked(refreshLongLivedToken).mockRejectedValue(
      new Error("Token refresh failed: 400 Error validating access token: Session has expired (code 190)"),
    );

    const results = await refreshExpiringTokens();
    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe("deauthorized");
    expect(results[0]!.error).toContain("190");

    // Should have called update to deactivate
    expect(updateFn).toHaveBeenCalled();
  });

  it("marks as failed on transient error", async () => {
    const account = makeAccount();
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
    const selectEqEq = vi.fn().mockReturnValue({
      or: vi.fn().mockResolvedValue({ data: [account], error: null }),
    });
    const selectEq = vi.fn().mockReturnValue({ eq: selectEqEq });
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq });

    const supabase = {
      from: vi.fn().mockImplementation(() => ({
        select: selectFn,
        update: updateFn,
      })),
    };
    vi.mocked(createAdminClient).mockReturnValue(supabase as AnyMock);

    vi.mocked(decryptToken).mockReturnValue("valid-token");
    vi.mocked(refreshLongLivedToken).mockRejectedValue(
      new Error("Token refresh failed: 500 Internal Server Error"),
    );

    const results = await refreshExpiringTokens();
    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe("failed");
    expect(results[0]!.error).toContain("500");
  });

  it("returns empty array on query error", async () => {
    const selectEqEq = vi.fn().mockReturnValue({
      or: vi.fn().mockResolvedValue({ data: null, error: { message: "connection refused" } }),
    });
    const selectEq = vi.fn().mockReturnValue({ eq: selectEqEq });
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq });

    const supabase = {
      from: vi.fn().mockImplementation(() => ({ select: selectFn })),
    };
    vi.mocked(createAdminClient).mockReturnValue(supabase as AnyMock);

    const results = await refreshExpiringTokens();
    expect(results).toEqual([]);
  });
});
