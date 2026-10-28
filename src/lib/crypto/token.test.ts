import { describe, it, expect, beforeAll } from "vitest";
import { encryptToken, decryptToken } from "./token";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY =
    "aab1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1";
});

describe("AES-256-GCM token encryption", () => {
  it("encrypts and decrypts a token correctly", () => {
    const token = "IGQVJWZAnRsX3BhNk5SemRqUmlGRjJF";
    const { ciphertext, iv } = encryptToken(token);
    const decrypted = decryptToken(ciphertext, iv);
    expect(decrypted).toBe(token);
  });

  it("produces unique IVs for each encryption", () => {
    const token = "same-token-value";
    const result1 = encryptToken(token);
    const result2 = encryptToken(token);
    expect(result1.iv.equals(result2.iv)).toBe(false);
    expect(result1.ciphertext.equals(result2.ciphertext)).toBe(false);
  });

  it("fails to decrypt with tampered ciphertext", () => {
    const { ciphertext, iv } = encryptToken("secret-token");
    ciphertext[0] = (ciphertext[0] ?? 0) ^ 0xff;
    expect(() => decryptToken(ciphertext, iv)).toThrow();
  });

  it("fails to decrypt with wrong IV", () => {
    const { ciphertext } = encryptToken("secret-token");
    const wrongIv = Buffer.alloc(12, 0);
    expect(() => decryptToken(ciphertext, wrongIv)).toThrow();
  });

  it("handles empty string tokens", () => {
    const { ciphertext, iv } = encryptToken("");
    expect(decryptToken(ciphertext, iv)).toBe("");
  });

  it("handles long tokens", () => {
    const longToken = "x".repeat(2000);
    const { ciphertext, iv } = encryptToken(longToken);
    expect(decryptToken(ciphertext, iv)).toBe(longToken);
  });

  it("round-trips through PostgREST \\x hex bytea format", () => {
    const token = "IGQVJWZAnRsX3BhNk5SemRqUmlGRjJF";
    const { ciphertext, iv } = encryptToken(token);

    const dbEncrypted = `\\x${ciphertext.toString("hex")}`;
    const dbIv = `\\x${iv.toString("hex")}`;

    const parsedCiphertext = Buffer.from(dbEncrypted.slice(2), "hex");
    const parsedIv = Buffer.from(dbIv.slice(2), "hex");

    expect(decryptToken(parsedCiphertext, parsedIv)).toBe(token);
  });
});
