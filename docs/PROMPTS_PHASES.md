# Zdoda Phased Build Plan

Run each phase in Planning mode, ideally in its own conversation. At the start: follow `/start-phase`. At the end: follow `/verify-phase`, then stop for my approval.

### Phase 0 — Discovery & architecture (no feature code)
1. **Inspect the workspace.** List what exists. If code exists, identify what works and must be preserved and where it conflicts with these rules; preserve working code and conventions. If empty, say so.
2. **Study the reference image** (`docs/design/zdoda-reference.png`, 12 screens: How Zdoda Works 6 steps, Pricing & Plans, Dashboard, Agent Builder, Knowledge Base, Channels, Tools & Integrations, Voice Assistant, Analytics & Reports, Templates, Team & Collaboration, Deploy & Publish, Billing & Settings). Produce a screen inventory: components, data shown, building phase.
3. **`docs/ARCHITECTURE.md`**: monorepo layout and reasons; Mermaid flows for tenant-scoped dashboard request, widget load on a customer site, RAG answer, Stripe checkout → webhook → subscription, WhatsApp inbound → agent → reply, voice call → STT → agent → TTS; provider interfaces with method signatures and real vs mock adapters.
4. **`docs/DATA_MODEL.md` + draft `schema.prisma`** (not migrated): User, Session, Workspace (`parentWorkspaceId` for agency clients), Membership, roles/permissions, ClientAccess, Plan, Subscription, UsageRecord, Invoice, Agent, AgentVersion, KnowledgeSource, KnowledgeChunk (pgvector), AgentKnowledge, Tool, AgentTool, IntegrationConnection (encrypted tokens), Channel, PhoneNumber, Contact, Lead, Conversation, Message, CallRecord, WidgetConfig, WidgetVersion, Template, OnboardingProgress, Notification, AuditLog, ProcessedWebhookEvent — with indexes, unique constraints and tenant-scoping marked.
5. **`docs/DESIGN_SYSTEM.md`**: Section 2 tokens as Tailwind v4 theme + CSS variables, `packages/ui` component list with props, ASCII wireframes (1440 and 390) for app shell, Dashboard, Agent Builder, Widget Studio. Critique your own plan: name anything that reads like a generic SaaS template and revise it; state each screen's signature element.
6. **Credentials list + `.env.example`**: every env var, the phase that needs it, and the mock behaviour until provided.
7. **Top 8 risks** with mitigations (widget bundle size, Shadow DOM font loading, pgvector performance, Stripe availability in India, WhatsApp template approval, voice latency, etc.).
8. End with an Implementation Plan and a Task List for Phase 1. Ask only the questions whose answers change the architecture. Stop.

### Phase 1 — Foundation: monorepo, design system, auth, workspace, app shell

**Scope**
- Monorepo per rule 03: pnpm + Turborepo, apps/web, apps/api, packages/shared, packages/ui, packages/db, packages/widget (empty shell for now). docker-compose with postgres+pgvector, redis, mailpit, minio. Scripts: dev, build, typecheck, lint, test, test:e2e, db:migrate, db:seed.
- Prisma schema from docs/DATA_MODEL.md for: User, Session, Workspace, Membership, ClientAccess, Plan, Subscription (stub), OnboardingProgress, AuditLog. First migration + seed (Smile Dental Clinic workspace + owner user, and a second workspace "Other Co" with its own user for tenant tests).
- Tenancy: Prisma client extension enforcing workspaceId, ctx resolution middleware, can() permission module, 404 on cross-tenant.
- Auth: signup, email verification (mailpit in dev), login, logout, forgot/reset password, session cookies, CSRF, rate limiting. Google sign-in hidden unless configured.
- Design system in packages/ui following rule 02: tokens (light/dark), glass utilities with reduced-transparency fallback, and components: Button, IconButton, SegmentedControl, Switch, TextField, Select, Sheet, Popover, Menu, Toast, StatusPill, Card, StatCard, GroupedList, EmptyState, Skeleton, LargeTitleHeader, GlassBar, Avatar, Badge, Tooltip, CommandPalette.
- A /design route (dev only) showing every component in every state, light and dark — this is our living style guide.
- App shell: glass sidebar with grouped sections (collapsible to icon rail), glass top bar (workspace switcher, ⌘K search, usage meter placeholder showing "Demo", notifications popover, help menu, profile menu), large-title page header that collapses on scroll, mobile drawer < 1024px, bottom tab bar < 640px. Every sidebar item routes to a page; unbuilt pages show a designed EmptyState with a "Coming in Phase N" pill.
- Onboarding steps 1–2 (business info, workspace creation) as a sheet flow with saved progress; steps 3–7 shown as upcoming.
- Workspace switcher works across the two seeded workspaces (for a user who belongs to both — add one such user).

