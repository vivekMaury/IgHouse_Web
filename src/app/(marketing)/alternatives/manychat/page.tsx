import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/logo";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  X,
  Minus,
  Sparkles,
  Zap,
  Shield,
  IndianRupee,
  Workflow,
  Users,
  MessageCircle,
} from "lucide-react";
import {
  JsonLd,
  softwareApplicationSchema,
  faqPageSchema,
  breadcrumbSchema,
  speakableSchema,
  type FaqItem,
} from "@/components/seo/JsonLd";

const SITE_URL = "https://iginbox.com";

/* -------------------------------------------------------------------------- */
/*  SEO metadata                                                              */
/* -------------------------------------------------------------------------- */

const pageTitle =
  "Best ManyChat Alternative for Instagram Automation (2027)";
const pageDescription =
  "IgInbox is the best ManyChat alternative built exclusively for Instagram. Compare pricing, flow builder, inbox, and Meta API compliance side by side.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/alternatives/manychat" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: `${SITE_URL}/alternatives/manychat`,
    siteName: "IgInbox",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
};

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

const faqs: FaqItem[] = [
  {
    question: "Is IgInbox a good alternative to ManyChat?",
    answer:
      "Yes. IgInbox is purpose-built for Instagram automation — DM flows, comment-to-DM, and a shared inbox — using Meta's official APIs. Unlike ManyChat, which spreads across Facebook, WhatsApp, Telegram, and SMS, IgInbox focuses exclusively on Instagram so every feature is optimised for that platform.",
  },
  {
    question: "Can I migrate my ManyChat flows to IgInbox?",
    answer:
      "IgInbox uses a visual flow builder with similar concepts (triggers, messages, conditions, delays). While there is no one-click import, most flows can be recreated in under 10 minutes using IgInbox's drag-and-drop canvas and starter templates.",
  },
  {
    question: "Does IgInbox support Instagram comment-to-DM automation?",
    answer:
      "Yes. Comment-to-DM is a core feature. Set a keyword trigger on any post or reel, and IgInbox automatically sends a personalised private reply within seconds — all through Meta's official API.",
  },
  {
    question: "How does IgInbox pricing compare to ManyChat?",
    answer:
      "IgInbox offers competitive pricing with plans starting lower than ManyChat Pro. All plans include the visual flow builder, shared inbox, and lead capture. IgInbox also supports Razorpay for Indian users, making it accessible with UPI and local payment methods.",
  },
  {
    question: "Is IgInbox compliant with Meta's platform policies?",
    answer:
      "Absolutely. IgInbox uses only official Meta APIs (Instagram API with Instagram Login), enforces the 24-hour messaging window, limits one private reply per comment, respects opt-outs, and encrypts all tokens with AES-256-GCM. The platform is built for Meta App Review compliance from day one.",
  },
  {
    question: "Does IgInbox have a shared team inbox?",
    answer:
      "Yes. IgInbox includes a real-time shared inbox with human takeover — when a team member replies, automation pauses automatically. Conversations show the full context including which flow triggered the conversation, tags, and lead data.",
  },
];

interface ComparisonRow {
  feature: string;
  iginbox: "yes" | "no" | "partial" | string;
  manychat: "yes" | "no" | "partial" | string;
}

const comparisonData: ComparisonRow[] = [
  { feature: "Instagram DM Automation", iginbox: "yes", manychat: "yes" },
  { feature: "Comment-to-DM Flows", iginbox: "yes", manychat: "yes" },
  {
    feature: "Instagram-Only Focus",
    iginbox: "yes",
    manychat: "no",
  },
  { feature: "Visual Flow Builder", iginbox: "yes", manychat: "yes" },
  {
    feature: "Shared Team Inbox",
    iginbox: "yes",
    manychat: "partial",
  },
  {
    feature: "Human Takeover (auto-pause)",
    iginbox: "yes",
    manychat: "partial",
  },
  {
    feature: "AES-256-GCM Token Encryption",
    iginbox: "yes",
    manychat: "no",
  },
  {
    feature: "Row-Level Security (workspace isolation)",
    iginbox: "yes",
    manychat: "no",
  },
  {
    feature: "Razorpay / UPI Payments (India)",
    iginbox: "yes",
    manychat: "no",
  },
  {
    feature: "Lead Capture & CRM",
    iginbox: "yes",
    manychat: "yes",
  },
  {
    feature: "Opt-Out Handling (STOP keyword)",
    iginbox: "yes",
    manychat: "partial",
  },
  {
    feature: "24-Hour Window Enforcement",
    iginbox: "yes",
    manychat: "yes",
  },
  { feature: "Facebook Messenger", iginbox: "no", manychat: "yes" },
  { feature: "WhatsApp / SMS / Telegram", iginbox: "no", manychat: "yes" },
  {
    feature: "AI-Powered Reply Agent",
    iginbox: "Coming soon",
    manychat: "yes",
  },
];

