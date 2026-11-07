"use client";

import { createClient } from "@/lib/supabase/browser";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Eye, EyeOff, AtSign, Lock, ArrowRight, LifeBuoy, Mail } from "lucide-react";
import { getRedirectPathFromSearch } from "@/lib/auth/redirect";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shakeField, setShakeField] = useState<string | null>(null);

  function triggerShake() {
    setShakeField("form");
    setTimeout(() => setShakeField(null), 400);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const next = getRedirectPathFromSearch(window.location.search);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setError(error.message);
        triggerShake();
        setLoading(false);
        return;
      }

      if (data.session) {
        window.location.assign(next);
        return;
      }

      if (data.user && !data.session) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!loginError) {
          window.location.assign(next);
          return;
        }
      }

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong");
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    const next = getRedirectPathFromSearch(window.location.search);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  /* ── Email Confirmation Success ── */
  if (success) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#09090C] px-4">
        {/* Orbs */}
        <div
          aria-hidden="true"
          className="animate-auth-orb-1 pointer-events-none absolute left-1/2 top-[22%] h-[440px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(229,25,127,0.28)_0%,rgba(139,49,255,0.16)_45%,transparent_72%)] blur-[85px]"
        />
        <div
          aria-hidden="true"
          className="animate-auth-orb-2 pointer-events-none absolute bottom-[8%] right-[22%] h-[380px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(104,37,234,0.25)_0%,rgba(217,37,163,0.12)_50%,transparent_70%)] blur-[95px]"
        />

        <div className="animate-auth-card relative z-10 w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-[0_0_30px_rgba(229,25,127,0.4)]">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Check your email
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            We sent a verification link to{" "}
            <span className="font-medium text-slate-200">{email}</span>
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-pink-400"
          >
            Back to sign in
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col justify-between overflow-x-hidden bg-[#09090C] font-sans text-slate-100 antialiased selection:bg-primary selection:text-white">
      {/* ── Ambient Background Orbs ── */}
      <div
        aria-hidden="true"
        className="animate-auth-orb-1 pointer-events-none absolute left-1/2 top-[22%] h-[440px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(229,25,127,0.28)_0%,rgba(139,49,255,0.16)_45%,transparent_72%)] blur-[85px]"
      />
      <div
        aria-hidden="true"
        className="animate-auth-orb-2 pointer-events-none absolute bottom-[8%] right-[22%] h-[380px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(104,37,234,0.25)_0%,rgba(217,37,163,0.12)_50%,transparent_70%)] blur-[95px]"
      />
      <div
        aria-hidden="true"
        className="animate-auth-orb-3 pointer-events-none absolute left-[18%] top-[60%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(139,49,255,0.15)_0%,transparent_65%)] blur-[90px]"
      />

      {/* ── Dot Grid Overlay ── */}
      <div
        aria-hidden="true"
        className="animate-auth-dot-drift pointer-events-none fixed inset-0 opacity-[0.04] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* ── Header ── */}
      <header className="animate-auth-item relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 [animation-delay:50ms]">
        <Link
          href="/"
          className="group flex items-center gap-3.5 rounded-xl p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-gradient-to-br from-primary via-violet-600 to-slate-800 p-0.5 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(229,25,127,0.45)]">
            <Image
              src="/favicon-192.png"
              alt=""
              width={36}
              height={36}
              className="h-full w-full rounded-[10px] object-cover"
              aria-hidden="true"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-white transition-opacity group-hover:opacity-95">
            <span className="text-gradient-brand">Ig</span>Inbox
          </span>
        </Link>

        <nav className="flex items-center text-xs font-medium text-slate-400">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-1.5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-slate-900/70 hover:text-slate-200 hover:shadow-[0_0_12px_-2px_rgba(229,25,127,0.25)] active:scale-95"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            Need Help?
          </Link>
        </nav>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex flex-grow items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[440px]">
          {/* Auth Card */}
          <section className="animate-auth-card relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#14141A]/90 p-7 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.14] sm:p-9">
            {/* Top sheen */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-24 w-44 -translate-x-1/2 bg-primary/25 blur-3xl" />

            {/* Logo Badge */}
            <div className="animate-auth-item mb-8 text-center [animation-delay:150ms]">
              <div className="animate-auth-badge group relative mx-auto mb-4 inline-flex cursor-default rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-2 shadow-inner">
                <Image
                  src="/favicon-192.png"
                  alt="IgInbox"
                  width={64}
                  height={64}
                  className="rounded-xl object-cover drop-shadow-[0_0_16px_rgba(229,25,127,0.45)] transition-all duration-300 ease-out group-hover:rotate-2 group-hover:scale-110 group-hover:drop-shadow-[0_0_26px_rgba(229,25,127,0.85)]"
                  priority
                />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[26px]">
                Start automating
              </h1>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-400 sm:text-sm">
                Create your free account and automate Instagram in minutes
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSignup}
              className={`space-y-4 ${shakeField === "form" ? "animate-shake" : ""}`}
            >
              {/* Email */}
              <div className="animate-auth-item space-y-1.5 [animation-delay:240ms]">
                <label
                  htmlFor="email"
                  className="ml-0.5 block text-xs font-semibold text-slate-300"
                >
                  Work or Personal Email
                </label>
                <div className="group relative rounded-xl border border-white/[0.08] transition-all duration-250 focus-within:border-primary/60 focus-within:shadow-[0_0_0_1.5px_rgba(229,25,127,0.85),0_0_20px_-3px_rgba(229,25,127,0.35),0_0_12px_-2px_rgba(139,49,255,0.25)]">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-all duration-200 group-focus-within:scale-108 group-focus-within:text-primary">
                    <AtSign className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border-0 bg-[#1A1A22] py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-colors duration-200 focus:bg-[#20202B] focus:outline-none focus:ring-0"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="animate-auth-item space-y-1.5 pt-0.5 [animation-delay:320ms]">
                <label
                  htmlFor="password"
                  className="ml-0.5 block text-xs font-semibold text-slate-300"
                >
                  Password
                </label>
                <div className="group relative rounded-xl border border-white/[0.08] transition-all duration-250 focus-within:border-primary/60 focus-within:shadow-[0_0_0_1.5px_rgba(229,25,127,0.85),0_0_20px_-3px_rgba(229,25,127,0.35),0_0_12px_-2px_rgba(139,49,255,0.25)]">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-all duration-200 group-focus-within:scale-108 group-focus-within:text-primary">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-xl border-0 bg-[#1A1A22] py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 transition-colors duration-200 focus:bg-[#20202B] focus:outline-none focus:ring-0"
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-all duration-150 hover:scale-110 hover:text-white focus:text-white focus:outline-none active:scale-95"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="animate-auth-item rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="animate-auth-item pt-2 [animation-delay:400ms]">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary via-[#E02699] to-[#9733F4] py-3 px-4 text-sm font-semibold text-white shadow-[0_0_25px_-4px_rgba(229,25,127,0.45),0_0_10px_-2px_rgba(139,49,255,0.35)] transition-all duration-300 hover:-translate-y-[1.5px] hover:scale-[1.01] hover:shadow-[0_10px_28px_-2px_rgba(229,25,127,0.55),0_5px_15px_-1px_rgba(139,49,255,0.45)] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#14141A] active:translate-y-0 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-60"
                >
                  {/* Shimmer */}
                  <div
                    aria-hidden="true"
                    className="animate-auth-shimmer pointer-events-none absolute inset-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  />
                  {loading ? (
                    <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span className="relative z-10">Create Account</span>
                      <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div
              aria-hidden="true"
              className="animate-auth-item relative my-6 [animation-delay:460ms]"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-[#14141A] px-3 font-medium text-slate-400">
                  or continue with
                </span>
              </div>
            </div>

            {/* Social Auth */}
            <div className="animate-auth-item space-y-2.5 [animation-delay:520ms]">
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/[0.09] bg-[#1C1C24] px-4 py-2.5 text-xs font-semibold text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-[#23232E] hover:shadow-[0_4px_18px_-2px_rgba(0,0,0,0.5),0_0_12px_rgba(255,255,255,0.06)] active:scale-95"
              >
                <svg
                  className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="transition-colors group-hover:text-white">
                  Continue with Google
                </span>
              </button>

              {/* Instagram */}
              <button
                type="button"
                className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/[0.09] bg-[#1C1C24] px-4 py-2.5 text-xs font-semibold text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-pink-500/30 hover:bg-[#23232E] hover:shadow-[0_4px_18px_-2px_rgba(229,25,127,0.22),0_0_12px_rgba(229,25,127,0.15)] active:scale-95"
              >
                <svg
                  className="h-4 w-4 shrink-0 text-pink-400 transition-all duration-200 group-hover:scale-110 group-hover:text-pink-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                <span className="transition-colors group-hover:text-white">
                  Continue with Instagram Work Account
                </span>
              </button>
            </div>
          </section>

          {/* Below Card Links */}
          <div className="animate-auth-item mt-6 space-y-3 text-center [animation-delay:600ms]">
            <p className="text-xs text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="ml-1 font-semibold text-primary underline-offset-2 transition-colors hover:text-pink-400 hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p className="mx-auto max-w-xs text-[11px] leading-normal text-slate-500">
              By signing up, you agree to our{" "}
              <Link
                href="/terms"
                className="text-slate-400 underline underline-offset-2 transition-colors hover:text-slate-300"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-slate-400 underline underline-offset-2 transition-colors hover:text-slate-300"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="animate-auth-item relative z-10 border-t border-white/[0.04] px-6 py-5 [animation-delay:680ms]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-[11px] text-slate-500 sm:flex-row">
          <div className="group flex cursor-default items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="font-medium text-slate-400 transition-colors group-hover:text-slate-300">
              All systems operational
            </span>
          </div>
          <span>&copy; 2025 IgInbox Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
