import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string | null
): boolean {
  if (!signature) return false;

  const elements = signature.split("=");
  if (elements.length !== 2 || elements[0] !== "sha256") return false;

  const signatureHash = elements[1];
  if (!signatureHash) return false;

  const expectedHash = createHmac("sha256", env.META_APP_SECRET)
    .update(rawBody)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signatureHash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch {
    return false;
  }
}

export function verifyGetChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null
): string | null {
  if (
    mode === "subscribe" &&
    token === env.META_WEBHOOK_VERIFY_TOKEN &&
    challenge
  ) {
    return challenge;
  }
  return null;
}
