import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature, verifyGetChallenge } from "./webhook-verify";
import { resetEnvCache } from "@/lib/env";

beforeAll(() => {
  process.env.META_APP_SECRET = "test_app_secret_123";
  process.env.META_WEBHOOK_VERIFY_TOKEN = "my_verify_token";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.META_APP_ID = "123456";
  process.env.INSTAGRAM_APP_ID = "789012";
  process.env.TOKEN_ENCRYPTION_KEY =
    "aab1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1";
  resetEnvCache();
});

function signPayload(body: string, secret: string): string {
  const hash = createHmac("sha256", secret).update(body).digest("hex");
  return `sha256=${hash}`;
}

describe("verifyWebhookSignature", () => {
  const body = '{"object":"instagram","entry":[]}';

  it("accepts a valid signature", () => {
    const sig = signPayload(body, "test_app_secret_123");
    expect(verifyWebhookSignature(body, sig)).toBe(true);
  });

  it("rejects a forged signature", () => {
    const sig = signPayload(body, "wrong_secret");
    expect(verifyWebhookSignature(body, sig)).toBe(false);
  });

  it("rejects null signature", () => {
    expect(verifyWebhookSignature(body, null)).toBe(false);
  });

  it("rejects malformed signature", () => {
    expect(verifyWebhookSignature(body, "not-a-valid-format")).toBe(false);
  });

  it("rejects empty signature hash", () => {
    expect(verifyWebhookSignature(body, "sha256=")).toBe(false);
  });

  it("works with Buffer body", () => {
    const buf = Buffer.from(body, "utf8");
    const sig = signPayload(body, "test_app_secret_123");
    expect(verifyWebhookSignature(buf, sig)).toBe(true);
  });
});

describe("verifyGetChallenge", () => {
  it("returns challenge on valid subscribe request", () => {
    expect(
      verifyGetChallenge("subscribe", "my_verify_token", "challenge_123")
    ).toBe("challenge_123");
  });

  it("returns null for wrong mode", () => {
    expect(
      verifyGetChallenge("unsubscribe", "my_verify_token", "challenge_123")
    ).toBeNull();
  });

  it("returns null for wrong token", () => {
    expect(
      verifyGetChallenge("subscribe", "wrong_token", "challenge_123")
    ).toBeNull();
  });

  it("returns null for missing challenge", () => {
    expect(verifyGetChallenge("subscribe", "my_verify_token", null)).toBeNull();
  });
});