**Definition of Done**
- Fresh clone → `pnpm i && docker compose up -d && pnpm db:migrate && pnpm db:seed && pnpm dev` works, documented in README.
- Signup → verify email (via mailpit) → onboarding → app shell, on desktop and 390px mobile.
- Password reset works end to end; reused or expired tokens are rejected.
- User of "Other Co" gets 404 for Smile Dental workspace routes and API IDs (automated test).
- /design shows all components; light/dark and reduced-transparency look correct.
- Lighthouse accessibility ≥ 95 on login and dashboard shell.

---

### Phase 2 — Plans, billing and the customer dashboard

**Scope**
- Plan table + seed with the demo plans in rule 01 (configurable, "Demo pricing" label, showPrice flag). Pricing page inside the app and a reusable PricingTable component (Monthly/Yearly segmented control, "Most popular" on Pro).
- PaymentProvider interface: Stripe adapter (test mode) + mock adapter. Checkout Session, Customer Portal, upgrade/downgrade with proration preview sheet, cancel at period end, resume, invoices list. Subscription state changes only via verified, idempotent webhooks.
- Trial/free preview: users can explore the product without paying; plan gates enforced server-side with typed over-quota errors → upgrade sheet.
- UsageRecord + metering service (messages, voice minutes, active agents) and a usage meter in the top bar.
- Billing & Subscription page (grouped inset lists): current plan, status pill, next billing date, usage bars vs limits, payment method (via portal), invoice history, billing details, cancel/resume, upgrade/downgrade.
- Customer Dashboard matching the reference: stat cards (Conversations, Appointments, Leads, Resolution rate with deltas), conversations chart by channel (Recharts, stacked bars), recent conversations list, top questions, active channels, quick actions (Create AI agent, Add knowledge, Connect channel, Customize widget, View analytics), date-range picker. All from API endpoints over seeded data; cards show "Demo data" pills while the workspace is seeded.

**Definition of Done**
- With Stripe test keys: subscribe to Pro via Checkout (card 4242…), webhook flips status to Active, upgrade to Business shows proration and updates after webhook, cancel shows "Cancels on <date>", resume works, invoices list populated. Without keys: mock adapter path works and every billing surface says Demo.
- Forging a client-side "success" redirect without a webhook does NOT change subscription state (test).
- Exceeding the Starter message quota returns the typed error and opens the upgrade sheet.
- Dashboard renders in < 1.5s on seeded data, matches the reference layout at 1440 and stacks correctly at 390.

---

### Phase 3 — Agent Builder, Knowledge Base and RAG

**Scope**
- Agents list (cards with status pill, channels, last edited) + Create agent sheet (from scratch or template).
- Agent Builder matching the reference: large title with agent name + status, glass toolbar (Test agent, Save draft, Publish as the single accent button, more menu: Pause, Duplicate, Version history, Delete). Tabs: Prompt, Knowledge, Tools, Channels, Settings. Fields: name, description, business category, personality & tone, system instructions, model (from LLMProvider list), temperature/params the model supports, language (incl. auto-detect), welcome message, fallback response, escalation instructions, voice on/off, channels on/off, assigned tools, assigned knowledge sources.
- Right-hand Test panel: live chat with the draft agent (streaming), showing retrieved source citations and token/usage cost. Works with mock LLM when no key is set (clearly labelled).
- AgentVersion: Save draft vs Publish (validated with Zod; publish blocked with inline reasons if invalid). Version history sheet with restore-as-draft.
- Knowledge Base matching the reference: filters (All, Web pages, Sitemap, Files, Text, Tables), "Add source" sheet (website URL, sitemap, file upload PDF/DOCX/TXT/CSV/XLSX, FAQ pairs, text/notes), table with type icon, name, chunks, last synced, status pill (Pending/Processing/Active/Failed with error + retry), re-sync, delete with confirm, search.
- Ingestion pipeline with BullMQ per rule 03, EmbeddingProvider (real + deterministic mock), pgvector HNSW index, retrieval scoped to agent sources + workspace.
- Templates page (Healthcare, Restaurants, Real Estate, Home Services, E-commerce, Agency) that pre-fill the Create agent sheet.

