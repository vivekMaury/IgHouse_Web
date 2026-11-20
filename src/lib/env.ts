import { z } from "zod/v4";

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  META_APP_ID: z.string().min(1),
  META_APP_SECRET: z.string().min(1),
  INSTAGRAM_APP_ID: z.string().min(1),
  INSTAGRAM_CLIENT_SECRET: z.string().min(1),
  INSTAGRAM_REDIRECT_URI: z.url(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z.string().min(64),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  SENTRY_DSN: z.url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
});

export type Env = z.infer<typeof serverSchema>;

let _env: Env | null = null;

export function resetEnvCache(): void {
  _env = null;
}

function cleanEnvValue(val?: string | null): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
}

export function getEnv(): Env {
  if (_env) return _env;

  const rawEnv: Record<string, unknown> = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL:
      cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      "https://nnfmkhepnddevymtmyss.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZm1raGVwbmRkZXZ5bXRteXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTg5ODQsImV4cCI6MjEwNzk3NDk4NH0.6uEXvHH3A_uzp_HCKm2-f6F0iU0yMBF8Jn3guIRRdYU",
    SUPABASE_SERVICE_ROLE_KEY:
      cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanEnvValue(process.env.SUPABASE_KEY),
    INSTAGRAM_REDIRECT_URI:
      cleanEnvValue(process.env.INSTAGRAM_REDIRECT_URI) ||
      "https://iginbox.com/api/instagram/callback",
    TOKEN_ENCRYPTION_KEY:
      cleanEnvValue(process.env.TOKEN_ENCRYPTION_KEY) ||
      "d724121a829877e6d0101994807f9bc460a20c02e8027fc0ed19bc79ccd5951f",
    META_WEBHOOK_VERIFY_TOKEN:
      cleanEnvValue(process.env.META_WEBHOOK_VERIFY_TOKEN) || "ig_webhook_verify_2026",
    INSTAGRAM_APP_ID:
      cleanEnvValue(process.env.INSTAGRAM_APP_ID) || cleanEnvValue(process.env.META_APP_ID),
    INSTAGRAM_CLIENT_SECRET:
      cleanEnvValue(process.env.INSTAGRAM_CLIENT_SECRET) ||
      cleanEnvValue(process.env.META_APP_SECRET),
    META_APP_ID:
      cleanEnvValue(process.env.META_APP_ID) || cleanEnvValue(process.env.INSTAGRAM_APP_ID),
    META_APP_SECRET:
      cleanEnvValue(process.env.META_APP_SECRET) ||
      cleanEnvValue(process.env.INSTAGRAM_CLIENT_SECRET),
  };

  const parsed = serverSchema.safeParse(rawEnv);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    console.error("Invalid environment variables:\n", issues);
    throw new Error(`Invalid environment variables: ${issues}`);
  }
  _env = parsed.data;
  return _env;
}

export const env = new Proxy({} as Env, {
  get(_, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
