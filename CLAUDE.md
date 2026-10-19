# IgHouse — Instructions for Claude Code

## Product
Instagram DM & Comment Automation SaaS. Always read `docs/PRD.md` before planning any feature.

## Locked Stack
- **Framework:** Next.js (App Router, latest stable), TypeScript strict (`noImplicitAny`, `noUncheckedIndexedAccess`).
- **UI & Aesthetic:** Tailwind CSS + shadcn/ui + Lucide. Design aesthetic: Linear/Vercel style—clean 1px borders (`border-border/60`), subtle zinc/slate surfaces, Geist Sans & Geist Mono fonts, compact density, crisp status badges.
- **Canvas:** `@xyflow/react` validated strictly against `FlowDefinitionSchema` in `src/lib/engine/schema.ts`.
- **Backend/DB:** Supabase (Postgres + Auth + Realtime + Storage) with strict RLS on every table.
- **Queue / Durable Jobs:** Inngest (`inngest` SDK) for webhook processing, `step.sleep` delays, and `step.waitForEvent` reply timeouts.
- **Cache / Rate Limit:** Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`).

## Hard Engineering Rules
1. **Zero Secrets in Client/Logs:** All env vars validated in `src/lib/env.ts` via Zod. Never import `service_role` key outside `src/lib/supabase/admin.ts` or server workers. Encrypt Meta tokens with AES-256-GCM (`key_version` supported).
2. **Multi-Tenancy First:** Every table MUST include `workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE`, composite indexes starting with `workspace_id`, and pgTAP/SQL tests proving Workspace A cannot read/modify Workspace B.
3. **Pure Execution Engine:** `src/lib/engine/step.ts` must remain a pure, side-effect-free function: `step(run, event, flowDef) -> { actions, nextState }`. All side effects (Meta API calls, DB writes) happen in the caller/worker.
4. **Meta Policy Enforcement:**
   - Enforce maximum 1 Private Reply per `comment_id`.
   - Enforce 24-hour standard messaging window check before sending any DM.
   - Check `contact.opted_out === false` and `conversation.bot_paused === false` before every automated send.
5. **Validation:** Validate every Route Handler, Server Action, and Webhook payload with Zod. Verify Meta webhooks using raw body `X-Hub-Signature-256` with `crypto.timingSafeEqual`.

## Workflow per Task
1. Read relevant section of `docs/PRD.md`.
2. Output a concise implementation plan (files to create/edit + test cases) and wait for approval on auth/DB/engine tasks.
3. Write unit/RLS tests FIRST where applicable.
4. Run `npm run typecheck && npm run lint && npm test` before completing the turn.