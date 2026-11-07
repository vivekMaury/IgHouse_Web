import { describe, expect, it } from "vitest";
import { getRedirectPathFromSearch, sanitizeRedirectPath } from "./redirect";

describe("sanitizeRedirectPath", () => {
  it("allows safe same-origin paths with query parameters", () => {
    expect(sanitizeRedirectPath("/api/instagram/connect?source=login")).toBe(
      "/api/instagram/connect?source=login",
    );
  });

  it.each([
    null,
    "",
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/user@example.com",
  ])("falls back to the dashboard for unsafe paths: %s", (path) => {
    expect(sanitizeRedirectPath(path)).toBe("/dashboard");
  });
});

describe("getRedirectPathFromSearch", () => {
  it("reads the post-login path from the query string", () => {
    expect(
      getRedirectPathFromSearch("?next=%2Fapi%2Finstagram%2Fconnect"),
    ).toBe("/api/instagram/connect");
  });
});
