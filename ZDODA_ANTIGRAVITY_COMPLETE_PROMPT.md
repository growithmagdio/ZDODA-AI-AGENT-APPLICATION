# Zdoda AI Agent Platform — complete development prompt for Google Antigravity

> **How to use:** open the project folder in Antigravity → Agent panel → **Planning mode** → highest-reasoning model → paste this entire prompt. Put the UI reference board image at `docs/design/zdoda-reference.png` before you start (or attach it to the message).

---

## 0. Role, mission and how you will work

Act as a **Senior Full-Stack Developer, SaaS Product Architect and Senior UI/UX Designer** (Apple Human Interface Guidelines fluent). Build **Zdoda — AI Agent Platform**, a production-oriented, multi-tenant AI-Agent-as-a-Service product: **One Agent. Every Channel.** Businesses create one AI agent, train it on their business knowledge, and deploy it to website chat, WhatsApp and voice from one dashboard. The **Widget Studio** (no-code chat-widget designer with a real live preview) is the core differentiator.

This prompt is the complete specification. Sections 1–4 are binding rules; Section 5 is the workflow you follow; Section 6 is the phased build plan with a Definition of Done per phase; Section 7 lists final deliverables.

### Bootstrap (do this first, before anything else)
1. Save this prompt's rules into the workspace so every future conversation inherits them:
   - Section 1 → `.agents/rules/01-zdoda-product.md` with frontmatter `trigger: always_on`
   - Section 2 → `.agents/rules/02-design-system-apple.md` with frontmatter `trigger: glob` and `globs: apps/web/**, packages/ui/**, packages/widget/**`
   - Section 3 → `.agents/rules/03-engineering-guardrails.md` with frontmatter `trigger: always_on`
   - Section 4 → `.agents/rules/04-widget-studio.md` with frontmatter `trigger: model_decision` and a one-line description
   - Section 5 workflows → `.agents/workflows/start-phase.md`, `verify-phase.md`, `design-check.md` (each with a `description:` frontmatter line)
   - Section 6 → `docs/PROMPTS_PHASES.md`
   Keep each rule file under 12,000 characters. Copy the text faithfully; do not summarise.
2. Create `docs/PROGRESS.md`, `docs/FEATURE_STATUS.md` (every feature listed as Planned with its phase) and `docs/DECISIONS.md` (append-only decision log).
3. Then run **Phase 0** (Section 6) and stop for my review. Build one phase at a time; after each phase, stop, show me the Walkthrough, and wait for approval before the next.

---

## 1. Product rules (always on)

You are building **Zdoda**, an AI-Agent-as-a-Service platform. Tagline: **One Agent. Every Channel.**
A business creates one AI agent, teaches it about the business, and deploys the same agent to website chat, WhatsApp and phone/voice — from one dashboard.

### Who uses it
- Small business owners (clinics, restaurants, real estate, home services, e-commerce) — non-technical. Every screen must make sense to them without docs.
- Agencies who build agents for many clients — need client workspaces, white-label, agency billing.
- Startups and enterprise teams — need roles, audit logs, API tools.

### Source-of-truth files (read before planning any task)
- `docs/design/zdoda-reference.png` — the approved UI reference board (12 screens). Match its information architecture, density and component vocabulary. Apply the Apple-style design language from rule `02-design-system-apple.md` on top of it.
- `docs/PROGRESS.md` — what is done, mocked and pending. Update it at the end of every task.
- `docs/FEATURE_STATUS.md` — the Live / Test mode / Demo / Setup required / Coming soon matrix.
- `docs/DECISIONS.md` — architecture decisions (append-only log, one entry per decision).

### Product surface (sidebar order)
Dashboard · Agents · Knowledge Base · Tools & Integrations · Channels · Widget Studio · Inbox · Phone Numbers · Analytics · Templates · Team & Workspace · Billing & Subscription · Settings

Top bar: workspace switcher · global search (⌘K / Ctrl+K command palette) · usage meter · notifications · help · profile menu.

