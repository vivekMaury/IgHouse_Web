"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch("/api/account/delete-data", { method: "POST" });
    if (res.ok) {
      setDone(true);
    }
    setDeleting(false);
    setConfirming(false);
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-600">All workspace data has been deleted successfully.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/30 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Delete all workspace data including flows, contacts, messages, and connected accounts.
        This action cannot be undone.
      </p>
      {confirming ? (
        <div className="mt-3 flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Yes, delete everything"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={deleting}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 border-destructive/30 text-destructive hover:bg-destructive/5"
          onClick={() => setConfirming(true)}
        >
          Delete All Data
        </Button>
      )}
    </div>
  );
}
