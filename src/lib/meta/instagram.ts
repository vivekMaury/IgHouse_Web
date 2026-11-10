import { env } from "@/lib/env";
import { decryptToken, encryptToken } from "@/lib/crypto/token";
import { z } from "zod/v4";

const INSTAGRAM_AUTH_BASE = "https://www.instagram.com/oauth/authorize";
const INSTAGRAM_OAUTH_BASE = "https://api.instagram.com";
const INSTAGRAM_GRAPH_BASE = "https://graph.instagram.com";
const INSTAGRAM_GRAPH_VERSION = "v22.0";

const instagramOAuthStateSchema = z.object({
  state: z.string().regex(/^[a-f0-9]{64}$/),
  purpose: z.enum(["login", "connect"]).optional(),
  workspaceId: z.uuid().optional(),
  userId: z.uuid().optional(),
});

export type InstagramOAuthState = z.infer<typeof instagramOAuthStateSchema>;

export function encodeInstagramOAuthState(state: InstagramOAuthState): string {
  const validatedState = instagramOAuthStateSchema.parse(state);
  const { ciphertext, iv } = encryptToken(JSON.stringify(validatedState));
  return `${iv.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decodeInstagramOAuthState(value: string): InstagramOAuthState {
  const [ivValue, ciphertextValue, extra] = value.split(".");
  if (!ivValue || !ciphertextValue || extra !== undefined) {
    throw new Error("Malformed Instagram OAuth state cookie");
  }

  const iv = Buffer.from(ivValue, "base64url");
  const ciphertext = Buffer.from(ciphertextValue, "base64url");
  if (iv.length !== 12 || ciphertext.length <= 16) {
    throw new Error("Malformed Instagram OAuth state cookie");
  }

  const payload = JSON.parse(decryptToken(ciphertext, iv)) as unknown;
  return instagramOAuthStateSchema.parse(payload);
}

const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
];

export function getInstagramRedirectUri(): string {
  return env.INSTAGRAM_REDIRECT_URI;
}

export function getInstagramAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    enable_fb_login: "0",
    force_authentication: "1",
    client_id: env.INSTAGRAM_APP_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });
  return `${INSTAGRAM_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; user_id: string }> {
  const tokenUrl = `${INSTAGRAM_OAUTH_BASE}/oauth/access_token`;
  const body = new FormData();
  body.set("client_id", env.INSTAGRAM_APP_ID);
  body.set("client_secret", env.INSTAGRAM_CLIENT_SECRET);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", redirectUri);
  body.set("code", code);

  console.log("[ig-token-exchange] POST", tokenUrl, "redirect_uri:", redirectUri);

  let res: Response;
  try {
    res = await fetch(tokenUrl, {
      method: "POST",
      body,
    });
  } catch (fetchErr) {
    console.error("[ig-token-exchange] Network error:", fetchErr);
    throw new Error(`Instagram token exchange network error: ${(fetchErr as Error).message}`);
  }

  const text = await res.text();
  const data = parseInstagramResponse(
    text,
    res.ok,
    res.status,
    "Instagram token exchange",
  );
  const tokenResponse = z.object({
    access_token: z.string().min(1),
    user_id: z.union([z.string(), z.number()]),
  }).parse(data);
  const userIdMatch = text.match(/"user_id"\s*:\s*(?:"([^"]+)"|(\d+))/);
  const userId = userIdMatch?.[1] ?? userIdMatch?.[2] ?? String(tokenResponse.user_id);

  return { access_token: tokenResponse.access_token, user_id: userId };
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const secrets = [
    env.INSTAGRAM_CLIENT_SECRET,
    ...(env.META_APP_SECRET && env.META_APP_SECRET !== env.INSTAGRAM_CLIENT_SECRET
      ? [env.META_APP_SECRET]
      : []),
  ];

  let lastError: Error | null = null;

  for (const secret of secrets) {
    const params = new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: secret,
      access_token: shortLivedToken,
    });

    // 1. Try POST with form-urlencoded body (Meta requires POST for token exchanges in newer API releases)
    try {
      const postUrl = `${INSTAGRAM_GRAPH_BASE}/access_token?${params.toString()}`;
      const res = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const text = await res.text();
      if (res.ok) {
        const data = parseInstagramResponse(
          text,
          true,
          res.status,
          "Long-lived token exchange",
        );
        return z
          .object({
            access_token: z.string().min(1),
            expires_in: z.number().int().positive(),
          })
          .parse(data);
      }

      console.warn(`[ig-long-token] POST exchange failed (${res.status}):`, text);
      try {
        parseInstagramResponse(text, false, res.status, "Long-lived token exchange");
      } catch (err) {
        lastError = err as Error;
      }
    } catch (fetchErr) {
      console.error("[ig-long-token] POST network error:", fetchErr);
      lastError = new Error(
        `Long-lived token exchange network error: ${(fetchErr as Error).message}`,
      );
    }

    // 2. Try GET with query parameters (legacy fallback)
    try {
      const getUrl = `${INSTAGRAM_GRAPH_BASE}/access_token?${params.toString()}`;
      const res = await fetch(getUrl);
      const text = await res.text();
      if (res.ok) {
        const data = parseInstagramResponse(
          text,
          true,
          res.status,
          "Long-lived token exchange",
        );
        return z
          .object({
            access_token: z.string().min(1),
            expires_in: z.number().int().positive(),
          })
          .parse(data);
      }

      console.warn(`[ig-long-token] GET exchange failed (${res.status}):`, text);
      try {
        parseInstagramResponse(text, false, res.status, "Long-lived token exchange");
      } catch (err) {
        lastError = err as Error;
      }
    } catch (fetchErr) {
      console.error("[ig-long-token] GET network error:", fetchErr);
      lastError = new Error(
        `Long-lived token exchange network error: ${(fetchErr as Error).message}`,
      );
    }
  }

  throw (
    lastError ??
    new Error("Long-lived token exchange failed with all attempted methods and secrets.")
  );
}

