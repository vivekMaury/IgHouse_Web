"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ChevronsUpDown,
  Check,
  PlusCircle,
  Building2,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { type WorkspaceRole } from "@/lib/workspace/rbac";

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
}

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceItem[];
  activeWorkspaceId: string;
}

function getRoleIcon(role: WorkspaceRole) {
  switch (role) {
    case "owner":
      return <ShieldAlert className="size-3 text-amber-500" />;
    case "admin":
      return <ShieldCheck className="size-3 text-primary" />;
    case "member":
      return <Shield className="size-3 text-muted-foreground" />;
    case "viewer":
      return <Eye className="size-3 text-muted-foreground" />;
  }
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState<string | null>(null);

  // Create Workspace Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsSlug, setWsSlug] = useState("");
  const [creating, setCreating] = useState(false);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  const handleNameChange = (val: string) => {
    setWsName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setWsSlug(autoSlug);
  };

  const handleSwitch = async (targetId: string) => {
    if (targetId === activeWorkspaceId) return;

    setSwitching(targetId);
    try {
      const res = await fetch("/api/workspaces/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: targetId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to switch workspace");
        return;
      }

      toast.success("Workspace switched");
      router.refresh();
    } catch {
      toast.error("Network error while switching workspace");
    } finally {
      setSwitching(null);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim() || !wsSlug.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: wsName.trim(), slug: wsSlug.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create workspace");
        return;
      }

      toast.success(`Workspace "${data.workspace.name}" created!`);
      setCreateOpen(false);
      setWsName("");
      setWsSlug("");
      router.refresh();
    } catch {
      toast.error("Network error while creating workspace");
    } finally {
      setCreating(false);
    }
  };

  if (!activeWorkspace) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-between gap-2 px-3 py-2 h-auto border-border/60 bg-muted/30 hover:bg-muted/70 transition-colors cursor-pointer",
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 text-left">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-xs font-bold text-white shadow-xs">
              {activeWorkspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground leading-tight">
                {activeWorkspace.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {getRoleIcon(activeWorkspace.role)}
                <span className="text-[10px] text-muted-foreground capitalize font-medium">
                  {activeWorkspace.role}
                </span>
              </div>
            </div>
          </div>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56 p-1.5 shadow-xl">
          <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Workspaces ({workspaces.length})
          </DropdownMenuLabel>

          <div className="space-y-0.5">
            {workspaces.map((ws) => {
              const isSelected = ws.id === activeWorkspaceId;
              const isPending = switching === ws.id;

              return (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => handleSwitch(ws.id)}
                  disabled={isPending}
                  className="flex items-center justify-between gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-muted"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-bold text-[10px] text-foreground border border-border/60">
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {ws.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {ws.role}
                      </span>
                    </div>
                  </div>

                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  ) : isSelected ? (
                    <Check className="size-3.5 text-primary shrink-0" />
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-1.5" />

          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-md cursor-pointer"
          >
            <PlusCircle className="size-4" />
            Create Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Create Workspace Modal ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <DialogTitle className="text-center text-lg">Create New Workspace</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Workspaces isolate your Instagram connections, flows, contacts, and team members.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWorkspace} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Workspace Name</Label>
              <Input
                id="ws-name"
                placeholder="e.g. Acme Marketing, Client Brand"
                value={wsName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
                maxLength={50}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-slug">URL Slug</Label>
              <Input
                id="ws-slug"
                placeholder="e.g. acme-marketing"
                value={wsSlug}
                onChange={(e) => setWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
                maxLength={50}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !wsName || !wsSlug}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Workspace"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
