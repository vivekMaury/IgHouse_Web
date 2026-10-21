import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInstagramAuthUrl } from "@/lib/meta/instagram";
import { randomBytes } from "node:crypto";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: Request) {
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
      return NextResponse.redirect(`${origin}/login`);
    }

    const { data: members } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1);

    const member = members?.[0] as { workspace_id: string } | undefined;
    if (!member) {
      return NextResponse.json({ error: "No workspace found. Please log out and sign up again." }, { status: 400 });
    }

    // Validate required env vars before attempting OAuth
    const igAppId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!igAppId || !appSecret) {
      console.error("Instagram connect: INSTAGRAM_APP_ID or META_APP_SECRET not configured");
      return NextResponse.json(
        { error: "Instagram integration not configured. INSTAGRAM_APP_ID and META_APP_SECRET must be set in environment variables." },
        { status: 500 },
      );
    }

    const state = randomBytes(32).toString("hex");

    const { origin } = new URL(request.url);
    const redirectUri = `${origin}/api/instagram/callback`;

    const cookieValue = JSON.stringify({
      state,
      workspaceId: member.workspace_id,
    });

    const authUrl = getInstagramAuthUrl(redirectUri, state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("ig_oauth_state", cookieValue, {
      httpOnly: true,
      secure: true,
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
