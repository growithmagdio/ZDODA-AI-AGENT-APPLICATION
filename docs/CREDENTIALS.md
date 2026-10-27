# Zdoda Credentials & Environment Variable Map

This document catalogs every environment variable, the phase in which it is introduced, and its fallback behavior when credentials have not yet been provided.

---

| Variable | Phase | Purpose | Real Provider | Mock / Unset Behavior |
|---|---|---|---|---|
| `DATABASE_URL` | Phase 1 | Database persistence | PostgreSQL 16 + pgvector | Required for API. Docker container provided. |
| `REDIS_URL` | Phase 1 | Job queue & rate limiting | Redis 7 | In-memory or Docker container provided. |
| `SESSION_SECRET` | Phase 1 | Cookie signing | Crypto string | Required for auth security. |
| `ENCRYPTION_KEY` | Phase 1 | Token encryption at rest | AES-256-GCM (32 bytes) | Generated default in development. |
| `EMAIL_PROVIDER` | Phase 1 | Verification & invite emails | Mailpit (Dev) / Resend | Defaults to Mailpit container (`localhost:8025`). |
| `GOOGLE_CLIENT_ID` | Phase 1 | Social sign-in | Google Cloud Console | Button hidden in UI when missing. |
| `STRIPE_SECRET_KEY` | Phase 2 | Subscription billing | Stripe Dashboard (Test Mode) | Mock Billing Adapter; all plans marked "Demo". |
| `STRIPE_WEBHOOK_SECRET` | Phase 2 | Webhook signature check | Stripe CLI / Webhook endpoint | Webhook events mocked or simulated. |
| `LLM_PROVIDER` | Phase 3 | Agent reasoning & test sandbox | OpenAI / Gemini / Anthropic | Scripted Smile Dental demo replies in test panel. |
| `OPENAI_API_KEY` | Phase 3 | OpenAI model calls | OpenAI Platform | Mock fallback if unset. |
| `EMBEDDING_PROVIDER` | Phase 3 | Chunk vector generation | OpenAI text-embedding-3-small | Deterministic hash vector generator (1536-dim). |
| `STORAGE_PROVIDER` | Phase 3 | File uploads & avatar storage | MinIO / AWS S3 | Local disk storage adapter with static serving. |
| `WHATSAPP_ACCESS_TOKEN` | Phase 5 | WhatsApp messaging | Meta for Developers | WhatsApp panel shows "Setup required". |
| `TWILIO_ACCOUNT_SID` | Phase 5 | Voice telephony | Twilio Console | Voice panel shows "Demo" with transcript mockup. |
| `VOICE_ENGINE_PROVIDER` | Phase 5 | Streaming STT/TTS pipeline | Cartesia / Deepgram / In-house | WebRTC browser test disabled; canned audio demo. |
