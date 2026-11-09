import { NextResponse } from "next/server";
import { connection } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  await connection();

  const appId = env.META_APP_ID;
  const appSecret = env.META_APP_SECRET;
  const igAppId = env.INSTAGRAM_APP_ID;
  const igSecret = env.INSTAGRAM_CLIENT_SECRET;

  const envStatus = {
    META_APP_ID: appId ? `${appId.slice(0, 4)}...${appId.slice(-4)}` : "MISSING",
    META_APP_SECRET: appSecret ? `${appSecret.slice(0, 4)}...(${appSecret.length} chars)` : "MISSING",
    INSTAGRAM_APP_ID: igAppId ? `${igAppId.slice(0, 4)}...${igAppId.slice(-4)}` : "MISSING",
    INSTAGRAM_CLIENT_SECRET: igSecret ? `${igSecret.slice(0, 4)}...(${igSecret.length} chars)` : "MISSING",
    INSTAGRAM_REDIRECT_URI: env.INSTAGRAM_REDIRECT_URI ?? "NOT SET",
  };

  const tokenUrl = `https://graph.facebook.com/v26.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`;

  let metaResponse: Record<string, unknown>;
  try {
    const res = await fetch(tokenUrl);
    const text = await res.text();
    try {
      metaResponse = { status: res.status, body: JSON.parse(text) };
    } catch {
      metaResponse = { status: res.status, body: text };
    }
  } catch (err) {
    metaResponse = { error: (err as Error).message };
  }

  return NextResponse.json({
    env: envStatus,
    meta_graph_api: metaResponse,
    timestamp: new Date().toISOString(),
  });
}
