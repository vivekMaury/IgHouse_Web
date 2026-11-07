IgInbox — Product Requirements Document v3.0 (Fresh Start)
Version 3.0 · Rebuild from scratch · Builder: you + Claude Code in VS Code · Updated October 19, 2026
1. What Changed From v2.0
Your v2.0 document describes a finished build with every milestone marked complete. For a fresh start you need a build plan instead, so v3.0 is organized around what to build first, what to defer, and how to work with Claude step by step.
Added in v3.0
•	A phased MVP scope (P0 / P1 / P2) so you ship something usable early.
•	Missing features: flow run state, wait-for-reply, flow versioning, simulator, broadcasts, analytics, templates, onboarding, notifications, opt-out handling, API keys, audit logs.
•	A full Security section with a threat model and checklist.
•	A full SEO section for the marketing site (and what to block for the dashboard).
•	A concrete VS Code + Claude Code workflow, including a CLAUDE.md template and ready-to-paste prompts.
Fixed from v2.0
•	The queue design used LPUSH/RPOP only. If the worker crashes after popping, the event is lost. v3.0 stores every webhook in Postgres first (idempotent), then queues it.
•	The Delay node had no durable mechanism. v3.0 uses scheduled jobs so a 2-hour delay survives restarts and deploys.
•	No place to store where a contact is inside a flow. v3.0 adds flow_runs so Wait-for-Reply, delays and human takeover work correctly.
•	Vercel Cron frequency depends on your plan, so a cron-only worker can be too slow. v3.0 uses a managed queue/job runner for execution.
2. Vision and Goals
Vision: IgInbox turns Instagram comments, story mentions and DMs into automated, compliant sales funnels, with a visual builder and a shared inbox where humans can step in at any time.
Goals
1.	Reply to an Instagram trigger in under 5 seconds end to end (webhook ACK under 200 ms).
2.	A non-technical user builds and publishes a working comment-to-DM flow in under 10 minutes.
3.	Zero lost or duplicated messages under bursts (target 10,000 events/hour).
4.	Pass Meta App Review and stay compliant with Meta platform policy.
5.	Reach paid conversion with a clear free-to-paid upgrade path.
Non-goals for MVP: WhatsApp/Messenger channels, a mobile app, a public marketplace of flows, full white-label.
3. Personas
Persona	Need	Key feature
Creator	Deliver a lead magnet when people comment a keyword	Comment-to-DM + public reply
E-commerce brand	Answer product questions, send discount codes	Quick replies, product cards, tags
Agency (SMMA)	Run many client accounts	Workspaces, roles, client-safe views
Coach / consultant	Qualify leads before booking	Conditions, lead capture, calendar link
4. Scope by Phase
Phase	Contents
P0 — MVP (weeks 1–6)	Auth, workspaces, Instagram connect, webhook pipeline, flow builder with Trigger / Message / Condition / Delay / Lead Capture, comment-to-DM, live inbox, human takeover, contacts and tags, basic logs, legal pages, landing page with SEO
P1 — Monetize (weeks 7–10)	Billing (Stripe + Razorpay for India), usage limits, onboarding, flow templates, simulator, analytics, webhook and Google Sheets export, email notifications, opt-out handling
P2 — Differentiate (weeks 11+)	AI Setter agent, broadcasts, A/B split, flow versioning, public API and API keys, audit logs, team invites with roles, white-label for agency tier
5. Feature Specifications
5.1 Auth and Workspaces (P0)
•	Email + Google sign-in via Supabase Auth; email verification required.
•	Every resource belongs to a workspace. Roles: owner, admin, member.
•	Invite by email with expiring token (P1).
•	Acceptance: a user in workspace A can never read or write workspace B data, verified by automated RLS tests.
5.2 Instagram Connection (P0)
•	OAuth connect flow using Meta's official Instagram messaging APIs (check current docs for whether to use Instagram Login or Facebook Login; Instagram Login removes the need for a linked Facebook Page).
•	Store the long-lived token encrypted (AES-256-GCM), with a scheduled refresh job before expiry (about 60 days).
•	Webhook subscriptions: comments, messages, story mentions, message reactions and seen receipts as needed.
•	Show connection health: token expiry, last webhook received, permission status. Alert the user by email if the token is about to fail.
5.3 Visual Flow Builder (P0)
Built with @xyflow/react. Flow JSON is stored in flow_versions (see 6.3).
Node	Purpose	Phase
Trigger	Comment keyword (on specific posts/reels or all), story mention, story reply, DM keyword, live comment, ice breaker / persistent menu	P0
Message	Private DM with variables, public comment reply (random variants), quick replies, buttons, image/video	P0
Condition	Is follower, has email/phone, has tag, custom field equals value	P0
Delay	Wait minutes/hours; durable scheduled job	P0
Lead Capture	Extract email/phone, validate, save, export	P0
Wait for Reply (new)	Pause until the contact answers, with timeout branch	P1
Set Tag / Field (new)	Add or remove tags, set custom fields	P1
HTTP Request (new)	Call an external API, map response to variables (SSRF-protected)	P1
Business Hours (new)	Branch on open/closed	P1
A/B Split (new)	Random percentage split with stats	P2
AI Reply (new)	LLM answers using knowledge base, with handoff rule	P2
Handoff to Human (new)	Pause automation and notify the team	P1
Canvas requirements: zoom, pan, snap-to-grid, minimap, undo/redo, copy/paste nodes, live validation (no dangling edges, trigger required, loops flagged), draft vs published, one-click pause.
5.4 Execution Engine (P0)
•	Each contact entering a flow creates a flow_run with current_node_id, status (running, waiting, completed, failed, cancelled) and context JSON.
•	The engine is a pure function: step(run, event) -> actions + next state. This makes it easy to unit test and easy for Claude to extend.
•	Idempotency: unique constraint on (platform_event_id) in webhook_events; dedupe key per (flow_id, contact_id, trigger_event_id).
•	One private reply per comment is allowed, and only within a limited window after the comment (verify current limit in Meta docs). The engine must enforce this.
•	Rate limiting per sender and per account to respect Meta limits; exponential backoff on 429/5xx.
•	Every step writes to automation_logs with success/error and the Meta API response code.
5.5 Live Inbox and Human Takeover (P0)
•	Conversation list sorted by last activity, unread badges, filters (unread, tag, assigned, bot active).
•	Realtime messages via Supabase Realtime.
•	Takeover: when an operator sends a message, set bot_paused = true for that contact (auto-resume after configurable hours).
•	Assign conversation to a teammate, internal notes (P1), saved replies (P1).
•	Show a clear indicator when the 24-hour window is closed and block sends accordingly (human replies may use Meta's approved human-agent tag where eligible).
5.6 Contacts and CRM (P0 / P1)
•	Contacts with Instagram scoped ID, username, avatar, email, phone, tags, custom fields, source flow.
•	Segments (saved filters) and CSV import/export (P1).
•	Opt-out: keywords like STOP set opted_out = true and the engine never messages them again (P1, important for trust and compliance).
5.7 Analytics (P1)
•	Per flow: triggers, DMs sent, delivered/read where available, replies, leads captured, drop-off per node.
•	Workspace dashboard: contacts, conversions, top posts by comment-to-lead rate.
•	Implemented with a daily rollup table so dashboards stay fast.
5.8 Billing (P1)
•	Stripe for international cards, Razorpay for India (UPI, cards, subscriptions).
•	Plans as in v2.0 (Starter, Growth, Pro, Agency) enforced by a central entitlements module, not scattered if checks.
•	Webhooks from the payment provider update subscriptions; the app never trusts the client for plan state.
•	Usage metering: unique contacts per billing month; soft warning at 80%, hard stop at 100% with upgrade prompt.
•	Free trial or free tier with the watermark only where Meta policy allows.
5.9 AI Setter Agent (P2)
•	Per-workspace knowledge base (FAQ text, URLs, PDFs) with retrieval.
•	Guardrails: allowed topics, max messages before handoff, never invent prices, escalate on anger or purchase intent.
•	Claude via the Anthropic API for responses; log prompts and outputs for review; per-workspace token budget.
•	Prompt-injection defense: user message is treated as data, tool access is minimal, outputs are length-capped and filtered.
5.10 Integrations (P1)
•	Custom webhook (signed with HMAC so the receiver can verify), Google Sheets, Zapier / Make via webhook, email notification on new lead.
•	Public REST API with scoped API keys (P2).
5.11 Product Quality Features (P1)
•	Flow simulator: test a flow with a fake contact before publishing.
•	Templates: 5 to 10 starter flows (lead magnet, giveaway, product link, booking).
•	Onboarding checklist: connect account → pick template → publish → test on a real post.
•	Notifications: email and in-app for token expiry, failed sends, new hot lead.
•	Flow versioning: every publish creates an immutable version with rollback (P2).
•	Help center link and in-app chat/feedback.
6. Architecture (Revised)
6.1 Stack
Layer	Choice	Why
Framework	Next.js (latest stable at project start, App Router) + TypeScript strict	Server Components, Route Handlers, great Claude support
UI	Tailwind CSS, shadcn/ui, Lucide, Framer Motion (sparingly)	Fast, accessible components
Canvas	@xyflow/react	Industry standard node editor
State/data	TanStack Query, Zustand (canvas only), Zod for all validation	Typed and predictable
Database/Auth	Supabase Postgres, RLS, Auth, Realtime, Storage	One platform, RLS for tenancy
ORM/migrations	Supabase CLI migrations (SQL) + generated types	SQL stays the source of truth
Queue / jobs	Upstash QStash, Inngest or Trigger.dev (pick one)	Retries, delays, scheduling and dead-letter handling built in
Cache / rate limit	Upstash Redis	Edge-friendly rate limiting and dedupe
Payments	Stripe + Razorpay	Global + India
Email	Resend (or Postmark)	Transactional email
Observability	Sentry, Vercel Analytics, structured logs, Better Stack or similar uptime	Know before customers do
Testing	Vitest, Playwright, pgTAP or SQL tests for RLS	Protect the engine and tenancy
CI/CD	GitHub Actions + Vercel previews	Every PR gets a preview URL
AI	Anthropic API (Claude)	AI Setter, flow suggestions
Versions move quickly. Before installing, check the current stable versions of Next.js, React Flow, Supabase and the Meta Graph API instead of pinning to the numbers in v2.0 (Next.js 14, Graph API v21).
6.2 Event Pipeline
Meta webhook POST
  -> verify X-Hub-Signature-256 (raw body, timing-safe compare)
  -> INSERT into webhook_events (unique platform_event_id, status=received)
  -> publish job to queue
  -> return 200 (under 200 ms)

Queue worker (retries + backoff + dead-letter)
  -> load event, resolve workspace + connected account
  -> dedupe + rate limit + opt-out + bot_paused checks
  -> run engine step(run, event)
  -> call Meta API with decrypted token
  -> write messages, automation_logs, update flow_run
  -> schedule next job for Delay / Wait-for-Reply timeout
Postgres is the source of truth, so any event can be replayed. The queue is only the delivery mechanism.
6.3 Core Tables
workspaces, workspace_members, invitations, connected_accounts, contacts, contact_tags, tags, custom_fields, conversations, messages, flows, flow_versions, flow_runs, scheduled_jobs, webhook_events, automation_logs, captured_leads, integrations, subscriptions, usage_counters, api_keys, audit_logs, knowledge_documents (P2), broadcasts (P2).
Every table has workspace_id, created_at, indexes on (workspace_id, ...), and an RLS policy. Add deleted_at where soft delete matters.
7. Security
7.1 Threat Model (top risks)
1.	Cross-tenant data leak through a missing or wrong RLS policy.
2.	Meta token theft (an attacker could message every follower of every customer).
3.	Forged webhooks triggering messages.
4.	SSRF through custom webhooks and the HTTP Request node.
5.	Abuse of automation to spam, which gets customer accounts restricted.
6.	Prompt injection against the AI Setter.
7.	Leaked secrets in the repo or logs.
7.2 Requirements
Authentication and access
•	Supabase Auth with email verification; optional MFA (TOTP) for owners (P1).
•	Server-side authorization on every Server Action and Route Handler. Never rely on hiding buttons.
•	RLS enabled on every table with deny-by-default; test policies with two seeded workspaces in CI.
•	The Supabase service-role key is used only in server code and workers, never in the browser.
Secrets and encryption
•	Meta tokens encrypted with AES-256-GCM, unique IV per record, key from a secrets manager or environment, with a key_version column to support rotation.
•	Environment variables validated at boot with Zod. .env* in .gitignore; enable GitHub secret scanning and push protection.
•	Never log tokens, message bodies in full, or payment details. Add a log scrubber.
Webhook and API hardening
•	Verify signatures against the raw request body using a timing-safe comparison; reject if missing.
•	Verify tokens for the GET challenge are long random values.
•	Rate limit all public endpoints and auth routes (Upstash Ratelimit).
•	Zod validation on all inputs; return generic errors.
•	Outbound webhooks and HTTP Request node: allow HTTPS only, resolve DNS and block private/loopback/link-local ranges, set timeouts and response-size limits, no redirects to blocked ranges.
•	Sign outbound webhooks with HMAC and a timestamp.
Web security
•	Security headers: Content-Security-Policy (nonce-based), Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors none.
•	CSRF protection via same-site cookies and Server Actions' built-in origin checks; verify origin on custom POST routes.
•	Sanitize any user-generated content rendered in the inbox (message text, usernames).
•	Use httpOnly, secure, sameSite=lax cookies.
Abuse prevention
•	Per-account send caps and humanized delays to stay under Meta limits; circuit breaker that pauses a workspace on repeated Meta errors.
•	Block prohibited content categories in the Terms of Service and monitor for spam patterns.
Supply chain and operations
•	Dependabot/Renovate, npm audit in CI, lockfile committed, review new packages Claude suggests.
•	Daily database backups with a tested restore; point-in-time recovery enabled.
•	Audit log for sensitive actions: connect/disconnect account, role change, API key creation, export, deletion.
•	Incident runbook: revoke tokens, rotate keys, notify customers within the legal timeframe.
Privacy
•	Data deletion callback and in-app delete for contacts and workspaces; retention settings for message history.
•	Privacy policy, terms, DPA available for agencies. Consider India's DPDP Act and GDPR if you serve EU users.
7.3 Pre-Launch Security Checklist
•	☐ RLS tests pass for every table
•	☐ Service-role key absent from client bundle (search the build output)
•	☐ Webhook forgery test returns 401
•	☐ SSRF test against 169.254.169.254 and localhost fails safely
•	☐ Security headers score A on a header scanner
•	☐ Secrets rotated since development
•	☐ Backup restore tested
•	☐ Rate limits tested
8. SEO
SEO applies to the public marketing site. The dashboard must stay private.
8.1 Technical SEO
•	Public pages (/, /pricing, /features/*, /use-cases/*, /compare/*, /blog/*, /privacy, /terms) are server-rendered or statically generated.
•	Use the Next.js Metadata API for unique title, description, canonical URL, Open Graph and Twitter cards on every page; generate OG images with next/og.
•	app/sitemap.ts and app/robots.ts: allow marketing routes, disallow /dashboard, /api, /auth. Add noindex metadata to authenticated pages.
•	Structured data (JSON-LD): Organization, SoftwareApplication with pricing Offer, FAQPage on pricing and feature pages, BreadcrumbList, Article for blog posts.
•	Core Web Vitals: LCP under 2.5 s, CLS under 0.1, INP under 200 ms. Use next/image, next/font, lazy-load the heavy 3D/Framer effects, keep the canvas bundle out of marketing pages.
•	Clean URLs, HTTPS only, one canonical domain (redirect www or non-www), custom 404.
•	Internationalization with hreflang if you add Hindi or other languages (strong opportunity for India).
8.2 Content SEO
•	Target keyword clusters: Instagram comment to DM automation, Instagram DM automation tool, ManyChat alternative, auto reply to Instagram comments, Instagram lead generation, Instagram chatbot for business.
•	Programmatic pages: /use-cases/{industry} (coaches, real estate, fitness, e-commerce, agencies) and /compare/iginbox-vs-{competitor} written with real differentiators, not thin templates.
•	Blog with how-tos, templates and Meta policy explainers; each post links to a template or signup.
•	Free tools as link bait: Instagram caption generator, comment-to-DM message template library, keyword trigger tester.
•	Social proof pages: case studies, reviews, changelog and public roadmap.
8.3 Measurement
•	Google Search Console and Bing Webmaster Tools verified on day one.
•	Privacy-friendly analytics (Plausible or PostHog) plus signup funnel events.
•	Monthly review of top queries, pages losing clicks, and Core Web Vitals report.

### 8.4 SEO & GEO (Generative Engine Optimization) Architecture

This section defines the full five-phase rollout of marketing pages, structured data, and LLM crawler optimization. Every page listed below lives under the `(marketing)` route group, is server-rendered or statically generated, and must score ≥ 90 on Lighthouse Performance.

---

#### Phase 1 — Core Marketing Pages (P0)

These ship with MVP. They are the primary organic and paid landing surfaces.

| Route | Purpose | Primary Keywords |
|---|---|---|
| `/` | Homepage — hero, social proof, feature grid, CTA | instagram dm automation, instagram comment automation tool |
| `/features` | Feature overview hub linking to sub-pages | instagram chatbot features, auto reply instagram comments |
| `/features/flow-builder` | Visual flow builder deep-dive | instagram automation builder, visual chatbot builder |
| `/features/inbox` | Shared inbox & human takeover | instagram shared inbox, team inbox for instagram |
| `/features/contacts` | CRM, tags, lead capture | instagram lead capture, instagram crm |
| `/features/analytics` | Analytics & reporting | instagram automation analytics |
| `/pricing` | Plans, comparison table, FAQ accordion | iginbox pricing, instagram automation pricing |

**Page requirements:**
- Each page has a unique `<title>` (≤ 60 chars), `meta description` (≤ 155 chars), canonical URL, OG image (generated via `next/og`), and Twitter card.
- FAQ sections on `/pricing` and each `/features/*` page emit `FAQPage` JSON-LD.
- `/pricing` includes `SoftwareApplication` + `Offer` JSON-LD with each plan's price.
- Homepage includes `Organization` JSON-LD with logo, sameAs social links, and `contactPoint`.

---

#### Phase 2 — GEO & Competitor Alternative Pages (P0–P1)

These pages target users actively searching for competitor alternatives and comparison queries. They are high-intent pages critical for both traditional SEO and AI-generated answers (GEO).

**Alternative pages** (`/alternatives/{competitor}`):

| Route | Target query cluster |
|---|---|
| `/alternatives/manychat` | manychat alternative, manychat alternative for instagram |
| `/alternatives/chatfuel` | chatfuel alternative, chatfuel vs iginbox |
| `/alternatives/mobilemonkey` | mobilemonkey alternative instagram |
| `/alternatives/igdm-pro` | igdm pro alternative |
| `/alternatives/meta-business-suite` | meta business suite automation alternative |

**Comparison pages** (`/compare/{slug}`):

| Route | Target query cluster |
|---|---|
| `/compare/iginbox-vs-manychat` | iginbox vs manychat, manychat vs iginbox |
| `/compare/iginbox-vs-chatfuel` | iginbox vs chatfuel |
| `/compare/iginbox-vs-mobilemonkey` | iginbox vs mobilemonkey |

**Content rules for alternative & comparison pages:**
- Every claim must cite a real differentiator (feature, price, policy). No generic filler.
- Include a structured comparison table with checkmarks/crosses per feature.
- Each page includes a "Why teams switch" section with specific pain points.
- FAQ section with 4–6 questions (emits `FAQPage` JSON-LD).
- CTA with a free trial or demo link and competitor-specific migration message.

**GEO optimizations (apply to all alternative/compare pages):**
- Write in clear, factual, citation-friendly prose that LLMs can excerpt verbatim.
- Lead with a one-sentence direct answer to the comparison query (position zero format).
- Use structured headings that match common question patterns (`## Is IgInbox better than ManyChat for Instagram DMs?`).
- Include a `<table>` comparison grid — LLMs frequently pull from HTML tables.
- Add `speakable` JSON-LD on the summary paragraph so voice assistants can cite it.

---

#### Phase 3 — Use Case & Audience Solutions Pages (P1)

These pages map personas (Section 3) to landing pages optimized for how-to and intent-based queries.

| Route | Persona | Primary Keywords |
|---|---|---|
| `/solutions/creators` | Creator / Influencer | instagram automation for creators, auto dm for influencers |
| `/solutions/ecommerce` | E-commerce brand | instagram automation for ecommerce, instagram chatbot for shopify |
| `/solutions/agencies` | SMMA / Agency | instagram automation for agencies, white label instagram chatbot |
| `/solutions/coaches` | Coach / Consultant | instagram lead generation for coaches, instagram dm automation for coaching |
| `/solutions/real-estate` | Real estate agents | instagram automation for realtors, real estate instagram chatbot |

**Page template:**
1. Hero with persona-specific headline and screenshot/mockup.
2. "How it works" — 3-step flow tied to the persona's use case.
3. Feature highlights (3–4) relevant to this persona, with flow builder screenshots.
4. Social proof — testimonial or case study from this vertical (placeholder until real ones exist).
5. FAQ accordion (4–6 Qs, emits `FAQPage` JSON-LD).
6. CTA: "Start free — built for {persona}."

**GEO for solutions pages:**
- Open with a direct answer paragraph: "IgInbox helps {persona} automate {workflow} on Instagram by…"
- Use schema.org `HowTo` JSON-LD for the "How it works" steps.
- Include stats or benchmarks where available ("Reply in under 5 seconds" from NFRs).

---

#### Phase 4 — Resource & Educational Hub (P1–P2)

Educational content builds topical authority and captures informational queries that feed the conversion funnel.

**Blog / Guides** (`/guides/{slug}`):

| Content cluster | Example articles |
|---|---|
| Instagram automation 101 | "How to Auto-Reply to Instagram Comments in 2027", "Instagram DM Automation: The Complete Guide" |
| Meta policy & compliance | "Instagram Messaging API Rules Explained", "How to Pass Meta App Review" |
| Growth tactics | "5 Comment-to-DM Funnels That Convert", "Instagram Lead Magnet Ideas for Coaches" |
| Templates & tutorials | "How to Build a Giveaway Flow in 5 Minutes", "Instagram Welcome DM Setup Guide" |
| Product updates | Changelog entries expanded into guides when they add user value |

**Content requirements:**
- Every guide has a unique title, meta description, OG image, and `Article` JSON-LD with `author`, `datePublished`, `dateModified`.
- Internal linking: every guide links to at least one product page and one related guide.
- Each guide includes a contextual CTA (e.g., "Try this flow template free →").
- `BreadcrumbList` JSON-LD on every guide (`Home > Guides > {title}`).
- Estimated reading time in meta and visible on page.

**Free tools** (link bait, P2):

| Route | Tool |
|---|---|
| `/tools/caption-generator` | AI Instagram caption generator |
| `/tools/keyword-tester` | Test which keyword triggers fire on a sample comment |
| `/tools/dm-template-library` | Browse and copy DM message templates |

Free tools include `WebApplication` JSON-LD with `applicationCategory: "Utility"` and `offers: { price: "0" }`.

---

#### Phase 5 — Trust & Compliance Legal Pages (P0)

These pages are required for Meta App Review, user trust, and legal compliance. They ship with MVP.

| Route | Purpose | Required by |
|---|---|---|
| `/privacy` | Privacy Policy — GDPR, DPDP Act (India), CCPA | Meta App Review, law |
| `/terms` | Terms of Service | Meta App Review, law |
| `/data-deletion` | Data deletion instructions + callback endpoint | Meta App Review |
| `/dpa` | Data Processing Agreement (for agency/enterprise) | GDPR (P1) |
| `/cookie-policy` | Cookie disclosure | ePrivacy / GDPR |
| `/security` | Security practices overview (public-facing) | Trust signal (P1) |

**Requirements:**
- All legal pages are server-rendered with `noindex` only if duplicated elsewhere; otherwise index them — legal pages build trust signals for search and LLMs.
- `/data-deletion` doubles as the Meta Data Deletion Request callback URL. It must accept POST requests from Meta and return a confirmation URL + code per Meta's spec.
- Legal pages include `WebPage` JSON-LD with `lastReviewed` date.
- Plain-language summaries at the top of `/privacy` and `/terms` (expandable "full legal text" below).
- Version history / "Last updated" date visible on every legal page.

---

### 8.5 JSON-LD Structured Data Schema Plan

All JSON-LD is injected via Next.js Metadata API `generateMetadata()` or a shared `<JsonLd />` component. Every schema is validated against Google's Rich Results Test before launch.

| Schema Type | Pages | Key Properties |
|---|---|---|
| `Organization` | `/` (homepage) | `name`, `url`, `logo`, `sameAs` (social links), `contactPoint`, `foundingDate` |
| `SoftwareApplication` | `/`, `/pricing` | `name`, `applicationCategory: "BusinessApplication"`, `operatingSystem: "Web"`, `offers` (per plan with `price`, `priceCurrency`, `billingPeriod`) |
| `FAQPage` | `/pricing`, `/features/*`, `/alternatives/*`, `/compare/*`, `/solutions/*` | `mainEntity` array of `Question` + `acceptedAnswer` pairs |
| `HowTo` | `/solutions/*`, select `/guides/*` | `name`, `step[]` with `text` and optional `image` |
| `Article` | `/guides/*` | `headline`, `author`, `datePublished`, `dateModified`, `image`, `publisher` |
| `BreadcrumbList` | All marketing pages | `itemListElement` with `position`, `name`, `item` URL |
| `WebApplication` | `/tools/*` | `name`, `applicationCategory: "Utility"`, `offers: { price: "0" }` |
| `WebPage` | `/privacy`, `/terms`, `/data-deletion`, `/security` | `name`, `lastReviewed`, `about` |
| `speakable` | `/alternatives/*`, `/compare/*` summary paragraphs | `cssSelector` pointing to the lead summary `<p>` |

**Implementation:**
```typescript
// src/components/seo/json-ld.tsx
// Shared component — pass schema type + props, renders <script type="application/ld+json">
// Validates at dev time with a Zod schema matching schema.org spec subset
```

---

### 8.6 LLM Crawler Optimization (GEO Technical Layer)

Generative Engine Optimization ensures IgInbox appears in AI-generated answers (ChatGPT, Perplexity, Google AI Overviews, etc.) when users ask about Instagram automation tools.

**Crawl access:**
- `robots.txt` allows known LLM crawlers: `GPTBot`, `Google-Extended`, `anthropic-ai`, `PerplexityBot`, `ClaudeBot`, `Applebot-Extended`, `cohere-ai`. Block only authenticated routes (`/dashboard/*`, `/api/*`, `/auth/*`).
- Serve a clean, JS-minimal HTML payload for marketing pages — SSR/SSG ensures content is in the initial HTML, not hydrated client-side.
- Add a `<meta name="robots" content="max-snippet:-1, max-image-preview:large, max-video-preview:-1">` to marketing pages to allow full-length snippets.

**Content structure for LLM extraction:**
- Every marketing page opens with a 1–2 sentence direct-answer paragraph that can be quoted verbatim by an LLM.
- Use semantic HTML: `<article>`, `<section>`, `<h1>`–`<h3>` hierarchy, `<table>` for comparisons, `<dl>` for feature definitions.
- Comparison tables use `<thead>` / `<tbody>` with clear column headers — LLMs parse HTML tables better than CSS grid layouts.
- FAQ sections use `<details>` / `<summary>` with matching `FAQPage` JSON-LD.
- Stat claims include inline citations or "Source:" annotations (e.g., "Reply in under 5 seconds — see our [architecture docs](/security)").

**Topical authority signals:**
- Comprehensive internal linking: every page links to 2+ related pages within the site.
- Consistent entity naming: always "IgInbox" (not "Ig Inbox", "igInbox", or "IGINBOX") across all pages, meta tags, and structured data.
- Author/brand entity: `Organization` JSON-LD on homepage, `publisher` on every `Article`, consistent `sameAs` links to social profiles.
- Freshness signals: `dateModified` on articles, "Last updated" on legal pages, a public `/changelog` page.

**llms.txt (optional, emerging standard):**
- Serve `/llms.txt` with a concise, machine-readable summary of what IgInbox is, its key features, pricing tiers, and links to authoritative pages. Format:
```
# IgInbox
> Instagram DM & Comment Automation Platform

## Key Pages
- [Homepage](https://iginbox.com)
- [Pricing](https://iginbox.com/pricing)
- [Features](https://iginbox.com/features)
- [Documentation](https://iginbox.com/guides)

## What is IgInbox?
IgInbox automates Instagram comment-to-DM funnels, manages a shared team inbox, and captures leads — built on official Meta APIs with a visual flow builder.
```

**Monitoring:**
- Track LLM crawler traffic in server logs (filter by user-agent).
- Monthly audit: search "best instagram automation tool" and similar queries in ChatGPT, Perplexity, and Google AI Overview to check if IgInbox appears.
- If IgInbox is not cited, review whether the relevant page has a clear direct-answer paragraph and proper structured data.
9. Meta Compliance and App Review
•	Use only official Meta APIs. Never automate with unofficial methods.
•	Respect the 24-hour messaging window and the one-private-reply-per-comment rule; verify current limits in Meta's documentation before launch.
•	Prepare App Review materials early: screencasts for each permission, test users, a working demo workspace, privacy policy URL, data deletion URL, business verification.
•	Request the minimum permissions needed; explain each one in plain language.
•	Keep a changelog of Meta API versions and schedule a quarterly review for deprecations.
10. Non-Functional Requirements and Metrics
Area	Target
Webhook ACK	under 200 ms at p95
Trigger to DM delivered	under 5 s at p95
Message loss	0 (replayable from webhook_events)
Availability	99.9% for webhook endpoint
Dashboard load	under 2 s on 4G
Test coverage	80%+ on the engine, 100% of RLS policies tested
Business KPIs	Signup to connected account above 40%; connected to first published flow above 60%; free to paid above 4%
11. How to Start From Scratch in VS Code With Claude
11.1 Prerequisites
•	Node.js LTS, Git, VS Code, a GitHub account, Supabase account, Vercel account, Upstash account, Meta developer account with a test Instagram professional account.
•	Install the Claude Code extension for VS Code (or run Claude Code in the integrated terminal).
•	Install the Supabase CLI and Docker for a local database.
11.2 Project Setup
npx create-next-app@latest iginbox --typescript --tailwind --eslint --app --src-dir
cd iginbox
git init && git add . && git commit -m "chore: bootstrap"
npx shadcn@latest init
npm i @supabase/supabase-js @supabase/ssr @xyflow/react zod @tanstack/react-query zustand lucide-react
npm i -D vitest @playwright/test
supabase init && supabase start
Put this PRD in docs/PRD.md so Claude can read it in every session.
11.3 Recommended Folder Structure
src/
  app/
    (marketing)/        # SEO pages, static
    (auth)/
    (dashboard)/        # flows, inbox, contacts, analytics, settings
    api/webhooks/instagram/route.ts
    api/jobs/           # queue worker endpoints
  components/ui/        # shadcn
  features/
    flows/              # canvas, nodes, validators
    inbox/
    contacts/
    billing/
  lib/
    engine/             # pure step() function + node handlers
    meta/               # Graph API client, signature, token refresh
    crypto/             # AES-256-GCM helpers
    supabase/           # server, browser, admin clients
    env.ts              # Zod-validated env
supabase/
  migrations/
  tests/                # RLS tests
docs/
  PRD.md
  ARCHITECTURE.md
  DECISIONS.md
CLAUDE.md
11.4 CLAUDE.md Template
Create CLAUDE.md in the repo root. Claude Code reads it at the start of every session.
# IgInbox — instructions for Claude

## Product
Instagram automation SaaS. Read docs/PRD.md before big tasks.

## Stack
Next.js App Router, TypeScript strict, Tailwind + shadcn/ui, Supabase (Postgres + RLS), React Flow, queue provider TBD in docs/DECISIONS.md.

## Rules
- Never commit secrets. All env vars go through src/lib/env.ts (Zod).
- Every new table needs workspace_id, RLS policies, and a test in supabase/tests.
- Validate all inputs with Zod. Check authorization on the server for every action.
- The workflow engine in src/lib/engine must stay a pure function with unit tests.
- Never use the Supabase service-role key in client code.
- Meta tokens are encrypted; never log them.
- Small commits, conventional commit messages, run lint + typecheck + tests before finishing.

## Commands
- npm run dev / npm run lint / npm run typecheck / npm test
- supabase db reset (local) / supabase gen types typescript --local

## Workflow
Plan first, then implement in small steps. Ask before adding new dependencies.
11.5 Phased Build Plan With Prompts
Work in short sessions. For each step, ask Claude to plan first, review the plan, then let it implement, then run tests and commit.
Step	Goal	Prompt to give Claude
1	Foundation	Read docs/PRD.md and CLAUDE.md. Propose a plan for Phase P0 week 1: env validation, Supabase clients, auth pages, and a protected dashboard layout. Do not code yet.
2	Database	Write migrations for workspaces, workspace_members, connected_accounts, contacts, conversations, messages with RLS. Add SQL tests proving a user in workspace A cannot read workspace B.
3	Landing + SEO	Build the marketing home and pricing pages in the (marketing) group with Metadata API, JSON-LD, sitemap.ts, robots.ts and OG image. Keep Lighthouse performance above 90.
4	Meta connect	Implement the Instagram OAuth flow, AES-256-GCM token encryption with key_version, and a token refresh job. Include unit tests for the crypto helpers.
5	Webhooks	Implement GET verification and POST ingestion with raw-body HMAC verification, insert into webhook_events with a unique event id, then enqueue a job. Add tests for forged and duplicate requests.
6	Engine	Implement src/lib/engine as a pure step() function for trigger, message, condition, delay and lead_capture, with flow_runs state. Write table-driven unit tests first.
7	Canvas	Build the React Flow canvas with the five node types, validation, draft/publish, and saving to flow_versions.
8	Inbox	Build the realtime inbox with human takeover that sets bot_paused, plus the 24-hour window indicator.
9	Hardening	Add security headers with a nonce CSP, rate limiting, Sentry, audit logs, and the pre-launch security checklist from the PRD.
10	Meta review	Prepare legal pages, data deletion endpoint, demo workspace and screencast script for App Review.
11+	P1 / P2	Billing, analytics, templates, simulator, then the AI Setter.
11.6 Working Rules With Claude
•	Always ask for a plan before code on anything touching auth, RLS, payments or Meta APIs, and review it yourself.
•	Ask Claude to write tests first for the engine and security code.
•	Keep tasks small: one feature or one migration per session, then commit.
•	Use DECISIONS.md to record choices (queue provider, auth providers) so Claude stays consistent.
•	Have a fresh Claude session review each large PR with a prompt like: Review this diff for security issues, RLS gaps, and missing tests.
•	Connect the Supabase MCP server only to a development project, never production.
•	Treat Claude's version numbers and API details as hints. Confirm against official docs, especially Meta's.
12. Risks and Mitigations
Risk	Mitigation
Meta rejects App Review or changes API rules	Start review early, minimal permissions, quarterly API audit
Customer accounts get restricted for spam	Humanized delays, send caps, opt-out, content guidelines
Token expiry silently breaks flows	Refresh job, health dashboard, email alerts
Solo-builder scope creep	Strict P0 / P1 / P2 phasing; ship P0 to 5 beta users first
Competitor pricing pressure	Differentiate with AI Setter, agency tools and India-first pricing and payments
## 13. Locked Architectural Decisions (v3.1)
1. **Instagram Auth Flow:** Use **Instagram API with Instagram Login** (`instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`). Do NOT require Facebook Page linking for P0.
2. **Queue & Durable Execution:** Locked to **Inngest** (handles durable `step.sleep` for Delay nodes, retries, and `step.waitForEvent` for Wait-for-Reply timeouts out of the box).
3. **Media & Post Picker:** 
   - Use Supabase Storage bucket `flow-media` (public read, authenticated tenant write) for image/video attachments in DMs.
   - Cache `GET /me/media` responses in Upstash Redis for 5 minutes for the Flow Builder Post/Reel selector.
4. **Concurrency & Run Collision Policy:**
   - Only **one active `flow_run` in `waiting` state** is allowed per `(workspace_id, contact_id)`. If a contact triggers a new flow while an old run is `waiting`, cancel the old run (`status = 'cancelled'`) and start the new one.
   - Per-flow cooldown: Default 24h cooldown per `(flow_id, contact_id)` unless disabled in Trigger settings.
5. **Meta "Is Follower" Flow Pattern:**
   - Since comment webhook payloads do not include `is_user_follow_business`, any flow checking follower status must first send a Quick Reply / Button DM via Private Reply. Once the user clicks the button, the incoming `messaging_postbacks` webhook resolves the user profile (`is_user_follow_business`) and evaluates the Condition node.
