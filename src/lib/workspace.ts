import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentWorkspace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .limit(1);

  const member = members?.[0] as
    | { workspace_id: string; role: "owner" | "admin" | "member" }
    | undefined;

  if (!member) {
    redirect("/login");
  }

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", member.workspace_id)
    .limit(1);

  const workspace = workspaces?.[0] as
    | { id: string; name: string; slug: string; owner_id: string; created_at: string; updated_at: string }
    | undefined;

  if (!workspace) {
    redirect("/login");
  }

  return {
    user: { id: user.id, email: user.email },
    workspaceId: member.workspace_id,
    role: member.role,
    workspace,
  };
}
