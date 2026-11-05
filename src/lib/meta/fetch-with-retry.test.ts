import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWithRetry } from "./fetch-with-retry";

const noopSleep = vi.fn().mockResolvedValue(undefined);

function mockResponse(status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify({ ok: status < 400 }), {
    status,
    headers: new Headers(headers),
  });
}

const retryOpts = { baseDelayMs: 10, _sleep: noopSleep };

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    noopSleep.mockClear();
  });

  it("succeeds on first try with no retries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("https://api.test/ok", {}, retryOpts);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(noopSleep).not.toHaveBeenCalled();
  });

  it("retries on 429, succeeds on 2nd attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(429))
      .mockResolvedValueOnce(mockResponse(200));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("https://api.test/retry429", {}, retryOpts);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(noopSleep).toHaveBeenCalledTimes(1);
  });

  it("retries on 500, succeeds on 3rd attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(502))
      .mockResolvedValueOnce(mockResponse(200));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("https://api.test/retry5xx", {}, retryOpts);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(noopSleep).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on 400", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(400));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("https://api.test/bad", {}, retryOpts);
    expect(res.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(noopSleep).not.toHaveBeenCalled();
  });

  it("does NOT retry on 403", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(403));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("https://api.test/forbidden", {}, retryOpts);
    expect(res.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("respects Retry-After header on 429", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(429, { "Retry-After": "2" }))
      .mockResolvedValueOnce(mockResponse(200));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("https://api.test/retryafter", {}, { ...retryOpts, baseDelayMs: 10 });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Retry-After: 2 → 2000ms
    expect(noopSleep).toHaveBeenCalledWith(2000);
  });

  it("fails after maxRetries exhausted", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(500));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("https://api.test/fail", {}, { ...retryOpts, maxRetries: 2 });
    expect(res.status).toBe(500);
    // 1 initial + 2 retries = 3 calls
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(noopSleep).toHaveBeenCalledTimes(2);
  });
});
