---
trigger: always_on
---

## 3. Engineering guardrails (always on)

### Stack (do not swap without a DECISIONS.md entry and my approval)
- Monorepo: pnpm workspaces + Turborepo. Node 22 LTS. TypeScript `strict: true` everywhere.
- `apps/web` — React 19 + TypeScript + Vite, React Router, TanStack Query, Tailwind CSS v4 (tokens from rule 02 as CSS variables), Radix UI primitives for accessible behaviour, Lucide icons, `motion` for animation, Recharts for charts, react-hook-form + Zod.
- `apps/api` — Node + Express + TypeScript, Zod validation on every route, Prisma ORM, PostgreSQL 16 with `pgvector`, Redis + BullMQ for background jobs (ingestion, embeddings, webhooks retries), pino structured logs.
- `packages/shared` — Zod schemas and TS types shared by web, api and widget (`WidgetConfig`, `AgentConfig`, plan quotas, API DTOs). Single source of truth for contracts.
- `packages/ui` — the design-system component kit (Button, IconButton, SegmentedControl, Switch, Sheet, Popover, Menu, Toast, StatusPill, StatCard, GroupedList, DataTable, EmptyState, Skeleton, LargeTitleHeader, GlassBar, CommandPalette).
- `packages/widget` — the embeddable chat widget runtime: Preact + TypeScript, rendered in Shadow DOM, built with Vite library mode to `w.js` (loader, ≤ 8 KB gzip) + `widget.[hash].js` (runtime, ≤ 45 KB gzip). The same runtime is imported by Widget Studio for the live preview.
- `packages/db` — Prisma schema, migrations, seed.
- Tests: Vitest (unit/integration), Supertest (API), Playwright (e2e + screenshots). Local infra via `docker-compose.yml` (postgres+pgvector, redis, mailpit, minio).
If the repo already has a working stack, keep it and adapt these rules — record what you kept in DECISIONS.md.

### Multi-tenancy and authorization
- Every tenant-owned table has `workspaceId` (indexed, part of composite unique keys where relevant).
- All data access goes through repository functions that take a `ctx: { userId, workspaceId, role }`. Implement a Prisma client extension that injects and asserts `workspaceId` on every query for tenant models; raw queries must include it explicitly.
- Resolve the active workspace from the session + `X-Workspace-Id` header, then verify membership server-side. Never trust IDs from the client.
- Cross-tenant access returns **404**, not 403 (do not leak existence).
- Roles: Owner, Admin, Builder, Agent (human inbox agent), Viewer. Permission checks live in one `can(ctx, action, resource)` module, used by routes and mirrored (read-only) in the UI to hide/disable controls.
- Agency: an agency workspace can own client workspaces (`parentWorkspaceId`). Agency members get access through explicit `ClientAccess` grants, never implicitly.

### Auth
- Email + password (argon2id), email verification, password reset (single-use, 30-min tokens), httpOnly Secure SameSite=Lax session cookies with server-side session store, CSRF token for state-changing requests, login rate limiting + lockout backoff.
- Google sign-in only when `GOOGLE_CLIENT_ID/SECRET` are set; otherwise hide the button (not disable).
- Widget/public endpoints authenticate with a per-widget public key + allowed-origin check, never with user sessions.

### Providers (ports & adapters)
Every third-party service sits behind an interface in `apps/api/src/providers/<name>/` with a `mock` adapter and at least one real adapter, chosen by env:
`LLMProvider` (openai | gemini | anthropic | mock) · `EmbeddingProvider` (openai | gemini | mock — deterministic hash vectors) · `PaymentProvider` (stripe | razorpay-planned | mock) · `WhatsAppProvider` (meta-cloud | mock) · `TelephonyProvider` (twilio | mock) · `VoiceEngine` (STT/TTS pipeline; pluggable so Zdoda's own in-house voice engine can replace it later) · `StorageProvider` (s3-compatible | local) · `EmailProvider` (smtp/resend | mailpit) · `IntegrationProvider` per integration.
Each adapter exposes `healthCheck()`; the Integrations and Channels screens show its result. Mock adapters must be obviously labelled Demo in the UI.

### Payments
- Stripe test mode: Checkout Sessions, Customer Portal for payment methods, subscription create/upgrade/downgrade (proration), cancel at period end, resume, invoices list.
- Subscription state changes ONLY in the webhook handler after signature verification (`STRIPE_WEBHOOK_SECRET`). Handlers are idempotent (store processed event IDs).
- Usage metering: `UsageRecord` rows (messages, voice seconds, agents) aggregated per billing period; quota checks happen server-side before an LLM call or call connect. Over-quota returns a typed error the UI turns into an upgrade sheet.

### Knowledge / RAG
- Ingestion is a BullMQ pipeline: fetch (URL, sitemap, upload) → extract (HTML readability, PDF, DOCX, TXT, CSV/XLSX) → clean → chunk (~800 tokens, 100 overlap, keep headings) → embed → store in `KnowledgeChunk.embedding vector(…)` with an HNSW index.
- Source states: Pending → Processing → Active | Failed (with human-readable error + retry). Re-sync replaces chunks atomically.
- Answering: retrieve top-k by cosine within the agent's assigned sources (and workspace), cite source titles in the test panel, fall back to the agent's fallback message when retrieval confidence is low.
- Uploads: max size per plan, MIME sniffing (not extension), virus-scan hook interface, stored in private bucket, signed URLs only.

### API conventions
- REST under `/api/v1`, JSON, cursor pagination, `{ error: { code, message, fields? } }` error shape, request IDs in logs and responses.
- OpenAPI generated from Zod schemas (`zod-to-openapi`) → `docs/api/openapi.json`.
- Rate limits: auth routes strict, widget public routes per-key + per-IP, general API per-user.
- Webhooks (Stripe, Meta, Twilio): raw-body signature verification, idempotency, retries via BullMQ.

### Security
- Secrets only in env; `.env.example` lists every variable with a comment; `.env*` in `.gitignore`. Never print secrets in logs, terminal output, artifacts or walkthroughs.
- Helmet, strict CORS (app origin only; widget routes allow configured customer origins), CSP for the web app.
- Integration OAuth tokens encrypted at rest (AES-256-GCM, key from env).
- Audit log for: logins, role changes, publishes, billing changes, integration connect/disconnect, deletions.

### Working rules for the agent
- **Planning mode for every phase.** Produce an Implementation Plan and Task List artifact and wait for my approval before writing code. Fast mode only for small fixes I ask for.
- One phase per conversation. Finish by updating `docs/PROGRESS.md` (done / mocked / pending / known issues / next step) so a fresh conversation can resume.
- Ask before: adding a dependency not listed above, changing the DB schema of a shipped table, running any destructive command (`DROP`, `prisma migrate reset`, `rm -rf`, `git push --force`, deleting branches), or touching `.env`.
- Never invent API keys, IDs or credentials. If a phase needs one, list it under "Credentials needed" in the plan and continue with the mock adapter.
- Commit in small, working increments with conventional commit messages on a feature branch per phase (`phase-2-billing`); never commit directly to `main`.
- After code changes: `pnpm typecheck && pnpm lint && pnpm test` must pass before you report the task done. Fix, don't skip or `@ts-ignore`.
- Verify UI with the browser subagent (see workflow `/verify-phase`) and attach screenshots to the Walkthrough artifact.
