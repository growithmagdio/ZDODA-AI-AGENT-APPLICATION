# Zdoda Architecture — Top 8 Technical & Operational Risks

This document catalogs the top 8 architectural and deployment risks for the Zdoda AI Agent SaaS platform, along with implemented mitigations and engineering guardrails.

---

### Risk 1: Embeddable Widget Bundle Size & Performance Degradation
- **Risk:** Chat widgets embedded on client sites can bloat page weight, block main-thread rendering, and harm Core Web Vitals (LCP/CLS), causing customers to uninstall the widget.
- **Severity:** Critical
- **Mitigation:**
  1. **Two-Stage Architecture:** A featherweight async loader (`w.js`, ≤ 8 KB gzip) loads asynchronously without render blocking. It checks the origin and fetches widget configuration with `Cache-Control: max-age=60, stale-while-revalidate=600`.
  2. **Lazy-Loaded Preact Runtime:** The full interactive runtime (`widget.[hash].js`, ≤ 45 KB gzip) is only downloaded when the launcher is interacted with or after window `load`.
  3. **Automated Bundle Size Limits:** CI includes `@size-limit/preset-small-lib` enforcing strict thresholds (failure if loader exceeds 8 KB or runtime exceeds 45 KB).

---

### Risk 2: Shadow DOM Font and Asset Isolation Leakage
- **Risk:** Elements rendered inside a closed Shadow DOM do not automatically inherit `@font-face` declarations from the host page. Furthermore, host site CSS resets (e.g. `* { box-sizing: content-box; margin: 0; }`) or high `z-index` overlays can visually break the widget.
- **Severity:** High
- **Mitigation:**
  1. **Injected Font Rules:** The widget injects self-contained `@font-face` or system font stack definitions (`--font-text`) directly into its internal shadow root `<style>` block.
  2. **Scoped Reset & Namespaced CSS Variables:** All internal elements are scoped with CSS custom properties (`--zd-*`) and a robust internal reset.
  3. **Automated Playwright Style Isolation Test:** A dedicated customer fixture test (`embed-test.html`) with aggressive host CSS (`* { font-family: Comic Sans; color: red !important; }`) asserts that host CSS does not alter widget aesthetics and vice versa.

---

### Risk 3: Vector Search (pgvector) Performance Under Multi-Tenant Scale
- **Risk:** As workspaces accumulate thousands of knowledge chunks, unindexed vector cosine similarity searches (`<=>`) will cause slow full-table scans, increasing RAG latency and database CPU usage.
- **Severity:** High
- **Mitigation:**
  1. **Partitioned HNSW Indexing:** Create an HNSW index on `KnowledgeChunk.embedding vector_cosine_ops` with tuned parameters (`m = 16, ef_construction = 64`).
  2. **Strict Compound Filtering:** All retrieval queries filter by `workspace_id` and assigned `source_id` before or alongside vector ranking.
  3. **Atomic Re-indexing & Chunk Purging:** Re-syncing a knowledge source replaces chunks inside a transaction with background queue processing in BullMQ.

---

### Risk 4: Payment Gateway Availability & Compliance (e.g., Stripe in India & International Cards)
- **Risk:** Stripe onboarding in specific jurisdictions (such as India where new merchant signups can be restricted, or e-mandate 3DS requirements) can block real merchant subscriptions.
- **Severity:** Medium / High
- **Mitigation:**
  1. **Provider Port Abstraction:** All checkout and subscription mechanics run through `PaymentProvider`.
  2. **Pluggable Multi-Gateway Architecture:** While Stripe is the primary provider for international SaaS, the interface accommodates Razorpay or PayPal adapters with identical event contracts.
  3. **Self-Contained Mock Adapter:** Local development and preview testing function seamlessly using the Mock Billing Adapter without requiring live Stripe keys.

---

### Risk 5: Meta WhatsApp Cloud API Verification & 24-Hour Session Window
- **Risk:** Meta requires strict business verification and charges for template messages outside the 24-hour customer care window. Unverified businesses have low messaging tier limits (e.g., 250 conversations/day).
- **Severity:** High
- **Mitigation:**
  1. **Honest Setup Guide & Step Checklist:** The Channels screen displays a guided walkthrough sheet outlining Meta App ID setup, System User access tokens, and webhook verification.
  2. **Template Message Support:** Pre-approved WhatsApp HSM templates for outbound proactive alerts and appointment reminders.
  3. **Mock Sandbox Provider:** A complete simulated WhatsApp webhook environment for instant testing and automated regression testing.

---

### Risk 6: Voice Latency in the Streaming Audio Pipeline (STT -> LLM -> TTS)
- **Risk:** Latency exceeding 1.2 seconds in voice calls disrupts conversational flow, causing users to speak over the AI agent.
- **Severity:** Critical
- **Mitigation:**
  1. **Full Audio & Token Streaming:** Twilio Media Streams send 8000Hz mulaw audio chunks via WebSocket directly to a streaming STT engine.
  2. **Early Sentence Chunking:** The LLM stream is chunked at punctuation boundaries (periods, commas, question marks) and piped immediately to streaming TTS (e.g., Cartesia or Deepgram) before the entire response is completed.
  3. **Pluggable In-House Voice Engine:** The `VoiceEngine` interface isolates the telephony layer, allowing Zdoda's upcoming in-house ultra-low latency voice engine to drop in without rewriting call handlers.

---

### Risk 7: Cross-Tenant Data Leakage & ID Enumeration
- **Risk:** Multi-tenant SaaS vulnerabilities where manipulating URL parameters or API payloads accesses another workspace's conversations, knowledge documents, or agent configurations.
- **Severity:** Critical
- **Mitigation:**
  1. **Prisma Client Extension Guard:** Enforces `workspaceId` injection and validation across all tenant models at the ORM layer.
  2. **404 Over 403 Security Policy:** Attempting to query an object belonging to another tenant returns a strict HTTP 404 (Not Found) rather than 403 (Forbidden), completely eliminating identifier enumeration attacks.
  3. **Automated Cross-Tenant Isolation Matrix:** Vitest integration tests verify that User A from Workspace 1 receives 404s for Workspace 2's IDs across every API endpoint.

---

### Risk 8: Live Preview Responsiveness in Widget Studio (Sub-100ms Target)
- **Risk:** If changing a color, radius, or background particle density in Widget Studio causes the iframe or component to re-mount, the canvas will flicker and introduce noticeable UI lag (>500ms).
- **Severity:** High
- **Mitigation:**
  1. **No-Remount `update(config)` API:** The widget exposes `mountWidget(container, config, { mode })` returning an update handle.
  2. **In-Memory Debounced Propagation:** Form inspector modifications in `apps/web` trigger debounced (16ms) in-memory state updates to the Preact Shadow DOM runtime.
  3. **Hardware-Accelerated CSS Transitions:** Background canvas shaders and theme transitions run off the main thread with requestAnimationFrame pausing when the studio tab is inactive.
