import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length < 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be at least 64 hex characters");
  }
  return Buffer.from(hex.slice(0, 64), "hex");
}

export function encryptToken(plaintext: string): { ciphertext: Buffer; iv: Buffer } {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: Buffer.concat([encrypted, authTag]),
    iv,
  };
}

export function decryptToken(ciphertext: Buffer, iv: Buffer): string {
  const key = getEncryptionKey();
  const authTag = ciphertext.subarray(ciphertext.length - AUTH_TAG_LENGTH);
  const encrypted = ciphertext.subarray(0, ciphertext.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return decipher.update(encrypted) + decipher.final("utf8");
}
