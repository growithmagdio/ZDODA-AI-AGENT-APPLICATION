# Progress

## 2026-11-17 — Full plan (`feat/full-plan`)

- **Voice:** Zdoda Voice Engine worker (`apps/voice`, LiveKit Agents: Silero VAD, Deepgram STT, turn detector, Claude/GPT/Gemini, ElevenLabs/Cartesia/OpenAI TTS). Web calls from the widget and the agent builder, phone numbers (Twilio ↔ LiveKit SIP), inbound + outbound calls, transfer, recording, summaries, voice-minute quotas, outbound campaigns.
- **WhatsApp** Cloud API channel with Inbox replies.
- **Agent tools** with function calling: Google Calendar, Google Sheets, GoHighLevel, API request, webhook, MCP.
- **Billing:** Razorpay (INR), voice minutes and number limits per plan.
- **Platform:** agent versions, templates, daily knowledge re-sync, agency sub-accounts + white-label, API keys + REST API, super-admin panel.
- **Fixes:** Tailwind now scans `packages/ui` (dialogs and switches were unstyled), primary is the default button style, CI install fixed.

## 2026-11-03 — Firebase chat MVP (`feat/firebase-chat-mvp`)

Built the full chat product on Firebase, following the product plan (chat first; WhatsApp and voice next).

**Backend (`apps/functions`)**
- Express API on Cloud Functions 2nd gen; Firebase ID-token auth; workspace membership + RBAC on every route.
- Agents, knowledge ingestion (crawl/sitemap/URL/files/text/FAQ) → chunking → embeddings → Firestore vector search.
- Chat engine: grounded prompt with citations, strict-knowledge mode, lead capture, human handoff and takeover, booking link, quotas, usage metering.
- Widgets: drafts, publish versions, restore, asset uploads, public config/chat endpoints with per-widget domain allow-list and rate limits.
- Inbox, leads CSV, analytics, team invites/roles/audit log, Stripe billing (+ demo mode), signed webhooks.
- Firestore + Storage security rules, vector index, `ingestKnowledge` trigger, demo seed, 17 tests.

**Widget (`packages/widget`)** — config-driven Shadow DOM runtime + `zdoda-widget.js` embed loader (history restore, human-reply polling).

**Web (`apps/web`)** — Firebase Auth (email, Google, verify, reset), live dashboard, Agents + builder with test chat, Knowledge Base, Widget Studio with live desktop/mobile preview, Channels/install, Inbox, Analytics, Team, Billing, Tools & Integrations, Settings, invite acceptance.

**Removed** — `apps/api` (Prisma/Postgres) and `packages/db` (see ADR-0012).

**Next** — WhatsApp Cloud API channel, voice engine, native integrations, streaming replies, route-level code splitting.
