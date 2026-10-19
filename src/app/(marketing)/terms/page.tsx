import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "IgHouse terms of service — rules and guidelines for using the platform.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-white/5 px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Ig<span className="text-[#FF007F]">House</span>
        </Link>
      </header>

      <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: October 19, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By creating an account or using IgHouse, you agree to these Terms of Service. If you
              do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p className="mt-2">
              IgHouse is an Instagram DM and comment automation platform. It allows you to build
              visual flows that automatically respond to Instagram comments, send direct messages,
              and manage conversations through a shared inbox.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Account Requirements</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>You must be at least 18 years old to use IgHouse</li>
              <li>You must provide a valid email address</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must have an Instagram Business or Creator account to connect</li>
              <li>You must be the authorized owner/administrator of any connected Instagram account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Acceptable Use</h2>
            <p className="mt-2">You agree NOT to use IgHouse to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Send spam, unsolicited messages, or bulk promotional content</li>
              <li>Violate Meta&apos;s Platform Terms, Community Guidelines, or Developer Policies</li>
              <li>Harass, threaten, or send abusive messages to any person</li>
              <li>Impersonate another person or entity</li>
              <li>Collect personal data of Instagram users without proper consent</li>
              <li>Exceed Instagram&apos;s API rate limits or circumvent platform restrictions</li>
              <li>Use the service for any illegal or unauthorized purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Meta Platform Compliance</h2>
            <p className="mt-2">
              IgHouse operates through Meta&apos;s official APIs and adheres to Meta&apos;s Platform
              Terms. You acknowledge that your use of IgHouse is also subject to Meta&apos;s terms
              and policies. Violation of Meta&apos;s policies may result in suspension of your
              IgHouse account and disconnection of your Instagram integration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Messaging Limits & Rules</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Automated messages are subject to Instagram&apos;s 24-hour messaging window</li>
              <li>Only one private reply is sent per comment to prevent spam</li>
              <li>Users who opt out will not receive further automated messages</li>
              <li>IgHouse enforces cooldown periods between automated messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Service Availability</h2>
            <p className="mt-2">
              We strive to keep IgHouse available 24/7, but we do not guarantee uninterrupted
              service. We may perform maintenance, updates, or experience downtime. Changes to
              Meta&apos;s API may also affect service availability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Intellectual Property</h2>
            <p className="mt-2">
              The IgHouse platform, including its design, code, and branding, is our intellectual
              property. The automation flows and content you create remain yours. You grant us a
              limited license to process your content as necessary to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Limitation of Liability</h2>
            <p className="mt-2">
              IgHouse is provided &quot;as is&quot; without warranty. We are not liable for any
              indirect, incidental, or consequential damages arising from your use of the service,
              including any actions taken by Meta or Instagram against your account due to
              automated messaging.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Termination</h2>
            <p className="mt-2">
              We may suspend or terminate your account if you violate these terms, Meta&apos;s
              policies, or use the service in a manner that could harm other users or the platform.
              You may delete your account at any time from your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Changes to Terms</h2>
            <p className="mt-2">
              We may update these terms from time to time. Material changes will be communicated
              via email. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Contact</h2>
            <p className="mt-2">
              For questions about these terms, contact us at{" "}
              <span className="font-medium text-foreground">legal@ighouse.com</span>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-sm text-muted-foreground">
        &copy; 2026 IgHouse. All rights reserved.
      </footer>
    </div>
  );
}
