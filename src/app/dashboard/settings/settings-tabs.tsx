"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InstagramConnectCard } from "./instagram-connect-card";
import { DangerZone } from "./danger-zone";

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
}: {
  defaultTab: "integrations" | "workspace";
  accounts: ConnectedAccount[];
}) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="workspace">Workspace</TabsTrigger>
      </TabsList>

      <TabsContent value="integrations">
        <InstagramConnectCard accounts={accounts} />
      </TabsContent>

      <TabsContent value="workspace">
        <DangerZone />
      </TabsContent>
    </Tabs>
  );
}
