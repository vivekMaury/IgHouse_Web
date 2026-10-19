"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return pos;
}

function GlowOrb({ className }: { className: string }) {
  return <div className={`absolute rounded-full blur-[120px] opacity-30 pointer-events-none ${className}`} />;
}

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
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B0B0B]/80 backdrop-blur-xl border-b border-white/5 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          Ig<span className="text-[#FF007F]">House</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-[0_0_24px_rgba(255,0,127,0.4)] hover:scale-105"
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white md:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-b border-white/5 bg-[#0B0B0B]/95 backdrop-blur-xl md:hidden">
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
            <div className="mt-3 flex flex-col gap-2 border-t border-white/5 pt-4">
              <Link
                href="/login"
                className="rounded-lg px-4 py-3 text-center text-sm text-white/70 transition-colors hover:bg-white/5"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] px-4 py-3 text-center text-sm font-medium text-white"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  const mouse = useMousePosition();
  const heroRef = useRef<HTMLDivElement>(null);

  const getParallax = (intensity: number) => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    return {
      x: (mouse.x - window.innerWidth / 2) * intensity,
      y: (mouse.y - window.innerHeight / 2) * intensity,
    };
  };

  const p1 = getParallax(0.02);
  const p2 = getParallax(0.04);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen items-center overflow-hidden bg-[#0B0B0B] pt-20"
    >
      <GlowOrb className="left-1/4 top-1/4 h-96 w-96 bg-[#FF007F]" />
      <GlowOrb className="right-1/4 bottom-1/4 h-80 w-80 bg-[#7B2FBE]" />
      <GlowOrb className="right-1/3 top-1/2 h-64 w-64 bg-[#00D4FF]" />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col justify-center space-y-8 animate-[fadeSlideUp_0.8s_ease-out]">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#FF007F]/30 bg-[#FF007F]/10 px-4 py-1.5 text-xs font-medium text-[#FF007F]">
            <Zap className="h-3 w-3" />
            Automate Instagram in minutes
          </div>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Social smarter,
            <br />
            <span className="bg-gradient-to-r from-[#FF007F] via-[#D946EF] to-[#7B2FBE] bg-clip-text text-transparent">
              not harder.
            </span>
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-white/50">
            Turn Instagram comments into automated sales funnels. Build visual flows
            that reply, send DMs, capture leads, and qualify prospects — all on autopilot.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_rgba(255,0,127,0.3)] transition-all hover:shadow-[0_0_48px_rgba(255,0,127,0.5)] hover:scale-105"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-7 py-3.5 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:text-white hover:bg-white/5"
            >
              See how it works
            </a>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0B0B0B] bg-gradient-to-br from-[#FF007F] to-[#7B2FBE] text-[10px] font-bold text-white"
                >
                  {["AK", "MR", "JS", "PV"][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xs text-white/40">Loved by 2,000+ creators</p>
            </div>
          </div>
        </div>

        <div className="relative hidden lg:flex lg:items-center lg:justify-center">
          <div
            className="animate-[fadeSlideUp_1s_ease-out_0.3s_both]"
            style={{ transform: `translate(${p1.x}px, ${p1.y}px)` }}
          >
            <div className="relative w-[380px] rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-white/30">IgHouse Flow Builder</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                  <MousePointerClick className="h-4 w-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-medium text-white">Comment Trigger</p>
                    <p className="text-[10px] text-white/40">Keyword: &quot;PRICE&quot;</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="h-6 w-px bg-gradient-to-b from-amber-500/50 to-blue-500/50" />
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                  <Send className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-xs font-medium text-white">Send DM</p>
                    <p className="text-[10px] text-white/40">&quot;Here&apos;s your pricing link!&quot;</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="h-6 w-px bg-gradient-to-b from-blue-500/50 to-emerald-500/50" />
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-medium text-white">Capture Lead</p>
                    <p className="text-[10px] text-white/40">Save email &amp; tag &quot;interested&quot;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute -right-8 top-8 animate-[fadeSlideUp_1s_ease-out_0.6s_both]"
            style={{ transform: `translate(${p2.x}px, ${p2.y}px)` }}
          >
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
                  <Zap className="h-3 w-3 text-green-400" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-white">Lead captured</p>
                  <p className="text-[10px] text-white/40">john@email.com</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute -left-4 bottom-12 animate-[fadeSlideUp_1s_ease-out_0.9s_both]"
            style={{ transform: `translate(${p2.x * -1}px, ${p2.y * -1}px)` }}
          >
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF007F]/20">
                  <MessageSquare className="h-3 w-3 text-[#FF007F]" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-white">+47 DMs sent</p>
                  <p className="text-[10px] text-white/40">Last 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B0B0B] to-transparent" />
    </section>
  );
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Comment-to-DM Automation",
    description: "Auto-reply to comments with DMs. Deliver lead magnets, pricing, and links instantly when keywords are detected.",
    color: "#FF007F",
  },
  {
    icon: Bot,
    title: "Visual Flow Builder",
    description: "Drag-and-drop builder with triggers, conditions, delays, and lead capture. No coding required.",
    color: "#7B2FBE",
  },
  {
    icon: Users,
    title: "Live Inbox & Human Takeover",
    description: "Real-time shared inbox with bot pause. Step in anytime to handle conversations personally.",
    color: "#00D4FF",
  },
  {
    icon: Zap,
    title: "Instant Webhook Processing",
    description: "Sub-5-second response times. Durable job queue ensures zero lost messages even under high load.",
    color: "#F59E0B",
  },
  {
    icon: Shield,
    title: "Meta Compliant & Secure",
    description: "24-hour window enforcement, AES-256-GCM encryption, RLS isolation, and full audit logging.",
    color: "#10B981",
  },
  {
    icon: BarChart3,
    title: "Contacts & Lead Capture",
    description: "Auto-tag contacts, capture emails and phone numbers, and build segmented audiences from conversations.",
    color: "#8B5CF6",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative bg-[#0B0B0B] py-24">
      <GlowOrb className="-left-32 top-1/2 h-72 w-72 bg-[#7B2FBE]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium text-[#FF007F]">Features</p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to
            <br />
            <span className="bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] bg-clip-text text-transparent">
              automate Instagram growth
            </span>
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(255,0,127,0.05)] hover:-translate-y-1"
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon className="h-5 w-5" style={{ color: feature.color }} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/40">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    step: "01",
    title: "Connect Your Instagram",
    description: "Link your Instagram Business or Creator account with one click via secure OAuth.",
  },
  {
    step: "02",
    title: "Build Your Flow",
    description: "Use the visual drag-and-drop builder to create comment triggers, DM responses, conditions, and lead capture.",
  },
  {
    step: "03",
    title: "Watch Leads Roll In",
    description: "Your automation runs 24/7. Monitor conversations in the live inbox and step in when needed.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-[#0B0B0B] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium text-[#FF007F]">How It Works</p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Up and running in{" "}
            <span className="bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] bg-clip-text text-transparent">
              3 simple steps
            </span>
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-[#FF007F]/30 to-transparent md:block" />
              )}
              <div className="relative rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FF007F] to-[#7B2FBE] text-lg font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mb-3 text-lg font-semibold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/40">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="relative bg-[#0B0B0B] py-24">
      <GlowOrb className="left-1/2 top-0 h-80 w-80 -translate-x-1/2 bg-[#FF007F]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium text-[#FF007F]">Pricing</p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start free, scale as you grow
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/40">
            No credit card required. Upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8">
            <h3 className="text-lg font-semibold text-white">Free</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-sm text-white/40">/month</span>
            </div>
            <ul className="mt-8 space-y-3">
              {["1 Instagram account", "3 active flows", "500 messages/month", "Live inbox", "Community support"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                  <ChevronRight className="h-3.5 w-3.5 text-[#FF007F]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 flex w-full items-center justify-center rounded-full border border-white/10 py-3 text-sm font-medium text-white transition-all hover:bg-white/5"
            >
              Get Started
            </Link>
          </div>

          <div className="relative rounded-xl border border-[#FF007F]/30 bg-gradient-to-b from-[#FF007F]/5 to-transparent p-8">
            <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] px-3 py-1 text-[10px] font-bold text-white">
              POPULAR
            </div>
            <h3 className="text-lg font-semibold text-white">Pro</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">$29</span>
              <span className="text-sm text-white/40">/month</span>
            </div>
            <ul className="mt-8 space-y-3">
              {["5 Instagram accounts", "Unlimited flows", "Unlimited messages", "Priority inbox", "Human takeover", "Lead export", "Priority support"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                  <ChevronRight className="h-3.5 w-3.5 text-[#FF007F]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] py-3 text-sm font-semibold text-white transition-all hover:shadow-[0_0_24px_rgba(255,0,127,0.4)] hover:scale-[1.02]"
            >
              Start Pro Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative bg-[#0B0B0B] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-[#FF007F]/10 via-[#7B2FBE]/10 to-[#00D4FF]/10 p-12 text-center md:p-20">
          <GlowOrb className="left-1/4 top-0 h-64 w-64 bg-[#FF007F]" />
          <GlowOrb className="right-1/4 bottom-0 h-48 w-48 bg-[#7B2FBE]" />

          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to automate your Instagram?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/40">
              Join thousands of creators and brands turning comments into customers.
            </p>
            <Link
              href="/signup"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF007F] to-[#7B2FBE] px-8 py-4 text-sm font-semibold text-white shadow-[0_0_32px_rgba(255,0,127,0.3)] transition-all hover:shadow-[0_0_48px_rgba(255,0,127,0.5)] hover:scale-105"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const columns = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "How It Works", href: "#how-it-works" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Contact", href: "mailto:vivekmaury555@gmail.com" },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/5 bg-[#0B0B0B] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <Link href="/" className="text-xl font-bold text-white">
              Ig<span className="text-[#FF007F]">House</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/30">
              Instagram DM &amp; comment automation platform for creators and brands.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
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

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-xs text-white/20">
            &copy; 2026 IgHouse. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-white/20 hover:text-white/40">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-white/20 hover:text-white/40">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="bg-[#0B0B0B] text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