**Definition of Done**
- Add smiledental.com-style site (use a local fixture site served by the dev server) → status moves Pending → Processing → Active live in the UI (polling or SSE) with chunk counts.
- Upload a PDF → chunks → asking the test panel a question from the PDF returns an answer citing it.
- A failing URL shows Failed with a readable reason and Retry works.
- Publish is blocked when required fields are missing; after publishing, status reads "Published (not deployed)" until a channel exists — never "Live".
- Tenant test: Other Co cannot retrieve Smile Dental chunks even via direct API calls with guessed IDs.

---

### Phase 4 — Widget Studio, widget runtime and publishing (core differentiator)

**Scope (MVP + animated backgrounds)**
- packages/shared: WidgetConfigV1 Zod schema with defaults; six theme presets; OKLCH auto-palette with contrast guarantee.
- packages/widget: Preact runtime + loader (w.js), Shadow DOM, mountWidget/update/destroy API, bubble + inline layouts, launcher (icon/text/icon+text, circle/pill/square, size, left/right, offsets, entrance, unread badge, glass option), welcome screen, quick replies, disclaimer, footer/privacy links, message list, typing indicator, composer, light/dark/auto, backgrounds (solid, gradient, aurora, particles, waves, bokeh, image) with speed/opacity/blur and reduced-motion handling. Bundle budgets enforced in CI (size-limit).
- Widget Studio page: inspector with Brand, Theme, Background, Launcher, Texts tabs; glass canvas toolbar (Desktop/Mobile segmented control, layout mode, preview appearance, Reset to published, Save draft, Version history, Publish); desktop browser frame with a sample Smile Dental host page; mobile phone frame; real runtime in preview mode with scripted demo replies or the published agent.
- Uploads for logo/avatar/header/background image via StorageProvider (signed URLs, size/type limits).
- Draft save with optimistic concurrency, publish → immutable WidgetVersion, version history with diff summary and restore.
- Public config endpoint with ETag/caching and allowed-domain check; Website Chat channel panel shows the install snippet (copy button), allowed domains editor, assigned agent, enable toggle, connection status (Live once the loader has phoned home from an allowed domain).
- apps/web/public/embed-test.html simulating a customer site.
- V2/Pro controls visible with Coming soon pills and disabled (side panel, popup, full page, brand import, proactive greeting, A/B tests, video/Lottie, custom CSS, hide branding).

**Definition of Done**
- Playwright: change each control in each tab → preview DOM/computed style changes (one assertion per control). No control is a no-op.
- Control change → preview updated in < 100ms (measured in a test with performance marks).
- Publish → embed-test.html shows the new design after reload without changing the snippet; previous version restorable.
- Loading the widget from a non-allowed origin renders nothing and the API returns 403.
- Host page CSS (e.g. `* { font-family: Comic Sans; color: red }`) does not affect the widget, and widget CSS does not affect the host (test).
- Reduced motion → backgrounds static; keyboard-only user can open, chat and close the widget; axe finds no violations inside the widget.
- size-limit: loader ≤ 8 KB gz, runtime ≤ 45 KB gz.

---

### Phase 5 — Channels, integrations, inbox, voice and phone numbers

