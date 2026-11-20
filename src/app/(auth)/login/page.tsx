"use client";

import { createClient } from "@/lib/supabase/browser";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getRedirectPathFromSearch } from "@/lib/auth/redirect";
import {
  Loader2,
  Eye,
  EyeOff,
  AtSign,
  Lock,
  ArrowRight,
  ArrowLeft,
  LifeBuoy,
  Mail,
  KeyRound,
  RotateCw,
  CheckCircle2,
} from "lucide-react";

const IG_ERROR_MESSAGES: Record<string, string> = {
  permissions_denied: "You need to allow all requested Instagram permissions. Please try again.",
  personal_account: "Please switch your Instagram account to a Business or Creator account.",
  no_facebook_page: "Your Instagram account is not linked to a Facebook Page.",
  instagram_auth_denied: "Instagram login was cancelled or denied. Please try again.",
  token_exchange_failed: "Instagram authentication failed. Please ensure you have a Business or Creator account.",
  profile_fetch_failed: "Could not retrieve Instagram profile. For Business accounts, please link a Facebook Page, or switch to a Creator account.",
};

type View = "otp-email" | "otp-verify" | "password" | "forgot" | "forgot-sent";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("otp-email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 6-digit OTP state
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState<number>(0);

  const urlError = searchParams.get("error");
  const [error, setError] = useState<string | null>(() => {
    if (urlError) return IG_ERROR_MESSAGES[urlError] ?? `Login failed: ${urlError}`;
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [shakeField, setShakeField] = useState<string | null>(null);

  function triggerShake() {
    setShakeField("form");
    setTimeout(() => setShakeField(null), 400);
  }

  // 60-second countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Focus first OTP input when entering otp-verify view
  useEffect(() => {
    if (view === "otp-verify") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [view]);

  // Handle OTP sending via Supabase Auth
  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      triggerShake();
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const next = getRedirectPathFromSearch(window.location.search);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (otpError) {
        if (otpError.message.toLowerCase().includes("rate limit") || otpError.status === 429) {
          setError("Too many attempts. Please wait a moment before requesting another code.");
        } else {
          setError(otpError.message);
        }
        triggerShake();
        setLoading(false);
        return;
      }

      setOtp(["", "", "", "", "", ""]);
      setView("otp-verify");
      setCountdown(60);
    } catch (err) {
      setError((err as Error).message ?? "Failed to send verification code");
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  // Handle OTP verification
  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const token = otp.join("").trim();

    if (token.length !== 6) {
      setError("Please enter all 6 digits of your verification code.");
      triggerShake();
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: "email",
      });

      if (verifyError) {
        const msg = verifyError.message.toLowerCase();
        if (msg.includes("expired")) {
          setError("This verification code has expired. Please request a new code.");
        } else if (msg.includes("invalid")) {
          setError("Invalid verification code. Please check your email and try again.");
        } else {
          setError(verifyError.message);
        }
        triggerShake();
        setLoading(false);
        return;
      }

      if (data.session || data.user) {
        const redirectPath = getRedirectPathFromSearch(window.location.search);
        window.location.assign(redirectPath);
      }
    } catch (err) {
      setError((err as Error).message ?? "Verification failed");
      triggerShake();
      setLoading(false);
    }
  }

  // OTP digit input change handler
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const updated = [...otp];
      updated[index] = "";
      setOtp(updated);
      return;
    }

    const digit = cleaned.slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);

    // Auto-advance to next input
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // OTP keydown handler for Backspace and Navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // OTP paste handler (pastes 6 digits across all boxes)
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...otp];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtp(updated);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Standard Password Login
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setError(error.message);
        triggerShake();
        setLoading(false);
        return;
      }

      window.location.assign(getRedirectPathFromSearch(window.location.search));
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong");
      setLoading(false);
    }
  }

  // Forgot Password
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/callback`,
      });

      if (error) {
        setError(error.message);
        triggerShake();
        setLoading(false);
        return;
      }

      setView("forgot-sent");
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Google OAuth Login
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

  /* ── Reset email sent confirmation ── */
  if (view === "forgot-sent") {
    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#09090C] px-4 font-sans text-slate-100">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[22%] h-[440px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(229,25,127,0.28)_0%,rgba(139,49,255,0.16)_45%,transparent_72%)] blur-[85px]"
        />
        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-[0_0_30px_rgba(229,25,127,0.4)]">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Check your email
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            We sent a password reset link to{" "}
            <span className="font-medium text-slate-200">{email}</span>
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setView("forgot");
                setError(null);
              }}
              className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 cursor-pointer"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                setView("otp-email");
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-pink-400 cursor-pointer"
            >
              Back to sign in
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col justify-between overflow-x-hidden bg-[#09090C] font-sans text-slate-100 antialiased selection:bg-primary selection:text-white">
      {/* ── Ambient Background Orbs ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[22%] h-[440px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(229,25,127,0.28)_0%,rgba(139,49,255,0.16)_45%,transparent_72%)] blur-[85px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[8%] right-[22%] h-[380px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(104,37,234,0.25)_0%,rgba(217,37,163,0.12)_50%,transparent_70%)] blur-[95px]"
      />

      {/* ── Dot Grid Overlay ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.04] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* ── Header ── */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
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
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Ig
            </span>
            Inbox
          </span>
        </Link>

        <nav className="flex items-center text-xs font-medium text-slate-400">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-1.5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-slate-900/70 hover:text-slate-200"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            Need Help?
          </Link>
        </nav>
      </header>

      {/* ── Main Auth Card ── */}
      <main className="relative z-10 flex flex-grow items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[440px]">
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#14141A]/90 p-7 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.14] sm:p-9">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-24 w-44 -translate-x-1/2 bg-primary/25 blur-3xl" />

            {/* Logo Badge & Headings */}
            <div className="mb-8 text-center">
              <div className="group relative mx-auto mb-4 inline-flex cursor-default rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-2 shadow-inner">
                <Image
                  src="/favicon-192.png"
                  alt="IgInbox"
                  width={64}
                  height={64}
                  className="rounded-xl object-cover drop-shadow-[0_0_16px_rgba(229,25,127,0.45)]"
                  priority
                />
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[26px]">
                {view === "otp-verify"
                  ? "Enter Verification Code"
                  : view === "password"
                    ? "Sign In with Password"
                    : view === "forgot"
                      ? "Reset Password"
                      : "Welcome to IgInbox"}
              </h1>

              <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-400 sm:text-sm">
                {view === "otp-verify" ? (
                  <>
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-slate-200">{email}</span>
                  </>
                ) : view === "password" ? (
                  "Enter your email and password to access your dashboard"
                ) : view === "forgot" ? (
                  "Enter your email address to receive a password reset link"
                ) : (
                  "Sign in or sign up passwordlessly with a 6-digit Email OTP"
                )}
              </p>
            </div>

            {/* ── STEP 1: Email OTP Entry Form ── */}
            {view === "otp-email" && (
              <form
                onSubmit={handleSendOtp}
                className={`space-y-4 ${shakeField === "form" ? "animate-shake" : ""}`}
              >
                <div className="space-y-1.5">
                  <label htmlFor="otp-email" className="ml-0.5 block text-xs font-semibold text-slate-300">
                    Work or Personal Email
                  </label>
                  <div className="group relative rounded-xl border border-white/[0.08] transition-all duration-250 focus-within:border-primary/60 focus-within:shadow-[0_0_0_1.5px_rgba(229,25,127,0.85),0_0_20px_-3px_rgba(229,25,127,0.35)]">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-all duration-200 group-focus-within:text-primary">
                      <AtSign className="h-4 w-4" />
                    </div>
                    <input
                      id="otp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                      className="w-full rounded-xl border-0 bg-[#1A1A22] py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:bg-[#20202B] focus:outline-none"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary via-[#E02699] to-[#9733F4] py-3 px-4 text-sm font-semibold text-white shadow-[0_0_25px_-4px_rgba(229,25,127,0.45)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Login Code</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>

                {/* Alternate Options */}
                <div className="pt-3 flex items-center justify-between text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setView("password");
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <KeyRound className="size-3.5 text-primary" />
                    Sign in with password
                  </button>
                  <Link href="/signup" className="hover:text-primary transition-colors">
                    Need an account?
                  </Link>
                </div>

                {/* Divider */}
                <div aria-hidden="true" className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                    <span className="bg-[#14141A] px-3 font-medium text-slate-400">
                      or continue with
                    </span>
                  </div>
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/[0.09] bg-[#1C1C24] px-4 py-2.5 text-xs font-semibold text-slate-200 transition-all hover:bg-[#23232E]"
                >
                  <svg className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </form>
            )}

            {/* ── STEP 2: OTP 6-Digit Verification Form ── */}
            {view === "otp-verify" && (
              <form
                onSubmit={handleVerifyOtp}
                className={`space-y-5 ${shakeField === "form" ? "animate-shake" : ""}`}
              >
                {/* Email Chip with Change Action */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#181822] px-3.5 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="size-4 text-primary shrink-0" />
                    <span className="truncate text-xs text-slate-300 font-mono">
                      {email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setView("otp-email");
                      setError(null);
                    }}
                    className="text-xs font-semibold text-primary hover:text-pink-400 transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>

                {/* 6-Digit Input Boxes */}
                <div className="space-y-2">
                  <label className="block text-center text-xs font-medium text-slate-300">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={idx === 0 ? handleOtpPaste : undefined}
                        className="size-12 rounded-xl border border-white/[0.12] bg-[#1A1A22] text-center text-xl font-bold font-mono text-white shadow-inner transition-all focus:border-primary focus:bg-[#20202B] focus:shadow-[0_0_12px_rgba(229,25,127,0.4)] focus:outline-none"
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                    {error}
                  </div>
                )}

                {/* Verify Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || otp.join("").length !== 6}
                    className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary via-[#E02699] to-[#9733F4] py-3 px-4 text-sm font-semibold text-white shadow-[0_0_25px_-4px_rgba(229,25,127,0.45)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Resend OTP with Countdown */}
                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span>Didn&apos;t receive code?</span>
                  {countdown > 0 ? (
                    <span className="font-mono text-slate-500">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:text-pink-400 transition-colors cursor-pointer"
                    >
                      <RotateCw className="size-3" />
                      Resend Code
                    </button>
                  )}
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setView("otp-email");
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to email entry
                  </button>
                </div>
              </form>
            )}

            {/* ── Password View ── */}
            {view === "password" && (
              <form
                onSubmit={handlePasswordLogin}
                className={`space-y-4 ${shakeField === "form" ? "animate-shake" : ""}`}
              >
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="pwd-email" className="ml-0.5 block text-xs font-semibold text-slate-300">
                    Email Address
                  </label>
                  <div className="group relative rounded-xl border border-white/[0.08] transition-all duration-250 focus-within:border-primary/60 focus-within:shadow-[0_0_0_1.5px_rgba(229,25,127,0.85)]">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-all duration-200 group-focus-within:text-primary">
                      <AtSign className="h-4 w-4" />
                    </div>
                    <input
                      id="pwd-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full rounded-xl border-0 bg-[#1A1A22] py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:bg-[#20202B] focus:outline-none"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="ml-0.5 flex items-center justify-between">
                    <label htmlFor="pwd-password" className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView("forgot");
                        setError(null);
                      }}
                      className="text-xs font-medium text-primary hover:text-pink-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="group relative rounded-xl border border-white/[0.08] transition-all duration-250 focus-within:border-primary/60 focus-within:shadow-[0_0_0_1.5px_rgba(229,25,127,0.85)]">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-all duration-200 group-focus-within:text-primary">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="pwd-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border-0 bg-[#1A1A22] py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 focus:bg-[#20202B] focus:outline-none"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary via-[#E02699] to-[#9733F4] py-3 px-4 text-sm font-semibold text-white shadow-[0_0_25px_-4px_rgba(229,25,127,0.45)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-3 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setView("otp-email");
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-pink-400 transition-colors cursor-pointer"
                  >
                    <Mail className="size-3.5" />
                    Sign in with Email OTP code instead
                  </button>
                </div>
              </form>
            )}

            {/* ── Forgot Password View ── */}
            {view === "forgot" && (
              <form
                onSubmit={handleForgotPassword}
                className={`space-y-4 ${shakeField === "form" ? "animate-shake" : ""}`}
              >
                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className="ml-0.5 block text-xs font-semibold text-slate-300">
                    Email Address
                  </label>
                  <div className="group relative rounded-xl border border-white/[0.08] transition-all duration-250 focus-within:border-primary/60 focus-within:shadow-[0_0_0_1.5px_rgba(229,25,127,0.85)]">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-all duration-200 group-focus-within:text-primary">
                      <AtSign className="h-4 w-4" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full rounded-xl border-0 bg-[#1A1A22] py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:bg-[#20202B] focus:outline-none"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary via-[#E02699] to-[#9733F4] py-3 px-4 text-sm font-semibold text-white shadow-[0_0_25px_-4px_rgba(229,25,127,0.45)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setView("otp-email");
                    setError(null);
                  }}
                  className="flex w-full items-center justify-center gap-1.5 pt-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to sign in
                </button>
              </form>
            )}
          </section>

          {/* Card Footer */}
          <footer className="mt-8 text-center text-xs text-slate-500">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-slate-400 underline underline-offset-4 hover:text-white">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-slate-400 underline underline-offset-4 hover:text-white">
              Privacy Policy
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
