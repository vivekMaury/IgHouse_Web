import { env } from "@/lib/env";
import { decryptToken, encryptToken } from "@/lib/crypto/token";
import { z } from "zod/v4";

const INSTAGRAM_AUTH_BASE = "https://www.instagram.com/oauth/authorize";
const INSTAGRAM_OAUTH_BASE = "https://api.instagram.com";
const INSTAGRAM_GRAPH_BASE = "https://graph.instagram.com";
const FACEBOOK_GRAPH_BASE = "https://graph.facebook.com";
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
  const cleanCode = code.replace(/#_.*$/, "").trim();
  const cleanRedirectUri = redirectUri.replace(/#_.*$/, "").trim();
  const tokenUrl = `${INSTAGRAM_OAUTH_BASE}/oauth/access_token`;
  const body = new FormData();
  body.set("client_id", env.INSTAGRAM_APP_ID);
  body.set("client_secret", env.INSTAGRAM_CLIENT_SECRET);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", cleanRedirectUri);
  body.set("code", cleanCode);

  console.log("[ig-token-exchange] POST", tokenUrl, "redirect_uri:", cleanRedirectUri);

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
  const cleanToken = tokenResponse.access_token.replace(/#_.*$/, "").trim();

  return { access_token: cleanToken, user_id: userId };
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const cleanToken = shortLivedToken.replace(/#_.*$/, "").trim();
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
      access_token: cleanToken,
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
        const parsed = z
          .object({
            access_token: z.string().min(1),
            expires_in: z.number().int().positive(),
          })
          .parse(data);
        return {
          access_token: parsed.access_token.replace(/#_.*$/, "").trim(),
          expires_in: parsed.expires_in,
        };
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

    // 2. Try GET with query parameters (primary Meta documented method)
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
        const parsed = z
          .object({
            access_token: z.string().min(1),
            expires_in: z.number().int().positive(),
          })
          .parse(data);
        return {
          access_token: parsed.access_token.replace(/#_.*$/, "").trim(),
          expires_in: parsed.expires_in,
        };
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

    // 3. Try versioned GET
    try {
      const getVersionedUrl = `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/access_token?${params.toString()}`;
      const res = await fetch(getVersionedUrl);
      const text = await res.text();
      if (res.ok) {
        const data = parseInstagramResponse(
          text,
          true,
          res.status,
          "Long-lived token exchange",
        );
        const parsed = z
          .object({
            access_token: z.string().min(1),
            expires_in: z.number().int().positive(),
          })
          .parse(data);
        return {
          access_token: parsed.access_token.replace(/#_.*$/, "").trim(),
          expires_in: parsed.expires_in,
        };
      }

      console.warn(`[ig-long-token] GET ${INSTAGRAM_GRAPH_VERSION} exchange failed (${res.status}):`, text);
      try {
        parseInstagramResponse(text, false, res.status, "Long-lived token exchange");
      } catch (err) {
        lastError = err as Error;
      }
    } catch (fetchErr) {
      console.error("[ig-long-token] GET versioned network error:", fetchErr);
      lastError = new Error(
        `Long-lived token exchange network error: ${(fetchErr as Error).message}`,
      );
    }

    // 4. Try Facebook Graph API fb_exchange_token fallback
    try {
      const appId = env.META_APP_ID || env.INSTAGRAM_APP_ID;
      const fbParams = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: secret,
        fb_exchange_token: cleanToken,
      });
      const fbUrl = `${FACEBOOK_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/oauth/access_token?${fbParams.toString()}`;
      const res = await fetch(fbUrl);
      const text = await res.text();
      if (res.ok) {
        const data = parseInstagramResponse(
          text,
          true,
          res.status,
          "Long-lived token exchange",
        );
        const parsed = z
          .object({
            access_token: z.string().min(1),
            expires_in: z.number().int().positive(),
          })
          .parse(data);
        return {
          access_token: parsed.access_token.replace(/#_.*$/, "").trim(),
          expires_in: parsed.expires_in,
        };
      }

      console.warn(`[ig-long-token] FB oauth/access_token exchange failed (${res.status}):`, text);
      try {
        parseInstagramResponse(text, false, res.status, "Long-lived token exchange");
      } catch (err) {
        lastError = err as Error;
      }
    } catch (fetchErr) {
      console.error("[ig-long-token] FB exchange network error:", fetchErr);
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
  const cleanToken = accessToken.replace(/#_.*$/, "").trim();
  const cleanId = instagramAccountId.replace(/#_.*$/, "").trim();
  const fields = ["messages", "messaging_postbacks"];
  const params = new URLSearchParams({
    subscribed_fields: fields.join(","),
    access_token: cleanToken,
  });

  const urls = [
    // 1. Instagram Graph API with version
    `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(cleanId)}/subscribed_apps?${params.toString()}`,
    // 2. Instagram Graph API unversioned
    `${INSTAGRAM_GRAPH_BASE}/${encodeURIComponent(cleanId)}/subscribed_apps?${params.toString()}`,
    // 3. Instagram Graph API /me/subscribed_apps
    `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/me/subscribed_apps?${params.toString()}`,
    // 4. Instagram Graph API unversioned /me/subscribed_apps
    `${INSTAGRAM_GRAPH_BASE}/me/subscribed_apps?${params.toString()}`,
    // 5. Facebook Graph API (standard endpoint for subscribed_apps)
    `https://graph.facebook.com/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(cleanId)}/subscribed_apps?${params.toString()}`,
  ];

  let lastError: Error | null = null;
  for (const url of urls) {
    // Attempt A: Standard query param + header (Meta compatibility)
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      let response: { success?: boolean; error?: { message?: string } };
      try {
        response = (await res.json()) as typeof response;
      } catch {
        continue;
      }

      if (res.ok && response.success === true) {
        console.log("[ig-webhook-sub] Successfully subscribed on:", new URL(url).pathname);
        return;
      }

      const message = response.error?.message;
      console.warn(`[ig-webhook-sub] Attempt A on ${new URL(url).pathname} failed (${res.status}): ${message ?? "unknown"}`);
      lastError = new Error(
        `Instagram webhook subscription failed${message ? `: ${message}` : ` (HTTP ${res.status})`}`,
      );
    } catch (err) {
      lastError = err as Error;
    }

    // Attempt B: Clean query-only (NO Authorization header, prevents "Cannot parse access token" conflict)
    try {
      const res = await fetch(url, {
        method: "POST",
      });

      let response: { success?: boolean; error?: { message?: string } };
      try {
        response = (await res.json()) as typeof response;
      } catch {
        continue;
      }

      if (res.ok && response.success === true) {
        console.log("[ig-webhook-sub] Successfully subscribed on:", new URL(url).pathname, "(query-only)");
        return;
      }

      const message = response.error?.message;
      console.warn(`[ig-webhook-sub] Attempt B on ${new URL(url).pathname} failed (${res.status}): ${message ?? "unknown"}`);
      if (message) {
        lastError = new Error(`Instagram webhook subscription failed: ${message}`);
      }
    } catch (err) {
      lastError = err as Error;
    }

    // Attempt C: Header-only (NO access_token in URL query or body)
    try {
      const baseUrl = url.split("?")[0]!;
      const formBody = new URLSearchParams({ subscribed_fields: fields.join(",") });
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      });

      let response: { success?: boolean; error?: { message?: string } };
      try {
        response = (await res.json()) as typeof response;
      } catch {
        continue;
      }

      if (res.ok && response.success === true) {
        console.log("[ig-webhook-sub] Successfully subscribed on:", baseUrl, "(header-only)");
        return;
      }

      const message = response.error?.message;
      console.warn(`[ig-webhook-sub] Attempt C on ${baseUrl} failed (${res.status}): ${message ?? "unknown"}`);
      if (message) {
        lastError = new Error(`Instagram webhook subscription failed: ${message}`);
      }
    } catch (err) {
      lastError = err as Error;
    }
  }

  if (lastError) throw lastError;
}

export async function fetchIgUserProfile(
  userId: string,
  accessToken: string,
): Promise<{ name?: string; username?: string; profile_pic?: string; is_follower?: boolean }> {
  // On an IGSID (Instagram Scoped ID), the profile picture field is profile_pic (NOT profile_picture_url)
  const fieldSets = [
    "name,username,profile_pic,is_user_follow_business",
    "name,username,profile_pic",
    "username,profile_pic",
    "name,username",
    "username",
  ];

  let lastError: Error | null = null;

  for (const fields of fieldSets) {
    const urls = [
      `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(userId)}?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`,
      `${FACEBOOK_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(userId)}?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`,
      `${INSTAGRAM_GRAPH_BASE}/${encodeURIComponent(userId)}?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          lastError = new Error(`IG user profile fetch failed for ${userId}: ${res.status} ${text}`);
          continue;
        }

        const json = (await res.json()) as {
          name?: string;
          username?: string;
          profile_pic?: string;
          profile_picture_url?: string;
          is_user_follow_business?: boolean | string | number;
        };

        const isFollower =
          typeof json.is_user_follow_business === "boolean"
            ? json.is_user_follow_business
            : json.is_user_follow_business === "true" || (json.is_user_follow_business as unknown) === 1
              ? true
              : json.is_user_follow_business === "false" || (json.is_user_follow_business as unknown) === 0
                ? false
                : undefined;

        console.log(`[ig:user-profile] Profile for sender ${userId}: username=${json.username} name=${json.name} isFollower=${isFollower}`);

        return {
          name: json.name,
          username: json.username,
          profile_pic: json.profile_pic ?? json.profile_picture_url,
          is_follower: isFollower,
        };
      } catch (err) {
        lastError = err as Error;
      }
    }
  }

  throw lastError ?? new Error(`IG user profile fetch failed for ${userId}`);
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
  const cleanToken = token.replace(/#_.*$/, "").trim();
  const cleanUserId = userId ? userId.replace(/#_.*$/, "").trim() : undefined;

  // Layered field sets from richest to minimal fallback to prevent 400 errors
  const fieldSets = [
    "id,username,account_type,profile_picture_url",
    "id,username,profile_picture_url",
    "id,user_id,username,account_type,profile_picture_url",
    "user_id,username,account_type",
    "id,username,account_type",
    "user_id,username",
    "id,username",
    "username",
  ];

  let lastError: Error | null = null;

  for (const fields of fieldSets) {
    const params = new URLSearchParams({
      fields,
      access_token: cleanToken,
    });

    const urlsToTry: string[] = [
      // 1. Unversioned /me (official Instagram Login endpoint)
      `${INSTAGRAM_GRAPH_BASE}/me?${params.toString()}`,
      // 2. Versioned /me
      `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/me?${params.toString()}`,
    ];

    if (cleanUserId) {
      // 3. Direct user node unversioned
      urlsToTry.push(`${INSTAGRAM_GRAPH_BASE}/${encodeURIComponent(cleanUserId)}?${params.toString()}`);
      // 4. Direct user node versioned
      urlsToTry.push(
        `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(cleanUserId)}?${params.toString()}`,
      );
      // 5. Facebook Graph direct user node
      urlsToTry.push(
        `${FACEBOOK_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(cleanUserId)}?${params.toString()}`,
      );
    }

    for (const url of urlsToTry) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        if (!res.ok) {
          console.warn(`[ig-profile] GET ${new URL(url).pathname} failed (${res.status}): ${text}`);
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

        // Unwrap { data: [...] } or { data: { ... } } if present
        let target = json as Record<string, unknown>;
        if (target.data) {
          if (Array.isArray(target.data) && target.data.length > 0) {
            target = target.data[0] as Record<string, unknown>;
          } else if (typeof target.data === "object" && target.data !== null) {
            target = target.data as Record<string, unknown>;
          }
        }

        const profileId = String(target.user_id ?? target.id ?? cleanUserId ?? "").trim();
        const rawUsername = typeof target.username === "string" ? target.username.trim() : "";
        const accountType = typeof target.account_type === "string" ? target.account_type : undefined;
        const pic = typeof target.profile_picture_url === "string"
          ? target.profile_picture_url
          : typeof target.profile_pic === "string"
            ? target.profile_pic
            : undefined;

        if (profileId || rawUsername) {
          console.log(`[ig-profile] Successfully fetched profile: username=${rawUsername} id=${profileId} pic=${pic ? "yes" : "no"}`);
          return {
            id: profileId || String(cleanUserId ?? ""),
            username: rawUsername || (profileId ? `ig_${profileId.slice(-6)}` : "unknown"),
            account_type: accountType,
            profile_picture_url: pic,
          };
        }
      } catch (fetchErr) {
        lastError = fetchErr as Error;
      }
    }
  }

  throw lastError ?? new Error("Instagram profile fetch failed across all attempted endpoints.");
}

export async function checkIsFollower(
  targetUserId: string,
  accessToken: string,
  _maxPages?: number,
): Promise<boolean> {
  const urls = [
    `${INSTAGRAM_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(targetUserId)}?fields=is_user_follow_business,is_business_follow_user&access_token=${encodeURIComponent(accessToken)}`,
    `${FACEBOOK_GRAPH_BASE}/${INSTAGRAM_GRAPH_VERSION}/${encodeURIComponent(targetUserId)}?fields=is_user_follow_business,is_business_follow_user&access_token=${encodeURIComponent(accessToken)}`,
    `${INSTAGRAM_GRAPH_BASE}/${encodeURIComponent(targetUserId)}?fields=is_user_follow_business&access_token=${encodeURIComponent(accessToken)}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[ig:followers] ${new URL(url).pathname} returned ${res.status}: ${errText}`);
        continue;
      }

      const body = (await res.json()) as {
        is_user_follow_business?: boolean | string | number;
      };

      console.log(`[ig:followers] Result for sender ${targetUserId}:`, body);

      if (typeof body.is_user_follow_business === "boolean") {
        return body.is_user_follow_business;
      }
      if (body.is_user_follow_business === "true" || (body.is_user_follow_business as unknown) === 1) {
        return true;
      }
      if (body.is_user_follow_business === "false" || (body.is_user_follow_business as unknown) === 0) {
        return false;
      }
    } catch (err) {
      console.warn(`[ig:followers] Fetch error for ${targetUserId}:`, (err as Error).message);
    }
  }

  return false;
}
