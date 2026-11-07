import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Bot,
  Check,
  Clock3,
  LockKeyhole,
  Mail,
  MessageCircle,
  MousePointer2,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Timer,
  TrendingUp,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/icons";
import { BrandLogo } from "@/components/logo";
import {
  JsonLd,
  organizationSchema,
  softwareApplicationSchema,
  faqPageSchema,
} from "@/components/seo/JsonLd";
import UseCaseTabs from "./use-case-tabs";

const siteUrl = "https://iginbox.com";
const description =
  "Turn Instagram comments and story mentions into automated DMs, sales funnels, and qualified leads — all on autopilot with Meta-compliant official APIs.";

export const metadata: Metadata = {
  title: "Instagram Comment & DM Automation",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Turn Instagram Comments & Stories into Sales | IgInbox",
    description,
    url: siteUrl,
    siteName: "IgInbox",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn Instagram Comments & Stories into Sales | IgInbox",
    description,
  },
};

/* -------------------------------------------------------------------------- */
/*  FAQ data                                                                  */
/* -------------------------------------------------------------------------- */

const faqs = [
  {
    question: "Is my Instagram account safe with IgInbox?",
    answer:
      "Yes. IgInbox uses only Meta's official Instagram APIs — we never ask for your Instagram password or use unofficial access methods. Your access tokens are encrypted with AES-256-GCM, and every workspace is isolated with row-level security so no other account can access your data.",
  },
  {
    question: "Is IgInbox compliant with Meta's platform policies?",
    answer:
      "Absolutely. IgInbox enforces the 24-hour standard messaging window, limits one private reply per comment, respects opt-out keywords like STOP, and applies per-account send caps with humanised delays. The platform is designed for Meta App Review compliance from day one.",
  },
  {
    question: "How long does it take to set up?",
    answer:
      "Under 10 minutes. Connect your Instagram professional account through the official OAuth flow, pick a starter template or build a flow from scratch in the visual builder, and publish. Your first automated DM can be live in minutes.",
  },
  {
    question: "Do I need an Instagram professional account?",
    answer:
      "Yes. Instagram automation requires a Business or Creator account and the permissions provided by Instagram's official APIs. If you have a personal account, you can switch to a professional account for free in your Instagram settings.",
  },
  {
    question: "Can my team take over conversations?",
    answer:
      "Yes. IgInbox includes a real-time shared inbox with human takeover — when a team member sends a message, automation pauses automatically. The inbox shows the full context including which flow triggered the conversation, tags, and lead data.",
  },
  {
    question: "What happens when someone replies outside the 24-hour window?",
    answer:
      "IgInbox respects Instagram's 24-hour standard messaging window. If the window has closed, the inbox shows a clear indicator and blocks automated sends. Human agents can still reply using Meta's approved human-agent tag where eligible.",
  },
  {
    question: "Can I delete my data at any time?",
    answer:
      "Yes. You can delete all data from your dashboard (Settings → Danger Zone), by disconnecting IgInbox from Instagram settings (triggers Meta's automatic deletion callback), or by emailing info@iginbox.com. Deletion is permanent and backups are purged within 30 days.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Shared components                                                         */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
        {detail}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                    */
/* -------------------------------------------------------------------------- */

function Navbar() {
  const links = [
    ["How it works", "#how-it-works"],
    ["Features", "#features"],
    ["Use cases", "#use-cases"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"],
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl border border-white/[0.09] bg-[#101014]/80 px-4 shadow-[0_8px_40px_rgba(0,0,0,.2)] backdrop-blur-xl sm:px-5">
        <Link href="/" aria-label="IgInbox home" className="flex items-center">
          <BrandLogo size="default" />
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-[13px] text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-300 transition hover:text-white sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-semibold text-zinc-950 transition hover:bg-pink-100 sm:px-4"
          >
            Get started <ArrowUpRight className="size-3.5" />
          </Link>
          <details className="relative md:hidden">
            <summary
              aria-label="Open navigation menu"
              className="flex size-10 list-none cursor-pointer items-center justify-center rounded-xl border border-white/10 text-white [&::-webkit-details-marker]:hidden"
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-1">
                <span className="h-px w-4 bg-current" />
                <span className="h-px w-4 bg-current" />
              </span>
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute right-0 top-12 flex w-52 flex-col rounded-xl border border-white/10 bg-[#121216] p-2 shadow-xl"
            >
              {links.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/login"
                className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
              >
                Log in
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero canvas + phone                                                       */
/* -------------------------------------------------------------------------- */

function FlowNode({
  icon,
  eyebrow,
  title,
  detail,
  color,
  className = "",
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  detail: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`flow-node absolute z-10 w-48 rounded-xl border border-white/10 bg-[#17171d]/95 p-3.5 shadow-2xl backdrop-blur ${className}`}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className={`flex size-7 items-center justify-center rounded-lg ${color}`}
        >
          {icon}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[.14em] text-zinc-500">
          {eyebrow}
        </span>
      </div>
      <p className="text-[12px] font-semibold text-zinc-100">{title}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
        {detail}
      </p>
    </div>
  );
}

function HeroCanvas() {
  return (
    <div className="hero-canvas relative h-[420px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0e12] sm:h-[400px]">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
      <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#14151a]/90 px-3 py-2 text-[10px] text-zinc-400">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        Product launch flow{" "}
        <span className="ml-2 rounded bg-emerald-400/10 px-1.5 py-0.5 text-emerald-300">
          Published
        </span>
      </div>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 660 400"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M209 135 C260 135 258 201 310 201"
          stroke="url(#flow-a)"
          strokeWidth="2"
        />
        <path
          d="M440 201 C473 201 470 132 500 132"
          stroke="url(#flow-b)"
          strokeWidth="2"
        />
        <path
          d="M440 210 C473 210 470 285 500 285"
          stroke="url(#flow-c)"
          strokeWidth="2"
        />
        <circle r="3" fill="#f472b6">
          <animateMotion
            dur="3.5s"
            repeatCount="indefinite"
            path="M209 135 C260 135 258 201 310 201"
          />
        </circle>
        <defs>
          <linearGradient
            id="flow-a"
            x1="209"
            y1="135"
            x2="310"
            y2="201"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f59e0b" />
            <stop offset="1" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient
            id="flow-b"
            x1="440"
            y1="201"
            x2="500"
            y2="132"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f472b6" />
            <stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient
            id="flow-c"
            x1="440"
            y1="210"
            x2="500"
            y2="285"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f472b6" />
            <stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <FlowNode
        icon={<MessageCircle className="size-3.5" />}
        eyebrow="Instagram comment"
        title={"“GUIDE” detected"}
        detail="On any post or reel"
        color="bg-amber-400/15 text-amber-300"
        className="flow-node-trigger left-[4%] top-[29%] sm:left-[9%]"
      />
      <FlowNode
        icon={<Zap className="size-3.5" />}
        eyebrow="Keyword match"
        title="Send the right reply"
        detail="Personalized to the comment"
        color="bg-pink-400/15 text-pink-300"
        className="flow-node-condition left-[38%] top-[47%] sm:left-[39%]"
      />
      <FlowNode
        icon={<Send className="size-3.5" />}
        eyebrow="Private message"
        title="Deliver the guide"
        detail="Start a helpful conversation"
        color="bg-blue-400/15 text-blue-300"
        className="flow-node-dm right-[3%] top-[17%] sm:right-[8%]"
      />
      <FlowNode
        icon={<Users className="size-3.5" />}
        eyebrow="Lead capture"
        title="Keep the conversation going"
        detail="Organize every new contact"
        color="bg-emerald-400/15 text-emerald-300"
        className="flow-node-lead right-[3%] top-[63%] sm:right-[8%]"
      />
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 text-[10px] text-zinc-600">
        <MousePointer2 className="size-3" /> Visual flow preview
      </div>
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="phone-float relative mx-auto w-[212px] rounded-[2rem] border border-white/15 bg-[#111116] p-2 shadow-[0_25px_80px_rgba(0,0,0,.55)] sm:w-[228px]">
      <div className="overflow-hidden rounded-[1.55rem] bg-[#f7f6f8]">
        <div className="flex h-8 items-center justify-center bg-white">
          <span className="h-1 w-12 rounded-full bg-zinc-300" />
        </div>
        <div className="flex items-center gap-2 border-y border-zinc-100 bg-white px-3 py-2.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-orange-400 text-white">
            <Instagram className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold text-zinc-800">
              yourbrand
            </span>
            <span className="block text-[8px] text-zinc-400">
              Professional account
            </span>
          </span>
          <span className="text-zinc-500">&middot;&middot;&middot;</span>
        </div>
        <div className="flex h-[205px] flex-col justify-end gap-2.5 bg-[#f7f6f8] px-3 py-4 sm:h-[225px]">
          <p className="self-center pb-1 text-[8px] text-zinc-400">
            Today 10:42 AM
          </p>
          <div className="max-w-[82%] self-start rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[9px] leading-relaxed text-zinc-700 shadow-sm">
            Hey! I saw your comment. Here&apos;s the guide you asked for
          </div>
          <div className="max-w-[82%] self-end rounded-2xl rounded-br-sm bg-gradient-to-br from-fuchsia-500 to-purple-600 px-3 py-2 text-[9px] leading-relaxed text-white">
            This is exactly what I needed. Thank you!
          </div>
          <div className="max-w-[82%] self-start rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[9px] leading-relaxed text-zinc-700 shadow-sm">
            So glad it helps! Want more tips like this?
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2.5">
          <span className="flex-1 rounded-full border border-zinc-200 px-3 py-1.5 text-[8px] text-zinc-400">
            Message...
          </span>
          <Send className="size-3 text-fuchsia-500" />
        </div>
        <div className="h-3 bg-white" />
      </div>
      <span className="absolute -right-5 top-16 flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-[#17171d] text-pink-300 shadow-xl sm:-right-6">
        <MessageCircle className="size-4" />
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  1. Hero                                                                   */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-36 sm:px-8 sm:pt-44 lg:pb-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(217,70,239,.13),transparent_55%)]" />
      <div className="pointer-events-none absolute left-1/2 top-32 -z-10 size-[420px] -translate-x-1/2 rounded-full bg-pink-500/[0.07] blur-[130px]" />
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          {/* Trust badge */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-2 text-[11px] font-medium text-emerald-200">
            <ShieldCheck className="size-3.5 text-emerald-300" />
            Meta API Compliant &amp; Secure
            <span className="h-3 w-px bg-emerald-300/20" />
            <LockKeyhole className="size-3" />
            AES-256 Encrypted
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-.045em] text-white sm:text-6xl lg:text-[76px]">
            Turn Instagram comments &amp; stories into{" "}
            <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              sales automatically
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
            Every comment, story mention, and DM is a sales opportunity.
            IgInbox sends the right reply in under 5 seconds, captures leads,
            and lets your team step in when it matters — all through
            Meta&apos;s official API.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_0_32px_rgba(236,72,153,.3)] transition hover:shadow-[0_0_48px_rgba(236,72,153,.45)]"
            >
              <Instagram className="size-4" />
              Connect Instagram Free
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#flow-demo"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07]"
            >
              <span className="flex size-5 items-center justify-center rounded-full border border-white/20 text-[9px]">
                ▶
              </span>
              See Live Demo
            </a>
          </div>

          {/* Social proof row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="flex -space-x-1.5">
                {["bg-pink-400", "bg-violet-400", "bg-blue-400", "bg-emerald-400"].map((color) => (
                  <span key={color} className={`inline-block size-5 rounded-full ${color} ring-2 ring-[#09090c]`} />
                ))}
              </span>
              <span className="ml-1">500+ creators</span>
            </span>
            <span className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className="size-3 fill-amber-300 text-amber-300" />
              ))}
              <span className="ml-0.5">4.9/5 avg</span>
            </span>
            <span>No credit card required</span>
          </div>
        </div>

        {/* Canvas + phone visual */}
        <div className="relative mx-auto mt-16 grid max-w-6xl items-center gap-5 md:mt-20 md:grid-cols-[1fr_228px] lg:gap-8">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-fuchsia-500/[0.07] blur-3xl" />
            <HeroCanvas />
          </div>
          <div className="relative z-10 hidden md:block">
            <PhonePreview />
          </div>
          <div className="absolute -bottom-7 right-6 z-20 hidden items-center gap-2 rounded-xl border border-white/10 bg-[#17171d] px-3 py-2.5 text-[11px] text-zinc-300 shadow-xl sm:flex md:right-[210px]">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.7)]" />
            Flow is running
          </div>
        </div>
        <div className="mt-8 md:hidden">
          <PhonePreview />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Trust strip                                                               */
/* -------------------------------------------------------------------------- */

function TrustStrip() {
  const items = [
    { icon: Instagram, label: "Instagram-first platform" },
    { icon: ShieldCheck, label: "Meta policy compliant" },
    { icon: LockKeyhole, label: "AES-256 token encryption" },
    { icon: Timer, label: "DMs in under 5 seconds" },
    { icon: Users, label: "Human handoff built in" },
  ];

  return (
    <section
      aria-label="Platform highlights"
      className="border-y border-white/[0.06] bg-white/[0.015] px-5 py-7 sm:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-4">
        {items.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 text-xs font-medium text-zinc-500"
          >
            <Icon className="size-4 text-zinc-400" strokeWidth={1.7} /> {label}
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  2. Before / After                                                         */
/* -------------------------------------------------------------------------- */

function BeforeAfter() {
  return (
    <section className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Why automate"
          title="Stop losing sales to unanswered comments"
          detail="Most creators and brands reply too late — or not at all. IgInbox closes the gap between interest and action."
        />

        <div className="grid gap-4 md:grid-cols-2">
          {/* BEFORE */}
          <div className="relative overflow-hidden rounded-2xl border border-red-400/15 bg-red-400/[0.03] p-7 sm:p-8">
            <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-red-500/[0.06] blur-[60px]" />
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-400/10 px-3 py-1.5 text-[11px] font-semibold text-red-300">
                <X className="size-3" /> Without IgInbox
              </div>
              <h3 className="text-lg font-semibold text-white">
                Manual replies, missed opportunities
              </h3>
              <ul className="mt-5 space-y-3.5">
                {[
                  ["Drowning in DMs", "Manually copying the same reply to every commenter, one by one"],
                  ["Sales lost while you sleep", "Comments at 2 AM go cold before you wake up"],
                  ["No lead capture", "Interested followers slip away with no email, no tag, no follow-up"],
                  ["Zero visibility", "No idea which posts drive leads or which conversations need attention"],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-400/10">
                      <X className="size-3 text-red-400" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{t}</p>
                      <p className="mt-0.5 text-xs leading-5 text-zinc-500">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AFTER */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.03] p-7 sm:p-8">
            <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-emerald-500/[0.06] blur-[60px]" />
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
                <Check className="size-3" /> With IgInbox
              </div>
              <h3 className="text-lg font-semibold text-white">
                Automated replies, 24/7 conversions
              </h3>
              <ul className="mt-5 space-y-3.5">
                {[
                  ["Smart replies in seconds", "Keyword triggers fire personalised DMs in under 5 seconds, day or night"],
                  ["Sales on autopilot", "Every comment, story mention, and keyword becomes a qualified lead"],
                  ["Automatic lead capture", "Emails, tags, and custom fields collected and organised without lifting a finger"],
                  ["Full visibility", "See every conversation, which flow triggered it, and where each lead stands"],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10">
                      <Check className="size-3 text-emerald-400" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{t}</p>
                      <p className="mt-0.5 text-xs leading-5 text-zinc-500">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  3. Three steps to go live                                                 */
/* -------------------------------------------------------------------------- */

function ThreeSteps() {
  const steps = [
    {
      number: "01",
      icon: Instagram,
      title: "Connect your Instagram Business account",
      text: "One-click OAuth through Meta's official login. No passwords shared, no unofficial access — your tokens are encrypted with AES-256-GCM from the first second.",
      accent: "from-pink-500/20 to-fuchsia-500/20",
      ring: "ring-pink-400/20",
    },
    {
      number: "02",
      icon: Workflow,
      title: "Build or pick a Quick Flow",
      text: "Choose from starter templates (lead magnet, giveaway, product link) or drag-and-drop your own in the visual builder. Triggers, messages, conditions, delays — done in minutes.",
      accent: "from-violet-500/20 to-blue-500/20",
      ring: "ring-violet-400/20",
    },
    {
      number: "03",
      icon: TrendingUp,
      title: "Watch DMs and sales flow on autopilot",
      text: "Hit publish and your flow goes live. Every matching comment triggers a DM in under 5 seconds. Track leads in the inbox, and step in when a human touch is best.",
      accent: "from-emerald-500/20 to-cyan-500/20",
      ring: "ring-emerald-400/20",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="border-y border-white/[0.05] bg-[#0d0d11] px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="3 simple steps"
          title="Go live in under 10 minutes"
          detail="No code, no complicated setup. Connect, build, and publish — your first automated DM is minutes away."
        />

        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connecting line */}
          <div className="absolute left-0 right-0 top-[72px] hidden h-px bg-gradient-to-r from-pink-400/30 via-violet-400/30 to-emerald-400/30 md:block" />

          {steps.map(({ number, icon: Icon, title, text, accent, ring }) => (
            <article
              key={number}
              className="group relative rounded-2xl border border-white/[0.07] bg-[#111116] p-7 transition hover:border-white/[0.14]"
            >
              {/* Step number dot */}
              <div className="mb-6 flex items-center justify-between">
                <span
                  className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} ring-1 ${ring}`}
                >
                  <Icon className="size-6 text-white" strokeWidth={1.6} />
                </span>
                <span className="flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] font-mono text-xs text-zinc-500">
                  {number}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
              {number !== "03" && (
                <ArrowDown className="mt-6 size-4 text-zinc-700 md:hidden" />
              )}
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-pink-100"
          >
            Start building your flow
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  4. Feature grid — glassmorphism                                           */
/* -------------------------------------------------------------------------- */

function Features() {
  const features = [
    {
      icon: MessageCircle,
      title: "Auto-DM on Comments",
      text: "Set keyword triggers on any post or reel. When someone comments the magic word, IgInbox sends a personalised DM in under 5 seconds — automatically.",
      hue: "text-pink-300 bg-pink-300/10",
      glow: "group-hover:shadow-[0_0_40px_rgba(244,114,182,.08)]",
    },
    {
      icon: AtSign,
      title: "Story Mention Triggers",
      text: "When someone mentions your account in their story, trigger a thank-you DM, a discount code, or a lead capture flow — no manual monitoring needed.",
      hue: "text-violet-300 bg-violet-300/10",
      glow: "group-hover:shadow-[0_0_40px_rgba(167,139,250,.08)]",
    },
    {
      icon: Bot,
      title: "24/7 AI Lead Capture",
      text: "Capture emails, phone numbers, and custom fields through conversational flows that run around the clock. Every lead is tagged, scored, and ready for follow-up.",
      hue: "text-emerald-300 bg-emerald-300/10",
      glow: "group-hover:shadow-[0_0_40px_rgba(52,211,153,.08)]",
    },
    {
      icon: Workflow,
      title: "Visual Flow Builder",
      text: "Drag-and-drop canvas with triggers, messages, conditions, delays, and branching. Build complex funnels visually — no code, no confusion.",
      hue: "text-blue-300 bg-blue-300/10",
      glow: "group-hover:shadow-[0_0_40px_rgba(96,165,250,.08)]",
    },
    {
      icon: Activity,
      title: "Shared Team Inbox",
      text: "Real-time conversation view for your whole team. See which flow brought someone in, their tags and lead data, and step in with full context.",
      hue: "text-amber-300 bg-amber-300/10",
      glow: "group-hover:shadow-[0_0_40px_rgba(252,211,77,.08)]",
    },
    {
      icon: ShieldCheck,
      title: "Meta Policy Engine",
      text: "24-hour messaging window enforcement, one private reply per comment, opt-out handling, and per-account send caps — compliance built into the core.",
      hue: "text-cyan-300 bg-cyan-300/10",
      glow: "group-hover:shadow-[0_0_40px_rgba(34,211,238,.08)]",
    },
  ];

  return (
    <section id="features" className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Powerful features"
          title="Everything you need to convert on Instagram"
          detail="From comment triggers to AI lead capture — a complete automation engine built on Meta's official APIs."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text, hue, glow }) => (
            <article
              key={title}
              className={`group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.04] ${glow}`}
            >
              <span
                className={`mb-5 flex size-11 items-center justify-center rounded-xl ${hue} ring-1 ring-white/[0.06]`}
              >
                <Icon className="size-5" strokeWidth={1.7} />
              </span>
              <h3 className="text-[15px] font-semibold text-zinc-100">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Flow demo (kept from original)                                            */
/* -------------------------------------------------------------------------- */

function FlowDemo() {
  return (
    <section
      id="flow-demo"
      className="border-y border-white/[0.05] bg-[#0d0d11] px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">
            See a flow in action
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">
            One comment. A sale in motion.
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
            A post gets a comment with your keyword. IgInbox fires a DM in
            under 5 seconds, captures the lead, and your team sees the full
            conversation in the inbox.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              "Triggers on comments, stories, and DM keywords",
              "Personalised replies with dynamic variables",
              "Human takeover with one click",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-sm text-zinc-300"
              >
                <Check className="size-4 text-emerald-300" /> {item}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-pink-200"
          >
            Create your first flow <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#101015] p-3 shadow-2xl sm:p-5">
          <div className="mb-5 flex items-center justify-between border-b border-white/[0.07] px-2 pb-4">
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                Free guide delivery
              </p>
              <p className="mt-1 text-[10px] text-zinc-600">
                Comment-to-DM &middot; Instagram
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-300" /> Active
            </span>
          </div>
          <div className="relative grid min-h-[270px] grid-cols-2 gap-x-6 gap-y-4 overflow-hidden px-2 pb-2 sm:grid-cols-4 sm:items-center sm:gap-3">
            <div className="flow-demo-line absolute left-[19%] right-[18%] top-[31%] hidden h-px bg-gradient-to-r from-amber-300/60 via-pink-300/50 to-blue-300/60 sm:block" />
            <div className="flow-demo-line absolute bottom-[31%] left-[19%] right-[18%] hidden h-px bg-gradient-to-r from-amber-300/60 via-pink-300/50 to-emerald-300/60 sm:block" />
            {[
              {
                tag: "TRIGGER",
                name: "Comment says",
                value: "“GUIDE”",
                color: "border-amber-300/20 bg-amber-300/[0.06]",
                dot: "bg-amber-300",
              },
              {
                tag: "REPLY",
                name: "Public response",
                value: "Check your DMs",
                color: "border-pink-300/20 bg-pink-300/[0.06]",
                dot: "bg-pink-300",
              },
              {
                tag: "MESSAGE",
                name: "Send a DM",
                value: "Here’s your guide",
                color: "border-blue-300/20 bg-blue-300/[0.06]",
                dot: "bg-blue-300",
              },
              {
                tag: "CONTACT",
                name: "Add a tag",
                value: "Guide requested",
                color: "border-emerald-300/20 bg-emerald-300/[0.06]",
                dot: "bg-emerald-300",
              },
            ].map((node) => (
              <div
                key={node.tag}
                className={`relative z-10 rounded-xl border p-3 ${node.color}`}
              >
                <div className="mb-4 flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${node.dot}`} />
                  <span className="text-[8px] font-semibold tracking-[.12em] text-zinc-500">
                    {node.tag}
                  </span>
                </div>
                <p className="text-[10px] font-medium text-zinc-300">
                  {node.name}
                </p>
                <p className="mt-1 text-[9px] text-zinc-500">{node.value}</p>
              </div>
            ))}
          </div>
          <details className="group border-t border-white/[0.07] pt-3">
            <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-2 text-xs font-medium text-zinc-300 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-pink-300/10 text-pink-200">
                  ▶
                </span>{" "}
                Preview the conversation
              </span>
              <span className="text-zinc-600 transition group-open:rotate-180">
                ⌄
              </span>
            </summary>
            <div className="mx-2 mb-2 mt-2 space-y-2 rounded-xl bg-black/20 p-3 text-[11px]">
              <p className="max-w-[80%] rounded-xl rounded-bl-sm bg-white/[0.06] p-2.5 text-zinc-300">
                Hey! Thanks for commenting. Here&apos;s the guide you asked for
              </p>
              <p className="ml-auto max-w-[75%] rounded-xl rounded-br-sm bg-fuchsia-500/20 p-2.5 text-pink-100">
                Got it, thanks!
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inbox preview (kept from original)                                        */
/* -------------------------------------------------------------------------- */

function InboxPreview() {
  const conversations = [
    {
      initials: "AM",
      name: "Alex Morgan",
      text: "That's so helpful, thank you!",
      time: "now",
      tag: "Guide",
      active: true,
    },
    {
      initials: "JL",
      name: "Jordan Lee",
      text: "Do you have this in another color?",
      time: "2m",
      tag: "Product question",
      active: false,
    },
    {
      initials: "SK",
      name: "Sam Kim",
      text: "I'd love to learn more.",
      time: "8m",
      tag: "New lead",
      active: false,
    },
  ];

  return (
    <section className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="order-2 rounded-2xl border border-white/[0.08] bg-[#111116] p-3 shadow-2xl sm:p-5 lg:order-1">
          <div className="flex min-h-[340px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c10]">
            <div className="w-[43%] border-r border-white/[0.06] sm:w-[40%]">
              <div className="flex items-center justify-between px-3 py-3 sm:px-4">
                <span className="text-xs font-semibold text-zinc-200">
                  Inbox
                </span>
                <span className="rounded-full bg-pink-400/10 px-2 py-0.5 text-[9px] text-pink-200">
                  3 new
                </span>
              </div>
              <div className="space-y-1 px-1.5 sm:px-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.name}
                    className={`rounded-lg p-2.5 ${conversation.active ? "bg-white/[0.07]" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/30 to-pink-400/30 text-[8px] font-semibold text-zinc-200">
                        {conversation.initials}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-zinc-300">
                        {conversation.name}
                      </span>
                      <span className="text-[8px] text-zinc-600">
                        {conversation.time}
                      </span>
                    </div>
                    <p className="mt-2 truncate pl-9 text-[8px] text-zinc-500">
                      {conversation.text}
                    </p>
                    <span className="ml-9 mt-2 inline-block rounded bg-white/[0.05] px-1.5 py-0.5 text-[7px] text-zinc-500">
                      {conversation.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/30 to-pink-400/30 text-[8px] font-semibold text-zinc-200">
                    AM
                  </span>
                  <span className="text-[9px] font-medium text-zinc-300">
                    Alex Morgan
                  </span>
                </div>
                <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-[8px] text-emerald-300">
                  Automation on
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-end gap-3 p-3 sm:p-4">
                <p className="self-center pb-2 text-[8px] text-zinc-600">
                  Today &middot; Instagram
                </p>
                <p className="max-w-[80%] self-start rounded-xl rounded-bl-sm bg-white/[0.06] p-2.5 text-[9px] leading-relaxed text-zinc-300">
                  Hey! Here&apos;s the guide you asked for. Hope you find it
                  useful!
                </p>
                <p className="max-w-[75%] self-end rounded-xl rounded-br-sm bg-fuchsia-400/15 p-2.5 text-[9px] leading-relaxed text-pink-100">
                  That&apos;s so helpful, thank you!
                </p>
                <p className="max-w-[80%] self-start rounded-xl rounded-bl-sm bg-white/[0.06] p-2.5 text-[9px] leading-relaxed text-zinc-300">
                  You&apos;re welcome! Let us know if you have any questions.
                </p>
              </div>
              <div className="m-2 rounded-lg border border-white/[0.07] px-3 py-2 text-[8px] text-zinc-600">
                Reply to conversation...
              </div>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">
            Shared team inbox
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">
            Automation that still feels human.
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
            See the full conversation, know which flow brought someone in, and
            take over when they need a real person.
          </p>
          <div className="mt-7 space-y-4">
            {[
              [
                "One shared view",
                "Keep comments and DMs from slipping through the cracks.",
              ],
              [
                "Context at a glance",
                "Understand the trigger and recent messages before replying.",
              ],
              [
                "Your team stays in control",
                "Pause automation and respond personally whenever needed.",
              ],
            ].map(([title, text]) => (
              <div key={title} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Social proof                                                              */
/* -------------------------------------------------------------------------- */

function Testimonials() {
  const quotes = [
    {
      quote:
        "I set up a comment-to-DM flow in 5 minutes and had 40 new leads by the next morning. IgInbox just works.",
      role: "Creator, 120K followers",
      initials: "CR",
    },
    {
      quote:
        "Our product question response time went from hours to seconds. Customers get answers instantly and we close more sales.",
      role: "E-commerce brand owner",
      initials: "SB",
    },
    {
      quote:
        "Managing 8 client accounts used to be chaos. Now every client has their own workspace and the inbox keeps everything organised.",
      role: "Agency founder",
      initials: "AT",
    },
  ];

  return (
    <section
      id="testimonials"
      className="border-y border-white/[0.05] bg-[#0d0d11] px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Trusted by creators & brands"
          title="Real results from real accounts"
          detail="Hear from creators, e-commerce brands, and agencies who automated their Instagram growth."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {quotes.map(({ quote, role, initials }) => (
            <figure
              key={role}
              className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 sm:p-7"
            >
              <div
                aria-label="5 out of 5 stars"
                className="mb-5 flex gap-1 text-amber-200"
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} className="size-3.5 fill-amber-300 text-amber-300" />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-6 text-zinc-300">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3 border-t border-white/[0.07] pt-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400/20 to-violet-400/20 text-[10px] font-semibold text-pink-100">
                  {initials}
                </span>
                <span className="text-xs font-medium text-zinc-400">
                  {role}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pricing teaser                                                            */
/* -------------------------------------------------------------------------- */

function PricingTeaser() {
  return (
    <section id="pricing" className="px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#18131d] via-[#111116] to-[#111116] p-7 sm:p-12">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">
              Simple, flexible plans
            </p>
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Start free. Scale when you&apos;re ready.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              Every plan includes the visual builder, shared inbox, and lead
              capture. Upgrade when your contact list grows.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {[
                "Free plan forever",
                "No credit card required",
                "Razorpay for India (UPI, cards)",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5 text-xs text-zinc-400"
                >
                  <Check className="size-3.5 text-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/signup"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-pink-100"
          >
            See pricing <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  5. FAQ + trust badges                                                     */
/* -------------------------------------------------------------------------- */

function FAQ() {
  return (
    <section
      id="faq"
      className="border-t border-white/[0.05] bg-[#0d0d11] px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Your questions, answered"
          detail="Everything you need to know about safety, compliance, and getting started."
        />
        <div className="space-y-2">
          {faqs.map(({ question, answer }) => (
            <details
              key={question}
              className="group rounded-xl border border-white/[0.07] bg-white/[0.02] px-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-zinc-200 [&::-webkit-details-marker]:hidden">
                {question}
                <span className="text-xl leading-none text-zinc-500 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-5 text-sm leading-6 text-zinc-400">
                {answer}
              </p>
            </details>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {[
            { icon: ShieldCheck, label: "Meta API Verified" },
            { icon: LockKeyhole, label: "AES-256-GCM Encrypted" },
            { icon: ThumbsUp, label: "GDPR Compliant" },
            { icon: Clock3, label: "99.9% Uptime" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-xs font-medium text-zinc-400"
            >
              <Icon className="size-3.5 text-emerald-300" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Final CTA                                                                 */
/* -------------------------------------------------------------------------- */

function FinalCTA() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-pink-200/15 bg-[#15121a] px-6 py-14 text-center sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full bg-pink-500/[0.12] blur-[100px]" />
        <div className="relative">
          <span className="mx-auto mb-5 flex size-11 items-center justify-center rounded-2xl bg-pink-300/10 text-pink-200">
            <Sparkles className="size-5" />
          </span>
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-5xl">
            Your next customer is in the comments right now.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-zinc-400 sm:text-base">
            Don&apos;t let another DM opportunity slip away. Connect your
            Instagram and go live in under 10 minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_0_32px_rgba(236,72,153,.3)] transition hover:shadow-[0_0_48px_rgba(236,72,153,.45)]"
            >
              <Instagram className="size-4" />
              Connect Instagram Free
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-600">
            Free forever plan &middot; No credit card required &middot; Cancel
            anytime
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0b0b0f] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div>
            <Link href="/" className="flex items-center">
              <BrandLogo size="sm" />
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-5 text-zinc-600">
              Turn Instagram comments and stories into automated sales funnels
              — built on Meta&apos;s official APIs.
            </p>
            <a
              href="mailto:info@iginbox.com"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-200"
            >
              <Mail className="size-3" />
              info@iginbox.com
            </a>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">
                Product
              </p>
              <div className="flex flex-col gap-2 text-xs text-zinc-500">
                <a href="#features" className="transition hover:text-zinc-200">Features</a>
                <a href="#pricing" className="transition hover:text-zinc-200">Pricing</a>
                <a href="#faq" className="transition hover:text-zinc-200">FAQ</a>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">
                Legal
              </p>
              <div className="flex flex-col gap-2 text-xs text-zinc-500">
                <Link href="/privacy" className="transition hover:text-zinc-200">Privacy</Link>
                <Link href="/terms" className="transition hover:text-zinc-200">Terms</Link>
                <Link href="/data-deletion" className="transition hover:text-zinc-200">Data deletion</Link>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">
                Compare
              </p>
              <div className="flex flex-col gap-2 text-xs text-zinc-500">
                <Link href="/alternatives/manychat" className="transition hover:text-zinc-200">
                  vs ManyChat
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.05] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[10px] text-zinc-700">
            &copy; {2026} IgInbox. All rights reserved.
          </span>
          {/* Footer trust badges */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: ShieldCheck, label: "Official Meta API" },
              { icon: LockKeyhole, label: "SOC 2 Ready" },
              { icon: ThumbsUp, label: "GDPR &amp; DPDP" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600"
              >
                <Icon className="size-3 text-zinc-600" />
                <span dangerouslySetInnerHTML={{ __html: label }} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#09090c] text-white">
      <JsonLd
        schema={[
          organizationSchema({
            contactEmail: "info@iginbox.com",
            foundingDate: "2026",
          }),
          softwareApplicationSchema({
            description,
            offers: [
              { name: "Starter", price: "0", priceCurrency: "USD" },
              { name: "Growth", price: "29", priceCurrency: "USD", billingPeriod: "month" },
              { name: "Pro", price: "79", priceCurrency: "USD", billingPeriod: "month" },
              { name: "Agency", price: "199", priceCurrency: "USD", billingPeriod: "month" },
            ],
          }),
          faqPageSchema(faqs),
        ]}
      />
      <Navbar />
      <Hero />
      <TrustStrip />
      <BeforeAfter />
      <ThreeSteps />
      <Features />
      <FlowDemo />
      <InboxPreview />
      <section id="use-cases" className="border-y border-white/[0.05] bg-[#0d0d11] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Made for your kind of work"
            title="One platform. Different ways to grow."
            detail="Choose a use case to see how a simple automated conversation can fit your business."
          />
          <UseCaseTabs />
        </div>
      </section>
      <Testimonials />
      <PricingTeaser />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
