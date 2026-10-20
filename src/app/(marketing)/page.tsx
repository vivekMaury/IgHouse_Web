"use client";

import Link from "next/link";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  ArrowRight,
  MessageSquare,
  Zap,
  Users,
  BarChart3,
  Bot,
  Shield,
  Menu,
  X,
  ChevronRight,
  Star,
  Send,
  MousePointerClick,
  Clock,
  CheckCircle2,
  ChevronDown,
  Play,
  Globe,
  Lock,
  TrendingUp,
  Heart,
  Sparkles,
} from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/* ── scroll-reveal hook ─────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── navbar ──────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0B]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF007F] to-[#7B2FBE]">
            <Zap className="h-4 w-4 text-white" />
          </div>
          Ig<span className="text-[#FF007F]">House</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-white/60 transition-colors hover:text-white hover:bg-white/[0.04]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white hover:bg-white/[0.04]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-2 rounded-full bg-[#FF007F] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#FF1A8C] hover:shadow-[0_0_20px_rgba(255,0,127,0.35)] active:scale-[0.98]"
          >
            Get Started Free
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white lg:hidden">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-b border-white/[0.06] bg-[#0A0A0B]/98 backdrop-blur-2xl lg:hidden">
          <nav className="flex flex-col gap-1 px-6 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
              <Link href="/login" className="rounded-lg px-4 py-3 text-center text-sm text-white/70 transition-colors hover:bg-white/5">
                Log in
              </Link>
              <Link href="/signup" className="rounded-full bg-[#FF007F] px-4 py-3 text-center text-sm font-semibold text-white">
                Get Started Free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ── hero ────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0A0A0B] pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* bg glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF007F] opacity-[0.07] blur-[160px]" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-[#7B2FBE] opacity-[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* badge */}
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF007F]/20 bg-[#FF007F]/[0.08] px-4 py-1.5 text-xs font-medium text-[#FF007F]">
              <Sparkles className="h-3.5 w-3.5" />
              #1 Instagram Automation Platform
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Turn comments into
              <br />
              <span className="bg-gradient-to-r from-[#FF007F] via-[#D946EF] to-[#7B2FBE] bg-clip-text text-transparent">
                customers, on autopilot
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl">
              Automate Instagram DMs and comment replies with a visual flow builder.
              Capture leads, deliver content, and close sales — without lifting a finger.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2.5 rounded-full bg-[#FF007F] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_0_40px_rgba(255,0,127,0.25)] transition-all hover:bg-[#FF1A8C] hover:shadow-[0_0_60px_rgba(255,0,127,0.4)] hover:scale-[1.03] active:scale-[0.98]"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-[15px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                <Play className="h-4 w-4 text-[#FF007F]" />
                Watch demo
              </a>
            </div>
          </Reveal>

          <Reveal delay={350}>
            <p className="mt-5 text-xs text-white/30">Free forever. No credit card required.</p>
          </Reveal>
        </div>

        {/* product mockup */}
        <Reveal delay={500}>
          <div className="relative mx-auto mt-16 max-w-5xl lg:mt-20">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-[#FF007F]/20 via-[#7B2FBE]/10 to-transparent blur-2xl" />
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#111113] p-2 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
              {/* browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-white/[0.04] px-3 py-1 text-xs text-white/30">
                  ighouse.com/dashboard/flows
                </div>
              </div>

              {/* flow builder mockup */}
              <div className="grid grid-cols-12 gap-0">
                {/* sidebar */}
                <div className="col-span-3 border-r border-white/[0.06] p-4">
                  <div className="mb-4 text-xs font-semibold text-white/50">NODES</div>
                  {[
                    { icon: MousePointerClick, label: "Comment Trigger", color: "#F59E0B" },
                    { icon: MessageSquare, label: "Send DM", color: "#3B82F6" },
                    { icon: Clock, label: "Wait / Delay", color: "#8B5CF6" },
                    { icon: Users, label: "Capture Lead", color: "#10B981" },
                    { icon: Zap, label: "Condition", color: "#FF007F" },
                  ].map((node) => (
                    <div key={node.label} className="mb-2 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs text-white/60">
                      <node.icon className="h-3.5 w-3.5" style={{ color: node.color }} />
                      {node.label}
                    </div>
                  ))}
                </div>

                {/* canvas */}
                <div className="col-span-9 p-8">
                  <div className="flex flex-col items-center gap-2">
                    {/* trigger */}
                    <div className="w-72 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-4">
                      <div className="flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-semibold text-white">Comment Trigger</span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-white/40">When someone comments &quot;INFO&quot; or &quot;PRICE&quot;</p>
                    </div>

                    <div className="h-8 w-px bg-gradient-to-b from-amber-500/40 to-blue-500/40" />

                    {/* condition */}
                    <div className="w-72 rounded-xl border border-[#FF007F]/20 bg-[#FF007F]/[0.08] p-4">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[#FF007F]" />
                        <span className="text-xs font-semibold text-white">Check Keyword</span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-white/40">If comment contains &quot;PRICE&quot; → send pricing</p>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-px bg-gradient-to-b from-[#FF007F]/40 to-blue-500/40" />
                        <div className="w-56 rounded-xl border border-blue-500/20 bg-blue-500/[0.08] p-4">
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-blue-400" />
                            <span className="text-xs font-semibold text-white">Send DM</span>
                          </div>
                          <p className="mt-1.5 text-[11px] text-white/40">&quot;Hey! Here&apos;s your pricing link 🔗&quot;</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-px bg-gradient-to-b from-[#FF007F]/40 to-emerald-500/40" />
                        <div className="w-56 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-white">Capture Lead</span>
                          </div>
                          <p className="mt-1.5 text-[11px] text-white/40">Save email &amp; tag &quot;interested&quot;</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── trust bar ───────────────────────────────────────────────────── */
function TrustBar() {
  return (
    <section className="border-y border-white/[0.04] bg-[#0A0A0B] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-white/30">
            Trusted by 2,000+ creators &amp; brands worldwide
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {/* Meta / Instagram partner badges */}
            {[
              { icon: InstagramIcon, label: "Instagram API", desc: "Official Partner" },
              { icon: Shield, label: "Meta Verified", desc: "App Review Passed" },
              { icon: Lock, label: "AES-256", desc: "Encryption" },
              { icon: Globe, label: "GDPR", desc: "Compliant" },
              { icon: Zap, label: "99.9%", desc: "Uptime SLA" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2.5 text-white/30">
                <badge.icon className="h-5 w-5" />
                <div>
                  <p className="text-xs font-semibold text-white/50">{badge.label}</p>
                  <p className="text-[10px] text-white/25">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── stats ────────────────────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { value: "2K+", label: "Active creators" },
    { value: "1.2M+", label: "DMs sent" },
    { value: "500K+", label: "Leads captured" },
    { value: "<5s", label: "Avg response time" },
  ];
  return (
    <section className="bg-[#0A0A0B] py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <div className="text-center">
                <div className="text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl">
                  {s.value}
                </div>
                <p className="mt-2 text-sm text-white/40">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── features — alternating showcase ─────────────────────────────── */
const SHOWCASES = [
  {
    badge: "Comment Automation",
    title: "Turn every comment into a conversation",
    description:
      "Set keyword triggers on your posts. When someone comments, IgHouse instantly sends a personalized DM — delivering lead magnets, pricing, or links before they scroll away.",
    features: ["Keyword matching", "Auto-reply to comments", "Private reply + DM combo", "Multi-post triggers"],
    color: "#FF007F",
    mockup: "comment",
  },
  {
    badge: "Visual Flow Builder",
    title: "Build powerful automations without code",
    description:
      "Drag and drop triggers, messages, conditions, delays, and lead capture nodes onto a visual canvas. Branch logic, A/B test messages, and create funnels that convert.",
    features: ["Drag & drop builder", "Conditional branching", "Time delays", "Lead capture nodes"],
    color: "#7B2FBE",
    mockup: "flow",
  },
  {
    badge: "Live Inbox",
    title: "One inbox for every conversation",
    description:
      "See all DM conversations in one place. Pause the bot to jump in personally, tag contacts, filter by status, and never miss a hot lead again.",
    features: ["Real-time messages", "Bot pause / human takeover", "Contact tagging", "Read receipts"],
    color: "#3B82F6",
    mockup: "inbox",
  },
];

function CommentMockup() {
  return (
    <div className="space-y-3">
      {/* IG post comment */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">@sarah_fitness</p>
            <p className="mt-1 text-sm text-white/60">How much is the program? 🙋‍♀️ PRICE</p>
            <div className="mt-2 flex items-center gap-3">
              <Heart className="h-3.5 w-3.5 text-white/30" />
              <MessageSquare className="h-3.5 w-3.5 text-white/30" />
            </div>
          </div>
        </div>
      </div>
      {/* arrow */}
      <div className="flex items-center justify-center gap-2 text-[#FF007F]">
        <Zap className="h-4 w-4" />
        <span className="text-xs font-medium">Keyword detected — sending DM</span>
      </div>
      {/* DM sent */}
      <div className="rounded-xl border border-[#FF007F]/20 bg-[#FF007F]/[0.06] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FF007F] to-[#7B2FBE]">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">IgHouse Bot → @sarah_fitness</p>
            <p className="mt-1 text-sm text-white/60">
              Hey Sarah! 👋 Here&apos;s the pricing for our 12-week program: [link]
              <br />Reply &quot;YES&quot; to grab your spot!
            </p>
            <p className="mt-2 text-[10px] text-[#FF007F]/60">Delivered instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowMockup() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <MousePointerClick className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold text-white">Trigger: &quot;INFO&quot; keyword</span>
        </div>
      </div>
      <div className="h-5 w-px bg-white/10" />
      <div className="w-full rounded-lg border border-purple-500/20 bg-purple-500/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-semibold text-white">Wait 2 seconds</span>
        </div>
      </div>
      <div className="h-5 w-px bg-white/10" />
      <div className="w-full rounded-lg border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-semibold text-white">Send welcome DM</span>
        </div>
      </div>
      <div className="h-5 w-px bg-white/10" />
      <div className="flex w-full gap-3">
        <div className="flex-1 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-white">Save lead</span>
          </div>
        </div>
        <div className="flex-1 rounded-lg border border-[#FF007F]/20 bg-[#FF007F]/[0.06] px-3 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-[#FF007F]" />
            <span className="text-[11px] font-semibold text-white">Tag contact</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InboxMockup() {
  const conversations = [
    { name: "@sarah_fitness", msg: "Yes I want to join!", time: "2m", unread: true },
    { name: "@mark.design", msg: "Thanks for the info!", time: "15m", unread: false },
    { name: "@jenny.ecom", msg: "What's included?", time: "1h", unread: true },
  ];
  return (
    <div className="space-y-2">
      {conversations.map((c) => (
        <div
          key={c.name}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
            c.unread ? "border-[#FF007F]/20 bg-[#FF007F]/[0.04]" : "border-white/[0.06] bg-white/[0.02]"
          }`}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FF007F] to-[#7B2FBE]" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">{c.name}</span>
              <span className="text-[10px] text-white/30">{c.time}</span>
            </div>
            <p className="truncate text-xs text-white/40">{c.msg}</p>
          </div>
          {c.unread && <div className="h-2 w-2 rounded-full bg-[#FF007F]" />}
        </div>
      ))}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.04] px-4 py-2.5">
        <Bot className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[11px] text-white/40">Bot active — handling 12 conversations</span>
      </div>
    </div>
  );
}

function FeatureShowcase({ showcase, index }: { showcase: typeof SHOWCASES[number]; index: number }) {
  const reversed = index % 2 === 1;
  const MockupComponent = showcase.mockup === "comment" ? CommentMockup : showcase.mockup === "flow" ? FlowMockup : InboxMockup;

  return (
    <div className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-20 ${reversed ? "lg:[direction:rtl]" : ""}`}>
      <div className={reversed ? "lg:[direction:ltr]" : ""}>
        <Reveal>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: `${showcase.color}15`, color: showcase.color }}
          >
            <Sparkles className="h-3 w-3" />
            {showcase.badge}
          </div>
        </Reveal>
        <Reveal delay={100}>
          <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {showcase.title}
          </h3>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-4 text-base leading-relaxed text-white/45 lg:text-lg">
            {showcase.description}
          </p>
        </Reveal>
        <Reveal delay={300}>
          <ul className="mt-6 space-y-3">
            {showcase.features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: showcase.color }} />
                {f}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <Reveal delay={200} className={reversed ? "lg:[direction:ltr]" : ""}>
        <div className="relative">
          <div
            className="absolute -inset-4 rounded-2xl opacity-20 blur-2xl"
            style={{ backgroundColor: showcase.color }}
          />
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#111113] p-6">
            <MockupComponent />
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="bg-[#0A0A0B] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 text-center">
          <Reveal>
            <p className="mb-3 text-sm font-semibold text-[#FF007F]">Features</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] bg-clip-text text-transparent">
                grow on Instagram
              </span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/40 lg:text-lg">
              From comment triggers to lead capture, IgHouse handles the entire funnel so you can focus on creating content.
            </p>
          </Reveal>
        </div>

        <div className="space-y-24 lg:space-y-32">
          {SHOWCASES.map((s, i) => (
            <FeatureShowcase key={s.badge} showcase={s} index={i} />
          ))}
        </div>

        {/* feature grid */}
        <div className="mt-24 lg:mt-32">
          <Reveal>
            <h3 className="mb-12 text-center text-2xl font-bold text-white">And so much more</h3>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Zap, title: "Instant Responses", desc: "Sub-5-second reply times with durable job queue", color: "#F59E0B" },
              { icon: Shield, title: "Meta Compliant", desc: "24h window enforcement, GDPR-ready, full audit logs", color: "#10B981" },
              { icon: BarChart3, title: "Contact Management", desc: "Auto-tag, segment, and export your audience", color: "#8B5CF6" },
              { icon: Lock, title: "Bank-Grade Security", desc: "AES-256-GCM encryption, RLS isolation per workspace", color: "#3B82F6" },
              { icon: TrendingUp, title: "Analytics Dashboard", desc: "Track DMs sent, leads captured, and conversion rates", color: "#FF007F" },
              { icon: Globe, title: "Team Collaboration", desc: "Invite your team with role-based access control", color: "#06B6D4" },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                    style={{ backgroundColor: `${f.color}12` }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <h4 className="mb-1.5 text-sm font-semibold text-white">{f.title}</h4>
                  <p className="text-sm leading-relaxed text-white/40">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── how it works ────────────────────────────────────────────────── */
const STEPS = [
  {
    step: "1",
    title: "Connect Instagram",
    description: "Link your Business or Creator account in one click. Secure OAuth — we never see your password.",
    icon: InstagramIcon,
    color: "#FF007F",
  },
  {
    step: "2",
    title: "Build your flow",
    description: "Use the drag-and-drop builder to create triggers, messages, conditions, and lead capture steps.",
    icon: Bot,
    color: "#7B2FBE",
  },
  {
    step: "3",
    title: "Watch leads roll in",
    description: "Your automation runs 24/7. Monitor the live inbox and jump in when a hot lead needs a personal touch.",
    icon: TrendingUp,
    color: "#10B981",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-[#0F0F11] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <Reveal>
            <p className="mb-3 text-sm font-semibold text-[#FF007F]">How It Works</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Up and running in{" "}
              <span className="bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] bg-clip-text text-transparent">
                under 5 minutes
              </span>
            </h2>
          </Reveal>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 150}>
              <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                {/* step number */}
                <div
                  className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white"
                  style={{ backgroundColor: `${s.color}15` }}
                >
                  <s.icon className="h-6 w-6" style={{ color: s.color }} />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-white/30">STEP {s.step}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/40">{s.description}</p>

                {/* connector */}
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 md:block">
                    <ChevronRight className="h-5 w-5 text-white/10" />
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── testimonials ────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "IgHouse completely transformed my DM game. I went from manually responding to 50+ messages a day to having everything automated. My lead capture rate tripled in the first month.",
    name: "Priya Sharma",
    handle: "@priya.wellness",
    role: "Fitness Coach",
    avatar: "PS",
  },
  {
    quote: "The flow builder is insanely intuitive. I set up a comment-to-DM funnel for my product launch and captured 400+ leads in 48 hours. This is a must-have for any serious creator.",
    name: "Alex Kim",
    handle: "@alexkimstudio",
    role: "E-commerce Brand Owner",
    avatar: "AK",
  },
  {
    quote: "What I love most is the live inbox with human takeover. The bot handles the routine stuff, but when a high-value lead comes in, I can jump right in. Best of both worlds.",
    name: "Jordan Rivera",
    handle: "@jordanrealestate",
    role: "Real Estate Agent",
    avatar: "JR",
  },
  {
    quote: "We were paying $200/month for another tool and getting half the features. IgHouse's free tier alone covers what most creators need. The Pro plan is an absolute steal at $29.",
    name: "Maya Chen",
    handle: "@mayacreates",
    role: "Content Creator",
    avatar: "MC",
  },
  {
    quote: "Setting up took less than 5 minutes. Connected my account, built a flow, and had it running by lunchtime. The keyword triggers are incredibly accurate.",
    name: "Raj Patel",
    handle: "@rajpatel.coaching",
    role: "Business Coach",
    avatar: "RP",
  },
  {
    quote: "The fact that it's Meta-compliant and handles the 24-hour window automatically gives me total peace of mind. I don't have to worry about getting flagged or banned.",
    name: "Sophia Laurent",
    handle: "@sophiabakes",
    role: "Food Blogger",
    avatar: "SL",
  },
];

function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-[#0A0A0B] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <Reveal>
            <p className="mb-3 text-sm font-semibold text-[#FF007F]">Testimonials</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Loved by creators worldwide
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="mx-auto mt-5 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm text-white/40">4.9/5 from 500+ reviews</span>
            </div>
          </Reveal>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="mb-4 flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-white/55">&quot;{t.quote}&quot;</p>
                <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF007F] to-[#7B2FBE] text-xs font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/30">{t.role} · {t.handle}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── pricing ─────────────────────────────────────────────────────── */
function PricingSection() {
  return (
    <section id="pricing" className="relative bg-[#0F0F11] py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF007F] opacity-[0.04] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <Reveal>
            <p className="mb-3 text-sm font-semibold text-[#FF007F]">Pricing</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Start free, scale as you grow
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-5 max-w-md text-base text-white/40">
              No credit card required. No hidden fees. Upgrade when you&apos;re ready.
            </p>
          </Reveal>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
              <div>
                <h3 className="text-lg font-bold text-white">Free</h3>
                <p className="mt-1 text-sm text-white/40">Perfect for getting started</p>
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight text-white">$0</span>
                <span className="text-sm text-white/40">/month</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3.5">
                {["1 Instagram account", "3 active flows", "500 messages/month", "Live inbox", "Basic analytics", "Community support"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/55">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-white/20" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.03] py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.08] active:scale-[0.98]"
              >
                Get Started Free
              </Link>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="relative flex h-full flex-col rounded-2xl border-2 border-[#FF007F]/30 bg-gradient-to-b from-[#FF007F]/[0.06] to-transparent p-8">
              <div className="absolute -top-3 right-6 rounded-full bg-[#FF007F] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pro</h3>
                <p className="mt-1 text-sm text-white/40">For serious creators &amp; brands</p>
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight text-white">$29</span>
                <span className="text-sm text-white/40">/month</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3.5">
                {[
                  "5 Instagram accounts",
                  "Unlimited flows",
                  "Unlimited messages",
                  "Priority inbox",
                  "Human takeover",
                  "Lead export (CSV)",
                  "Advanced analytics",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/55">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FF007F]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 flex w-full items-center justify-center rounded-full bg-[#FF007F] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#FF1A8C] hover:shadow-[0_0_30px_rgba(255,0,127,0.3)] active:scale-[0.98]"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── faq ─────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "Is IgHouse compliant with Instagram/Meta's policies?",
    a: "Yes. IgHouse uses Meta's official Instagram API and has passed App Review. We enforce the 24-hour messaging window, respect opt-outs, and comply with all Meta Platform Terms.",
  },
  {
    q: "Do I need a Business or Creator account?",
    a: "Yes. Instagram's API only works with Business or Creator accounts connected to a Facebook Page. Personal accounts are not supported by Meta's API.",
  },
  {
    q: "Can I pause the bot and reply manually?",
    a: "Absolutely. Every conversation in your inbox has a human takeover toggle. Pause the bot with one click, handle the conversation personally, then re-enable automation when you're done.",
  },
  {
    q: "How fast are the automated replies?",
    a: "Most replies are sent within 2-5 seconds of the trigger event. We use a durable job queue (Inngest) to ensure zero lost messages, even under high load.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All Instagram access tokens are encrypted with AES-256-GCM. We use row-level security (RLS) to isolate workspace data, and all connections are encrypted with TLS. We're GDPR compliant with full data export and deletion support.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no commitments. Cancel your Pro subscription anytime and you'll keep access until the end of your billing period. You can also delete all your data from the settings page.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-[#0A0A0B] py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-16 text-center">
          <Reveal>
            <p className="mb-3 text-sm font-semibold text-[#FF007F]">FAQ</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Frequently asked questions
            </h2>
          </Reveal>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 60}>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:bg-white/[0.03]">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="pr-4 text-sm font-semibold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    openIndex === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-relaxed text-white/45">{faq.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── final cta ───────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="bg-[#0A0A0B] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#FF007F]/10 via-[#7B2FBE]/10 to-[#0A0A0B] p-12 text-center md:p-20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-[#FF007F] opacity-[0.08] blur-[120px]" />
              <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-[#7B2FBE] opacity-[0.08] blur-[120px]" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to automate your
                <br />
                Instagram growth?
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base text-white/45 lg:text-lg">
                Join 2,000+ creators and brands who are turning comments into customers with IgHouse.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-[#FF007F] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_0_40px_rgba(255,0,127,0.25)] transition-all hover:bg-[#FF1A8C] hover:shadow-[0_0_60px_rgba(255,0,127,0.4)] hover:scale-[1.03] active:scale-[0.98]"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/25">Free forever. No credit card required.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── footer ──────────────────────────────────────────────────────── */
function Footer() {
  const columns = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "FAQ", href: "#faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Data Deletion", href: "/api/meta/data-deletion" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Contact Us", href: "mailto:vivekmaury555@gmail.com" },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/[0.06] bg-[#0A0A0B] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#FF007F] to-[#7B2FBE]">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              Ig<span className="text-[#FF007F]">House</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/30">
              Instagram DM &amp; comment automation platform for creators and brands.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
                <InstagramIcon className="h-3.5 w-3.5 text-white/40" />
                <span className="text-xs text-white/40">Official API Partner</span>
              </div>
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/40">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/30 transition-colors hover:text-white/60"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
          <p className="text-xs text-white/20">
            &copy; 2026 IgHouse. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-white/20 transition-colors hover:text-white/40">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-white/20 transition-colors hover:text-white/40">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="bg-[#0A0A0B] text-white">
      <Navbar />
      <HeroSection />
      <TrustBar />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
