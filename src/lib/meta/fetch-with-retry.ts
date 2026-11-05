export type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Override for testing — defaults to real setTimeout-based sleep */
  _sleep?: (ms: number) => Promise<void>;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

function computeDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  retryAfterMs: number | null,
): number {
  if (retryAfterMs !== null && retryAfterMs > 0) {
    return Math.min(retryAfterMs, maxDelayMs);
  }
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxDelayMs);
  const jitter = capped * (0.5 + Math.random() * 0.5);
  return jitter;
}

function parseRetryAfter(res: Response): number | null {
  const header = res.headers.get("Retry-After");
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds) && seconds > 0) {
    return seconds * 1000;
  }
  return null;
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts?: RetryOptions,
): Promise<Response> {
  const maxRetries = opts?.maxRetries ?? 3;
  const baseDelayMs = opts?.baseDelayMs ?? 1000;
  const maxDelayMs = opts?.maxDelayMs ?? 30000;
  const sleepFn = opts?._sleep ?? sleep;

  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, init);
    lastResponse = res;

    if (res.ok || !isRetryable(res.status)) {
      return res;
    }

    if (attempt === maxRetries) {
      break;
    }

    const retryAfterMs = res.status === 429 ? parseRetryAfter(res) : null;
    const delay = computeDelay(attempt, baseDelayMs, maxDelayMs, retryAfterMs);

    console.warn(
      `[fetch-retry] ${res.status} on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${Math.round(delay)}ms`,
    );

    await sleepFn(delay);
  }

  return lastResponse!;
}
