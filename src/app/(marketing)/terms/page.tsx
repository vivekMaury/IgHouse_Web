import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, FileText } from "lucide-react";
import {
  JsonLd,
  webPageSchema,
  breadcrumbSchema,
} from "@/components/seo/JsonLd";

const SITE_URL = "https://iginbox.com";
const LAST_UPDATED = "2026-11-07";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "IgInbox terms of service — SaaS subscription, acceptable use, messaging rules, Meta platform compliance, and liability.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | IgInbox",
    description:
      "Rules and guidelines for using the IgInbox Instagram automation platform.",
    url: `${SITE_URL}/terms`,
  },
};

function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <Image
          src="/favicon-192.png"
          alt=""
          width={28}
          height={28}
          className="rounded-lg"
          aria-hidden="true"
        />
        <span className="text-[15px] font-semibold tracking-tight text-white">
          Ig<span className="text-pink-400">Inbox</span>
        </span>
      </Link>
      <nav className="flex items-center gap-4 text-xs text-zinc-500">
        <Link href="/privacy" className="transition hover:text-zinc-200">
          Privacy
        </Link>
        <Link href="/data-deletion" className="transition hover:text-zinc-200">
          Data Deletion
        </Link>
      </nav>
    </header>
  );
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd
        schema={[
          webPageSchema({
            name: "Terms of Service",
            url: `${SITE_URL}/terms`,
            description:
              "IgInbox terms of service covering SaaS subscription, acceptable use, and Meta platform compliance.",
            lastReviewed: LAST_UPDATED,
          }),
          breadcrumbSchema([
            { name: "Home", url: SITE_URL },
            { name: "Terms of Service", url: `${SITE_URL}/terms` },
          ]),
        ]}
      />
      <Header />

      <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
            <FileText className="size-5" strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </div>

        {/* Plain-language summary */}
        <div className="mb-8 rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-5">
          <p className="text-sm font-medium text-violet-300">Quick summary</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            IgInbox is an Instagram automation SaaS. You need an eligible
            professional account, must follow Meta&apos;s policies, and
            can&apos;t use the service for spam or abuse. We enforce messaging
            limits, honor opt-outs, and can suspend accounts that violate these
            terms. You can delete your account and data at any time.
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By creating an account or using IgInbox (&quot;the Service&quot;),
              you agree to these Terms of Service (&quot;Terms&quot;). If you do
              not agree, do not use the Service. These Terms form a legally
              binding agreement between you and IgInbox.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p className="mt-2">
              IgInbox is an Instagram DM and comment automation platform. It
              allows you to build visual automation flows that respond to
              Instagram comments, send direct messages, capture leads, and
              manage conversations through a shared team inbox — all using
              Meta&apos;s official APIs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. Account Requirements
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>You must be at least 18 years old to use IgInbox</li>
              <li>You must provide a valid email address</li>
              <li>
                You are responsible for maintaining the security of your account
                credentials
              </li>
              <li>
                You must have an Instagram Business or Creator account to
                connect
              </li>
              <li>
                You must be the authorised owner or administrator of any
                connected Instagram account
              </li>
              <li>
                One account per person or legal entity unless operating multiple
                workspaces under an agency plan
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. Acceptable Use
            </h2>
            <p className="mt-2">You agree NOT to use IgInbox to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Send spam, unsolicited messages, or bulk promotional content
              </li>
              <li>
                Violate Meta&apos;s Platform Terms, Community Guidelines, or
                Developer Policies
              </li>
              <li>
                Harass, threaten, or send abusive messages to any person
              </li>
              <li>Impersonate another person or entity</li>
              <li>
                Collect personal data of Instagram users without proper consent
              </li>
              <li>
                Exceed Instagram&apos;s API rate limits or circumvent platform
                restrictions
              </li>
              <li>
                Reverse-engineer, scrape, or redistribute any part of the
                Service
              </li>
              <li>Use the Service for any illegal or unauthorised purpose</li>
            </ul>
            <p className="mt-2">
              Violation of this section may result in immediate account
              suspension without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              5. Meta Platform Compliance
            </h2>
            <p className="mt-2">
              IgInbox operates through Meta&apos;s official APIs and adheres to
              Meta&apos;s Platform Terms. Your use of IgInbox is also subject to
              Meta&apos;s terms and policies. Violation of Meta&apos;s policies
              may result in suspension of your IgInbox account and
              disconnection of your Instagram integration. IgInbox is not
              affiliated with, endorsed by, or sponsored by Meta Platforms, Inc.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              6. Messaging Rules &amp; Limits
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Automated messages are subject to Instagram&apos;s 24-hour
                standard messaging window
              </li>
              <li>
                Only one private reply is permitted per comment to prevent spam
              </li>
              <li>
                Users who opt out (e.g. by sending STOP) will not receive
                further automated messages
              </li>
              <li>
                IgInbox enforces per-account send caps and cooldown periods
                between automated messages
              </li>
              <li>
                The Service respects Meta&apos;s rate limits and applies
                exponential backoff on API errors
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              7. Subscription &amp; Billing
            </h2>
            <p className="mt-2">
              IgInbox offers subscription plans with varying feature and usage
              limits. By subscribing, you authorise recurring charges to your
              chosen payment method (Stripe or Razorpay). Fees are
              non-refundable except where required by law. Usage is metered by
              unique contacts per billing month — you will receive a warning at
              80% of your plan limit and a hard stop with an upgrade prompt at
              100%.
            </p>
            <p className="mt-2">
              We may change pricing with 30 days&apos; written notice. Your
              continued use after the change constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              8. Service Availability
            </h2>
            <p className="mt-2">
              We target 99.9% availability for the webhook endpoint and strive
              to keep IgInbox available 24/7, but we do not guarantee
              uninterrupted service. Scheduled maintenance, updates, or changes
              to Meta&apos;s API may affect availability. We will provide
              reasonable notice for planned downtime.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              9. Intellectual Property
            </h2>
            <p className="mt-2">
              The IgInbox platform — including its design, code, branding, and
              documentation — is our intellectual property. The automation flows,
              content, and data you create remain yours. You grant us a limited,
              non-exclusive licence to process your content as necessary to
              provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              10. Data &amp; Privacy
            </h2>
            <p className="mt-2">
              Your use of IgInbox is also governed by our{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 transition hover:text-foreground"
              >
                Privacy Policy
              </Link>
              . You acknowledge that we process Instagram data on your behalf
              using official Meta APIs, and that you are responsible for
              obtaining any necessary consents from your contacts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              11. Limitation of Liability
            </h2>
            <p className="mt-2">
              IgInbox is provided &quot;as is&quot; without warranty of any
              kind, express or implied. We are not liable for any indirect,
              incidental, special, or consequential damages arising from your
              use of the Service, including any actions taken by Meta or
              Instagram against your account due to automated messaging. Our
              total liability is limited to the amount you paid us in the 12
              months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              12. Indemnification
            </h2>
            <p className="mt-2">
              You agree to indemnify and hold IgInbox harmless from any claims,
              losses, or damages arising from your use of the Service, your
              violation of these Terms, or your violation of Meta&apos;s
              policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              13. Termination
            </h2>
            <p className="mt-2">
              We may suspend or terminate your account if you violate these
              Terms, Meta&apos;s policies, or use the Service in a manner that
              could harm other users or the platform. You may delete your
              account at any time from your account settings. Upon termination,
              your data will be deleted in accordance with our{" "}
              <Link
                href="/data-deletion"
                className="underline underline-offset-2 transition hover:text-foreground"
              >
                Data Deletion Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              14. Governing Law
            </h2>
            <p className="mt-2">
              These Terms are governed by the laws of India. Any disputes shall
              be resolved in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              15. Changes to Terms
            </h2>
            <p className="mt-2">
              We may update these Terms from time to time. Material changes will
              be communicated via email. Continued use after changes constitutes
              acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              16. Contact
            </h2>
            <p className="mt-2">
              For questions about these terms, contact us at{" "}
              <span className="font-medium text-foreground">
                info@iginbox.com
              </span>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 flex items-center gap-4 text-sm">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 text-zinc-400 transition hover:text-white"
          >
            Privacy Policy <ArrowUpRight className="size-3.5" />
          </Link>
          <Link
            href="/data-deletion"
            className="inline-flex items-center gap-1.5 text-zinc-400 transition hover:text-white"
          >
            Data Deletion <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} IgInbox. All rights reserved.
      </footer>
    </div>
  );
}
