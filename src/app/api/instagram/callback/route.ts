import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getInstagramProfile,
} from "@/lib/meta/instagram";
import { encryptToken } from "@/lib/crypto/token";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");

  if (error) {
    console.error("Instagram OAuth denied:", error, errorReason);
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=instagram_auth_denied`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=missing_params`
    );
  }

  // Read OAuth state cookie using Next.js API
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("ig_oauth_state");

  if (!stateCookie?.value) {
    console.error("Instagram callback: ig_oauth_state cookie missing");
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=missing_state`
    );
  }

  let storedState: { state: string; workspaceId: string };
  try {
    storedState = JSON.parse(stateCookie.value) as {
      state: string;
      workspaceId: string;
    };
  } catch {
    console.error("Instagram callback: failed to parse ig_oauth_state cookie");
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=invalid_state`
    );
  }

  if (state !== storedState.state) {
    console.error("Instagram callback: state mismatch");
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=state_mismatch`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const redirectUri = `${origin}/api/instagram/callback`;
    const { access_token: shortToken, user_id } = await exchangeCodeForToken(
      code,
      redirectUri
    );

    const { access_token: longToken, expires_in } =
      await exchangeForLongLivedToken(shortToken);

    const profile = await getInstagramProfile(longToken);

    const { ciphertext, iv } = encryptToken(longToken);

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase.from("connected_accounts").upsert(
      {
        workspace_id: storedState.workspaceId,
        platform: "instagram",
        platform_account_id: user_id,
        username: profile.username,
        avatar_url: profile.profile_picture_url ?? null,
        encrypted_access_token: `\\x${ciphertext.toString("hex")}`,
        token_iv: `\\x${iv.toString("hex")}`,
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
      console.error("Instagram callback: DB upsert failed:", upsertError);
      return NextResponse.redirect(
        `${origin}/dashboard/settings?error=instagram_connect_failed`
      );
    }

    await writeAuditLog({
      workspace_id: storedState.workspaceId,
      actor_id: user.id,
      action: "account.connected",
      entity_type: "connected_account",
      entity_id: user_id,
      metadata: { platform: "instagram", username: profile.username },
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    const response = NextResponse.redirect(
      `${origin}/dashboard/settings?success=instagram_connected`
    );
    response.cookies.delete("ig_oauth_state");
    return response;
  } catch (err) {
    console.error("Instagram OAuth error:", (err as Error).message);
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=instagram_connect_failed`
    );
  }
}
