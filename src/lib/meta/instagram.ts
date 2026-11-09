import { env } from "@/lib/env";

const INSTAGRAM_AUTH_BASE = "https://www.instagram.com/oauth/authorize";
const INSTAGRAM_API_BASE = "https://api.instagram.com";
const GRAPH_IG_BASE = "https://graph.instagram.com";
const GRAPH_API_VERSION = "v21.0";

const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
];

export function getInstagramRedirectUri(
  redirectUri = env.INSTAGRAM_REDIRECT_URI,
): string {
  if (!redirectUri) {
    throw new Error(
      "INSTAGRAM_REDIRECT_URI must be configured and match the Meta app OAuth redirect URI.",
    );
  }
  return redirectUri;
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
  redirectUri: string
): Promise<{ access_token: string; user_id: string }> {
  const tokenUrl = `${INSTAGRAM_API_BASE}/oauth/access_token`;
  const body = new URLSearchParams({
    client_id: env.INSTAGRAM_APP_ID,
    client_secret: env.INSTAGRAM_CLIENT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  console.log("[ig-token-exchange] POST", tokenUrl, "redirect_uri:", redirectUri);

  let res: Response;
  try {
    res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (fetchErr) {
    console.error("[ig-token-exchange] Network error:", fetchErr);
    throw new Error(`Instagram token exchange network error: ${(fetchErr as Error).message}`);
  }

  const text = await res.text();

  if (!res.ok) {
    console.error("Meta Token Exchange Error:", text);
    throw new Error(`Instagram token exchange failed (HTTP ${res.status}): ${text}`);
  }

  const data = JSON.parse(text) as { access_token: string; user_id?: number };
  // Parse user_id from raw text to avoid JavaScript number precision loss.
  const userIdMatch = text.match(/"user_id"\s*:\s*(\d+)/);
  const userId = userIdMatch?.[1] ?? String(data.user_id ?? "");

  return { access_token: data.access_token, user_id: userId };
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: env.META_APP_SECRET,
    access_token: shortLivedToken,
  });

  const tokenUrl = `${GRAPH_IG_BASE}/access_token?${params.toString()}`;

  let res: Response;
  try {
    res = await fetch(tokenUrl);
  } catch (fetchErr) {
    console.error("[ig-long-token] Network error:", fetchErr);
    throw new Error(`Long-lived token exchange network error: ${(fetchErr as Error).message}`);
  }

  const text = await res.text();

  if (!res.ok) {
    console.error("Meta Long-Lived Token Exchange Error:", text);
    throw new Error(`Long-lived token exchange failed (HTTP ${res.status}): ${text}`);
  }

  return JSON.parse(text) as { access_token: string; expires_in: number };
}

export async function refreshLongLivedToken(
  token: string
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: token,
  });

  const res = await fetch(`${GRAPH_IG_BASE}/refresh_access_token?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }

  return (await res.json()) as { access_token: string; expires_in: number };
}

export async function subscribeInstagramWebhooks(
  instagramAccountId: string,
  accessToken: string,
): Promise<void> {
  const fields = ["messages", "messaging_postbacks"];
  const params = new URLSearchParams({ subscribed_fields: fields.join(",") });
  const res = await fetch(
    `${GRAPH_IG_BASE}/${GRAPH_API_VERSION}/${encodeURIComponent(instagramAccountId)}/subscribed_apps?${params}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  let response: { success?: boolean; error?: { message?: string } };
  try {
    response = (await res.json()) as typeof response;
  } catch {
    throw new Error(`Instagram webhook subscription failed (HTTP ${res.status}).`);
  }

  if (!res.ok || response.success !== true) {
    const message = response.error?.message;
    throw new Error(
      `Instagram webhook subscription failed${message ? `: ${message}` : ` (HTTP ${res.status})`}`,
    );
  }
}

export async function fetchIgUserProfile(
  userId: string,
  accessToken: string,
): Promise<{ name?: string; username?: string; profile_pic?: string }> {
  const params = new URLSearchParams({
    fields: "name,username,profile_pic",
    access_token: accessToken,
  });

  const res = await fetch(
    `${GRAPH_IG_BASE}/${GRAPH_API_VERSION}/${encodeURIComponent(userId)}?${params}`,
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IG user profile fetch failed for ${userId}: ${res.status} ${text}`);
  }

  return (await res.json()) as { name?: string; username?: string; profile_pic?: string };
}

export async function getInstagramProfile(
  token: string
): Promise<{ id: string; username: string; profile_picture_url?: string }> {
  const params = new URLSearchParams({
    fields: "id,user_id,username,account_type,profile_picture_url",
    access_token: token,
  });

  const res = await fetch(`${GRAPH_IG_BASE}/me?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram profile fetch failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    id?: string;
    user_id?: string;
    username: string;
    account_type?: string;
    profile_picture_url?: string;
  };

  return {
    id: data.user_id ?? data.id ?? "",
    username: data.username,
    profile_picture_url: data.profile_picture_url,
  };
}

/**
 * Check if a specific user follows the authenticated IG account.
 * Paginates GET /me/followers (max ~500 entries) looking for the target user.
 */
export async function checkIsFollower(
  targetUserId: string,
  accessToken: string,
  maxPages = 20,
): Promise<boolean> {
  let url: string | null =
    `${GRAPH_IG_BASE}/me/followers?access_token=${encodeURIComponent(accessToken)}&limit=25`;

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
