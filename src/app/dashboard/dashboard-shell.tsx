"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import {
  LayoutDashboard,
  GitBranch,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Activity,
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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen">
      <aside className="flex w-56 flex-col border-r border-border/60 bg-muted/30">
        <div className="flex h-14 items-center border-b border-border/60 px-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            IgHouse
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

      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
