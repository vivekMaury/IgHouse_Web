import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Shield } from "lucide-react";
import {
  JsonLd,
  webPageSchema,
  breadcrumbSchema,
} from "@/components/seo/JsonLd";

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
        <Link href="/terms" className="transition hover:text-zinc-200">
          Terms
        </Link>
        <Link href="/data-deletion" className="transition hover:text-zinc-200">
          Data Deletion
        </Link>
      </nav>
    </header>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
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
      <Header />

      <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-pink-400/10 text-pink-300">
            <Shield className="size-5" strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </div>

        {/* Plain-language summary */}
        <div className="mb-8 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
          <p className="text-sm font-medium text-emerald-300">Quick summary</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            IgInbox uses the official Instagram API to automate DMs and comment
            replies on your behalf. We encrypt your Instagram tokens with
            AES-256-GCM, isolate every workspace with row-level security, and
            never sell or share your data. You can delete everything at any time
            from your dashboard, or by contacting{" "}
            <span className="font-medium text-foreground">
              info@iginbox.com
            </span>
            .
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              1. Information We Collect
            </h2>
            <p className="mt-2">
              When you create an account, we collect your email address and
              authentication credentials via Supabase Auth (email/password or
              Google OAuth). When you connect an Instagram account, we receive:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                A short-lived access token (exchanged for a long-lived token and
                encrypted at rest)
              </li>
              <li>
                Your Instagram business profile information: username, profile
                picture, and page-scoped ID
              </li>
              <li>
                Permission-scoped data: comments on your posts, DM
                conversations you initiate or receive through IgInbox, and story
                mentions
              </li>
            </ul>
            <p className="mt-2">
              We do <strong className="text-foreground">not</strong> store your
              Instagram password. We do not access private messages outside the
              conversations initiated through IgInbox.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              2. How We Use Your Information
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                To operate the IgInbox automation service — sending DMs,
                replying to comments, and running flows
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
                To improve the product based on aggregated, non-identifiable
                usage patterns
              </li>
            </ul>
            <p className="mt-2">
              We <strong className="text-foreground">never</strong> sell, rent,
              or share your personal data or Instagram data with third-party
              advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. Instagram API Data Handling
            </h2>
            <p className="mt-2">
              We access Instagram data exclusively through Meta&apos;s official
              Graph API and Instagram API with Instagram Login. We request only
              the permissions necessary to operate the service:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <code className="text-xs text-zinc-300">
                  instagram_business_basic
                </code>{" "}
                — profile info and media
              </li>
              <li>
                <code className="text-xs text-zinc-300">
                  instagram_business_manage_messages
                </code>{" "}
                — send and receive DMs
              </li>
              <li>
                <code className="text-xs text-zinc-300">
                  instagram_business_manage_comments
                </code>{" "}
                — read and reply to comments
              </li>
            </ul>
            <p className="mt-2">
              All Instagram access tokens are encrypted at rest using
              AES-256-GCM with a unique initialisation vector per record.
              Encryption keys support versioned rotation via a{" "}
              <code className="text-xs text-zinc-300">key_version</code>{" "}
              column. Tokens are never logged, exposed in client-side code, or
              transmitted in plain text.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. Data Storage &amp; Security
            </h2>
            <p className="mt-2">
              Your data is stored in Supabase (powered by PostgreSQL) with
              row-level security (RLS) policies enforcing strict workspace
              isolation — Workspace A can never read or modify Workspace B data,
              verified by automated tests in CI.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>All data encrypted in transit (TLS 1.2+)</li>
              <li>Sensitive tokens encrypted at rest (AES-256-GCM)</li>
              <li>
                Security headers: CSP, HSTS, X-Content-Type-Options,
                Referrer-Policy
              </li>
              <li>
                Webhook payloads verified via{" "}
                <code className="text-xs text-zinc-300">
                  X-Hub-Signature-256
                </code>{" "}
                with timing-safe comparison
              </li>
              <li>Rate limiting on all public endpoints via Upstash Redis</li>
              <li>Daily database backups with point-in-time recovery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              5. Data Retention &amp; Deletion
            </h2>
            <p className="mt-2">
              We retain your data for as long as your account is active. When
              you delete your account or request data deletion:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                All workspace data (flows, contacts, messages, connected
                accounts) is permanently removed from our active database
                immediately
              </li>
              <li>Encrypted backups are purged within 30 days</li>
              <li>Instagram tokens are revoked and destroyed on the spot</li>
            </ul>
            <p className="mt-2">
              See our{" "}
              <Link
                href="/data-deletion"
                className="underline underline-offset-2 transition hover:text-foreground"
              >
                Data Deletion page
              </Link>{" "}
              for full details on how to request deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              6. Third-Party Services
            </h2>
            <p className="mt-2">
              We use the following services to operate IgInbox:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong className="text-zinc-300">Meta (Instagram) API</strong>{" "}
                — DM and comment automation
              </li>
              <li>
                <strong className="text-zinc-300">Supabase</strong> — database,
                authentication, realtime, and storage
              </li>
              <li>
                <strong className="text-zinc-300">Vercel</strong> — hosting and
                deployment
              </li>
              <li>
                <strong className="text-zinc-300">Inngest</strong> — durable
                background job processing
              </li>
              <li>
                <strong className="text-zinc-300">Upstash</strong> — Redis
                caching and rate limiting
              </li>
              <li>
                <strong className="text-zinc-300">Stripe / Razorpay</strong> —
                payment processing
              </li>
              <li>
                <strong className="text-zinc-300">Sentry</strong> — error
                monitoring (no PII or tokens logged)
              </li>
            </ul>
            <p className="mt-2">
              Each service processes only the minimum data necessary. We do not
              share your Instagram data with any analytics or advertising
              platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              7. Your Rights
            </h2>
            <p className="mt-2">
              Depending on your jurisdiction (GDPR, CCPA, India DPDP Act), you
              have the right to:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong className="text-zinc-300">Access</strong> — request a
                copy of the personal data we hold about you
              </li>
              <li>
                <strong className="text-zinc-300">Rectification</strong> —
                correct inaccurate data
              </li>
              <li>
                <strong className="text-zinc-300">Erasure</strong> — request
                deletion of your data
              </li>
              <li>
                <strong className="text-zinc-300">Portability</strong> — export
                your data in a machine-readable format
              </li>
              <li>
                <strong className="text-zinc-300">Restrict processing</strong>{" "}
                — limit how we use your data
              </li>
              <li>
                <strong className="text-zinc-300">Withdraw consent</strong> —
                disconnect your Instagram account at any time
              </li>
              <li>
                <strong className="text-zinc-300">Opt out</strong> — contacts
                can send STOP to halt all automated messages
              </li>
            </ul>
            <p className="mt-2">
              To exercise any right, email{" "}
              <span className="font-medium text-foreground">
                info@iginbox.com
              </span>{" "}
              or use the in-app controls. We respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              8. Cookies &amp; Tracking
            </h2>
            <p className="mt-2">
              IgInbox uses strictly necessary cookies for authentication (
              <code className="text-xs text-zinc-300">httpOnly</code>,{" "}
              <code className="text-xs text-zinc-300">secure</code>,{" "}
              <code className="text-xs text-zinc-300">sameSite=lax</code>). We
              use privacy-friendly analytics with no cross-site tracking and no
              advertising cookies. We do not use Meta Pixel or any third-party
              tracking pixels.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              9. Meta Platform Terms
            </h2>
            <p className="mt-2">
              Our use of Instagram data is governed by Meta&apos;s Platform
              Terms and Developer Policies. We comply with all applicable Meta
              policies regarding data usage, storage, and deletion. Users may
              revoke access at any time through their Instagram settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              10. International Data Transfers
            </h2>
            <p className="mt-2">
              Your data may be processed on servers located outside your country
              of residence. We ensure appropriate safeguards (such as standard
              contractual clauses) are in place when transferring data across
              borders.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              11. Children&apos;s Privacy
            </h2>
            <p className="mt-2">
              IgInbox is not intended for users under 18 years of age. We do not
              knowingly collect personal data from minors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              12. Changes to This Policy
            </h2>
            <p className="mt-2">
              We may update this privacy policy from time to time. Material
              changes will be communicated via email to registered users.
              Continued use of the service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              13. Contact
            </h2>
            <p className="mt-2">
              If you have questions about this privacy policy or wish to
              exercise your rights, contact us at{" "}
              <span className="font-medium text-foreground">
                info@iginbox.com
              </span>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 flex items-center gap-4 text-sm">
          <Link
            href="/terms"
            className="inline-flex items-center gap-1.5 text-zinc-400 transition hover:text-white"
          >
            Terms of Service <ArrowUpRight className="size-3.5" />
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
