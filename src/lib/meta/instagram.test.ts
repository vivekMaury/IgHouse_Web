import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getInstagramAuthUrl,
  getInstagramRedirectUri,
  subscribeInstagramWebhooks,
} from "./instagram";

describe("Instagram OAuth redirect URI", () => {
  it("uses the configured canonical URI and rejects missing configuration", () => {
    const redirectUri = "https://iginbox.com/api/instagram/callback";

    expect(getInstagramRedirectUri(redirectUri)).toBe(redirectUri);
    expect(() => getInstagramRedirectUri("")).toThrow(
      "INSTAGRAM_REDIRECT_URI must be configured",
    );
  });

  it("includes the exact redirect URI in the authorization URL", () => {
    vi.stubEnv("INSTAGRAM_APP_ID", "test-app-id");
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
      "https://graph.instagram.com/v21.0/ig-account/subscribed_apps?subscribed_fields=messages%2Cmessaging_postbacks",
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