### The core differentiator
**Widget Studio** — a no-code editor for the website chat widget with a live preview. The preview MUST render the real widget runtime (`packages/widget`) inside a Shadow DOM, fed by the same `WidgetConfig` object the editor edits. Never a screenshot, never a look-alike React copy.

### Honesty contract (non-negotiable)
Every external capability shows exactly one of these states, using the shared `<StatusPill>`:

| State | Meaning | When |
|---|---|---|
| Live | Real provider, real credentials, verified by a server round-trip | Provider configured AND last health check passed |
| Test mode | Real provider in sandbox (Stripe test keys, Meta test number) | Sandbox credentials present |
| Demo | Mock adapter or seeded data | No credentials; seed data |
| Setup required | Feature exists but needs credentials/config | Show what is missing and a "How to set up" sheet |
| Coming soon | Planned, not built | Never clickable as if it works |

Never:
- show a subscription as active unless the backend received and verified the Stripe webhook;
- show an integration as Connected unless a server-side token exists and a test call succeeded;
- mark an agent "Live" unless its published version is deployed to at least one channel that passed a health check;
- fake WhatsApp delivery, call connection, number purchase or payment success;
- render another workspace's data — every read and write is workspace-scoped on the server;
- put secrets, API keys or provider tokens in frontend code, URLs, logs or `localStorage`;
- leave a button, toggle, menu item or link without a real action. If it cannot work yet, it is disabled with a tooltip and a Coming soon / Setup required pill.

### Demo workspace (seed data)
Seed one workspace named **Smile Dental Clinic** matching the reference board: agent "Dental Assistant" (friendly, professional, helpful; English + auto-detect), knowledge sources (smiledental.com site, sitemap, Clinic Brochure PDF, FAQ doc, Services & Prices sheet), website chat channel, ~2,800 demo conversations across 30 days, ~180 leads, sample inbox threads (Sarah M. – book appointment, John D. – pricing, Priya S. – reschedule, Mike R. – product info). Every seeded number renders a small "Demo data" pill in its card header.

### Plans (configurable, demo prices)
Plans, prices and quotas live in the `Plan` table / server config — never in components. Demo values, all labelled "Demo pricing":
- Starter $49/mo — 1 agent, website widget, basic knowledge, essential integrations, 1,000 messages/mo
- Pro $99/mo (Most popular) — 5 agents, chat + WhatsApp, inbound voice, advanced knowledge, tools & integrations, 10,000 messages/mo
- Business $199/mo — unlimited agents, white-label widget, multi-workspace, custom integrations, priority support, 50,000 messages/mo
- Agency — client workspaces, white-label, custom domains, agency billing. Support `showPrice=false` per plan so a plan can show "Talk to sales" instead of a price.
Monthly/Yearly toggle, yearly = save 20% (configurable).

### Language and copy
- Plain verbs, sentence case for body and labels, title case only for page titles. Name things by what the user controls: "Notifications", not "Webhook config".
- A button says what happens ("Publish widget"), and the toast echoes it ("Widget published").
- Errors say what went wrong and how to fix it, never apologise, never "Something went wrong".
- Empty states invite the next action with one primary button.

---

## 2. Design language — "Apple effect" (all UI code)

Goal: Zdoda should feel like a first-party Apple pro app that happens to run in a browser — calm, precise, spatial — while keeping Zdoda's violet identity from the reference board. Familiar controls carry navigation; brand lives in colour, type, the agent avatar and one signature moment per surface.

### 1. The two-layer model (most important rule)
- **Content layer** — cards, tables, lists, charts, forms, chat transcripts. Opaque surfaces. No glass, no blur.
- **Functional layer** — floating chrome above content: sidebar, top bar, page toolbars (e.g. Agent Builder "Test agent / Publish" bar), sheets, popovers, menus, command palette, toasts, the Widget Studio preview toolbar, the widget launcher on customer sites. Only here may you use glass.
- Content scrolls *under* the top bar and sidebar so the glass has something to reflect. Use a scroll-edge fade (12–16px gradient mask) where content meets a bar instead of a hard border.
- Glass budget: at most 3 glass surfaces visible at once. Never glass on glass. Never glass on cards or rows.

