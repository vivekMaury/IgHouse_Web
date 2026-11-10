import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "@/lib/env";
import {
  decodeInstagramOAuthState,
  encodeInstagramOAuthState,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getInstagramAuthUrl,
  getInstagramRedirectUri,
  refreshLongLivedToken,
  subscribeInstagramWebhooks,
} from "./instagram";

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.META_APP_ID = "987654321";
  process.env.META_APP_SECRET = "test-app-secret";
  process.env.INSTAGRAM_APP_ID = "1748895003007419";
  process.env.INSTAGRAM_CLIENT_SECRET = "test-ig-client-secret";
  process.env.META_WEBHOOK_VERIFY_TOKEN = "test-verify-token";
  process.env.TOKEN_ENCRYPTION_KEY =
    "aab1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1";
  resetEnvCache();
});

describe("Instagram OAuth redirect URI", () => {
  it("returns the configured redirect URI from env", () => {
    process.env.INSTAGRAM_REDIRECT_URI = "https://iginbox.com/api/instagram/callback";
    resetEnvCache();

    expect(getInstagramRedirectUri()).toBe("https://iginbox.com/api/instagram/callback");
  });

  it("includes the exact redirect URI in the authorization URL", () => {
    const redirectUri = "https://iginbox.com/api/instagram/callback";
    const authUrl = new URL(getInstagramAuthUrl(redirectUri, "oauth-state"));

    expect(authUrl.origin + authUrl.pathname).toBe(
      "https://www.instagram.com/oauth/authorize",
    );
    expect(authUrl.searchParams.get("client_id")).toBe("1748895003007419");
    expect(authUrl.searchParams.get("client_id")).not.toBe("987654321");
    expect(authUrl.searchParams.get("redirect_uri")).toBe(redirectUri);
    expect(authUrl.searchParams.get("state")).toBe("oauth-state");
  });
});

describe("Instagram Login token exchange", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exchanges the authorization code through Instagram OAuth and preserves the user ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        '{"access_token":"short-token","user_id":12345678901234567}',
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await exchangeCodeForToken(
      "authorization-code",
      "https://iginbox.com/api/instagram/callback",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.instagram.com/oauth/access_token");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).get("grant_type")).toBe("authorization_code");
    expect(result).toEqual({
      access_token: "short-token",
      user_id: "12345678901234567",
    });
  });

  it("exchanges short-lived tokens using Instagram's 60-day token grant via POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ access_token: "long-token", expires_in: 5_184_000 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(exchangeForLongLivedToken("short-token")).resolves.toEqual({
      access_token: "long-token",
      expires_in: 5_184_000,
    });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsedUrl = new URL(url);
    expect(parsedUrl.origin).toBe("https://graph.instagram.com");
    expect(parsedUrl.pathname).toBe("/access_token");
    expect(options.method).toBe("POST");
    expect(parsedUrl.searchParams.get("grant_type")).toBe("ig_exchange_token");
    expect(parsedUrl.searchParams.get("access_token")).toBe("short-token");
  });

  it("falls back to GET if POST token exchange fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              message: "Unsupported request - method type: post",
              type: "IGApiException",
              code: 100,
            },
          }),
          { status: 400 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({ access_token: "long-token-via-get", expires_in: 5_184_000 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(exchangeForLongLivedToken("short-token")).resolves.toEqual({
      access_token: "long-token-via-get",
      expires_in: 5_184_000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [getUrl, getOptions] = fetchMock.mock.calls[1] as [string, RequestInit | undefined];
    expect(getOptions?.method).toBeUndefined();
    expect(new URL(getUrl).searchParams.get("grant_type")).toBe("ig_exchange_token");
  });

  it("refreshes long-lived tokens using Instagram's refresh endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ access_token: "refreshed-token", expires_in: 5_184_000 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await refreshLongLivedToken("long-token");

    const [url] = fetchMock.mock.calls[0] as [string];
    const parsedUrl = new URL(url);
    expect(parsedUrl.origin).toBe("https://graph.instagram.com");
    expect(parsedUrl.pathname).toBe("/refresh_access_token");
    expect(parsedUrl.searchParams.get("grant_type")).toBe("ig_refresh_token");
  });
});

describe("Instagram OAuth state cookie payload", () => {
  it("encrypts and validates the state payload", () => {
    const state = {
      state: "a".repeat(64),
      purpose: "connect" as const,
      workspaceId: "123e4567-e89b-12d3-a456-426614174000",
      userId: "123e4567-e89b-12d3-a456-426614174001",
    };

    expect(decodeInstagramOAuthState(encodeInstagramOAuthState(state))).toEqual(state);
  });

  it("rejects a tampered encrypted state payload", () => {
    const encoded = encodeInstagramOAuthState({ state: "b".repeat(64) });
    const [iv, ciphertext] = encoded.split(".");
    const replacement = `${ciphertext?.[0] === "A" ? "B" : "A"}${ciphertext?.slice(1)}`;

    expect(() => decodeInstagramOAuthState(`${iv}.${replacement}`)).toThrow();
  });
});

describe("subscribeInstagramWebhooks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("subscribes the Instagram account to message and postback webhooks", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await subscribeInstagramWebhooks("ig-account", "access-token");

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://graph.instagram.com/v26.0/ig-account/subscribed_apps?subscribed_fields=messages%2Cmessaging_postbacks",
    );
    expect(options.method).toBe("POST");
    expect(new Headers(options.headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
  });

  it("reports a rejected webhook subscription", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: { message: "Missing permission" },
          }),
          { status: 400 },
        ),
      ),
    );

    await expect(
      subscribeInstagramWebhooks("ig-account", "access-token"),
    ).rejects.toThrow("Missing permission");
  });
});
