import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import {
  JsonLd,
  webPageSchema,
  breadcrumbSchema,
} from "@/components/seo/JsonLd";
import { LegalShell } from "@/components/legal-shell";

const SITE_URL = "https://iginbox.com";
const LAST_UPDATED = "2026-11-07";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "IgInbox privacy policy — how we collect, use, store, and protect your Instagram data. GDPR, CCPA, and India DPDP Act compliant.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | IgInbox",
    description:
      "How IgInbox collects, stores, and protects your data — including Instagram Graph API data handling, encryption, and user rights.",
    url: `${SITE_URL}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <LegalShell>
      <JsonLd
        schema={[
          webPageSchema({
            name: "Privacy Policy",
            url: `${SITE_URL}/privacy`,
            description:
              "IgInbox privacy policy covering data collection, storage, Instagram API data handling, and user rights.",
            lastReviewed: LAST_UPDATED,
          }),
          breadcrumbSchema([
            { name: "Home", url: SITE_URL },
            { name: "Privacy Policy", url: `${SITE_URL}/privacy` },
          ]),
        ]}
      />

      {/* Page header */}
      <div className="mb-10 flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
          <Shield className="size-6" strokeWidth={1.6} />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Plain-language summary */}
      <div className="mb-10 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.03] p-6">
        <p className="text-sm font-semibold text-emerald-300">
          In plain language
        </p>
        <p className="mt-2 text-[15px] leading-7 text-zinc-400">
          IgInbox uses the official Instagram API to automate DMs and comment
          replies on your behalf. We encrypt your Instagram tokens with
          AES-256-GCM, isolate every workspace with row-level security, and
          never sell or share your data. You can delete everything at any time
          from your dashboard, or by contacting{" "}
          <a
            href="mailto:info@iginbox.com"
            className="font-medium text-zinc-200 underline underline-offset-2 transition hover:text-white"
          >
            info@iginbox.com
          </a>
          .
        </p>
      </div>

      {/* Divider */}
      <div className="mb-10 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Sections */}
      <article className="space-y-10 text-[15px] leading-7 text-zinc-400">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            1. Information We Collect
          </h2>
          <p>
            When you create an account, we collect your email address and
            authentication credentials via Supabase Auth (email/password or
            Google OAuth). When you connect an Instagram account, we receive:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-zinc-700">
            <li>
              A short-lived access token (exchanged for a long-lived token and
              encrypted at rest)
            </li>
            <li>
              Your Instagram business profile information: username, profile
              picture, and page-scoped ID
            </li>
            <li>
              Permission-scoped data: comments on your posts, DM conversations
              you initiate or receive through IgInbox, and story mentions
            </li>
          </ul>
          <p className="mt-3">
            We do <strong className="text-zinc-200">not</strong> store your
            Instagram password. We do not access private messages outside the
            conversations initiated through IgInbox.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 marker:text-zinc-700">
            <li>
              To operate the IgInbox automation service — sending DMs, replying
              to comments, and running flows
            </li>
            <li>
              To manage your contacts, conversation history, and lead data
              within the platform
            </li>
            <li>
              To send transactional emails (account verification, token expiry
              alerts, billing receipts)
            </li>
            <li>To monitor service health and prevent abuse</li>
            <li>
              To improve the product based on aggregated, non-identifiable usage
              patterns
            </li>
          </ul>
          <p className="mt-3">
            We <strong className="text-zinc-200">never</strong> sell, rent, or
            share your personal data or Instagram data with third-party
            advertisers.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            3. Instagram API Data Handling
          </h2>
          <p>
            We access Instagram data exclusively through Meta&apos;s official
            Graph API and Instagram API with Instagram Login. We request only
            the permissions necessary to operate the service:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-zinc-700">
            <li>
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-zinc-300">
                instagram_business_basic
              </code>{" "}
              — profile info and media
            </li>
            <li>
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-zinc-300">
                instagram_business_manage_messages
              </code>{" "}
              — send and receive DMs
            </li>
            <li>
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-zinc-300">
                instagram_business_manage_comments
              </code>{" "}
              — read and reply to comments
            </li>
          </ul>
          <p className="mt-3">
            All Instagram access tokens are encrypted at rest using AES-256-GCM
            with a unique initialisation vector per record. Encryption keys
            support versioned rotation via a{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-zinc-300">
              key_version
            </code>{" "}
            column. Tokens are never logged, exposed in client-side code, or
            transmitted in plain text.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            4. Data Storage &amp; Security
          </h2>
          <p>
            Your data is stored in Supabase (powered by PostgreSQL) with
            row-level security (RLS) policies enforcing strict workspace
            isolation — Workspace A can never read or modify Workspace B data,
            verified by automated tests in CI.
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-zinc-700">
            <li>All data encrypted in transit (TLS 1.2+)</li>
            <li>Sensitive tokens encrypted at rest (AES-256-GCM)</li>
            <li>
              Security headers: CSP, HSTS, X-Content-Type-Options,
              Referrer-Policy
            </li>
            <li>
              Webhook payloads verified via{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-zinc-300">
                X-Hub-Signature-256
              </code>{" "}
              with timing-safe comparison
            </li>
            <li>Rate limiting on all public endpoints via Upstash Redis</li>
            <li>Daily database backups with point-in-time recovery</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            5. Data Retention &amp; Deletion
          </h2>
          <p>
            We retain your data for as long as your account is active. When you
            delete your account or request data deletion:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-zinc-700">
            <li>
              All workspace data (flows, contacts, messages, connected accounts)
              is permanently removed from our active database immediately
            </li>
            <li>Encrypted backups are purged within 30 days</li>
            <li>Instagram tokens are revoked and destroyed on the spot</li>
          </ul>
          <p className="mt-3">
            See our{" "}
            <Link
              href="/data-deletion"
              className="font-medium text-zinc-200 underline underline-offset-2 transition hover:text-white"
            >
              Data Deletion page
            </Link>{" "}
            for full details on how to request deletion.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            6. Third-Party Services
          </h2>
          <p>We use the following services to operate IgInbox:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-zinc-700">
            <li>
              <strong className="text-zinc-200">Meta (Instagram) API</strong> —
              DM and comment automation
            </li>
            <li>
              <strong className="text-zinc-200">Supabase</strong> — database,
              authentication, realtime, and storage
            </li>
            <li>
              <strong className="text-zinc-200">Vercel</strong> — hosting and
              deployment
            </li>
            <li>
              <strong className="text-zinc-200">Inngest</strong> — durable
              background job processing
            </li>
            <li>
              <strong className="text-zinc-200">Upstash</strong> — Redis caching
              and rate limiting
            </li>
            <li>
              <strong className="text-zinc-200">Stripe / Razorpay</strong> —
              payment processing
            </li>
            <li>
              <strong className="text-zinc-200">Sentry</strong> — error
              monitoring (no PII or tokens logged)
            </li>
          </ul>
          <p className="mt-3">
            Each service processes only the minimum data necessary. We do not
            share your Instagram data with any analytics or advertising
            platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            7. Your Rights
          </h2>
          <p>
            Depending on your jurisdiction (GDPR, CCPA, India DPDP Act), you
            have the right to:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-zinc-700">
            <li>
              <strong className="text-zinc-200">Access</strong> — request a copy
              of the personal data we hold about you
            </li>
            <li>
              <strong className="text-zinc-200">Rectification</strong> — correct
              inaccurate data
            </li>
            <li>
              <strong className="text-zinc-200">Erasure</strong> — request
              deletion of your data
            </li>
            <li>
              <strong className="text-zinc-200">Portability</strong> — export
              your data in a machine-readable format
            </li>
            <li>
              <strong className="text-zinc-200">Restrict processing</strong> —
              limit how we use your data
            </li>
            <li>
              <strong className="text-zinc-200">Withdraw consent</strong> —
              disconnect your Instagram account at any time
            </li>
            <li>
              <strong className="text-zinc-200">Opt out</strong> — contacts can
              send STOP to halt all automated messages
            </li>
          </ul>
          <p className="mt-3">
            To exercise any right, email{" "}
            <a
              href="mailto:info@iginbox.com"
              className="font-medium text-zinc-200 underline underline-offset-2 transition hover:text-white"
            >
              info@iginbox.com
            </a>{" "}
            or use the in-app controls. We respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            8. Cookies &amp; Tracking
          </h2>
          <p>
            IgInbox uses strictly necessary cookies for authentication (
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-zinc-300">
              httpOnly
            </code>
            ,{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-zinc-300">
              secure
            </code>
            ,{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-zinc-300">
              sameSite=lax
            </code>
            ). We use privacy-friendly analytics with no cross-site tracking and
            no advertising cookies. We do not use Meta Pixel or any third-party
            tracking pixels.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            9. Meta Platform Terms
          </h2>
          <p>
            Our use of Instagram data is governed by Meta&apos;s Platform Terms
            and Developer Policies. We comply with all applicable Meta policies
            regarding data usage, storage, and deletion. Users may revoke access
            at any time through their Instagram settings.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            10. International Data Transfers
          </h2>
          <p>
            Your data may be processed on servers located outside your country
            of residence. We ensure appropriate safeguards (such as standard
            contractual clauses) are in place when transferring data across
            borders.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            11. Children&apos;s Privacy
          </h2>
          <p>
            IgInbox is not intended for users under 18 years of age. We do not
            knowingly collect personal data from minors.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            12. Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. Material
            changes will be communicated via email to registered users.
            Continued use of the service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            13. Contact
          </h2>
          <p>
            If you have questions about this privacy policy or wish to exercise
            your rights, contact us at{" "}
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
