import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation",
  description: "IgHouse documentation — learn how to set up automations, connect Instagram, and grow your audience.",
};

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-white/5 px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Ig<span className="text-[#FF007F]">House</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything you need to get started with IgHouse and make the most of your Instagram automation.
        </p>

        <div className="mt-10 space-y-10">
          {/* Getting Started */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FF007F]/10 text-xs font-bold text-[#FF007F]">1</span>
              Getting Started
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <div className="rounded-lg border border-border/60 p-4">
                <h3 className="font-semibold text-foreground">Create Your Account</h3>
                <p className="mt-1.5">
                  Sign up for free at{" "}
                  <Link href="/signup" className="font-medium text-[#FF007F] hover:underline">ighouse.com/signup</Link>.
                  No credit card required. You can use your email and password or sign in with Google.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-4">
                <h3 className="font-semibold text-foreground">Connect Your Instagram Account</h3>
                <p className="mt-1.5">
                  Navigate to <span className="font-medium text-foreground">Settings → Instagram</span> and
                  click <span className="font-medium text-foreground">Connect Instagram</span>. You&apos;ll be
                  redirected to Meta&apos;s OAuth flow where you&apos;ll grant IgHouse permission to manage
                  your messages and read comments.
                </p>
                <div className="mt-3 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-200/80">
                  <span className="font-semibold">Requirement:</span> You must have an Instagram Business or Creator
                  account connected to a Facebook Page. Personal accounts are not supported by Meta&apos;s API.
                </div>
              </div>
            </div>
          </section>

          {/* Flow Builder */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#7B2FBE]/10 text-xs font-bold text-[#7B2FBE]">2</span>
              Flow Builder
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                The Flow Builder is a visual drag-and-drop canvas where you create your automation logic.
                Each flow starts with a <span className="font-medium text-foreground">Trigger</span> and can include
                any combination of the following nodes:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Comment Trigger",
                    desc: "Starts the flow when someone comments on your post with a matching keyword.",
                    color: "#F59E0B",
                  },
                  {
                    title: "Send DM",
                    desc: "Sends an automated direct message to the user who triggered the flow.",
                    color: "#3B82F6",
                  },
                  {
                    title: "Private Reply",
                    desc: "Replies to the original comment publicly before sending a DM.",
                    color: "#FF007F",
                  },
                  {
                    title: "Wait / Delay",
                    desc: "Pauses the flow for a set duration before proceeding to the next step.",
                    color: "#8B5CF6",
                  },
                  {
                    title: "Condition",
                    desc: "Branches the flow based on keyword matching or contact properties.",
                    color: "#EC4899",
                  },
                  {
                    title: "Capture Lead",
                    desc: "Saves the user's info as a contact and applies tags for segmentation.",
                    color: "#10B981",
                  },
                ].map((node) => (
                  <div key={node.title} className="rounded-lg border border-border/60 p-3">
                    <h4 className="font-semibold" style={{ color: node.color }}>{node.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{node.desc}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-border/60 p-4">
                <h3 className="font-semibold text-foreground">Creating a Flow</h3>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                  <li>Go to <span className="font-medium text-foreground">Dashboard → Flows → New Flow</span></li>
                  <li>Give your flow a name (e.g., &quot;Pricing Funnel&quot;)</li>
                  <li>Drag a <span className="font-medium text-foreground">Comment Trigger</span> onto the canvas</li>
                  <li>Set your trigger keywords (e.g., &quot;PRICE&quot;, &quot;INFO&quot;, &quot;LINK&quot;)</li>
                  <li>Connect a <span className="font-medium text-foreground">Send DM</span> node and write your message</li>
                  <li>Optionally add delays, conditions, or lead capture steps</li>
                  <li>Click <span className="font-medium text-foreground">Save &amp; Activate</span></li>
                </ol>
              </div>
            </div>
          </section>

          {/* Inbox */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3B82F6]/10 text-xs font-bold text-[#3B82F6]">3</span>
              Inbox &amp; Conversations
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                The Inbox gives you a real-time view of all DM conversations happening through your automations.
              </p>
              <div className="rounded-lg border border-border/60 p-4">
                <h3 className="font-semibold text-foreground">Features</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li><span className="font-medium text-foreground">Real-time updates:</span> Messages appear instantly via live subscriptions</li>
                  <li><span className="font-medium text-foreground">Human takeover:</span> Pause the bot on any conversation to reply personally</li>
                  <li><span className="font-medium text-foreground">Filters:</span> View all, unread, or bot-paused conversations</li>
                  <li><span className="font-medium text-foreground">24-hour window:</span> A visual indicator shows if the messaging window is still open</li>
                  <li><span className="font-medium text-foreground">Contact info:</span> See contact tags and captured data alongside the conversation</li>
                </ul>
              </div>
              <div className="rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-200/80">
                <span className="font-semibold">Note:</span> Instagram&apos;s API enforces a 24-hour messaging window.
                You can only send messages to a user within 24 hours of their last message to you. IgHouse
                automatically tracks this and prevents sends outside the window.
              </div>
            </div>
          </section>

          {/* Contacts */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10B981]/10 text-xs font-bold text-[#10B981]">4</span>
              Contacts &amp; Leads
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Every user who interacts with your automation is saved as a contact. You can tag contacts,
                capture their email or phone, and build segmented audiences.
              </p>
              <div className="rounded-lg border border-border/60 p-4">
                <h3 className="font-semibold text-foreground">Contact Management</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>Contacts are created automatically when a user triggers a flow</li>
                  <li>Use the <span className="font-medium text-foreground">Capture Lead</span> node to ask for email, phone, or custom fields</li>
                  <li>Apply tags to segment your audience (e.g., &quot;interested&quot;, &quot;purchased&quot;, &quot;VIP&quot;)</li>
                  <li>Export contacts as CSV from the dashboard (Pro plan)</li>
                  <li>Contacts who opt out are automatically excluded from future automation</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Settings & Security */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EF4444]/10 text-xs font-bold text-[#EF4444]">5</span>
              Settings &amp; Security
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <div className="rounded-lg border border-border/60 p-4">
                <h3 className="font-semibold text-foreground">Instagram Connection</h3>
                <p className="mt-1.5">
                  Manage your connected Instagram accounts from{" "}
                  <span className="font-medium text-foreground">Settings → Instagram</span>.
                  You can connect up to 1 account on Free and 5 on Pro. Disconnecting an account
                  revokes the token and removes associated data.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-4">
                <h3 className="font-semibold text-foreground">Data &amp; Privacy</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>All Instagram tokens are encrypted with AES-256-GCM at rest</li>
                  <li>Workspace data is isolated using row-level security (RLS)</li>
                  <li>All connections use TLS encryption in transit</li>
                  <li>Full audit logging of sensitive operations</li>
                  <li>
                    Delete all data anytime from{" "}
                    <span className="font-medium text-foreground">Settings → Danger Zone</span>
                    {" "}or see our{" "}
                    <Link href="/data-deletion" className="font-medium text-[#FF007F] hover:underline">Data Deletion Policy</Link>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-border/60 p-4">
                <h3 className="font-semibold text-foreground">Meta Compliance</h3>
                <p className="mt-1.5">
                  IgHouse enforces Meta&apos;s platform policies automatically:
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>Maximum 1 private reply per comment (prevents spam)</li>
                  <li>24-hour messaging window strictly enforced</li>
                  <li>Opt-out users are excluded from all automated sends</li>
                  <li>Bot-paused conversations are never auto-messaged</li>
                  <li>Webhook signatures verified with HMAC-SHA256</li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F59E0B]/10 text-xs font-bold text-[#F59E0B]">6</span>
              Frequently Asked Questions
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              {[
                {
                  q: "Do I need a Business or Creator account?",
                  a: "Yes. Instagram's Messaging and Comment APIs only work with Business or Creator accounts that are connected to a Facebook Page. Personal accounts are not supported.",
                },
                {
                  q: "Will I get banned for using IgHouse?",
                  a: "No. IgHouse uses Meta's official APIs and has passed App Review. We enforce all rate limits, messaging windows, and anti-spam policies. Your account is safe.",
                },
                {
                  q: "How fast are automated replies?",
                  a: "Most replies are delivered within 2-5 seconds. We use Inngest's durable job queue to ensure reliable, fast delivery even under high load.",
                },
                {
                  q: "Can I use IgHouse on multiple Instagram accounts?",
                  a: "The Free plan supports 1 Instagram account. Pro supports up to 5 accounts, all managed from a single dashboard.",
                },
                {
                  q: "What happens if I disconnect Instagram?",
                  a: "Your flows will stop running and your Instagram access token will be revoked. Your contacts and conversation history remain until you choose to delete them.",
                },
              ].map((faq) => (
                <div key={faq.q} className="rounded-lg border border-border/60 p-4">
                  <h3 className="font-semibold text-foreground">{faq.q}</h3>
                  <p className="mt-1.5">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Support */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EC4899]/10 text-xs font-bold text-[#EC4899]">7</span>
              Need Help?
            </h2>
            <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                If you have questions or run into issues, we&apos;re here to help:
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  <span className="font-medium text-foreground">Email:</span>{" "}
                  <span className="font-medium text-foreground">support@ighouse.com</span>
                </li>
                <li>
                  <span className="font-medium text-foreground">Response time:</span>{" "}
                  Free plan — within 48 hours. Pro plan — within 12 hours (priority support).
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-sm text-muted-foreground">
        &copy; 2026 IgHouse. All rights reserved.
      </footer>
    </div>
  );
}
