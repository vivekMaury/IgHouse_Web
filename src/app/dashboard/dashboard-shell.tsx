"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { BrandLogo } from "@/components/logo";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import {
  LayoutDashboard,
  GitBranch,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Activity,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/flows", label: "Flows", icon: GitBranch },
  { href: "/dashboard/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/logs", label: "Logs", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden md:flex-row">
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background px-4 md:hidden">
        <Link href="/dashboard" className="flex items-center">
          <BrandLogo size="default" variant="auto" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-dashboard-navigation"
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <div
          id="mobile-dashboard-navigation"
          hidden={!mobileNavOpen}
          className="absolute inset-x-2 top-[calc(100%+0.5rem)] rounded-xl border border-border/60 bg-background p-2 shadow-xl"
        >
            <nav aria-label="Dashboard navigation" className="space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-2 flex items-center gap-2 border-t border-border/60 px-3 pt-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 truncate text-sm text-muted-foreground">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
        </div>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-border/60 bg-muted/30 md:flex">
        <div className="flex h-14 items-center border-b border-border/60 px-4">
          <Link href="/dashboard" className="flex items-center">
            <BrandLogo size="default" variant="auto" />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-sm text-muted-foreground">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-auto">
        <div className="p-3 sm:p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
