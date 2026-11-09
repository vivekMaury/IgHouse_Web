import { NextResponse } from "next/server";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getInstagramAuthUrl, getInstagramRedirectUri } from "@/lib/meta/instagram";

export async function GET() {
  await connection();

  const state = randomBytes(32).toString("hex");
  const redirectUri = getInstagramRedirectUri();

  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", JSON.stringify({ state, purpose: "login" }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const authUrl = getInstagramAuthUrl(redirectUri, state);
  return NextResponse.redirect(authUrl);
}
