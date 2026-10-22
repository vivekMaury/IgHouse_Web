"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  MessageSquare,
  Users,
  Settings,
  Activity,
  Search,
  Plus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const NAV_COMMANDS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Flows", icon: GitBranch, href: "/dashboard/flows" },
  { label: "Inbox", icon: MessageSquare, href: "/dashboard/inbox" },
  { label: "Contacts", icon: Users, href: "/dashboard/contacts" },
  { label: "Logs", icon: Activity, href: "/dashboard/logs" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
] as const;

const ACTION_COMMANDS = [
  { label: "New Flow", icon: Plus, href: "/dashboard/flows/new" },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-56 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left text-xs">Search…</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {NAV_COMMANDS.map((cmd) => (
              <CommandItem key={cmd.href} onSelect={() => navigate(cmd.href)}>
                <cmd.icon className="mr-2 h-4 w-4" />
                {cmd.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            {ACTION_COMMANDS.map((cmd) => (
              <CommandItem key={cmd.href} onSelect={() => navigate(cmd.href)}>
                <cmd.icon className="mr-2 h-4 w-4" />
                {cmd.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
