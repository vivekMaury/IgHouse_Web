"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Mail } from "lucide-react";
import { BrandLogo } from "@/components/logo";

/* -------------------------------------------------------------------------- */
/*  Tab config                                                                */
/* -------------------------------------------------------------------------- */

const tabs = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Data Deletion", href: "/data-deletion" },
] as const;

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                    */
/* -------------------------------------------------------------------------- */

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#09090c]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <BrandLogo size="default" />
        </Link>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden rounded-lg px-3 py-2 text-[13px] text-zinc-400 transition hover:bg-white/[0.05] hover:text-white sm:inline-flex"
          >
            Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-[13px] font-medium text-zinc-200 transition hover:bg-white/[0.1] hover:text-white sm:px-4"
          >
            Log in <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab switcher                                                              */
/* -------------------------------------------------------------------------- */

function TabSwitcher() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Legal pages"
      className="border-b border-white/[0.06] bg-[#09090c]/60 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-0.5 overflow-x-auto px-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative shrink-0 px-3 py-3 text-[12px] font-medium transition sm:px-4 sm:text-[13px] ${
                active
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
              {active && (
                <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-pink-400 to-fuchsia-400 sm:inset-x-4" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

function LegalFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0b0b0f]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          {/* Brand */}
          <div>
            <Link href="/" className="flex shrink-0 items-center opacity-80 transition hover:opacity-100">
              <BrandLogo size="sm" />
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-5 text-zinc-600">
              Instagram DM &amp; comment automation, built on Meta&apos;s
              official APIs.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">
                Legal
              </p>
              <div className="flex flex-col gap-2">
                {tabs.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-xs text-zinc-500 transition hover:text-zinc-200"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">
                Product
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="text-xs text-zinc-500 transition hover:text-zinc-200"
                >
                  Home
                </Link>
                <Link
                  href="/login"
                  className="text-xs text-zinc-500 transition hover:text-zinc-200"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="text-xs text-zinc-500 transition hover:text-zinc-200"
                >
                  Get started
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">
                Contact
              </p>
              <a
                href="mailto:info@iginbox.com"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-200"
              >
                <Mail className="size-3" />
                info@iginbox.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-zinc-700 sm:flex-row sm:justify-between">
          <span>&copy; {2026} IgInbox. All rights reserved.</span>
          <span>Built for better conversations.</span>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shell                                                                     */
/* -------------------------------------------------------------------------- */

interface LegalShellProps {
  children: ReactNode;
}

export function LegalShell({ children }: LegalShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#09090c] text-white">
      <Navbar />
      <TabSwitcher />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          {children}
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