/* -------------------------------------------------------------------------- */
/*  Components                                                                */
/* -------------------------------------------------------------------------- */

function CellIcon({ value }: { value: string }) {
  if (value === "yes")
    return <Check className="size-4 text-emerald-400" aria-label="Yes" />;
  if (value === "no")
    return <X className="size-4 text-zinc-600" aria-label="No" />;
  if (value === "partial")
    return <Minus className="size-4 text-amber-400" aria-label="Partial" />;
  return (
    <span className="text-xs text-zinc-400">{value}</span>
  );
}

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl border border-white/[0.09] bg-[#101014]/80 px-4 shadow-[0_8px_40px_rgba(0,0,0,.2)] backdrop-blur-xl sm:px-5">
        <Link href="/" aria-label="IgInbox home" className="flex items-center">
          <BrandLogo size="default" />
        </Link>
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
        </div>
      </div>
    </header>
  );
}

function WhySwitchCard({
  icon: Icon,
  title,
  text,
  hue,
}: {
  icon: typeof Zap;
  title: string;
  text: string;
  hue: string;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition hover:-translate-y-0.5 hover:border-white/[0.13]">
      <span
        className={`mb-4 flex size-10 items-center justify-center rounded-xl ${hue}`}
      >
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ManychatAlternativePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#09090c] text-white">
      {/* Structured data */}
      <JsonLd
        schema={[
          softwareApplicationSchema({
            name: "IgInbox",
            description:
              "Instagram DM & comment automation platform — the best ManyChat alternative built exclusively for Instagram.",
            url: SITE_URL,
            offers: [
              { name: "Starter", price: "0", priceCurrency: "USD" },
              {
                name: "Growth",
                price: "29",
                priceCurrency: "USD",
                billingPeriod: "month",
              },
              {
                name: "Pro",
                price: "79",
                priceCurrency: "USD",
                billingPeriod: "month",
              },
              {
                name: "Agency",
                price: "199",
                priceCurrency: "USD",
                billingPeriod: "month",
              },
            ],
          }),
          faqPageSchema(faqs),
          breadcrumbSchema([
            { name: "Home", url: SITE_URL },
            { name: "Alternatives", url: `${SITE_URL}/alternatives` },
            {
              name: "ManyChat Alternative",
              url: `${SITE_URL}/alternatives/manychat`,
            },
          ]),
          speakableSchema({
            url: `${SITE_URL}/alternatives/manychat`,
            cssSelectors: ["#lead-summary"],
          }),
        ]}
      />

      <Navbar />

      {/* ------------------------------------------------------------------ */}
      {/*  Hero                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative px-5 pb-20 pt-36 sm:px-8 sm:pt-44">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(217,70,239,.10),transparent_55%)]" />
        <div className="mx-auto max-w-4xl text-center">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500"
          >
            <Link href="/" className="transition hover:text-zinc-300">
              Home
            </Link>
            <span>/</span>
            <span className="text-zinc-400">Alternatives</span>
            <span>/</span>
            <span className="text-zinc-300">ManyChat</span>
          </nav>

          <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-[-.04em] text-white sm:text-5xl lg:text-6xl">
            The best{" "}
            <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              ManyChat alternative
            </span>{" "}
            for Instagram
          </h1>

          {/* GEO direct-answer paragraph */}
          <p
            id="lead-summary"
            className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8"
          >
            IgInbox is an Instagram-first automation platform that replaces
            ManyChat for teams who only need Instagram. It offers a visual flow
            builder, shared team inbox with human takeover, comment-to-DM
            automation, and lead capture — all built on Meta&apos;s official APIs
            with AES-256-GCM token encryption and workspace-level row-level
            security.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-pink-100"
            >
              Try IgInbox free{" "}
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#comparison"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07]"
            >
              See the comparison
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Why teams switch                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-white/[0.05] bg-[#0d0d11] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">
              Why teams switch
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">
              Built for Instagram, not bolted on
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
              ManyChat covers Facebook, WhatsApp, Telegram, SMS, and Instagram.
              IgInbox focuses exclusively on Instagram — so every feature, every
              UI decision, and every compliance check is built around that one
              platform.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <WhySwitchCard
              icon={Zap}
              title="Instagram-first architecture"
              text="Every node, trigger, and inbox feature is designed for Instagram's messaging API — no compromises from supporting 5 other channels."
              hue="bg-pink-300/10 text-pink-300"
            />
            <WhySwitchCard
              icon={Workflow}
              title="Simpler visual builder"
              text="Drag-and-drop flows with comment triggers, DM messages, conditions, delays, and lead capture. No bloated node palette for channels you don't use."
              hue="bg-violet-300/10 text-violet-300"
            />
            <WhySwitchCard
              icon={Users}
              title="True shared inbox"
              text="Real-time conversations with human takeover. When your team replies, automation pauses automatically — no lost context, no duplicate messages."
              hue="bg-blue-300/10 text-blue-300"
            />
            <WhySwitchCard
              icon={Shield}
              title="Security-first design"
              text="AES-256-GCM token encryption, row-level security isolating every workspace, webhook signature verification, and rate limiting on every endpoint."
              hue="bg-emerald-300/10 text-emerald-300"
            />
            <WhySwitchCard
              icon={IndianRupee}
              title="India-friendly pricing"
              text="Razorpay integration for UPI, cards, and subscriptions. Competitive pricing designed for Indian creators, agencies, and e-commerce brands."
              hue="bg-amber-300/10 text-amber-300"
            />
            <WhySwitchCard
              icon={MessageCircle}
              title="Meta policy compliant"
              text="24-hour messaging window enforcement, one private reply per comment, opt-out handling, and send caps built into the engine — not an afterthought."
              hue="bg-cyan-300/10 text-cyan-300"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Comparison table                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section id="comparison" className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">
              Feature comparison
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">
              IgInbox vs ManyChat — side by side
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
              A clear comparison of what each platform offers for Instagram
              automation.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-5 py-4 text-left font-medium text-zinc-300">
                    Feature
                  </th>
                  <th className="px-5 py-4 text-center font-semibold text-pink-300">
                    IgInbox
                  </th>
                  <th className="px-5 py-4 text-center font-medium text-zinc-400">
                    ManyChat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {comparisonData.map((row) => (
                  <tr
                    key={row.feature}
                    className="transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3.5 text-zinc-300">
                      {row.feature}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex justify-center">
                        <CellIcon value={row.iginbox} />
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex justify-center">
                        <CellIcon value={row.manychat} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-center text-xs text-zinc-600">
            Comparison based on publicly available information as of November
            2026. Features may change.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Pricing teaser                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-white/[0.05] bg-[#0d0d11] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">
              Pricing
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">
              More affordable than ManyChat Pro
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
              All plans include the visual flow builder, shared inbox, and lead
              capture. No per-channel add-ons, no hidden fees.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Starter",
                price: "Free",
                detail: "Up to 100 contacts",
                highlight: false,
              },
              {
                name: "Growth",
                price: "$29/mo",
                detail: "Up to 1,000 contacts",
                highlight: false,
              },
              {
                name: "Pro",
                price: "$79/mo",
                detail: "Up to 5,000 contacts",
                highlight: true,
              },
              {
                name: "Agency",
                price: "$199/mo",
                detail: "Unlimited workspaces",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 transition ${
                  plan.highlight
                    ? "border-pink-400/30 bg-pink-400/[0.04]"
                    : "border-white/[0.07] bg-white/[0.025]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {plan.name}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {plan.price}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{plan.detail}</p>
                {plan.highlight && (
                  <span className="mt-3 inline-block rounded-full bg-pink-400/10 px-2.5 py-1 text-[10px] font-medium text-pink-300">
                    Most popular
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            All prices in USD.{" "}
            <strong className="text-zinc-300">Indian users:</strong> pay with
            UPI, cards, or netbanking via Razorpay.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FAQ                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.19em] text-pink-300">
              FAQ
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">
              Common questions about switching from ManyChat
            </h2>
          </div>

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
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Final CTA                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-pink-200/15 bg-[#15121a] px-6 py-14 text-center sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full bg-pink-500/[0.12] blur-[100px]" />
          <div className="relative">
            <span className="mx-auto mb-5 flex size-11 items-center justify-center rounded-2xl bg-pink-300/10 text-pink-200">
              <Sparkles className="size-5" />
            </span>
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-[-.035em] text-white sm:text-5xl">
              Ready to switch from ManyChat?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-zinc-400 sm:text-base">
              Start free and build your first Instagram automation flow in under
              10 minutes. No credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-pink-100"
            >
              Get started free{" "}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Footer                                                             */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-white/[0.06] bg-[#0b0b0f] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
            <div>
              <Link href="/" className="flex items-center">
                <BrandLogo size="sm" />
              </Link>
              <p className="mt-3 max-w-xs text-xs leading-5 text-zinc-600">
                The Instagram automation platform built for creators, brands,
                and agencies.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-zinc-500">
              <Link
                href="/privacy"
                className="transition hover:text-zinc-200"
              >
                Privacy
              </Link>
              <Link href="/terms" className="transition hover:text-zinc-200">
                Terms
              </Link>
              <Link
                href="/data-deletion"
                className="transition hover:text-zinc-200"
              >
                Data deletion
              </Link>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-zinc-700 sm:flex-row sm:justify-between">
            <span>&copy; {2026} IgInbox. All rights reserved.</span>
            <span>
              IgInbox is not affiliated with or endorsed by Meta Platforms, Inc.
              or ManyChat.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
