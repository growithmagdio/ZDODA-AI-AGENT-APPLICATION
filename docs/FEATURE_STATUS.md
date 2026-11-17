# Zdoda Feature Status Matrix

Honesty contract (Rule 01): the UI shows exactly one of these states for every capability.

- **Live** — real provider with real credentials.
- **Test mode** — real provider in sandbox (e.g. Stripe test keys).
- **Demo** — built-in demo adapter (no key configured). Works, clearly labelled.
- **Setup required** — code exists, configuration missing.
- **Coming soon** — not built yet; never clickable as if it works.

_Last updated: 2026-11-17 (full plan, branch `feat/full-plan`)._

| Area | Feature | Status | Provider / notes |
|---|---|---|---|
| Auth | Email + password, verification, password reset | Live (with Firebase project) | Firebase Auth; action links handled at `/auth/action` |
| Auth | Google sign-in | Live once enabled in Firebase Console | `VITE_ENABLE_GOOGLE_SIGNIN=false` hides it |
| Tenancy | Workspaces, membership check on every request, RBAC (`can()`) | Live | Firestore `memberships`; cross-tenant → 404 |
| Team | Invites (link + optional email), roles, remove/leave, audit log | Live | Email via Resend when `RESEND_API_KEY` is set, otherwise copy the link |
| Agents | Create/duplicate/delete, instructions, language, greeting, fallback, publish/unpublish | Live | Plan agent limits enforced |
| Agents | Model choice: Claude, GPT, Gemini, custom model ID | Live with a key / Demo without | Demo model answers extractively from the knowledge base |
| Agents | Test chat with citations | Live | Not counted in usage |
| Knowledge | Website (sitemap or crawl), single page, PDF/DOCX/TXT/MD/CSV/HTML upload, text, FAQ | Live | SSRF guard; 50-page crawl cap; 20 MB uploads |
| Knowledge | Embeddings + vector search | Live with OpenAI/Gemini key / Demo (keyword hashing) | Firestore KNN, 768 dims, cosine |
| Knowledge | Retrieval tester, chunk viewer, re-index | Live | |
| Widget Studio | Brand, avatar/logo/header image upload, 6 presets, custom colors, light/dark/auto, fonts, radius, density | Live | Real runtime in preview (Shadow DOM) |
| Widget Studio | Backgrounds: solid, gradient, aurora, bokeh, waves, particles, image, video | Live | Lottie: Coming soon |
| Widget Studio | Launcher style/shape/icon/position/size/offset/entrance/glass/badge | Live | |
| Widget Studio | Layouts: bubble, popup, side panel, full page, inline | Live | |
| Widget Studio | Draft / publish / version history / restore | Live | White-label needs Business plan (enforced on publish) |
| Channels | Website chat embed (one script tag) + allowed domains | Live | `zdoda-widget.js` |
| Channels | WhatsApp Business (Meta Cloud API): connect, AI replies, human replies from Inbox | Live with Meta app + token | Signed webhook (META_APP_SECRET) |
| Voice | Zdoda Voice Engine on LiveKit: web calls (widget + builder test), inbound & outbound phone calls, barge-in, knowledge, tools, transfer, hang-up, recording, summary | Live with LiveKit + Deepgram + voice + LLM keys | Worker in `apps/voice` (Cloud Run) |
| Voice | Phone numbers: search, buy, assign, release (Twilio ↔ LiveKit SIP) | Live with Twilio + one-time admin setup | |
| Voice | Outbound campaigns: CSV contacts, calling window, concurrency, retries, consent check | Live (Business+) | Scheduled dialer every minute |
| Channels | Instagram/Messenger, Email, Telegram, SMS | Coming soon | |
| Inbox | Conversations, filters, search, human takeover, hand back, resolve, contact panel | Live | Polling (4–5 s); widget shows human replies |
| Leads | Auto-capture email/phone/name, list, CSV export | Live | |
| Integrations | Signed webhooks for Make / Zapier / n8n / custom (lead captured, handoff, resolved), test event | Live | HMAC-SHA256 `x-zdoda-signature`; secret AES-256-GCM encrypted |
| Integrations | Booking link shared by the agent | Live | Set per agent |
| Agent tools | Function calling for Claude/GPT/Gemini: Google Calendar booking, Google Sheets, GoHighLevel, API request, webhook, MCP servers | Live (Google tools need GOOGLE_CLIENT_ID/SECRET) | Shared by chat and voice |
| Integrations | Native Slack, HubSpot, Shopify | Coming soon | Use Make/Zapier/n8n or the API request tool |
| Billing | Plans, 14-day trial, Stripe Checkout, Customer Portal, webhook sync | Test mode / Live with Stripe keys; Demo without | Demo billing simulates activation, no charge |
| Billing | Monthly message quota + agent limits | Live | Over quota → chat routed to humans |
| Analytics | KPIs with period deltas, daily volume chart, top first questions, per-agent table | Live | Computed from Firestore |
| Billing | Razorpay (INR, UPI/cards) subscriptions + webhook | Live with Razorpay keys | Stripe for other currencies |
| Platform | Agent version history + restore, industry templates, daily knowledge re-sync | Live | |
| Platform | Agency: client sub-workspaces, white-label branding, usage per client | Live (Agency plan) | Custom domain needs a Hosting domain |
| Platform | API keys + public REST API (agents, messages, conversations, leads, calls) | Live (Business+) | |
| Platform | Super-admin panel: all workspaces, MRR, usage, plan overrides, telephony setup | Live (SUPERADMIN_EMAILS) | |
| Platform | Number porting, SSO, visual workflow canvas, A/B widget designs, voicemail detection, squads | Coming soon | V3 items in the plan |
