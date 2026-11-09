import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "@/lib/env";
import {
  getInstagramAuthUrl,
  getInstagramRedirectUri,
  subscribeInstagramWebhooks,
} from "./instagram";

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.META_APP_ID = "123456";
  process.env.META_APP_SECRET = "test-app-secret";
  process.env.INSTAGRAM_APP_ID = "test-app-id";
  process.env.INSTAGRAM_CLIENT_SECRET = "test-ig-client-secret";
  process.env.META_WEBHOOK_VERIFY_TOKEN = "test-verify-token";
  process.env.TOKEN_ENCRYPTION_KEY =
    "aab1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1";
  resetEnvCache();
});

describe("Instagram OAuth redirect URI", () => {
  it("uses the configured canonical URI and rejects missing configuration", () => {
    const redirectUri = "https://iginbox.com/api/instagram/callback";

    expect(getInstagramRedirectUri(redirectUri)).toBe(redirectUri);
    expect(() => getInstagramRedirectUri("")).toThrow(
      "INSTAGRAM_REDIRECT_URI must be configured",
    );
  });

  it("includes the exact redirect URI in the authorization URL", () => {
    const redirectUri = "https://iginbox.com/api/instagram/callback";
    const authUrl = new URL(getInstagramAuthUrl(redirectUri, "oauth-state"));

    expect(authUrl.searchParams.get("redirect_uri")).toBe(redirectUri);
    expect(authUrl.searchParams.get("state")).toBe("oauth-state");
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
      "https://graph.facebook.com/v26.0/ig-account/subscribed_apps?subscribed_fields=messages%2Cmessaging_postbacks",
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
