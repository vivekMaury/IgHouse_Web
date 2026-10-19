import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInstagramAuthUrl } from "@/lib/meta/instagram";
import { randomBytes } from "node:crypto";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);

  const member = members?.[0] as { workspace_id: string } | undefined;
  if (!member) {
    return NextResponse.json({ error: "No workspace found" }, { status: 400 });
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
}
