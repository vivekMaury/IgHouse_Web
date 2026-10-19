import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function createLimiter(tokens: number, window: string) {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(tokens, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
    prefix: "ighouse:rl",
  });
}

const limiters = {
  api: () => createLimiter(60, "60 s"),
  auth: () => createLimiter(10, "60 s"),
  webhook: () => createLimiter(200, "60 s"),
} as const;

type LimiterKey = keyof typeof limiters;

export async function checkRateLimit(
  key: string,
  type: LimiterKey = "api"
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limiter = limiters[type]();
  if (!limiter) return { success: true, remaining: -1, reset: 0 };

  const result = await limiter.limit(key);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function rateLimitHeaders(remaining: number, reset: number): Record<string, string> {
  if (remaining < 0) return {};
  return {
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
  };
}
