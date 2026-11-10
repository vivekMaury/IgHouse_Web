import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  decodeInstagramOAuthState,
  getInstagramRedirectUri,
  getInstagramProfile,
  subscribeInstagramWebhooks,
} from "@/lib/meta/instagram";
import { encryptToken } from "@/lib/crypto/token";
import { inngest } from "@/lib/inngest/client";
import { randomBytes } from "node:crypto";

function clearStateCookie(response: NextResponse): NextResponse {
  response.cookies.set("ig_oauth_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

function errorRedirect(url: string, error: string): NextResponse {
  const redirectUrl = new URL(url);
  redirectUrl.searchParams.set("error", error);
  return clearStateCookie(NextResponse.redirect(redirectUrl));
}

function settingsRedirect(origin: string, error: string): NextResponse {
  return errorRedirect(`${origin}/dashboard/settings`, error);
}

function loginRedirect(origin: string, error: string): NextResponse {
  return errorRedirect(`${origin}/login`, error);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");
  const providerErrorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  // ── Read & immediately clear state cookie (prevents replay) ──
  const cookieStore = await cookies();
  const stateCookieValue = cookieStore.get("ig_oauth_state")?.value;

  let storedState: ReturnType<typeof decodeInstagramOAuthState> | null = null;
  let malformedStateCookie = false;
  if (stateCookieValue) {
    try {
      storedState = decodeInstagramOAuthState(stateCookieValue);
    } catch {
      malformedStateCookie = true;
      console.error("[ig-callback] Invalid or malformed state cookie");
    }
  }

  const isLoginFlow = storedState?.purpose === "login";
  const redirectForError = (errorCode: string) =>
    isLoginFlow
      ? loginRedirect(origin, errorCode)
      : settingsRedirect(origin, errorCode);

  if (!stateCookieValue) {
    console.error("[ig-callback] ig_oauth_state cookie not found");
    return redirectForError("missing_state_cookie");
  }
  if (malformedStateCookie || !storedState) {
    return redirectForError("invalid_state");
  }
  if (!state) {
    console.error("[ig-callback] Missing state query parameter");
    return redirectForError("missing_params");
  }
  if (state !== storedState.state) {
    console.error("[ig-callback] State mismatch");
    return redirectForError("state_mismatch");
  }

  // ── Handle OAuth errors from Meta only after validating the state ──
  if (error || errorReason || providerErrorCode || errorDescription) {
    console.error("[ig-callback] OAuth authorization failed:", error, errorReason);
    if (
      error === "access_denied" ||
      error === "permissions_denied" ||
      errorReason === "user_denied" ||
      errorReason === "permissions_denied" ||
      providerErrorCode === "200" ||
      errorDescription?.toLowerCase().includes("permission") ||
      errorDescription?.toLowerCase().includes("denied")
    ) {
      return redirectForError("permissions_denied");
    }
    return redirectForError("instagram_auth_denied");
  }

  if (!code) {
    console.error("[ig-callback] Missing authorization code");
    return redirectForError("missing_params");
  }

  // ── Supabase clients ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error("[ig-callback] Missing Supabase env vars");
    return redirectForError("server_config");
  }

  const admin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Instagram Login codes must be exchanged through Instagram's OAuth endpoint.
  let shortToken: string;
  let igUserId: string;
  try {
    const redirectUri = getInstagramRedirectUri();
    const result = await exchangeCodeForToken(code, redirectUri);
    shortToken = result.access_token;
    igUserId = result.user_id;
    console.log("[ig-callback] Short-lived token obtained for IG user:", igUserId);
  } catch (err) {
    console.error("[ig-callback] Token exchange failed:", (err as Error).message);
    return redirectForError("token_exchange_failed");
  }

  // Instagram Login uses ig_exchange_token for the 60-day token exchange.
  let longToken: string;
  let expiresIn: number;
  try {
    const result = await exchangeForLongLivedToken(shortToken);
    longToken = result.access_token;
    expiresIn = result.expires_in;
    console.log("[ig-callback] Long-lived token obtained, expires in:", expiresIn, "seconds");
  } catch (err) {
    console.warn(
      "[ig-callback] Long-lived token exchange failed, falling back to short-lived token:",
      (err as Error).message,
    );
    // Graceful fallback to short-lived token (valid for ~1 hour) so user connection doesn't break
    longToken = shortToken;
    expiresIn = 3600;
  }

  // ── Fetch Instagram profile & validate account type ──
  let igBusinessAccountId: string = igUserId;
  let username = `user_${igUserId.slice(-6)}`;
  let avatarUrl: string | null = null;
  try {
    const profile = await getInstagramProfile(longToken, igUserId);
    igBusinessAccountId = profile.id;
    username = profile.username;
    avatarUrl = profile.profile_picture_url ?? null;
    console.log("[ig-callback] Profile:", username, "type:", profile.account_type, "id:", igBusinessAccountId);

    if (
      profile.account_type &&
      !["BUSINESS", "MEDIA_CREATOR"].includes(profile.account_type.toUpperCase())
    ) {
      console.error("[ig-callback] Personal account detected:", profile.account_type);
      return redirectForError("personal_account");
    }
  } catch (err) {
    console.warn(
      "[ig-callback] Profile fetch failed, continuing with token IG user ID:",
      (err as Error).message,
    );
    if (!igBusinessAccountId) {
      return redirectForError("profile_fetch_failed");
    }
  }

  if (!igBusinessAccountId) {
    console.error("[ig-callback] Missing IG business account ID");
    return redirectForError("missing_ig_business_id");
  }

  // ═══════════════════════════════════════════════════════════════════
  //  LOGIN FLOW
  // ═══════════════════════════════════════════════════════════════════
  if (isLoginFlow) {
    return handleLoginFlow({
      request,
      origin,
      admin,
      supabaseUrl,
      igBusinessAccountId,
      username,
      avatarUrl,
      longToken,
      expiresIn,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CONNECT FLOW — resolve user session with fallback
  // ═══════════════════════════════════════════════════════════════════
  let userId: string | null = null;
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    if (sessionError) {
      console.error("[ig-callback] Supabase session lookup failed:", sessionError.message);
    }
    userId = user?.id ?? null;
  } catch (err) {
    console.error("[ig-callback] Supabase session lookup failed:", err);
  }

  const workspaceId = storedState.workspaceId;
  if (!workspaceId || !storedState.userId) {
    console.error("[ig-callback] Connect state missing workspace or initiating user");
    return settingsRedirect(origin, "invalid_state");
  }

  if (userId && userId !== storedState.userId) {
    console.error("[ig-callback] Authenticated user does not match OAuth initiator");
    return settingsRedirect(origin, "invalid_state");
  }

  if (!userId) {
    console.warn("[ig-callback] Session missing after Meta redirect; resolving signed OAuth user context");
    userId = storedState.userId;
  }

  const { data: membership, error: membershipError } = await admin
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    console.error("[ig-callback] Workspace membership validation failed:", membershipError.message);
    return settingsRedirect(origin, "workspace_access_failed");
  }
  if (!membership) {
    console.error("[ig-callback] OAuth user is not a member of the target workspace");
    return settingsRedirect(origin, "workspace_access_denied");
  }

  return saveAccountAndRedirect({
    request,
    admin,
    workspaceId,
    userId,
    igBusinessAccountId,
    username,
    avatarUrl,
    longToken,
    expiresIn,
    redirectUrl: `${origin}/dashboard/settings?connected=true`,
    errorUrl: `${origin}/dashboard/settings`,
  });
}

// ─────────────────────────────────────────────────────────────────────
//  Login flow: find existing user by IG account or create new one
// ─────────────────────────────────────────────────────────────────────
async function handleLoginFlow({
  request,
  origin,
  admin,
  supabaseUrl,
  igBusinessAccountId,
  username,
  avatarUrl,
  longToken,
  expiresIn,
}: {
  request: Request;
  origin: string;
  admin: SupabaseClient;
  supabaseUrl: string;
  igBusinessAccountId: string;
  username: string;
  avatarUrl: string | null;
  longToken: string;
  expiresIn: number;
}) {
  const loginUrl = `${origin}/login`;

  const { data: existingAccount } = await admin
    .from("connected_accounts")
    .select("workspace_id")
    .eq("platform", "instagram")
    .eq("platform_account_id", igBusinessAccountId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  let userId: string;
  let workspaceId: string;

  if (existingAccount) {
    const { data: member } = await admin
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", existingAccount.workspace_id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (!member) {
      console.error("[ig-login] No owner found for workspace:", existingAccount.workspace_id);
      return loginRedirect(origin, "instagram_auth_denied");
    }

    userId = member.user_id as string;
    workspaceId = existingAccount.workspace_id as string;
    console.log("[ig-login] Existing user found:", userId, "workspace:", workspaceId);
  } else {
    const syntheticEmail = `ig_${igBusinessAccountId}@instagram.iginbox.local`;
    const tempPassword = randomBytes(32).toString("hex");

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        instagram_username: username,
        avatar_url: avatarUrl,
        auth_provider: "instagram",
      },
    });

    if (createError || !newUser.user) {
      console.error("[ig-login] Failed to create user:", createError);
      return loginRedirect(origin, "instagram_auth_denied");
    }

    userId = newUser.user.id;
    console.log("[ig-login] New user created:", userId);

    const { data: member } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!member) {
      console.error("[ig-login] Workspace not auto-created for user:", userId);
      return loginRedirect(origin, "instagram_auth_denied");
    }

    workspaceId = member.workspace_id as string;
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: (await admin.auth.admin.getUserById(userId)).data.user?.email ?? "",
    options: { redirectTo: `${origin}/callback?next=/dashboard` },
  });

  if (linkError || !linkData.properties?.hashed_token) {
    console.error("[ig-login] Failed to generate magic link:", linkError);
    return loginRedirect(origin, "instagram_auth_denied");
  }

  return saveAccountAndRedirect({
    request,
    admin,
    workspaceId,
    userId,
    igBusinessAccountId,
    username,
    avatarUrl,
    longToken,
    expiresIn,
    redirectUrl: `${supabaseUrl}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(`${origin}/callback?next=/dashboard`)}`,
    errorUrl: loginUrl,
  });
}

