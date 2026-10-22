import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  LockKeyhole,
  MessageCircle,
  MousePointer2,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/icons";
import UseCaseTabs from "./use-case-tabs";

const siteUrl = "https://ig-house-web.vercel.app";
const description =
  "Turn Instagram comments into conversations and customers. Build visual automations for comment replies, DMs, lead capture, and your shared inbox.";

export const metadata: Metadata = {
  title: "Instagram Comment & DM Automation",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Turn Instagram comments into customers | IgHouse",
    description,
    url: siteUrl,
    siteName: "IgHouse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn Instagram comments into customers | IgHouse",
    description,
  },
};

const faqs = [
  {
    question: "What can I automate with IgHouse?",
    answer:
      "Create visual workflows that respond to Instagram comments, send follow-up DMs, capture leads, and route conversations to your team.",
  },
  {
    question: "Do I need an Instagram professional account?",
    answer:
      "Yes. Instagram automation requires an eligible professional account and the permissions provided by Instagram's official APIs.",
  },
  {
    question: "Can a person take over a conversation?",
    answer:
      "Yes. Use the shared inbox to review conversations and pause automation when a personal reply is the right next step.",
  },
  {
    question: "Can I control when automated messages are sent?",
    answer:
      "IgHouse is designed around Instagram's messaging rules, including messaging windows and comment-reply limits. Your workflows should always follow current Meta policies.",
  },
  {
    question: "How is account data handled?",
    answer:
      "IgHouse is built with workspace isolation and protected account credentials in mind. Read the Privacy page for details, or use the Data Deletion page to request deletion.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "IgHouse",
    url: siteUrl,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "IgHouse",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description,
    url: siteUrl,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  },
];

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-400 via-pink-500 to-orange-400 text-white shadow-[0_4px_24px_rgba(236,72,153,.24)] ${small ? "size-8 rounded-lg" : "size-9"}`}
    >
      <Instagram className={small ? "size-4" : "size-[18px]"} strokeWidth={2.2} />
    </span>
  );
}

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
        <Link href="/" aria-label="IgHouse home" className="flex items-center gap-2.5">
          <BrandMark small />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Ig<span className="text-pink-400">House</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
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
                <a key={href} href={href} className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5">
                  {label}
                </a>
              ))}
              <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5">
                Log in
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

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
    <div className={`flow-node absolute z-10 w-48 rounded-xl border border-white/10 bg-[#17171d]/95 p-3.5 shadow-2xl backdrop-blur ${className}`}>
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`flex size-7 items-center justify-center rounded-lg ${color}`}>{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-[.14em] text-zinc-500">{eyebrow}</span>
      </div>
      <p className="text-[12px] font-semibold text-zinc-100">{title}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{detail}</p>
    </div>
  );
}

