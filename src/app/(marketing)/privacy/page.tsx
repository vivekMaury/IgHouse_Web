import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "IgHouse privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border/60 px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          IgHouse
        </Link>
      </header>

      <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: October 19, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p className="mt-2">
              When you create an account, we collect your email address and authentication credentials.
              When you connect an Instagram account, we receive an access token and your Instagram
              business profile information (username, profile picture, page ID) through the Meta
              (Instagram) API. We do not store your Instagram password.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To provide and operate the IgHouse automation service</li>
              <li>To send and receive Instagram DMs and comment replies on your behalf</li>
              <li>To manage your contacts and conversation history within the platform</li>
              <li>To send transactional emails related to your account</li>
              <li>To improve and maintain the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Instagram Data</h2>
            <p className="mt-2">
              We access Instagram data through Meta&apos;s official APIs. We only request permissions
              necessary to operate the service (managing messages, reading comments, accessing
              profile info). All Instagram access tokens are encrypted at rest using AES-256-GCM
              encryption. We do not sell or share your Instagram data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Data Storage & Security</h2>
            <p className="mt-2">
              Your data is stored in Supabase (powered by PostgreSQL) with row-level security
              policies ensuring workspace isolation. All data is encrypted in transit (TLS) and
              sensitive tokens are encrypted at rest. We implement strict access controls and
              regularly audit our security practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Data Retention</h2>
            <p className="mt-2">
              We retain your data for as long as your account is active. When you delete your
              account, all associated data (flows, contacts, messages, connected accounts) is
              permanently deleted within 30 days. You can request data deletion at any time by
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Third-Party Services</h2>
            <p className="mt-2">We use the following third-party services to operate IgHouse:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Meta (Instagram) API — for DM and comment automation</li>
              <li>Supabase — database and authentication</li>
              <li>Vercel — hosting and deployment</li>
              <li>Inngest — background job processing</li>
              <li>Upstash — rate limiting and caching</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Disconnect your Instagram account at any time</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Meta Platform Terms</h2>
            <p className="mt-2">
              Our use of Instagram data is governed by Meta&apos;s Platform Terms and Developer
              Policies. We comply with all applicable Meta policies regarding data usage, storage,
              and deletion. Users may revoke access at any time through their Instagram settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this privacy policy from time to time. We will notify registered users
              of material changes via email. Continued use of the service after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
            <p className="mt-2">
              If you have questions about this privacy policy or your data, contact us at{" "}
              <span className="font-medium text-foreground">privacy@ighouse.com</span>.
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
