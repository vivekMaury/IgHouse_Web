"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function NewFlowPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    const res = await fetch("/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (res.ok) {
      const data = (await res.json()) as { id: string };
      router.push(`/dashboard/flows/${data.id}`);
    } else {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">New Flow</h1>
        <p className="text-sm text-muted-foreground">
          Give your flow a name to get started.
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="flowName" className="text-sm font-medium">
            Flow name
          </label>
          <input
            id="flowName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-border/60 bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="e.g., Lead Magnet Flow"
            autoFocus
          />
        </div>
        <Button type="submit" className="w-full" disabled={creating}>
          {creating ? "Creating…" : "Create Flow"}
        </Button>
      </form>
    </div>
  );
}