function HeroCanvas() {
  return (
    <div className="hero-canvas relative h-[420px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0e12] sm:h-[400px]">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
      <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#14151a]/90 px-3 py-2 text-[10px] text-zinc-400">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        Product launch flow <span className="ml-2 rounded bg-emerald-400/10 px-1.5 py-0.5 text-emerald-300">Published</span>
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 660 400" fill="none" aria-hidden="true">
        <path d="M209 135 C260 135 258 201 310 201" stroke="url(#flow-a)" strokeWidth="2" />
        <path d="M440 201 C473 201 470 132 500 132" stroke="url(#flow-b)" strokeWidth="2" />
        <path d="M440 210 C473 210 470 285 500 285" stroke="url(#flow-c)" strokeWidth="2" />
        <circle r="3" fill="#f472b6">
          <animateMotion dur="3.5s" repeatCount="indefinite" path="M209 135 C260 135 258 201 310 201" />
        </circle>
        <defs>
          <linearGradient id="flow-a" x1="209" y1="135" x2="310" y2="201" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" /><stop offset="1" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="flow-b" x1="440" y1="201" x2="500" y2="132" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f472b6" /><stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="flow-c" x1="440" y1="210" x2="500" y2="285" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f472b6" /><stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <FlowNode
        icon={<MessageCircle className="size-3.5" />}
        eyebrow="Instagram comment"
        title="Comment contains “GUIDE”"
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
            <span className="block text-[10px] font-semibold text-zinc-800">yourbrand</span>
            <span className="block text-[8px] text-zinc-400">Professional account</span>
          </span>
          <span className="text-zinc-500">···</span>
        </div>
        <div className="flex h-[205px] flex-col justify-end gap-2.5 bg-[#f7f6f8] px-3 py-4 sm:h-[225px]">
          <p className="self-center pb-1 text-[8px] text-zinc-400">Today 10:42 AM</p>
          <div className="max-w-[82%] self-start rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[9px] leading-relaxed text-zinc-700 shadow-sm">
            Hey! I saw your comment. Here’s the guide you asked for ✨
          </div>
          <div className="max-w-[82%] self-end rounded-2xl rounded-br-sm bg-gradient-to-br from-fuchsia-500 to-purple-600 px-3 py-2 text-[9px] leading-relaxed text-white">
            This is exactly what I needed. Thank you!
          </div>
          <div className="max-w-[82%] self-start rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[9px] leading-relaxed text-zinc-700 shadow-sm">
            So glad it helps! Want more tips like this?
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2.5">
          <span className="flex-1 rounded-full border border-zinc-200 px-3 py-1.5 text-[8px] text-zinc-400">Message...</span>
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

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-36 sm:px-8 sm:pt-44 lg:pb-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(217,70,239,.13),transparent_55%)]" />
      <div className="pointer-events-none absolute left-1/2 top-32 -z-10 size-[420px] -translate-x-1/2 rounded-full bg-pink-500/[0.07] blur-[130px]" />
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-pink-300/15 bg-pink-300/[0.06] px-3 py-1.5 text-[11px] font-medium text-pink-200">
            <Sparkles className="size-3.5" /> The visual Instagram automation platform
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-.045em] text-white sm:text-6xl lg:text-[76px]">
            Turn Instagram comments into{" "}
            <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              customers on autopilot
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
            Turn every comment into a timely, personal conversation. Build a flow once, then let IgHouse reply, share what people want, and keep your inbox moving.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-pink-100"
            >
              Build your first flow <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#flow-demo"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07]"
            >
              <span className="flex size-5 items-center justify-center rounded-full border border-white/20 text-[9px]">▶</span>
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-zinc-600">Connect your professional account. No automation experience needed.</p>
        </div>

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

