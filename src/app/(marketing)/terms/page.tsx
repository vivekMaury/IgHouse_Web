import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import {
  JsonLd,
  webPageSchema,
  breadcrumbSchema,
} from "@/components/seo/JsonLd";
import { LegalShell } from "@/components/legal-shell";

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

export default function TermsPage() {
  return (
    <LegalShell>
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

      {/* Page header */}
      <div className="mb-10 flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/20">
          <FileText className="size-6" strokeWidth={1.6} />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Plain-language summary */}
      <div className="mb-10 rounded-2xl border border-violet-400/15 bg-violet-400/[0.03] p-6">
        <p className="text-sm font-semibold text-violet-300">
          In plain language
        </p>
        <p className="mt-2 text-[15px] leading-7 text-zinc-400">
          IgInbox is an Instagram automation SaaS. You need an eligible
          professional account, must follow Meta&apos;s policies, and can&apos;t
          use the service for spam or abuse. We enforce messaging limits, honour
          opt-outs, and can suspend accounts that violate these terms. You can
          delete your account and data at any time.
        </p>
      </div>

      {/* Divider */}
      <div className="mb-10 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Sections */}
      <article className="space-y-10 text-[15px] leading-7 text-zinc-400">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By creating an account or using IgInbox (&quot;the Service&quot;),
            you agree to these Terms of Service (&quot;Terms&quot;). If you do
            not agree, do not use the Service. These Terms form a legally
            binding agreement between you and IgInbox.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            2. Description of Service
          </h2>
          <p>
            IgInbox is an Instagram DM and comment automation platform. It
            allows you to build visual automation flows that respond to
            Instagram comments, send direct messages, capture leads, and manage
            conversations through a shared team inbox — all using Meta&apos;s
            official APIs.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            3. Account Requirements
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 marker:text-zinc-700">
            <li>You must be at least 18 years old to use IgInbox</li>
            <li>You must provide a valid email address</li>
            <li>
              You are responsible for maintaining the security of your account
              credentials
            </li>
            <li>
              You must have an Instagram Business or Creator account to connect
            </li>
            <li>
              You must be the authorised owner or administrator of any connected
              Instagram account
            </li>
            <li>
              One account per person or legal entity unless operating multiple
              workspaces under an agency plan
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            4. Acceptable Use
          </h2>
          <p>You agree NOT to use IgInbox to:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-zinc-700">
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
              Reverse-engineer, scrape, or redistribute any part of the Service
            </li>
            <li>Use the Service for any illegal or unauthorised purpose</li>
          </ul>
          <p className="mt-3">
            Violation of this section may result in immediate account suspension
            without prior notice.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            5. Meta Platform Compliance
          </h2>
          <p>
            IgInbox operates through Meta&apos;s official APIs and adheres to
            Meta&apos;s Platform Terms. Your use of IgInbox is also subject to
            Meta&apos;s terms and policies. Violation of Meta&apos;s policies
            may result in suspension of your IgInbox account and disconnection
            of your Instagram integration. IgInbox is not affiliated with,
            endorsed by, or sponsored by Meta Platforms, Inc.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            6. Messaging Rules &amp; Limits
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 marker:text-zinc-700">
            <li>
              Automated messages are subject to Instagram&apos;s 24-hour
              standard messaging window
            </li>
            <li>
              Only one private reply is permitted per comment to prevent spam
            </li>
            <li>
              Users who opt out (e.g. by sending STOP) will not receive further
              automated messages
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
          <h2 className="mb-3 text-lg font-semibold text-white">
            7. Subscription &amp; Billing
          </h2>
          <p>
            IgInbox offers subscription plans with varying feature and usage
            limits. By subscribing, you authorise recurring charges to your
            chosen payment method (Stripe or Razorpay). Fees are non-refundable
            except where required by law. Usage is metered by unique contacts
            per billing month — you will receive a warning at 80% of your plan
            limit and a hard stop with an upgrade prompt at 100%.
          </p>
          <p className="mt-3">
            We may change pricing with 30 days&apos; written notice. Your
            continued use after the change constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            8. Service Availability
          </h2>
          <p>
            We target 99.9% availability for the webhook endpoint and strive to
            keep IgInbox available 24/7, but we do not guarantee uninterrupted
            service. Scheduled maintenance, updates, or changes to Meta&apos;s
            API may affect availability. We will provide reasonable notice for
            planned downtime.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            9. Intellectual Property
          </h2>
          <p>
            The IgInbox platform — including its design, code, branding, and
            documentation — is our intellectual property. The automation flows,
            content, and data you create remain yours. You grant us a limited,
            non-exclusive licence to process your content as necessary to
            provide the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            10. Data &amp; Privacy
          </h2>
          <p>
            Your use of IgInbox is also governed by our{" "}
            <Link
              href="/privacy"
              className="font-medium text-zinc-200 underline underline-offset-2 transition hover:text-white"
            >
              Privacy Policy
            </Link>
            . You acknowledge that we process Instagram data on your behalf
            using official Meta APIs, and that you are responsible for obtaining
            any necessary consents from your contacts.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            11. Limitation of Liability
          </h2>
          <p>
            IgInbox is provided &quot;as is&quot; without warranty of any kind,
            express or implied. We are not liable for any indirect, incidental,
            special, or consequential damages arising from your use of the
            Service, including any actions taken by Meta or Instagram against
            your account due to automated messaging. Our total liability is
            limited to the amount you paid us in the 12 months preceding the
            claim.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            12. Indemnification
          </h2>
          <p>
            You agree to indemnify and hold IgInbox harmless from any claims,
            losses, or damages arising from your use of the Service, your
            violation of these Terms, or your violation of Meta&apos;s policies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            13. Termination
          </h2>
          <p>
            We may suspend or terminate your account if you violate these
            Terms, Meta&apos;s policies, or use the Service in a manner that
            could harm other users or the platform. You may delete your account
            at any time from your account settings. Upon termination, your data
            will be deleted in accordance with our{" "}
            <Link
              href="/data-deletion"
              className="font-medium text-zinc-200 underline underline-offset-2 transition hover:text-white"
            >
              Data Deletion Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            14. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be
            resolved in the courts of competent jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            15. Changes to Terms
          </h2>
          <p>
            We may update these Terms from time to time. Material changes will
            be communicated via email. Continued use after changes constitutes
            acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            16. Contact
          </h2>
          <p>
            For questions about these terms, contact us at{" "}
            <a
              href="mailto:info@iginbox.com"
              className="font-medium text-zinc-200 underline underline-offset-2 transition hover:text-white"
            >
              info@iginbox.com
            </a>
            .
          </p>
        </section>
      </article>
    </LegalShell>
  );
}
