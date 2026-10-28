import { env } from "@/lib/env";

const INSTAGRAM_AUTH_BASE = "https://www.instagram.com/oauth/authorize";
const INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_API_BASE = "https://graph.instagram.com";

const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
];

export function getInstagramAuthUrl(redirectUri: string, state: string): string {
  const igAppId = process.env.INSTAGRAM_APP_ID ?? env.INSTAGRAM_APP_ID;
  const params = new URLSearchParams({
    enable_fb_login: "0",
    force_authentication: "1",
    client_id: igAppId,
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
  const igAppId = process.env.INSTAGRAM_APP_ID ?? env.INSTAGRAM_APP_ID;
  const appSecret = process.env.META_APP_SECRET ?? env.META_APP_SECRET;
  const body = new URLSearchParams({
    client_id: igAppId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(INSTAGRAM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram token exchange failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string; user_id: number };
  return { access_token: data.access_token, user_id: String(data.user_id) };
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const appSecret = process.env.META_APP_SECRET ?? env.META_APP_SECRET;
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: appSecret,
    access_token: shortLivedToken,
  });

  const res = await fetch(`${GRAPH_API_BASE}/access_token?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Long-lived token exchange failed: ${res.status} ${text}`);
  }

  return (await res.json()) as { access_token: string; expires_in: number };
}

export async function refreshLongLivedToken(
  token: string
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: token,
  });

  const res = await fetch(`${GRAPH_API_BASE}/refresh_access_token?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }

  return (await res.json()) as { access_token: string; expires_in: number };
}

export async function getInstagramProfile(
  token: string
): Promise<{ id: string; username: string; profile_picture_url?: string }> {
  const params = new URLSearchParams({
    fields: "id,user_id,username,account_type,profile_picture_url",
    access_token: token,
  });

  const res = await fetch(`${GRAPH_API_BASE}/me?${params.toString()}`);

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
