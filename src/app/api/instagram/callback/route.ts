import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getInstagramRedirectUri,
  getInstagramProfile,
  subscribeInstagramWebhooks,
  checkFacebookPageLinked,
} from "@/lib/meta/instagram";
import { encryptToken } from "@/lib/crypto/token";
import { inngest } from "@/lib/inngest/client";
import { randomBytes } from "node:crypto";

type OAuthState = {
  state: string;
  purpose?: "login" | "connect";
  workspaceId?: string;
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");

  const settingsUrl = `${origin}/dashboard/settings`;
  const loginUrl = `${origin}/login`;

  // ── Parse state cookie ──
  let stateCookieValue: string | undefined;
  try {
    const cookieStore = await cookies();
    stateCookieValue = cookieStore.get("ig_oauth_state")?.value;
  } catch (err) {
    console.error("[ig-callback] Failed to read cookies:", err);
  }

  let storedState: OAuthState | null = null;
  if (stateCookieValue) {
    try {
      storedState = JSON.parse(stateCookieValue) as OAuthState;
    } catch {
      console.error("[ig-callback] Failed to parse state cookie");
    }
  }

  const isLoginFlow = storedState?.purpose === "login";
  const errorRedirect = isLoginFlow ? loginUrl : settingsUrl;

  if (error) {
    console.error("[ig-callback] OAuth denied:", error, errorReason);
    const errorCode =
      errorReason === "user_denied" || error === "access_denied"
        ? "permissions_denied"
        : "instagram_auth_denied";
    return NextResponse.redirect(`${errorRedirect}?error=${errorCode}`);
  }

  if (!code || !state) {
    console.error("[ig-callback] Missing code or state params");
    return NextResponse.redirect(`${errorRedirect}?error=missing_params`);
  }

  if (!storedState) {
    console.error("[ig-callback] ig_oauth_state cookie not found");
    return NextResponse.redirect(`${errorRedirect}?error=missing_state_cookie`);
  }

  if (state !== storedState.state) {
    console.error("[ig-callback] State mismatch");
    return NextResponse.redirect(`${errorRedirect}?error=state_mismatch`);
  }

  // ── Supabase clients ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error("[ig-callback] Missing Supabase env vars");
    return NextResponse.redirect(`${errorRedirect}?error=server_config`);
  }

  const admin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Exchange code for tokens ──
  let shortToken: string;
  let igUserId: string;
  try {
    const redirectUri = getInstagramRedirectUri();
    const result = await exchangeCodeForToken(code, redirectUri);
    shortToken = result.access_token;
    igUserId = result.user_id;
    console.log("[ig-callback] Short token obtained for user:", igUserId);
  } catch (err) {
    console.error("[ig-callback] Token exchange failed:", (err as Error).message);
    return NextResponse.redirect(`${errorRedirect}?error=token_exchange_failed`);
  }

  let longToken: string;
  let expiresIn: number;
  try {
    const result = await exchangeForLongLivedToken(shortToken);
    longToken = result.access_token;
    expiresIn = result.expires_in;
    console.log("[ig-callback] Long-lived token obtained, expires in:", expiresIn);
  } catch (err) {
    console.error("[ig-callback] Long-lived token exchange failed:", (err as Error).message);
    return NextResponse.redirect(`${errorRedirect}?error=token_exchange_failed`);
  }

  // ── Get Instagram profile & validate ──
  let igBusinessAccountId: string;
  let username = "unknown";
  let avatarUrl: string | null = null;
  try {
    const profile = await getInstagramProfile(longToken);
    igBusinessAccountId = profile.id;
    username = profile.username;
    avatarUrl = profile.profile_picture_url ?? null;
    console.log("[ig-callback] Profile:", username, "type:", profile.account_type, "id:", igBusinessAccountId);

    if (
      profile.account_type &&
      profile.account_type !== "BUSINESS" &&
      profile.account_type !== "MEDIA_CREATOR"
    ) {
      console.error("[ig-callback] Personal account detected:", profile.account_type);
      return NextResponse.redirect(`${errorRedirect}?error=personal_account`);
    }
  } catch (err) {
    console.error("[ig-callback] Profile fetch failed:", (err as Error).message);
    return NextResponse.redirect(`${errorRedirect}?error=profile_fetch_failed`);
  }

  if (!igBusinessAccountId) {
    console.error("[ig-callback] Missing IG business account ID");
    return NextResponse.redirect(`${errorRedirect}?error=missing_ig_business_id`);
  }

  // Check Facebook Page linkage (non-blocking)
  try {
    const hasPage = await checkFacebookPageLinked(igBusinessAccountId, longToken);
    if (!hasPage) {
      console.error("[ig-callback] No linked Facebook Page for:", username);
      return NextResponse.redirect(`${errorRedirect}?error=no_facebook_page`);
    }
  } catch (err) {
    console.warn("[ig-callback] Facebook Page check skipped:", (err as Error).message);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  LOGIN FLOW — find or create user, sign them in, connect account
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
  //  CONNECT FLOW — user already logged in, link to workspace
  // ═══════════════════════════════════════════════════════════════════
  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch (err) {
    console.error("[ig-callback] Auth check failed:", err);
  }

  if (!userId) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const workspaceId = storedState.workspaceId;
  if (!workspaceId) {
    console.error("[ig-callback] Missing workspaceId in state");
    return NextResponse.redirect(`${settingsUrl}?error=invalid_state`);
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
    redirectUrl: `${settingsUrl}?connected=true`,
    errorUrl: settingsUrl,
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

  // Look up existing connected account
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
    // Existing user — find them via workspace membership
    const { data: member } = await admin
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", existingAccount.workspace_id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (!member) {
      console.error("[ig-login] No owner found for workspace:", existingAccount.workspace_id);
      return NextResponse.redirect(`${loginUrl}?error=instagram_auth_denied`);
    }

    userId = member.user_id as string;
    workspaceId = existingAccount.workspace_id as string;
    console.log("[ig-login] Existing user found:", userId, "workspace:", workspaceId);
  } else {
    // New user — create account via Supabase admin
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
      return NextResponse.redirect(`${loginUrl}?error=instagram_auth_denied`);
    }

    userId = newUser.user.id;
    console.log("[ig-login] New user created:", userId);

    // handle_new_user trigger auto-creates workspace + member
    // Fetch the workspace it created
    const { data: member } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!member) {
      console.error("[ig-login] Workspace not auto-created for user:", userId);
      return NextResponse.redirect(`${loginUrl}?error=instagram_auth_denied`);
    }

    workspaceId = member.workspace_id as string;
  }

  // Generate a magic link to sign the user in
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: (await admin.auth.admin.getUserById(userId)).data.user?.email ?? "",
    options: { redirectTo: `${origin}/callback?next=/dashboard` },
  });

  if (linkError || !linkData.properties?.hashed_token) {
    console.error("[ig-login] Failed to generate magic link:", linkError);
    return NextResponse.redirect(`${loginUrl}?error=instagram_auth_denied`);
  }

  // Save/update the connected account for this workspace
  const saveResult = await saveAccountAndRedirect({
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

  return saveResult;
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
  // Encrypt token
  let encryptedHex: string;
  let ivHex: string;
  try {
    const { ciphertext, iv } = encryptToken(longToken);
    encryptedHex = ciphertext.toString("hex");
    ivHex = iv.toString("hex");
  } catch (err) {
    console.error("[ig-callback] Encryption failed:", (err as Error).message);
    return NextResponse.redirect(`${errorUrl}?error=encryption_failed`);
  }

  // Subscribe webhooks
  try {
    await subscribeInstagramWebhooks(igBusinessAccountId, longToken);
  } catch (err) {
    console.error("[ig-callback] Webhook subscription failed:", (err as Error).message);
    return NextResponse.redirect(`${errorUrl}?error=webhook_subscription_failed`);
  }

  // Save to DB
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
      return NextResponse.redirect(`${errorUrl}?error=db_save_failed`);
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
    return NextResponse.redirect(`${errorUrl}?error=db_save_failed`);
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete("ig_oauth_state");
  return response;
}
