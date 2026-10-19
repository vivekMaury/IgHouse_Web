"use client";

import { createClient } from "@/lib/supabase/browser";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shakeField, setShakeField] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${y * -6}deg)`;
  }

  function handleMouseLeave() {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
  }

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/callback` },
      });

      if (error) {
        setError(error.message);
        triggerShake();
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (data.user && !data.session) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!loginError) {
          router.push("/dashboard");
          router.refresh();
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
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/callback` },
    });
  }

  if (success) {
    return (
      <div className="dark">
        <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] px-4">
          <div className="w-full max-w-sm animate-[fadeSlideUp_0.6s_ease-out] text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF007F] to-[#7B2FBE]">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Check your email</h1>
            <p className="mt-3 text-sm text-white/40">
              We sent a verification link to{" "}
              <span className="font-medium text-white/60">{email}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0B0B] px-4">
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-[#7B2FBE] opacity-10 blur-[150px]" />
        <div className="absolute bottom-1/3 left-1/4 h-80 w-80 rounded-full bg-[#FF007F] opacity-10 blur-[150px]" />

        <div className="w-full max-w-sm animate-[fadeSlideUp_0.6s_ease-out]">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block text-2xl font-bold text-white">
              Ig<span className="text-[#FF007F]">House</span>
            </Link>
            <p className="mt-2 text-sm text-white/40">Start automating your Instagram</p>
          </div>

          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md transition-transform duration-200 ease-out"
          >
            <form
              onSubmit={handleSignup}
              className={`space-y-5 ${shakeField === "form" ? "animate-shake" : ""}`}
            >
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-white/60">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/20 transition-all focus:border-[#FF007F]/50 focus:outline-none focus:ring-1 focus:ring-[#FF007F]/30"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-white/60">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 pr-10 text-sm text-white placeholder:text-white/20 transition-all focus:border-[#FF007F]/50 focus:outline-none focus:ring-1 focus:ring-[#FF007F]/30"
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,0,127,0.3)] transition-all hover:shadow-[0_0_32px_rgba(255,0,127,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0B0B0B] px-3 text-white/20">or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-white/30">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#FF007F]/70 transition-colors hover:text-[#FF007F]"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-[11px] text-white/15">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-white/30">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-white/30">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