**Scope**
- Channels page (segmented: Website chat, WhatsApp, Voice): each panel with configuration, assigned agent, enable toggle, health status pill.
  - WhatsApp: WhatsAppProvider (Meta Cloud API adapter + mock): business number, connection setup sheet with step list, webhook URL + verify token display, signature-verified inbound webhook → agent → reply, message status tracking. Mock mode clearly labelled; never simulate real delivery.
  - Voice: TelephonyProvider (Twilio adapter + mock) + VoiceEngine interface (STT → agent → TTS, streaming; pluggable for Zdoda's in-house engine later). Settings: number, voice, language, greeting, call rules, business hours, human handoff number, recording + transcription only with consent notice. Voice Assistant screen per reference: call card with avatar, live waveform, timer, mute/end/keypad, live transcript and call-flow tabs. "Test call in browser" via WebRTC when provider configured; otherwise a clearly-labelled simulated transcript demo.
- Phone Numbers: list, search/buy flow (provider-gated → Setup required without credentials), assign to agent, inbound/outbound config, porting request form (stores request, shows status), number status.
- Tools & Integrations directory per reference (tabs: Integrations, API tools, MCP, Functions): Google Sheets, Google Calendar, Slack, Make, n8n, GoHighLevel, HubSpot, Salesforce, Custom API tool builder (method, URL, headers from encrypted secrets, JSON schema params, test call), MCP server connections where supported. Real OAuth only when client IDs exist; otherwise Setup required or Coming soon. Connected only after a successful server-side test call. Tokens encrypted at rest.
- Inbox: conversation list (search, filters by channel/agent/status/lead), thread view for chat and voice (transcript + recording player), contact panel (details, extracted fields, lead status, summary), human handoff (take over / return to agent), assignment, notes.

**Definition of Done**
- With Meta test credentials: message to the test number gets an agent reply and appears in Inbox in real time. Without: WhatsApp panel shows Setup required with exact missing variables.
- With Twilio credentials: a real inbound call is answered by the agent, transcript + call record saved. Without: voice screens say Demo and nothing claims a live call.
- Custom API tool: create, test call (against a local fixture endpoint), assign to agent, agent calls it in the Test panel.
- Human takeover in Inbox stops agent replies for that conversation until returned.
- No integration shows Connected without a stored token + passing healthCheck (test).

---

### Phase 6 — Analytics, team, agency and white-label

**Scope**
- Analytics & Reports per reference: date-range picker, conversations, appointments, leads, resolution rate, average response time, channel breakdown donut, agent performance table, voice minutes, message usage vs quota, trends; filters by agent/channel; CSV export; empty states that tell users how to get data. Aggregations via SQL (materialized daily rollups refreshed by a BullMQ job).
- Team & Workspace: members table, invite by email (expiring tokens), roles (Owner, Admin, Builder, Agent, Viewer) with a permissions matrix sheet, remove/transfer ownership with confirms, activity log viewer (AuditLog), workspace settings (name, logo, timezone, default language, data retention).
- Agency: client workspaces list, create client workspace, switch into client, ClientAccess grants, agency branding (logo, colours, custom domain field with DNS instructions + verification status), white-label toggle for eligible plans (hides Zdoda branding in widget and client dashboard), agency-level billing overview.
- Deploy & Publish screen per reference: draft/publish per agent, version history, rollback, A/B traffic split marked Coming soon unless built.
- Settings (grouped inset lists): profile, security (password, sessions list with revoke), notifications, accessibility (reduce motion, reduce transparency, appearance: system/light/dark), API keys for the public API (hashed, shown once), danger zone.

**Definition of Done**
- Analytics numbers reconcile with raw table counts in an automated test.
- A Viewer cannot change anything (API returns 403 for writes inside their own workspace; UI disables controls).
- Agency user can manage only client workspaces they have ClientAccess to (tests for allowed and denied).
- White-label hides Zdoda branding on the widget for eligible plans only (server-enforced).

---

### Phase 7 — Landing page, full onboarding, hardening and docs

**Scope**
- Public landing page (apps/web, route /), Apple-style per rule 02 §8:
  - Hero: "One Agent. Every Channel." with the signature pinned scroll sequence — the Dental Assistant answers one question in the website widget, the thread morphs into WhatsApp, then into a voice-call card with waveform (shared-element morph). Use the REAL widget runtime for the first stage. Reduced motion → three static frames side by side.
  - How it works (the 6 steps from the reference — a real sequence, so numbering is allowed), channels, Widget Studio showcase (interactive mini-studio: 3 controls driving the real widget), industry templates, pricing (PricingTable from Phase 2), FAQ (accordion), final CTA, footer. Login / Start free buttons.
  - Performance: LCP < 2.0s on mid-tier mobile, CLS < 0.05, landing JS split from app JS.
- Onboarding steps 3–7 completed: subscription selection (trial allowed), create agent (template or scratch), add first knowledge source, connect a channel (website chat by default — shows snippet), test and publish. Resume from saved progress; skippable steps; checklist card on the dashboard until complete.
- Hardening: security headers/CSP review, rate-limit review, dependency audit, error boundaries on every route, 404/500 pages, structured logging with request IDs, health endpoints, graceful shutdown, DB indexes reviewed with EXPLAIN on hot queries.
- Tests: auth, tenant isolation matrix (every resource type), billing webhooks, quota enforcement, widget publish/load, ingestion, inbox handoff — unit + API + e2e.
- Docs: README (setup), docs/DEPLOYMENT.md (Docker images, env vars, migrations, Stripe/Meta/Twilio webhook setup, CDN for widget assets), docs/api/openapi.json + rendered API reference page, docs/FEATURE_STATUS.md final pass (Implemented / Mocked / Planned), demo script.

**Definition of Done**
- New visitor → landing → Start free → signup → onboarding → published widget on embed-test.html in under 5 minutes (record with the browser subagent).
- All test suites green in CI; Lighthouse ≥ 90 performance and ≥ 95 accessibility on landing and dashboard.
- FEATURE_STATUS.md matches what the UI actually shows (spot-check 10 features).
