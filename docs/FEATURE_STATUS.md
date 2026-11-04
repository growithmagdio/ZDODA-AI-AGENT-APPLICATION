# Zdoda Feature Status Matrix

Honesty contract (Rule 01): the UI shows exactly one of these states for every capability.

- **Live** — real provider with real credentials.
- **Test mode** — real provider in sandbox (e.g. Stripe test keys).
- **Demo** — built-in demo adapter (no key configured). Works, clearly labelled.
- **Setup required** — code exists, configuration missing.
- **Coming soon** — not built yet; never clickable as if it works.

_Last updated: 2026-11-03 (Firebase chat MVP, branch `feat/firebase-chat-mvp`)._

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
| Channels | WhatsApp, Voice AI, Instagram/Messenger, Email | Coming soon | Next release |
| Inbox | Conversations, filters, search, human takeover, hand back, resolve, contact panel | Live | Polling (4–5 s); widget shows human replies |
| Leads | Auto-capture email/phone/name, list, CSV export | Live | |
| Integrations | Signed webhooks for Make / Zapier / n8n / custom (lead captured, handoff, resolved), test event | Live | HMAC-SHA256 `x-zdoda-signature`; secret AES-256-GCM encrypted |
| Integrations | Booking link shared by the agent | Live | Set per agent |
| Integrations | Native Google Calendar, Sheets, Slack, HubSpot, Shopify | Coming soon | Use Make/Zapier meanwhile |
| Billing | Plans, 14-day trial, Stripe Checkout, Customer Portal, webhook sync | Test mode / Live with Stripe keys; Demo without | Demo billing simulates activation, no charge |
| Billing | Monthly message quota + agent limits | Live | Over quota → chat routed to humans |
| Analytics | KPIs with period deltas, daily volume chart, top first questions, per-agent table | Live | Computed from Firestore |
| Phone Numbers | Buy/port numbers | Coming soon | Part of Voice AI |
