import { NextResponse } from "next/server";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  encodeInstagramOAuthState,
  getInstagramAuthUrl,
  getInstagramRedirectUri,
} from "@/lib/meta/instagram";
import { randomBytes } from "node:crypto";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: Request) {
  await connection();
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await checkRateLimit(`auth:${ip}`, "auth");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rl.remaining, rl.reset) },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const { origin } = new URL(request.url);
      return NextResponse.redirect(
        `${origin}/login?next=${encodeURIComponent("/api/instagram/connect")}`,
      );
    }

    const { data: members, error: memberError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1);

    if (memberError) {
      console.error("Instagram connect workspace lookup failed:", memberError.message);
      return NextResponse.json({ error: "Could not resolve your workspace." }, { status: 500 });
    }

    const member = members?.[0];
    if (!member) {
      return NextResponse.json({ error: "No workspace found. Please log out and sign up again." }, { status: 400 });
    }

    const state = randomBytes(32).toString("hex");

    const redirectUri = getInstagramRedirectUri();

    const cookieValue = encodeInstagramOAuthState({
      state,
      purpose: "connect",
      workspaceId: member.workspace_id,
      userId: user.id,
    });

    const authUrl = getInstagramAuthUrl(redirectUri, state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("ig_oauth_state", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Instagram connect error:", err);
    return NextResponse.json(
      { error: `Failed to initiate Instagram connection: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
