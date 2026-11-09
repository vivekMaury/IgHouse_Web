import { NextResponse } from "next/server";
import { connection } from "next/server";
import { randomBytes } from "node:crypto";
import {
  encodeInstagramOAuthState,
  getInstagramAuthUrl,
  getInstagramRedirectUri,
} from "@/lib/meta/instagram";

export async function GET() {
  await connection();

  const state = randomBytes(32).toString("hex");
  const redirectUri = getInstagramRedirectUri();

  const response = NextResponse.redirect(getInstagramAuthUrl(redirectUri, state));
  response.cookies.set("ig_oauth_state", encodeInstagramOAuthState({ state, purpose: "login" }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
