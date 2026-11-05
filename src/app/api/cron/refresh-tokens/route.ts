import { NextResponse } from "next/server";
import { refreshExpiringTokens } from "@/lib/meta/refresh-token";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await refreshExpiringTokens();

    return NextResponse.json({
      ok: true,
      summary: {
        total: results.length,
        refreshed: results.filter((r) => r.status === "refreshed").length,
        failed: results.filter((r) => r.status === "failed").length,
        deauthorized: results.filter((r) => r.status === "deauthorized").length,
      },
      results,
    });
  } catch (err) {
    console.error("[cron:refresh-tokens] Unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
