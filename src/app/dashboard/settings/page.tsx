import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsTabs } from "./settings-tabs";
import { ConnectionAlert } from "./connection-alert";

export const instant = false;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();

  const params = await searchParams;
  const connected = params.connected === "true";
  const error = typeof params.error === "string" ? params.error : null;
  const tab = typeof params.tab === "string" ? params.tab : "integrations";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);

  const member = members?.[0] as { workspace_id: string } | undefined;
  if (!member) {
    redirect("/login");
  }

  const { data: accounts } = await supabase
    .from("connected_accounts")
    .select("id, platform, platform_account_id, username, avatar_url, is_active, token_expires_at, last_webhook_at, scopes, created_at")
    .eq("workspace_id", member.workspace_id);

  const connectedAccounts = (accounts ?? []) as Array<{
    id: string;
    platform: string;
    platform_account_id: string;
    username: string | null;
    avatar_url: string | null;
    is_active: boolean;
    token_expires_at: string | null;
    last_webhook_at: string | null;
    scopes: string[];
    created_at: string;
  }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Instagram connections and workspace settings.
        </p>
      </div>

      <ConnectionAlert connected={connected} error={error} />

      <SettingsTabs
        defaultTab={tab === "workspace" ? "workspace" : "integrations"}
        accounts={connectedAccounts}
      />
    </div>
  );
}
