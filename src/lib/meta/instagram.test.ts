import { afterEach, describe, expect, it, vi } from "vitest";
import { subscribeInstagramWebhooks } from "./instagram";

describe("subscribeInstagramWebhooks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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