// ─────────────────────────────────────────────────────────────────────
//  Shared: encrypt token, save account, subscribe webhooks, redirect
// ─────────────────────────────────────────────────────────────────────
async function saveAccountAndRedirect({
  request,
  admin,
  workspaceId,
  userId,
  igBusinessAccountId,
  username,
  avatarUrl,
  longToken,
  expiresIn,
  redirectUrl,
  errorUrl,
}: {
  request: Request;
  admin: SupabaseClient;
  workspaceId: string;
  userId: string;
  igBusinessAccountId: string;
  username: string;
  avatarUrl: string | null;
  longToken: string;
  expiresIn: number;
  redirectUrl: string;
  errorUrl: string;
}) {
  let encryptedHex: string;
  let ivHex: string;
  try {
    const { ciphertext, iv } = encryptToken(longToken);
    encryptedHex = ciphertext.toString("hex");
    ivHex = iv.toString("hex");
  } catch (err) {
    console.error("[ig-callback] Encryption failed:", (err as Error).message);
    return errorRedirect(errorUrl, "encryption_failed");
  }

  try {
    await subscribeInstagramWebhooks(igBusinessAccountId, longToken);
    console.log("[ig-callback] Webhooks subscribed for @" + username);
  } catch (err) {
    console.warn(
      "[ig-callback] Webhook subscription failed, proceeding with account save:",
      (err as Error).message,
    );
  }

  try {
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { data: upsertedRow, error: upsertError } = await admin.from("connected_accounts").upsert(
      {
        workspace_id: workspaceId,
        platform: "instagram",
        platform_account_id: igBusinessAccountId,
        username,
        avatar_url: avatarUrl,
        encrypted_access_token: `\\x${encryptedHex}`,
        token_iv: `\\x${ivHex}`,
        key_version: 1,
        token_expires_at: expiresAt,
        scopes: [
          "instagram_business_basic",
          "instagram_business_manage_messages",
          "instagram_business_manage_comments",
        ],
        is_active: true,
      } as Record<string, unknown>,
      { onConflict: "workspace_id,platform,platform_account_id" },
    ).select("id").single();

    if (upsertError || !upsertedRow) {
      console.error("[ig-callback] DB upsert error:", upsertError);
      return errorRedirect(errorUrl, "db_save_failed");
    }

    const connectedAccountId = (upsertedRow as { id: string }).id;
    console.log("[ig-callback] Account saved for @" + username);

    void inngest.send({
      name: "instagram/account.connected",
      data: { workspaceId, connectedAccountId, igUserId: igBusinessAccountId },
    }).catch((err) => {
      console.error("[ig-callback] Failed to dispatch sync:", err);
    });

    void admin.from("audit_logs").insert({
      workspace_id: workspaceId,
      actor_id: userId,
      action: "account.connected",
      entity_type: "connected_account",
      entity_id: igBusinessAccountId,
      metadata: { platform: "instagram", username },
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    } as Record<string, unknown>);
  } catch (err) {
    console.error("[ig-callback] DB operation failed:", (err as Error).message);
    return errorRedirect(errorUrl, "db_save_failed");
  }

  return clearStateCookie(NextResponse.redirect(redirectUrl));
}
