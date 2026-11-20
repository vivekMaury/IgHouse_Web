"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InstagramConnectCard } from "./instagram-connect-card";
import { DangerZone } from "./danger-zone";
import { WorkspaceTeam } from "./workspace-team";
import { type WorkspaceRole } from "@/lib/workspace/rbac";

type ConnectedAccount = {
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
};

export function SettingsTabs({
  defaultTab,
  accounts,
  workspaceId,
  workspaceName,
  currentUserRole,
  currentUserId,
}: {
  defaultTab: "integrations" | "workspace";
  accounts: ConnectedAccount[];
  workspaceId: string;
  workspaceName: string;
  currentUserRole: WorkspaceRole;
  currentUserId: string;
}) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="workspace">Workspace & Team</TabsTrigger>
      </TabsList>

      <TabsContent value="integrations">
        <InstagramConnectCard accounts={accounts} />
      </TabsContent>

      <TabsContent value="workspace" className="space-y-8 mt-6">
        <WorkspaceTeam
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
        />
        <DangerZone />
      </TabsContent>
    </Tabs>
  );
}
