import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code?.startsWith("del_")) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  return NextResponse.json({
    confirmation_code: code,
    status: "completed",
    message: "All user data associated with this Instagram account has been deleted.",
  });
}
