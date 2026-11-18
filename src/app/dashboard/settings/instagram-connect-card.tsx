"use client";

import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, AlertTriangle, Trash2, RefreshCw, Pencil, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
  const diffMs = expires.getTime() - now.getTime();
  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMs <= 0) return { label: "Expired", variant: "expired" };
  if (daysLeft === 0) return { label: `Expires in ${Math.max(1, hoursLeft)}h`, variant: "warning" };
  if (daysLeft < 7) return { label: `Expires in ${daysLeft}d`, variant: "warning" };
  return { label: `Expires in ${daysLeft}d`, variant: "healthy" };
}

export function InstagramConnectCard({ accounts }: { accounts: ConnectedAccount[] }) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  function startEditing(account: ConnectedAccount) {
    setEditingId(account.id);
    setEditUsername(account.username?.startsWith("user_") ? "" : (account.username ?? ""));
  }

  function cancelEditing() {
    setEditingId(null);
    setEditUsername("");
  }

  async function handleSaveUsername(accountId: string) {
    const trimmed = editUsername.trim().replace(/^@/, "");
    if (!trimmed) {
      toast.error("Please enter a valid Instagram username");
      return;
    }
    setSavingUsername(true);
    try {
      const res = await fetch("/api/instagram/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, username: trimmed }),
      });
      const data = (await res.json()) as { error?: string };
      if (res.ok) {
        toast.success("Instagram username updated!");
        setEditingId(null);
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to update username");
      }
    } catch {
      toast.error("Failed to update username");
    } finally {
      setSavingUsername(false);
    }
  }

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

  async function handleSync(accountId: string) {
    setSyncing(accountId);
    try {
      const res = await fetch("/api/instagram/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        toast.success("Account profile and inbox synced successfully.");
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? "Failed to start sync");
      }
    } catch {
      toast.error("Failed to start sync");
    } finally {
      setSyncing(null);
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
                    {editingId === account.id ? (
                      <div className="flex items-center gap-1.5 py-0.5">
                        <span className="text-sm font-medium text-muted-foreground">@</span>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          placeholder="username"
                          className="h-7 w-32 rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveUsername(account.id);
                            if (e.key === "Escape") cancelEditing();
                          }}
                          autoFocus
                          disabled={savingUsername}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveUsername(account.id)}
                          disabled={savingUsername}
                          className="rounded p-1 text-emerald-500 hover:bg-muted"
                          title="Save username"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={savingUsername}
                          className="rounded p-1 text-muted-foreground hover:bg-muted"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">
                          @{account.username ?? account.platform_account_id}
                        </p>
                        <button
                          type="button"
                          onClick={() => startEditing(account)}
                          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit username"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
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
                    {account.username?.startsWith("user_") && (
                      <p className="text-[11px] text-amber-500/90 pt-0.5">
                        Tip: Click pencil to set your handle, or switch account to Professional on Instagram.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSync(account.id)}
                    disabled={syncing === account.id}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={`h-4 w-4${syncing === account.id ? " animate-spin" : ""}`} />
                    <span className="ml-1 hidden sm:inline">Sync Inbox</span>
                  </Button>
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
