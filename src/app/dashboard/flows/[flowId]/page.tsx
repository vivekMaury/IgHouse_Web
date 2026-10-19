"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { FlowCanvas } from "@/features/flows/canvas/flow-canvas";
import type { FlowDefinition } from "@/lib/engine/schema";

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading flow…</p>
      </div>
    );
  }

  if (!flow) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/flows")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Flows
          </button>
          <span className="text-sm font-medium">{flow.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              flow.status === "published"
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {flow.status}
          </span>
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
