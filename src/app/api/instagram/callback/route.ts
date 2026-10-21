import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getInstagramProfile,
} from "@/lib/meta/instagram";
import { encryptToken } from "@/lib/crypto/token";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");

  const settingsUrl = `${origin}/dashboard/settings`;

  if (error) {
    console.error("[ig-callback] OAuth denied:", error, errorReason);
    return NextResponse.redirect(`${settingsUrl}?error=instagram_auth_denied`);
  }

  if (!code || !state) {
    console.error("[ig-callback] Missing code or state params");
    return NextResponse.redirect(`${settingsUrl}?error=missing_params`);
  }

  // Step 1: Read OAuth state cookie
  let stateCookieValue: string | undefined;
  try {
    const cookieStore = await cookies();
    stateCookieValue = cookieStore.get("ig_oauth_state")?.value;
  } catch (err) {
    console.error("[ig-callback] Failed to read cookies:", err);
  }

  if (!stateCookieValue) {
    console.error("[ig-callback] ig_oauth_state cookie not found");
    return NextResponse.redirect(`${settingsUrl}?error=missing_state_cookie`);
  }

  let storedState: { state: string; workspaceId: string };
  try {
    storedState = JSON.parse(stateCookieValue) as { state: string; workspaceId: string };
  } catch {
    console.error("[ig-callback] Failed to parse state cookie:", stateCookieValue);
    return NextResponse.redirect(`${settingsUrl}?error=invalid_state`);
  }

  if (state !== storedState.state) {
    console.error("[ig-callback] State mismatch:", { expected: storedState.state, got: state });
    return NextResponse.redirect(`${settingsUrl}?error=state_mismatch`);
  }

  // Step 2: Verify the user is still logged in
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error("[ig-callback] Missing Supabase env vars");
    return NextResponse.redirect(`${settingsUrl}?error=server_config`);
  }

  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only in route handler during redirect
        },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch (err) {
    console.error("[ig-callback] Auth check failed:", err);
  }

  if (!userId) {
    console.error("[ig-callback] User not authenticated");
    return NextResponse.redirect(`${origin}/login`);
  }

  // Step 3: Exchange code for tokens
  let shortToken: string;
  let igUserId: string;
  try {
    const redirectUri = `${origin}/api/instagram/callback`;
    const result = await exchangeCodeForToken(code, redirectUri);
    shortToken = result.access_token;
    igUserId = result.user_id;
    console.log("[ig-callback] Short token obtained for user:", igUserId);
  } catch (err) {
    console.error("[ig-callback] Token exchange failed:", (err as Error).message);
    return NextResponse.redirect(`${settingsUrl}?error=token_exchange_failed`);
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
    return NextResponse.redirect(`${settingsUrl}?error=token_exchange_failed`);
  }

  // Step 4: Get Instagram profile
  let username = "unknown";
  let avatarUrl: string | null = null;
  try {
    const profile = await getInstagramProfile(longToken);
    username = profile.username;
    avatarUrl = profile.profile_picture_url ?? null;
    console.log("[ig-callback] Profile fetched:", username);
  } catch (err) {
    console.error("[ig-callback] Profile fetch failed (continuing):", (err as Error).message);
  }

  // Step 5: Encrypt token
  let encryptedHex: string;
  let ivHex: string;
  try {
    const { ciphertext, iv } = encryptToken(longToken);
    encryptedHex = ciphertext.toString("hex");
    ivHex = iv.toString("hex");
  } catch (err) {
    console.error("[ig-callback] Encryption failed:", (err as Error).message);
    return NextResponse.redirect(`${settingsUrl}?error=encryption_failed`);
  }

  // Step 6: Save to DB using service role (bypasses RLS)
  try {
    const admin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error: upsertError } = await admin.from("connected_accounts").upsert(
      {
        workspace_id: storedState.workspaceId,
        platform: "instagram",
        platform_account_id: igUserId,
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
      { onConflict: "workspace_id,platform,platform_account_id" }
    );

    if (upsertError) {
      console.error("[ig-callback] DB upsert error:", upsertError);
      return NextResponse.redirect(`${settingsUrl}?error=db_save_failed`);
    }

    console.log("[ig-callback] Account saved successfully for @" + username);

    // Audit log (non-blocking)
    void admin.from("audit_logs").insert({
      workspace_id: storedState.workspaceId,
      actor_id: userId,
      action: "account.connected",
      entity_type: "connected_account",
      entity_id: igUserId,
      metadata: { platform: "instagram", username },
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    } as Record<string, unknown>);

  } catch (err) {
    console.error("[ig-callback] DB operation failed:", (err as Error).message);
    return NextResponse.redirect(`${settingsUrl}?error=db_save_failed`);
  }

  // Step 7: Redirect to dashboard with success
  const response = NextResponse.redirect(`${settingsUrl}?success=instagram_connected`);
  response.cookies.delete("ig_oauth_state");
  return response;
}