### 2. Glass recipe (CSS)
```css
.glass {            /* regular — default for bars, sheets, menus */
  background: color-mix(in oklab, var(--surface) 72%, transparent);
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  border: 1px solid var(--glass-edge);          /* rgba(255,255,255,.55) light / rgba(255,255,255,.08) dark */
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-float);
}
.glass--clear {     /* only over rich media: widget over host site, voice call screen */
  background: color-mix(in oklab, var(--surface) 30%, transparent);
  backdrop-filter: blur(12px) saturate(1.3);
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass, .glass--clear { background: var(--surface); backdrop-filter: none; border-color: var(--separator-strong); }
}
```
Also expose a user setting "Reduce transparency" (Settings → Accessibility) that adds `data-reduce-transparency` on `<html>` for browsers without the media query.

### 3. Colour tokens (CSS variables on :root, dark under [data-theme=dark] and prefers-color-scheme)
| Token | Light | Dark | Use |
|---|---|---|---|
| --canvas | #F7F8FF | #0C0C1D | App background |
| --surface | #FFFFFF | #16162E | Cards, sheets |
| --surface-2 | #F1F2FB | #1E1E3A | Grouped-inset backgrounds, input fills |
| --ink | #15153B | #F3F3FF | Primary text (17.5:1 / 17.6:1) |
| --ink-2 | #4A4A6A | #B9B9D6 | Secondary text (8.5:1 / 9.2:1) |
| --ink-3 | #6B6B88 | #9090B0 | Tertiary, captions, placeholders (5.1:1 / 5.7:1) |
| --accent | #6538F5 | #6538F5 | Primary buttons (white label 6.1:1), selected states |
| --accent-ink | #5227E0 | #9B80FF | Accent text and icons (7.7:1 / 5.8:1) |
| --accent-tint | #EFEAFF | rgba(101,56,245,.18) | Selected row, active nav |
| --success | #0A7D3E | #3DD68C | Live, Active (5.2:1 / 9.4:1) |
| --warning | #A15C00 | #FFB547 | Setup required, Test mode |
| --danger | #C62834 | #FF6B75 | Failed, destructive |
| --separator | rgba(21,21,59,.08) | rgba(255,255,255,.08) | Hairlines |

