import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string | null
): boolean {
  if (!signature) return false;

  const trimmed = signature.trim();
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) return false;

  const algorithm = trimmed.slice(0, eqIdx).toLowerCase();
  const signatureHash = trimmed.slice(eqIdx + 1).trim().toLowerCase();

  if (!signatureHash) return false;
  if (algorithm !== "sha256" && algorithm !== "sha1") return false;

  let sigBuffer: Buffer;
  try {
    sigBuffer = Buffer.from(signatureHash, "hex");
    if (sigBuffer.length === 0) return false;
  } catch {
    return false;
  }

  // Collect candidate secrets to verify against
  const candidateSecrets = new Set<string>();
  const addSecret = (val?: string | null) => {
    if (!val) return;
    const clean = val.trim();
    if (!clean) return;
    candidateSecrets.add(clean);
    // Also strip surrounding quotes if present in env vars
    const unquoted = clean.replace(/^["']|["']$/g, "").trim();
    if (unquoted) candidateSecrets.add(unquoted);
  };

  try {
    addSecret(env.META_APP_SECRET);
  } catch {
    // env proxy may not be initialized in isolated tests
  }
  try {
    addSecret(env.INSTAGRAM_CLIENT_SECRET);
  } catch {
    // env proxy may not be initialized in isolated tests
  }

  // Fallbacks to process.env in case env proxy has different keys or during cold start
  addSecret(process.env.META_APP_SECRET);
  addSecret(process.env.INSTAGRAM_CLIENT_SECRET);
  addSecret(process.env.APP_SECRET);
  addSecret(process.env.FB_APP_SECRET);

  for (const secret of candidateSecrets) {
    try {
      const expectedHash = createHmac(algorithm, secret)
        .update(rawBody)
        .digest("hex");
      const expectedBuffer = Buffer.from(expectedHash, "hex");

      if (
        sigBuffer.length === expectedBuffer.length &&
        timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        return true;
      }
    } catch {
      // Continue to next candidate secret
    }
  }

  return false;
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
