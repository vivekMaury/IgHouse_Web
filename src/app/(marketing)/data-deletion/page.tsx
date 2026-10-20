import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Deletion",
  description: "IgHouse data deletion policy — how to request deletion of your data and what happens when you do.",
};

export default function DataDeletionPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-white/5 px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Ig<span className="text-[#FF007F]">House</span>
        </Link>
      </header>

      <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Data Deletion Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: October 20, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Your Right to Delete</h2>
            <p className="mt-2">
              You have the right to request deletion of all personal data associated with your
              IgHouse account at any time. We are committed to honoring every deletion request
              promptly and transparently, in compliance with GDPR, CCPA, and Meta Platform Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How to Request Deletion</h2>
            <p className="mt-2">There are three ways to delete your data:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-foreground">From your dashboard:</span>{" "}
                Go to <span className="font-medium text-foreground">Settings → Danger Zone → Delete All Data</span>.
                This immediately removes all workspace data including flows, contacts, messages, and connected accounts.
              </li>
              <li>
                <span className="font-medium text-foreground">Via Instagram settings:</span>{" "}
                Remove IgHouse from your Instagram connected apps. This triggers an automatic data deletion
                callback from Meta, and we remove all data associated with that Instagram account.
              </li>
              <li>
                <span className="font-medium text-foreground">By contacting us:</span>{" "}
                Email{" "}
                <span className="font-medium text-foreground">privacy@ighouse.com</span>{" "}
                with the subject line &quot;Data Deletion Request&quot; and the email address associated
                with your account. We will process your request within 48 hours.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. What Gets Deleted</h2>
            <p className="mt-2">When you request data deletion, the following is permanently removed:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Your account profile and authentication credentials</li>
              <li>All connected Instagram account tokens (immediately revoked and destroyed)</li>
              <li>Automation flows and flow definitions</li>
              <li>Contact records and lead data</li>
              <li>Conversation history and message logs</li>
              <li>Workspace settings and team member associations</li>
              <li>Audit logs related to your workspace</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Deletion Timeline</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <span className="font-medium text-foreground">Dashboard deletion:</span>{" "}
                Data is removed immediately from our active database.
              </li>
              <li>
                <span className="font-medium text-foreground">Meta callback deletion:</span>{" "}
                Processed within minutes of receiving the callback from Meta.
              </li>
              <li>
                <span className="font-medium text-foreground">Email requests:</span>{" "}
                Processed within 48 hours of receiving the request.
              </li>
              <li>
                <span className="font-medium text-foreground">Backup purge:</span>{" "}
                Encrypted backups are purged within 30 days of the deletion request.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Meta Data Deletion Callback</h2>
            <p className="mt-2">
              In compliance with Meta Platform Terms, IgHouse implements a data deletion callback
              endpoint. When a user removes the IgHouse app from their Instagram/Facebook settings,
              Meta sends a signed request to our server. We verify the request using HMAC-SHA256
              and immediately delete all data associated with that user&apos;s Instagram account.
            </p>
            <p className="mt-2">
              A unique confirmation code is generated for each deletion request, and a status URL
              is provided where the deletion progress can be verified.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Data We May Retain</h2>
            <p className="mt-2">
              After deletion, we may retain the following for legal and operational purposes:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>
                <span className="font-medium text-foreground">Anonymized analytics:</span>{" "}
                Aggregated, non-identifiable usage statistics that cannot be linked back to you.
              </li>
              <li>
                <span className="font-medium text-foreground">Legal records:</span>{" "}
                Transaction records required by law (e.g., billing invoices) for the legally
                mandated retention period.
              </li>
            </ul>
            <p className="mt-2">
              No personal data, Instagram tokens, messages, or contact information is retained
              after deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Verification</h2>
            <p className="mt-2">
              After your data is deleted, you will receive a confirmation email at the address
              associated with your account. If you initiated deletion via Meta&apos;s callback,
              you can verify the status using the confirmation code and status URL provided by Meta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
            <p className="mt-2">
              For questions about data deletion or to submit a request, contact us at{" "}
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