Rules: accent colour only on the one primary action per view, the selected nav item, focus rings, and status. Status is never colour-only — always icon + label. Charts use a validated categorical palette led by the accent (violet, teal #12A7A0, amber #E0A100, slate #7B8199, coral #E2626B).

### 4. Typography — SF-style system stack
```css
--font-text: -apple-system, BlinkMacSystemFont, "Inter Variable", "Segoe UI", Roboto, sans-serif;
--font-display: -apple-system, BlinkMacSystemFont, "Inter Display", "Inter Variable", sans-serif;
--font-mono: ui-monospace, "SF Mono", "JetBrains Mono", monospace;  /* code snippets ONLY */
```
Apple devices get SF Pro natively; others get Inter (self-hosted, `font-display: swap`). Do not bundle SF fonts.
Scale (px / line-height / weight / tracking): Large title 34/41/700/-0.022em · Title 1 28/34/700/-0.02em · Title 2 22/28/600/-0.017em · Headline 17/22/600 · Body 15/22/400 (web app body) · Callout 14/20/400 · Footnote 13/18/400 · Caption 12/16/500. Minimum 12px anywhere. Numbers in stats and tables use `font-variant-numeric: tabular-nums`. No ALL-CAPS eyebrow labels; no single highlighted word in headlines.

### 5. Shape, spacing, depth
- 4px base grid; spacing scale 4, 8, 12, 16, 20, 24, 32, 40, 56, 80.
- Radius by hierarchy, not one radius for everything: controls 10px · inputs 12px · cards 16px · sheets/modals 24px · app windows/preview frames 28px · pills 999px. Inner radius = outer radius − padding.
- Shadows: content cards get almost none (`0 1px 2px rgba(21,21,59,.04)` + 1px separator border). Floating layer gets `--shadow-float: 0 12px 40px -12px rgba(21,21,59,.18)`.
- Hit targets ≥ 44×44px on touch, ≥ 28×28px with pointer. Visible focus ring: 2px `--accent` + 2px offset.

### 6. Apple-native patterns to use
- **Large titles** that collapse into the glass top bar on scroll (sticky, 34px → 17px, crossfade, 200ms).
- **Sidebar** like macOS: grouped sections (Build: Agents, Knowledge, Tools, Channels, Widget Studio · Operate: Inbox, Phone Numbers, Analytics · Account: Templates, Team, Billing, Settings), SF-Symbols-style Lucide icons at 1.75 stroke, collapsible to an icon rail; on < 1024px it becomes a sheet drawer; on < 640px a bottom tab bar with 5 tabs (Home, Agents, Inbox, Studio, More).
- **Segmented controls** for 2–5 peer views (Monthly/Yearly, Chat/Voice/WhatsApp, Desktop/Mobile preview).
- **Grouped inset lists** for Settings, Billing details and Agent settings (rounded group, hairline separators, chevron rows, switches right-aligned).
- **Sheets** (bottom sheet on mobile, centered 24px-radius sheet on desktop) for create flows: Create agent, Add source, Connect channel. One task per sheet, clear Cancel.
- **Popovers/menus** with glass, 8px radius items, keyboard navigable.
- **Toggles** are iOS-style switches (51×31 on touch, 38×22 desktop) — the reference board already uses them.
- **Inspector panel** (right column) in Agent Builder and Widget Studio, like Xcode/Keynote inspectors.
- **Command palette** (⌘K) with glass, search across agents, conversations, settings and actions.

### 7. Motion — springs, brief, purposeful
- Use `motion` (Framer Motion). Default spring: `{ type: "spring", stiffness: 380, damping: 32, mass: 0.9 }`. Sheets: stiffness 300, damping 30. Durations for fades 150–220ms, ease `cubic-bezier(0.32, 0.72, 0, 1)`.
- Motion answers user actions (open, expand, confirm, reorder). No scroll-triggered fade-ups on every section, no hover bounce on every card.
- Press feedback: scale 0.97 on primary buttons and cards that open something.
- Shared-element transitions: agent card → Agent Builder header; template card → create-agent sheet.
- `prefers-reduced-motion: reduce` → replace movement with opacity changes; stop all background animations in the widget and landing page.

### 8. Signature moments (spend boldness here, keep the rest quiet)
1. **Landing hero — "One Agent. Every Channel."** A pinned scroll sequence: the same Dental Assistant answers one question in the web widget, then the conversation morphs into a WhatsApp thread, then into a live voice-call card with a waveform (shared-element morph between the three). This is the only scroll-driven animation on the site.
2. **Widget Studio preview** — the device frame (28px radius, realistic browser chrome for desktop, phone frame for mobile) with the real widget responding instantly to every control.
3. **Publish** — on successful publish, the Publish button morphs into a check and the version number ticks up (no confetti).

### 9. Craft checklist (run before marking any UI task done)
- Light and dark both checked; reduced motion and reduced transparency both checked.
- 1440, 1024, 768 and 390px widths: no horizontal scroll, no clipped text, sidebar adapts.
- One primary (accent-filled) button per view. Destructive actions are red text buttons with a confirm sheet.
- Every async action shows: immediate pressed state → inline progress → success toast or inline error.
- Skeletons match the final layout shape; no spinners for whole pages.
- Remove one accessory: before finishing a screen, delete one decorative element that adds nothing.

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

---

## 4. Widget Studio and widget runtime spec

### Architecture: one renderer, two hosts
```
packages/shared  ── WidgetConfigV1 (Zod) ──┐
                                           ├── packages/widget  mountWidget(el, config, { mode })
apps/web Widget Studio (editor state) ─────┘        ▲                    ▲
        └── <WidgetPreview config={draft}/> ─────────┘ mode:"preview"     │ mode:"live"
customer site: <script async src=".../w.js" data-zdoda="wk_pub_…"> ───────┘ (fetches published config)
```
- `mountWidget(container, config, opts)` returns `{ update(config), destroy(), open(), close() }`. The Studio calls `update()` on every editor change (debounced 16ms) — no remount, no flicker. Target: control change → pixels in < 100ms.
- Preview mode uses a mock conversation transport (scripted Smile Dental demo replies) or, when the agent is published, a real test session to the agent.
- Every Studio control writes to the draft `WidgetConfig`. A control that does not change the preview is a bug.

### WidgetConfigV1 (shape — define in packages/shared with defaults for every field)
```ts
{
  schemaVersion: 1,
  brand:      { botName, tagline, logoUrl?, avatar: { type: "upload"|"initials"|"generated", url?, initials? }, headerImageUrl? },
  theme:      { preset: "violet"|"glass"|"midnight"|"mint"|"coral"|"graphite",
                primary, palette: "auto"|"custom", colors?: { header, headerText, userBubble, userText, botBubble, botText, button, buttonText, surface, text },
                appearance: "light"|"dark"|"auto", fontFamily: "system"|"inter"|"serif"|"rounded", radius: 8|14|20|28, density: "compact"|"comfortable" },
  background: { type: "solid"|"gradient"|"aurora"|"particles"|"waves"|"bokeh"|"image"|"video"|"lottie",
                colors: string[], speed: 0..2, opacity: 0..1, blur: 0..40, imageUrl?, videoUrl?, lottieUrl?, respectReducedMotion: true },
  launcher:   { style: "icon"|"text"|"icon_text", shape: "circle"|"pill"|"square", icon, label?, size: 48..72,
                position: "right"|"left", offsetX, offsetY, entrance: "none"|"fade"|"pop"|"slide", unreadBadge: boolean, glass: boolean },
  texts:      { welcomeTitle, welcomeMessage, placeholder, disclaimer, footerText?, privacyUrl?, quickReplies: string[], language: "auto"|BCP47, translate: boolean },
  layout:     { mode: "bubble"|"inline"|"side_panel"|"popup"|"fullpage", width, height, inlineSelector? },
  behavior:   { proactiveGreeting?: { enabled, delaySec, message }, openOnLoad: boolean, soundOnMessage: boolean },
  advanced:   { customCss?: string, hideBranding: boolean }  // plan-gated
}
```
Unknown/invalid fields fall back to defaults — the widget must always render.

### Themes (MVP: six presets)
| Preset | Character |
|---|---|
| Violet | Zdoda default — #6538F5 header, white surface |
| Glass | Apple-style: clear glass panel over the host page, monochrome text, accent only on send button and user bubble |
| Midnight | Dark navy surface, violet accents |
| Mint | Clinical/healthcare — soft mint, deep teal text |
| Coral | Warm hospitality/restaurants |
| Graphite | Neutral grey, for brands with their own strong colour |
"Auto palette" derives header/bubbles/button from `primary` in OKLCH and guarantees ≥ 4.5:1 text contrast; the Contrast checker (V2) warns live in the inspector when custom colours fail.

### Studio layout (desktop)
`[ sidebar ] [ inspector 360px: Brand · Theme · Background · Launcher · Texts tabs ] [ preview canvas ]`
- Glass toolbar above the canvas: segmented Desktop / Mobile, layout mode menu, Light/Dark/Auto preview toggle, Reset to published, Save draft, Version history, Publish (the one accent button).
- Canvas: desktop shows a browser frame with a sample host page (Smile Dental site mock) so position, offsets and glass are judged in context; mobile shows a 390×844 phone frame. Background animations run in preview and pause when the tab is hidden.
- Unsaved changes indicator next to the title; ⌘S saves draft; leaving with unsaved changes asks to save.
- Tablet/mobile Studio: inspector becomes a bottom sheet over a full-width preview.

### Backgrounds
Implement solid, gradient (CSS), aurora/mesh (CSS radial gradients with slow transform), particles and bokeh (single `<canvas>`, ≤ 60 particles, requestAnimationFrame paused off-screen), waves (SVG path animation). `speed`, `opacity`, `blur` apply live. With `prefers-reduced-motion` or `respectReducedMotion` → render the first frame static. Video/Lottie are Pro and lazy-loaded only when selected.

### Publishing and versions
- Draft lives in `WidgetConfig.draft` (JSON). Save draft = PATCH with optimistic concurrency (`version` field; conflict → sheet offering reload/overwrite).
- Publish = server validates with Zod + plan gates → creates immutable `WidgetVersion { number, config, publishedBy, publishedAt }` → points `WidgetConfig.publishedVersionId` at it → purges CDN/ETag cache. Install snippet never changes.
- Version history sheet: list with author, time, diff summary ("Theme: Violet → Glass; Launcher: right → left"), Preview this version, Restore as draft.

### Runtime requirements (live mode)
- Loader `w.js`: async, no globals except `window.Zdoda` (open/close/identify/on API), reads `data-zdoda` public key, fetches `GET /api/v1/public/widgets/:key/config` (ETag, `Cache-Control: max-age=60, stale-while-revalidate=600`), then lazy-loads the runtime.
- Server checks `Origin` against the widget's allowed domains (wildcards like `*.smiledental.com` allowed); disallowed → 403 and the loader renders nothing (console warning only).
- Shadow DOM (`mode: "closed"`), all styles inside the shadow root, CSS custom properties namespaced `--zd-*`, z-index max-safe, no host CSS leakage either way. Respect host `prefers-color-scheme` when appearance = auto.
- Accessibility: launcher is a `<button>` with `aria-label`, panel is a `role="dialog"` with focus trap and Esc to close, live region for new messages, full keyboard use, 44px touch targets, text scales with browser zoom.
- Performance budget: no layout shift on host page, runtime parsed after `load`, Lighthouse impact < 3 points on a sample page. Add `apps/web/public/embed-test.html` that loads the widget like a customer site, used in Playwright tests.

### Feature phases — label in UI exactly as built
- MVP: brand, theme + six presets, typography & shape, basic launcher, welcome screen, editable texts, desktop/mobile preview, bubble & inline layouts, save draft, publish, version history.
- V2: animated backgrounds, website brand import (fetch site → extract logo, colours, font), proactive greeting, side panel / popup / full-page layouts, A/B design tests, contrast checker.
- Pro/Advanced: video & Lottie backgrounds, custom CSS (sanitised, scoped to shadow root), hide Zdoda branding / white-label, agency controls.
Anything not built in the current phase appears in the inspector with a "Coming soon" pill and disabled controls — never hidden fake controls that do nothing.

---

## 5. Workflows (save as slash commands)

### /start-phase — run at the start of every phase
1. Read `docs/PROGRESS.md`, `docs/FEATURE_STATUS.md`, `docs/DECISIONS.md` and the phase section in `docs/PROMPTS_PHASES.md` for the phase number I gave you.
2. Look at `docs/design/zdoda-reference.png` and note which reference screens this phase covers.
3. Run `git status` and `git branch`. If there are uncommitted changes, stop and ask me what to do with them.
4. Create a branch `phase-<n>-<short-name>` from the latest `main`.
5. Run `pnpm install` (if a lockfile changed) and `pnpm typecheck`. Record any pre-existing failures — do not hide them.
6. Produce an **Implementation Plan** artifact with: scope, out of scope, files/packages to touch, DB changes (with migration names), new API routes, new screens/components, provider adapters (real vs mock), credentials needed, risks, and the phase Definition of Done copied from PROMPTS_PHASES.md.
7. Produce a **Task List** artifact with small, verifiable tasks in build order (schema → API → UI → tests → verification).
8. Stop and wait for my approval or comments on the plan. Do not write code until I approve.

### /verify-phase — run when a phase is built
1. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`. Fix every failure in code (no skips, no `@ts-ignore`, no disabled lint rules). Re-run until green.
2. Run `pnpm test:e2e` (Playwright). Fix failures.
3. Start the stack (`docker compose up -d`, `pnpm dev`). Seed if needed (`pnpm db:seed`).
4. With the browser subagent, open every screen touched in this phase and capture screenshots at 1440px, 768px and 390px, in light and dark appearance. Also capture one screenshot with reduced motion emulated.
5. Compare each screenshot with `docs/design/zdoda-reference.png` and rule `02-design-system-apple.md`. List mismatches (spacing, radius, hierarchy, glass misuse, more than one accent button, colour-only status) and fix them.
6. Click through every button, toggle, menu item and link on those screens. Each must do something real, or be disabled with a Coming soon / Setup required pill. Fix any dead control.
7. Honesty audit: for every external capability on these screens, confirm the StatusPill matches reality (Live / Test mode / Demo / Setup required / Coming soon). Confirm no secret appears in the network tab, page source, console or logs.
8. Tenant check: log in as the second seeded user (other workspace) and try opening three URLs/IDs from the first workspace. Each must return 404.
9. Write a **Walkthrough** artifact: what was built, screenshots, how to demo it in 60 seconds, what is mocked and why, credentials still needed.
10. Update `docs/PROGRESS.md` and `docs/FEATURE_STATUS.md`. Append any decisions to `docs/DECISIONS.md`.
11. Commit with a conventional message and tell me the phase is ready for review. Do not merge to `main` without my OK.

### /design-check — Apple-style audit of one screen
1. Open the screen I name in the browser subagent at 1440px and 390px, light and dark.
2. Audit it in this order and list findings with severity (Critical / High / Medium / Low):
   - Accessibility: text contrast against the tokens in rule 02 (show ratios), 12px minimum text, 44px touch targets, visible focus, keyboard path, status not colour-only, reduced motion and reduced transparency fallbacks.
   - Layers: glass only on the functional layer (bars, sheets, menus, toolbars, launcher); no glass on cards or rows; ≤ 3 glass surfaces; scroll-edge fade under bars.
   - Hierarchy: one accent-filled primary action; large title present and collapsing; radius by hierarchy; grouped inset lists for settings-like content.
   - Motion: springs on user-triggered transitions only; nothing animates on its own except the defined signature moments.
   - Copy: verbs on buttons, toast echoes the action, errors explain the fix, empty state has one next action.
3. Name the one thing this screen should be remembered by. If nothing, propose one small, specific improvement.
4. Remove one accessory — name a decorative element to delete.
5. Fix all Critical and High findings, re-screenshot, and show before/after in a Walkthrough artifact.

---

## 6. Phased build plan

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

---

---

## 7. Final deliverables (end of Phase 7)

1. Working frontend (`apps/web`), backend (`apps/api`) and embeddable widget (`packages/widget`).
2. Coherent, reusable design system (`packages/ui`) with the `/design` living style guide.
3. Prisma schema, migrations and seed data (Smile Dental demo workspace + a second tenant for isolation tests).
4. `.env.example` with every variable documented, no secrets.
5. README setup, `docs/DEPLOYMENT.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/DESIGN_SYSTEM.md`.
6. API documentation (`docs/api/openapi.json` + rendered reference page).
7. Tests: auth, tenant isolation matrix, billing webhooks and quotas, widget publish/load and style isolation, ingestion/RAG, inbox handoff — unit, API and Playwright e2e, all green in CI.
8. `docs/FEATURE_STATUS.md`: an honest list of what is Implemented, Mocked and Planned, matching what the UI shows.

**Start now with the Bootstrap steps in Section 0, then Phase 0. Prioritise a polished, Apple-quality customer experience and a genuinely functional Widget Studio — never a static mockup.**
