import type { Metadata } from "next";
import { Trash2, CheckCircle2 } from "lucide-react";
import {
  JsonLd,
  webPageSchema,
  breadcrumbSchema,
} from "@/components/seo/JsonLd";
import { LegalShell } from "@/components/legal-shell";

const SITE_URL = "https://iginbox.com";
const LAST_UPDATED = "2026-11-07";

export const metadata: Metadata = {
  title: "Data Deletion",
  description:
    "IgInbox data deletion instructions — how to request removal of your Instagram account data and connection tokens. Meta-compliant callback endpoint.",
  alternates: { canonical: "/data-deletion" },
  openGraph: {
    title: "Data Deletion Instructions | IgInbox",
    description:
      "How to request deletion of your data from IgInbox — dashboard, Meta callback, or email. Full timeline and confirmation details.",
    url: `${SITE_URL}/data-deletion`,
  },
};

function DeletionMethod({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:border-white/[0.12]">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-pink-400/10 text-sm font-bold text-pink-300">
          {step}
        </span>
        <h3 className="text-[15px] font-semibold text-white">{title}</h3>
      </div>
      <div className="pl-11 text-[15px] leading-7 text-zinc-400">
        {children}
      </div>
    </div>
  );
}

export default function DataDeletionPage() {
  return (
    <LegalShell>
      <JsonLd
        schema={[
          webPageSchema({
            name: "Data Deletion Instructions",
            url: `${SITE_URL}/data-deletion`,
            description:
              "Meta-compliant data deletion instructions for IgInbox. Three methods: dashboard, Instagram settings callback, or email request.",
            lastReviewed: LAST_UPDATED,
          }),
          breadcrumbSchema([
            { name: "Home", url: SITE_URL },
            { name: "Data Deletion", url: `${SITE_URL}/data-deletion` },
          ]),
        ]}
      />

      {/* Page header */}
      <div className="mb-10 flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300 ring-1 ring-red-400/20">
          <Trash2 className="size-6" strokeWidth={1.6} />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Data Deletion Instructions
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Plain-language summary */}
      <div className="mb-10 rounded-2xl border border-amber-400/15 bg-amber-400/[0.03] p-6">
        <p className="text-sm font-semibold text-amber-300">
          In plain language
        </p>
        <p className="mt-2 text-[15px] leading-7 text-zinc-400">
          You can delete all of your data from IgInbox at any time — from your
          dashboard, through Instagram&apos;s settings (which triggers an
          automatic Meta callback), or by emailing{" "}
          <a
            href="mailto:info@iginbox.com"
            className="font-medium text-zinc-200 underline underline-offset-2 transition hover:text-white"
          >
            info@iginbox.com
          </a>
          . Deletion is permanent and includes all flows, contacts, messages,
          and encrypted Instagram tokens. Backups are purged within 30 days.
        </p>
      </div>

      {/* Divider */}
      <div className="mb-10 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Sections */}
      <article className="space-y-10 text-[15px] leading-7 text-zinc-400">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            1. Your Right to Delete
          </h2>
          <p>
            You have the right to request deletion of all personal data
            associated with your IgInbox account at any time. We honour every
            deletion request promptly and transparently, in compliance with
            GDPR, CCPA, India&apos;s DPDP Act, and Meta Platform Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            2. How to Request Deletion
          </h2>
          <p className="mb-5">There are three ways to delete your data:</p>
          <div className="space-y-3">
            <DeletionMethod step="A" title="From your IgInbox dashboard">
              <p>
                Go to{" "}
                <strong className="text-zinc-200">
                  Settings &rarr; Danger Zone &rarr; Delete All Data
                </strong>
                . This immediately removes all workspace data including flows,
                contacts, messages, and connected accounts. Your account is
                closed and you are logged out.
              </p>
            </DeletionMethod>
            <DeletionMethod step="B" title="Via Instagram settings">
              <p>
                Remove IgInbox from your connected apps in Instagram settings.
                This triggers an automatic data deletion callback from Meta. We
                verify the request using HMAC-SHA256, then immediately delete
                all data associated with that Instagram account.
              </p>
            </DeletionMethod>
            <DeletionMethod step="C" title="By email">
              <p>
                Email{" "}
                <a
                  href="mailto:info@iginbox.com"
                  className="font-medium text-zinc-200 underline underline-offset-2 transition hover:text-white"
                >
                  info@iginbox.com
                </a>{" "}
                with the subject line &quot;Data Deletion Request&quot; and the
                email address associated with your account. We process email
                requests within 48 hours.
              </p>
            </DeletionMethod>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            3. What Gets Deleted
          </h2>
          <p>
            When you request data deletion, the following is permanently
            removed:
          </p>
          <ul className="mt-4 space-y-2.5 pl-1">
            {[
              "Your account profile and authentication credentials",
              "All connected Instagram account tokens (immediately revoked and destroyed)",
              "Automation flows and flow version history",
              "Contact records, tags, custom fields, and captured lead data",
              "Conversation history and message logs",
              "Workspace settings, team member associations, and role assignments",
              "Audit logs, analytics data, and webhook event records",
              "Any uploaded media in your workspace storage bucket",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            4. Deletion Timeline
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/[0.08]">
            <table className="w-full text-[15px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-5 py-3.5 text-left font-medium text-zinc-200">
                    Method
                  </th>
                  <th className="px-5 py-3.5 text-left font-medium text-zinc-200">
                    Timeline
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                <tr>
                  <td className="px-5 py-3 text-zinc-300">
                    Dashboard deletion
                  </td>
                  <td className="px-5 py-3">Immediate</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-zinc-300">Meta callback</td>
                  <td className="px-5 py-3">Within minutes</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-zinc-300">Email request</td>
                  <td className="px-5 py-3">Within 48 hours</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-zinc-300">Backup purge</td>
                  <td className="px-5 py-3">Within 30 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            5. Meta Data Deletion Callback
          </h2>
          <p>
            In compliance with Meta Platform Terms, IgInbox implements a data
            deletion callback endpoint. When a user removes the IgInbox app
            from their Instagram or Facebook settings, Meta sends a signed
            request to our server. We:
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 marker:text-zinc-700">
            <li>
              Verify the request signature using HMAC-SHA256 with our app secret
            </li>
            <li>
              Identify all data associated with that user&apos;s Instagram
              account
            </li>
            <li>
              Permanently delete all associated data from our active database
            </li>
            <li>
              Return a unique confirmation code and status URL where deletion
              progress can be verified
            </li>
          </ol>
          <p className="mt-3">
            This endpoint is always available at{" "}
            <code className="rounded bg-white/[0.06] px-2 py-1 text-[13px] text-zinc-300">
              https://iginbox.com/api/webhooks/meta/data-deletion
            </code>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            6. Data We May Retain
          </h2>
          <p>After deletion, we may retain only:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-zinc-700">
            <li>
              <strong className="text-zinc-200">
                Anonymised analytics:
              </strong>{" "}
              Aggregated, non-identifiable usage statistics that cannot be
              linked back to you
            </li>
            <li>
              <strong className="text-zinc-200">Legal records:</strong>{" "}
              Transaction records required by law (e.g., billing invoices) for
              the legally mandated retention period
            </li>
          </ul>
          <p className="mt-3">
            No personal data, Instagram tokens, messages, or contact
            information is retained after deletion.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            7. Confirmation
          </h2>
          <p>
            After your data is deleted, you will receive a confirmation email at
            the address associated with your account. If you initiated deletion
            via Meta&apos;s callback, you can verify the status using the
            confirmation code and status URL provided by Meta.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            8. Contact
          </h2>
          <p>
            For questions about data deletion or to submit a request, contact us
            at{" "}
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
