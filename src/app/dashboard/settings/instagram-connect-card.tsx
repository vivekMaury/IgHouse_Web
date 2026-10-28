"use client";

import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

function getTokenStatus(expiresAt: string | null): {
  label: string;
  variant: "healthy" | "warning" | "expired";
} {
  if (!expiresAt) return { label: "Unknown", variant: "warning" };
  const expires = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return { label: "Expired", variant: "expired" };
  if (daysLeft < 7) return { label: `Expires in ${daysLeft}d`, variant: "warning" };
  return { label: `Expires in ${daysLeft}d`, variant: "healthy" };
}

export function InstagramConnectCard({ accounts }: { accounts: ConnectedAccount[] }) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  async function handleDisconnect(accountId: string) {
    setDisconnecting(accountId);
    try {
      const res = await fetch("/api/instagram/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <div className="rounded-lg border border-border/60 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Camera className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Instagram Connection</h2>
      </div>

      {accounts.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect your Instagram Business or Creator account to start automating.
          </p>
          <Button onClick={() => { window.location.href = "/api/instagram/connect"; }}>
            <Camera className="mr-2 h-4 w-4" />
            Connect Instagram
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const tokenStatus = getTokenStatus(account.token_expires_at);

            return (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-md border border-border/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {account.avatar_url ? (
                    <img
                      src={account.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Camera className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      @{account.username ?? account.platform_account_id}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {tokenStatus.variant === "healthy" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      )}
                      <span>{tokenStatus.label}</span>
                      {account.last_webhook_at && (
                        <>
                          <span>&middot;</span>
                          <span>
                            Last webhook:{" "}
                            {new Date(account.last_webhook_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(account.id)}
                  disabled={disconnecting === account.id}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          <Button variant="outline" size="sm" onClick={() => { window.location.href = "/api/instagram/connect"; }}>
            <Camera className="mr-2 h-4 w-4" />
            Connect another account
          </Button>
        </div>
      )}
    </div>
  );
}
