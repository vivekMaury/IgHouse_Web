import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";

const querySchema = z.object({
  filter: z.enum(["all", "unread", "bot_active", "bot_paused"]).default("all"),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);

  const member = members?.[0] as { workspace_id: string } | undefined;
  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    filter: searchParams.get("filter") ?? "all",
    limit: searchParams.get("limit") ?? "20",
    offset: searchParams.get("offset") ?? "0",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const { filter, limit, offset } = parsed.data;

  let query = supabase
    .from("conversations")
    .select("id, status, bot_paused, bot_paused_until, assigned_to, last_message_at, unread_count, contact_id, connected_account_id, contacts(id, username, avatar_url, platform_scoped_id)")
    .eq("workspace_id", member.workspace_id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (filter === "unread") {
    query = query.gt("unread_count", 0);
  } else if (filter === "bot_active") {
    query = query.eq("bot_paused", false);
  } else if (filter === "bot_paused") {
    query = query.eq("bot_paused", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[inbox] conversation list error:", error.message);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }

  return NextResponse.json({ conversations: data ?? [], workspaceId: member.workspace_id });
}
