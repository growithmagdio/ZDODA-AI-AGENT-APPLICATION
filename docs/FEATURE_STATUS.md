# Zdoda Feature Status Matrix

This matrix tracks the honesty status of every external and internal capability across the Zdoda platform according to Rule 01: Honesty Contract.

### Status Definitions
- **Live**: Real provider, real credentials, verified by a server round-trip.
- **Test mode**: Real provider in sandbox (e.g. Stripe test keys, Meta test number).
- **Demo**: Mock adapter or seeded demo data.
- **Setup required**: Feature code exists but credentials or config are missing.
- **Coming soon**: Planned, not yet built. Never clickable as if it works.
- **Planned**: Scheduled for an upcoming build phase.

---

| Category / Surface | Feature | Phase | Current Status | Provider / Adapter | Notes |
|---|---|---|---|---|---|
| **Core Platform** | Monorepo & Workspace Scaffold | Phase 1 | Planned | Turborepo + pnpm | Turborepo, shared packages, web & api apps |
| **Core Platform** | Multi-tenant Data Isolation | Phase 1 | Planned | Prisma Client Extension | Strict `workspaceId` assertion on all tenant queries |
| **Core Platform** | Role-Based Access Control | Phase 1 | Planned | Internal `can()` module | Owner, Admin, Builder, Agent, Viewer |
| **Core Platform** | Auth (Email + Password, Sessions) | Phase 1 | Planned | argon2id + httpOnly Cookies | Rate limiting, lockout backoff, CSRF |
| **Core Platform** | Auth (Google OAuth) | Phase 1 | Planned | Google OAuth 2.0 | Hidden dynamically unless credentials set |
| **Core Platform** | Design System & Styleguide (/design) | Phase 1 | Planned | `packages/ui` + Tailwind v4 | Apple effect tokens, glass recipe, living guide |
| **Core Platform** | App Shell & Navigation | Phase 1 | Planned | React 19 + Radix | Sidebar, top bar, ⌘K command palette, mobile tabs |
| **Core Platform** | Guided Onboarding (Steps 1–2) | Phase 1 | Planned | Internal Engine | Business info & workspace creation flow |
| **Billing & Plans** | Plans Catalog & Demo Pricing | Phase 2 | Planned | `Plan` Table / Config | Starter ($49), Pro ($99), Business ($199), Agency |
| **Billing & Plans** | Stripe Checkout & Portal | Phase 2 | Planned | Stripe / Mock Adapter | Test mode checkout sessions & billing portal |
| **Billing & Plans** | Webhook Subscription Sync | Phase 2 | Planned | Stripe Webhooks | Idempotent event processing, secret verification |
| **Billing & Plans** | Usage Metering & Quota Gate | Phase 2 | Planned | `UsageRecord` Service | Messages, voice seconds, agent limits |
| **Billing & Plans** | Billing & Invoices UI | Phase 2 | Planned | Stripe Invoices API | Grouped inset lists with plan management |
| **Dashboard** | KPI Stat Cards with Deltas | Phase 2 | Planned | API + Seed Data | Conversations, Appointments, Leads, Resolution |
| **Dashboard** | Channel Volume Breakdown Chart | Phase 2 | Planned | Recharts (Stacked Bars) | Web chat, WhatsApp, Voice conversation trends |
| **Dashboard** | Recent Conversations Feed | Phase 2 | Planned | API + Seed Data | Preview threads with lead status pills |
| **Dashboard** | Top Customer Questions | Phase 2 | Planned | API + Seed Data | Ranked frequent customer queries |
| **Agent Studio** | Agent List & Creation Sheet | Phase 3 | Planned | Internal API | Scratch or template-based creation |
| **Agent Studio** | Agent Builder (Multi-tab) | Phase 3 | Planned | Internal API | Prompt, Knowledge, Tools, Channels, Settings |
| **Agent Studio** | Versioning & Publish Flow | Phase 3 | Planned | `AgentVersion` Immutable | Draft vs Published state machine |
| **Agent Studio** | Interactive Agent Test Sandbox | Phase 3 | Planned | LLMProvider (Streaming) | Real-time chat with source citations |
| **Knowledge Base** | Document & Web Ingestion | Phase 3 | Planned | BullMQ + Readability/Parsers | URL, sitemap, PDF, DOCX, TXT, CSV, FAQ pairs |
| **Knowledge Base** | Vector Storage & RAG Search | Phase 3 | Planned | PostgreSQL + pgvector (HNSW) | Cosine similarity scoped to workspace + agent |
| **Knowledge Base** | Embedding Pipeline | Phase 3 | Planned | EmbeddingProvider (OpenAI/Gemini/Mock) | 1536-dim vectors with mock deterministic fallback |
| **Templates** | Industry Agent Templates | Phase 3 | Planned | Template Catalog | Healthcare, Restaurant, Real Estate, Home Services |
| **Widget Studio** | Live Visual Inspector | Phase 4 | Planned | `packages/ui` + React Hook Form | Brand, Theme, Background, Launcher, Texts |
| **Widget Studio** | Real Shadow DOM Live Preview | Phase 4 | Planned | `packages/widget` Mount API | Sub-100ms updates, device frames (desktop/mobile) |
| **Widget Studio** | Preset Themes & Auto-Palette | Phase 4 | Planned | OKLCH Color Math | 6 presets (Violet, Glass, Midnight, Mint, Coral, Graphite) |
| **Widget Studio** | Background Shader / Animations | Phase 4 | Planned | CSS / Canvas Canvas2D / SVG | Aurora, Particles, Waves, Bokeh, Gradients |
| **Widget Studio** | Embed Loader (`w.js`) & Runtime | Phase 4 | Planned | Preact + Vite Lib Mode | Bundle budget: loader ≤ 8KB gz, runtime ≤ 45KB gz |
| **Widget Studio** | Allowed Origin & Public Config API | Phase 4 | Planned | Express + ETag / Caching | Origin verification and domain wildcard checking |
| **Channels** | Website Chat Channel Integration | Phase 4 | Planned | Zdoda Widget Endpoint | Snippet generator, allowed domains, live healthcheck |
| **Channels** | WhatsApp Cloud API Integration | Phase 5 | Planned | WhatsAppProvider (Meta / Mock) | Inbound webhook, outbound replies, test sandbox |
| **Channels** | Voice Assistant (Telephony) | Phase 5 | Planned | TelephonyProvider (Twilio / Mock) | Inbound/outbound calling, number configuration |
| **Channels** | Real-time Voice Engine | Phase 5 | Planned | VoiceEngine (STT/TTS/LLM) | Streaming voice pipeline, WebRTC browser test |
| **Phone Numbers** | Number Inventory & Assignment | Phase 5 | Planned | Twilio Phone Numbers API | Purchase, search, porting request form, routing |
| **Integrations** | Pre-built Directory | Phase 5 | Planned | IntegrationProvider | Google Sheets, Calendar, Slack, Make, n8n, CRM |
| **Integrations** | Custom REST API Tool Builder | Phase 5 | Planned | JSON Schema Runner | Encrypted headers, request execution, agent binding |
| **Inbox** | Omnichannel Conversation Inbox | Phase 5 | Planned | WebSocket / SSE + REST | Web, WhatsApp, Voice conversation threads |
| **Inbox** | Human Handoff / Takeover | Phase 5 | Planned | Live Session Controller | Agent pause on human takeover, return to bot |
| **Analytics** | Operational Analytics & Reports | Phase 6 | Planned | SQL Aggregations / Rollups | Conversations, resolution, agent performance, CSV |
| **Team** | Workspace Members & Invitations | Phase 6 | Planned | Email Service (Mailpit / SMTP) | Role assignment, email invites, token expiry |
| **Team** | Activity Audit Log | Phase 6 | Planned | `AuditLog` Table | Immutable record of auth, billing, settings actions |
| **Agency** | Multi-Client Sub-workspaces | Phase 6 | Planned | `parentWorkspaceId` & `ClientAccess` | Agency dashboard, client switching, delegated access |
| **Agency** | White-Label Branding | Phase 6 | Planned | Plan-gated Widget Config | Removal of "Powered by Zdoda" badge |
| **Settings** | App Preferences & Accessibility | Phase 6 | Planned | LocalStorage / User Profile | Reduce transparency, reduce motion, theme switch |
| **Marketing** | Apple-Style Landing Page | Phase 7 | Planned | React 19 + Framer Motion | Signature hero morph, 6-step flow, pricing table |
| **Onboarding** | End-to-End Setup Checklist | Phase 7 | Planned | Progress Persistence | 7-step guided journey from signup to live deploy |
| **Hardening** | Production Security & Performance | Phase 7 | Planned | Helmet, RateLimit, Pino, Vitest | Full test suites, CI checks, OpenAPI documentation |