function TrustStrip() {
  const items = [
    { icon: Instagram, label: "Instagram-first workflows" },
    { icon: ShieldCheck, label: "Built for policy-aware messaging" },
    { icon: LockKeyhole, label: "Workspace-level separation" },
    { icon: Users, label: "Human handoff when it matters" },
  ];

  return (
    <section aria-label="Platform highlights" className="border-y border-white/[0.06] bg-white/[0.015] px-5 py-7 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-5">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 text-xs font-medium text-zinc-500">
            <Icon className="size-4 text-zinc-400" strokeWidth={1.7} /> {label}
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">{detail}</p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Instagram,
      title: "Connect your account",
      text: "Link an eligible Instagram professional account through the official sign-in flow.",
    },
    {
      number: "02",
      icon: Workflow,
      title: "Build a simple flow",
      text: "Choose a trigger, write your reply, and decide where each conversation should go.",
    },
    {
      number: "03",
      icon: Activity,
      title: "Let conversations happen",
      text: "Follow activity in your inbox and step in whenever a person-to-person reply is best.",
    },
  ];

  return (
    <section id="how-it-works" className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="From comment to conversation in three steps"
          detail="No complicated setup. Just a clear path from the first keyword to a helpful, on-brand DM."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, text }) => (
            <article key={number} className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition hover:border-pink-300/20 hover:bg-white/[0.04] sm:p-7">
              <div className="mb-7 flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-pink-200">
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <span className="font-mono text-xs text-zinc-600">{number}</span>
              </div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
              {number !== "03" && <ArrowDown className="mt-6 size-4 text-zinc-700 md:hidden" />}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: MessageCircle, title: "Comment-to-DM", text: "Turn a keyword in a comment into a timely private reply that starts a real conversation.", hue: "text-pink-300 bg-pink-300/10" },
    { icon: Workflow, title: "Visual flow builder", text: "Map triggers, messages, conditions, and next steps in one simple canvas.", hue: "text-violet-300 bg-violet-300/10" },
    { icon: Users, title: "Lead capture", text: "Collect useful details, add context, and keep new contacts organized for follow-up.", hue: "text-emerald-300 bg-emerald-300/10" },
    { icon: Activity, title: "Shared inbox", text: "See conversations together, understand what happened, and step in without losing context.", hue: "text-blue-300 bg-blue-300/10" },
    { icon: Clock3, title: "Human handoff", text: "Pause automation when a conversation needs a personal answer from your team.", hue: "text-amber-300 bg-amber-300/10" },
    { icon: ShieldCheck, title: "Thoughtful controls", text: "Build within platform messaging limits and give your team clear control over every flow.", hue: "text-cyan-300 bg-cyan-300/10" },
  ];

  return (
    <section id="features" className="border-y border-white/[0.05] bg-[#0d0d11] px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Everything in one place"
          title="A better way to manage Instagram conversations"
          detail="Automate the repetitive first steps, then bring your human touch in at exactly the right moment."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text, hue }) => (
            <article key={title} className="rounded-2xl border border-white/[0.07] bg-[#111116] p-6 transition hover:-translate-y-0.5 hover:border-white/[0.13]">
              <span className={`mb-5 flex size-10 items-center justify-center rounded-xl ${hue}`}>
                <Icon className="size-[18px]" strokeWidth={1.8} />
              </span>
              <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlowDemo() {
  return (
    <section id="flow-demo" className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">See a flow in action</p>
          <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">
            One comment. A thoughtful next step.
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
            A post gets a comment with your keyword. IgHouse sends the reply you prepared, while keeping the conversation visible to your team.
          </p>
          <ul className="mt-7 space-y-3">
            {["Choose your trigger words", "Personalize the first DM", "Keep a human in the loop"].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                <Check className="size-4 text-emerald-300" /> {item}
              </li>
            ))}
          </ul>
          <Link href="/signup" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-pink-200">
            Create your first flow <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#101015] p-3 shadow-2xl sm:p-5">
          <div className="mb-5 flex items-center justify-between border-b border-white/[0.07] px-2 pb-4">
            <div>
              <p className="text-xs font-semibold text-zinc-200">Free guide delivery</p>
              <p className="mt-1 text-[10px] text-zinc-600">Comment-to-DM · Instagram</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-300" /> Active
            </span>
          </div>
          <div className="relative grid min-h-[270px] grid-cols-2 gap-x-6 gap-y-4 overflow-hidden px-2 pb-2 sm:grid-cols-4 sm:items-center sm:gap-3">
            <div className="flow-demo-line absolute left-[19%] right-[18%] top-[31%] hidden h-px bg-gradient-to-r from-amber-300/60 via-pink-300/50 to-blue-300/60 sm:block" />
            <div className="flow-demo-line absolute bottom-[31%] left-[19%] right-[18%] hidden h-px bg-gradient-to-r from-amber-300/60 via-pink-300/50 to-emerald-300/60 sm:block" />
            {[
              { tag: "TRIGGER", name: "Comment says", value: "“GUIDE”", color: "border-amber-300/20 bg-amber-300/[0.06]", dot: "bg-amber-300" },
              { tag: "REPLY", name: "Public response", value: "Check your DMs ✨", color: "border-pink-300/20 bg-pink-300/[0.06]", dot: "bg-pink-300" },
              { tag: "MESSAGE", name: "Send a DM", value: "Here’s your guide", color: "border-blue-300/20 bg-blue-300/[0.06]", dot: "bg-blue-300" },
              { tag: "CONTACT", name: "Add a tag", value: "Guide requested", color: "border-emerald-300/20 bg-emerald-300/[0.06]", dot: "bg-emerald-300" },
            ].map((node) => (
              <div key={node.tag} className={`relative z-10 rounded-xl border p-3 ${node.color}`}>
                <div className="mb-4 flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${node.dot}`} />
                  <span className="text-[8px] font-semibold tracking-[.12em] text-zinc-500">{node.tag}</span>
                </div>
                <p className="text-[10px] font-medium text-zinc-300">{node.name}</p>
                <p className="mt-1 text-[9px] text-zinc-500">{node.value}</p>
              </div>
            ))}
          </div>
          <details className="group border-t border-white/[0.07] pt-3">
            <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-2 text-xs font-medium text-zinc-300 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-lg bg-pink-300/10 text-pink-200">▶</span> Preview the conversation</span>
              <span className="text-zinc-600 transition group-open:rotate-180">⌄</span>
            </summary>
            <div className="mx-2 mb-2 mt-2 space-y-2 rounded-xl bg-black/20 p-3 text-[11px]">
              <p className="max-w-[80%] rounded-xl rounded-bl-sm bg-white/[0.06] p-2.5 text-zinc-300">Hey! Thanks for commenting. Here’s the guide you asked for ✨</p>
              <p className="ml-auto max-w-[75%] rounded-xl rounded-br-sm bg-fuchsia-500/20 p-2.5 text-pink-100">Got it, thanks!</p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

function InboxPreview() {
  const conversations = [
    { initials: "AM", name: "Alex Morgan", text: "That’s so helpful, thank you!", time: "now", tag: "Guide", active: true },
    { initials: "JL", name: "Jordan Lee", text: "Do you have this in another color?", time: "2m", tag: "Product question", active: false },
    { initials: "SK", name: "Sam Kim", text: "I’d love to learn more.", time: "8m", tag: "New lead", active: false },
  ];

  return (
    <section className="border-y border-white/[0.05] bg-[#0d0d11] px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="order-2 rounded-2xl border border-white/[0.08] bg-[#111116] p-3 shadow-2xl sm:p-5 lg:order-1">
          <div className="flex min-h-[340px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c10]">
            <div className="w-[43%] border-r border-white/[0.06] sm:w-[40%]">
              <div className="flex items-center justify-between px-3 py-3 sm:px-4">
                <span className="text-xs font-semibold text-zinc-200">Inbox</span>
                <span className="rounded-full bg-pink-400/10 px-2 py-0.5 text-[9px] text-pink-200">3 new</span>
              </div>
              <div className="space-y-1 px-1.5 sm:px-2">
                {conversations.map((conversation) => (
                  <div key={conversation.name} className={`rounded-lg p-2.5 ${conversation.active ? "bg-white/[0.07]" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/30 to-pink-400/30 text-[8px] font-semibold text-zinc-200">{conversation.initials}</span>
                      <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-zinc-300">{conversation.name}</span>
                      <span className="text-[8px] text-zinc-600">{conversation.time}</span>
                    </div>
                    <p className="mt-2 truncate pl-9 text-[8px] text-zinc-500">{conversation.text}</p>
                    <span className="ml-9 mt-2 inline-block rounded bg-white/[0.05] px-1.5 py-0.5 text-[7px] text-zinc-500">{conversation.tag}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/30 to-pink-400/30 text-[8px] font-semibold text-zinc-200">AM</span>
                  <span className="text-[9px] font-medium text-zinc-300">Alex Morgan</span>
                </div>
                <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-[8px] text-emerald-300">Automation on</span>
              </div>
              <div className="flex flex-1 flex-col justify-end gap-3 p-3 sm:p-4">
                <p className="self-center pb-2 text-[8px] text-zinc-600">Today · Instagram</p>
                <p className="max-w-[80%] self-start rounded-xl rounded-bl-sm bg-white/[0.06] p-2.5 text-[9px] leading-relaxed text-zinc-300">Hey! Here’s the guide you asked for. Hope you find it useful!</p>
                <p className="max-w-[75%] self-end rounded-xl rounded-br-sm bg-fuchsia-400/15 p-2.5 text-[9px] leading-relaxed text-pink-100">That’s so helpful, thank you!</p>
                <p className="max-w-[80%] self-start rounded-xl rounded-bl-sm bg-white/[0.06] p-2.5 text-[9px] leading-relaxed text-zinc-300">You’re welcome! Let us know if you have any questions.</p>
              </div>
              <div className="m-2 rounded-lg border border-white/[0.07] px-3 py-2 text-[8px] text-zinc-600">Reply to conversation...</div>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">The live inbox</p>
          <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">Automation that still feels human.</h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
            See the full conversation, know which flow brought someone in, and take over when they need a real person.
          </p>
          <div className="mt-7 space-y-4">
            {[
              ["One shared view", "Keep comments and DMs from slipping through the cracks."],
              ["Context at a glance", "Understand the trigger and recent messages before replying."],
              ["Your team stays in control", "Pause automation and respond personally whenever needed."],
            ].map(([title, text]) => (
              <div key={title} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                <div><p className="text-sm font-medium text-zinc-200">{title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { quote: "I can spend less time copying and pasting the same reply, and more time showing up for my community.", role: "Creator", initials: "CR" },
    { quote: "The flow makes it easy to connect a product question to the next helpful step for a customer.", role: "Small business owner", initials: "SB" },
    { quote: "Having the conversation and the automation context together makes client handoff feel much clearer.", role: "Agency team", initials: "AT" },
  ];

  return (
    <section id="testimonials" className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Built around real conversations"
          title="Give every comment a thoughtful next step"
          detail="Designed for the people behind the account, whether you’re growing a community or supporting a team."
        />
        <div className="grid gap-3 md:grid-cols-3">
          {quotes.map(({ quote, role, initials }) => (
            <figure key={role} className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 sm:p-7">
              <div aria-label="5 out of 5 stars" className="mb-5 flex gap-1 text-amber-200">
                {Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true">★</span>)}
              </div>
              <blockquote className="flex-1 text-sm leading-6 text-zinc-300">“{quote}”</blockquote>
              <figcaption className="mt-7 flex items-center gap-3 border-t border-white/[0.07] pt-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400/20 to-violet-400/20 text-[10px] font-semibold text-pink-100">{initials}</span>
                <span className="text-xs font-medium text-zinc-400">{role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section id="pricing" className="px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#18131d] via-[#111116] to-[#111116] p-7 sm:p-12">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">Simple, flexible plans</p>
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">Start with the conversations you have today.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Choose a plan that fits your Instagram activity and grow into more powerful workflows as your needs change.</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {["No complicated setup", "Built to scale with your team", "Your account, your control"].map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-xs text-zinc-400"><Check className="size-3.5 text-emerald-300" />{item}</li>
              ))}
            </ul>
          </div>
          <Link href="/signup" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-pink-100">
            Find your fit <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="border-t border-white/[0.05] bg-[#0d0d11] px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Good questions, clear answers"
          detail="A few things to know before you build your first flow."
        />
        <div className="space-y-2">
          {faqs.map(({ question, answer }) => (
            <details key={question} className="group rounded-xl border border-white/[0.07] bg-white/[0.02] px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-zinc-200 [&::-webkit-details-marker]:hidden">
                {question}
                <span className="text-xl leading-none text-zinc-500 transition group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-2xl pb-5 text-sm leading-6 text-zinc-400">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-pink-200/15 bg-[#15121a] px-6 py-14 text-center sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full bg-pink-500/[0.12] blur-[100px]" />
        <div className="relative">
          <span className="mx-auto mb-5 flex size-11 items-center justify-center rounded-2xl bg-pink-300/10 text-pink-200"><Sparkles className="size-5" /></span>
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-5xl">Your next great customer could be in the comments.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-zinc-400 sm:text-base">Give every comment a useful next step, and every conversation the chance to grow.</p>
          <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-pink-100">
            Get started with IgHouse <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0b0b0f] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark small />
              <span className="text-sm font-semibold text-white">Ig<span className="text-pink-400">House</span></span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-5 text-zinc-600">A clearer way to turn Instagram conversations into meaningful connections.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-zinc-500">
            <Link href="/privacy" className="transition hover:text-zinc-200">Privacy</Link>
            <Link href="/terms" className="transition hover:text-zinc-200">Terms</Link>
            <Link href="/data-deletion" className="transition hover:text-zinc-200">Data deletion</Link>
            <Link href="/docs" className="transition hover:text-zinc-200">Help center</Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-zinc-700 sm:flex-row sm:justify-between">
          <span>© IgHouse. All rights reserved.</span>
          <span>Built for better conversations.</span>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#09090c] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Features />
      <FlowDemo />
      <InboxPreview />
      <section id="use-cases" className="px-5 py-24 sm:px-8 sm:py-32">
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
