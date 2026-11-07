"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { BrandLogo } from "@/components/logo";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/browser";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  GitBranch,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Activity,
  Menu,
  ChevronRight,
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

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const isActive = useCallback(
    (href: string) =>
      href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(href),
    [pathname],
  );

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden md:flex-row">
      {/* ── Mobile Header ── */}
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:hidden">
        <Link href="/dashboard" className="flex items-center">
          <BrandLogo size="default" variant="auto" />
        </Link>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" showCloseButton>
            <SheetHeader>
              <SheetTitle>
                <BrandLogo size="default" variant="auto" />
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 space-y-1 px-2" aria-label="Dashboard navigation">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive(href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-[18px]" />
                  <span className="flex-1">{label}</span>
                  {isActive(href) && (
                    <ChevronRight className="size-3.5 text-primary/60" />
                  )}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-border/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-xs font-semibold text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-border/60 bg-sidebar md:flex">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border/60 px-5">
          <Link href="/dashboard" className="flex items-center">
            <BrandLogo size="default" variant="auto" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-2.5" aria-label="Dashboard navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                isActive(href)
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
              }`}
            >
              {isActive(href) && (
                <span className="absolute -left-[11px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-border/60 p-2.5">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-brand text-[10px] font-semibold text-white">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-xs text-muted-foreground">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="min-h-0 min-w-0 flex-1 overflow-auto bg-background">
        <div className="p-4 sm:p-5 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