export async function refreshLongLivedToken(
  token: string,
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: token,
  });

  let res: Response;
  let text = "";
  try {
    // 1. Try GET first (standard documented method for refresh)
    res = await fetch(`${INSTAGRAM_GRAPH_BASE}/refresh_access_token?${params.toString()}`);
    text = await res.text();

    // If GET fails with unsupported method, fallback to POST
    if (!res.ok && text.toLowerCase().includes("unsupported request - method type")) {
      console.warn("[ig-refresh-token] GET refresh rejected with method error, trying POST...");
      res = await fetch(`${INSTAGRAM_GRAPH_BASE}/refresh_access_token?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      text = await res.text();
    }
  } catch (fetchErr) {
    console.error("[ig-refresh-token] Network error:", fetchErr);
    throw new Error(`Token refresh network error: ${(fetchErr as Error).message}`);
  }

  const data = parseInstagramResponse(text, res.ok, res.status, "Token refresh");
  return z
    .object({
      access_token: z.string().min(1),
      expires_in: z.number().int().positive(),
    })
    .parse(data);
}

function parseInstagramResponse(
  body: string,
  ok: boolean,
  status: number,
  operation: string,
): unknown {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`${operation} returned invalid JSON (HTTP ${status}).`);
  }

  if (!ok) {
    const error = z.object({
      error: z.object({ message: z.string().optional() }).optional(),
    }).safeParse(parsed);
    const message = error.success ? error.data.error?.message : undefined;
    throw new Error(`${operation} failed (HTTP ${status})${message ? `: ${message}` : "."}`);
  }

  return parsed;
}

export async function subscribeInstagramWebhooks(
  instagramAccountId: string,
  accessToken: string,
): Promise<void> {
  const fields = ["messages", "messaging_postbacks"];
  const params = new URLSearchParams({ subscribed_fields: fields.join(",") });
  const urls = [
    `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(instagramAccountId)}/subscribed_apps?${params.toString()}`,
    `${INSTAGRAM_GRAPH_BASE}/${encodeURIComponent(instagramAccountId)}/subscribed_apps?${params.toString()}`,
  ];

  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      let response: { success?: boolean; error?: { message?: string } };
      try {
        response = (await res.json()) as typeof response;
      } catch {
        continue;
      }

      if (res.ok && response.success === true) {
        return;
      }

      const message = response.error?.message;
      lastError = new Error(
        `Instagram webhook subscription failed${message ? `: ${message}` : ` (HTTP ${res.status})`}`,
      );
    } catch (err) {
      lastError = err as Error;
    }
  }

  if (lastError) throw lastError;
}

export async function fetchIgUserProfile(
  userId: string,
  accessToken: string,
): Promise<{ name?: string; username?: string; profile_pic?: string }> {
  const params = new URLSearchParams({
    fields: "name,username,profile_picture_url",
    access_token: accessToken,
  });

  const res = await fetch(
    `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(userId)}?${params}`,
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IG user profile fetch failed for ${userId}: ${res.status} ${text}`);
  }

  const profile = z.object({
    name: z.string().optional(),
    username: z.string().optional(),
    profile_picture_url: z.string().optional(),
  }).parse(await res.json());

  return {
    name: profile.name,
    username: profile.username,
    profile_pic: profile.profile_picture_url,
  };
}

