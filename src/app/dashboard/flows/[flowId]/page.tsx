"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { FlowCanvas } from "@/features/flows/canvas/flow-canvas";
import type { FlowDefinition } from "@/lib/engine/schema";
import { Loader2 } from "lucide-react";

type FlowData = {
  id: string;
  name: string;
  status: string;
  definition: FlowDefinition | null;
};

export default function FlowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.flowId as string;
  const [flow, setFlow] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    async function loadFlow() {
      const res = await fetch(`/api/flows/${flowId}`);
      if (res.ok) {
        const data = (await res.json()) as FlowData;
        setFlow(data);
      } else {
        router.push("/dashboard/flows");
      }
      setLoading(false);
    }
    loadFlow();
  }, [flowId, router]);

  const handleSave = useCallback(
    async (definition: FlowDefinition) => {
      setSaving(true);
      await fetch(`/api/flows/${flowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ definition }),
      });
      setSaving(false);
    },
    [flowId]
  );

  async function handleStatusChange(newStatus: string) {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/flows/${flowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setFlow((prev) => (prev ? { ...prev, status: newStatus } : prev));
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Failed to update status");
      }
    } finally {
      setStatusLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading flow…</p>
      </div>
    );
  }

  if (!flow) return null;

  const isPublished = flow.status === "published";
  const isPaused = flow.status === "paused";
  const isDraft = flow.status === "draft";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/flows")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Flows
          </button>
          <span className="text-sm font-medium">{flow.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isPublished
                ? "bg-emerald-500/10 text-emerald-600"
                : isPaused
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {flow.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPublished && (
            <button
              onClick={() => handleStatusChange("paused")}
              disabled={statusLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
            >
              {statusLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Pause
            </button>
          )}

          {isPaused && (
            <button
              onClick={() => handleStatusChange("published")}
              disabled={statusLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {statusLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Resume
            </button>
          )}

          {(isDraft || isPaused) && (
            <button
              onClick={() => handleStatusChange("published")}
              disabled={statusLoading}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {statusLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {isDraft ? "Publish" : "Publish"}
            </button>
          )}

          {isPublished && (
            <button
              onClick={() => handleStatusChange("draft")}
              disabled={statusLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
            >
              Unpublish
            </button>
          )}
        </div>
      </div>

      <div className="flex-1">
        <FlowCanvas
          initialDefinition={flow.definition ?? undefined}
          onSave={handleSave}
          saving={saving}
        />
      </div>
    </div>
  );
}