export async function getInstagramProfile(
  token: string,
  userId?: string,
): Promise<{
  id: string;
  username: string;
  account_type?: string;
  profile_picture_url?: string;
}> {
  // Use official Instagram User Graph fields (id, username, account_type, profile_picture_url)
  const fields = "id,username,account_type,profile_picture_url";
  const params = new URLSearchParams({
    fields,
    access_token: token,
  });

  const urlsToTry: string[] = [
    // 1. Unversioned /me (official Instagram Login endpoint)
    `${INSTAGRAM_GRAPH_BASE}/me?${params.toString()}`,
    // 2. Versioned /me (current active Meta Graph API version)
    `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/me?${params.toString()}`,
  ];

  if (userId) {
    // 3. Direct user node unversioned
    urlsToTry.push(`${INSTAGRAM_GRAPH_BASE}/${encodeURIComponent(userId)}?${params.toString()}`);
    // 4. Direct user node versioned
    urlsToTry.push(
      `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(userId)}?${params.toString()}`,
    );
  }

  let lastError: Error | null = null;

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) {
        console.warn(`[ig-profile] Profile fetch failed on ${new URL(url).pathname} (${res.status}):`, text);
        lastError = new Error(`Instagram profile fetch failed: ${res.status} ${text}`);
        continue;
      }

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        lastError = new Error(`Instagram profile returned invalid JSON (HTTP ${res.status}).`);
        continue;
      }

      const parsed = z
        .object({
          id: z.union([z.string(), z.number()]).optional(),
          user_id: z.union([z.string(), z.number()]).optional(),
          username: z.string().min(1).optional(),
          account_type: z.string().optional(),
          profile_picture_url: z.string().optional(),
        })
        .safeParse(json);

      if (!parsed.success) {
        lastError = new Error(`Instagram profile response validation failed: ${parsed.error.message}`);
        continue;
      }

      const data = parsed.data;
      const profileId = String(data.id ?? data.user_id ?? userId ?? "");
      if (!profileId) {
        lastError = new Error("Instagram profile missing id");
        continue;
      }

      return {
        id: profileId,
        username: data.username ?? (profileId ? `ig_${profileId.slice(-6)}` : "unknown"),
        account_type: data.account_type,
        profile_picture_url: data.profile_picture_url,
      };
    } catch (fetchErr) {
      lastError = fetchErr as Error;
    }
  }

  throw lastError ?? new Error("Instagram profile fetch failed across all attempted endpoints.");
}

export async function checkIsFollower(
  targetUserId: string,
  accessToken: string,
  maxPages = 20,
): Promise<boolean> {
  let url: string | null =
    `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/me/followers?access_token=${encodeURIComponent(accessToken)}&limit=25`;

  for (let page = 0; page < maxPages && url; page++) {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[ig:followers] API returned ${res.status}, defaulting to false`);
      return false;
    }

    const body = (await res.json()) as {
      data: Array<{ id: string; username?: string }>;
      paging?: { next?: string };
    };

    if (body.data.some((u) => u.id === targetUserId)) {
      return true;
    }

    url = body.paging?.next ?? null;
  }

  return false;
}
