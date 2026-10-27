# Zdoda System Architecture

This document describes the high-level system architecture, monorepo package layout, data flow sequences, and provider abstractions for **Zdoda: One Agent. Every Channel.**

---

## 1. Monorepo Organization & Rationale

Zdoda is structured as a pnpm workspace orchestrated by Turborepo:

```
zdoda/
├── apps/
│   ├── web/               # Customer dashboard, admin app, landing page (React 19, Vite, Tailwind v4)
│   └── api/               # REST API & WebSocket/SSE server (Node, Express, TypeScript, Prisma)
├── packages/
│   ├── shared/            # Zod schemas, TypeScript contracts, WidgetConfig, plan quotas
│   ├── ui/                # Apple-inspired design system kit (Radix, Tailwind v4, Lucide, Motion)
│   ├── widget/            # Embeddable chat widget runtime (Preact, Shadow DOM, lib mode build)
│   └── db/                # Prisma schema, migrations, seed scripts, client extensions
├── docs/                  # Architectural specs, data models, progress, guides
├── .agents/               # Antigravity rules and phase execution workflows
├── docker-compose.yml     # Local services: PostgreSQL + pgvector, Redis, Mailpit, MinIO
└── turbo.json             # Monorepo build and pipeline cache configurations
```

### Rationale
- **Single Source of Truth (`packages/shared`):** The `WidgetConfigV1` and DTO schemas are imported directly by `apps/web` (studio form), `packages/widget` (runtime renderer), and `apps/api` (validation & storage). Contract mismatches are caught at compile time.
- **Shared UI Kit (`packages/ui`):** Enforces the Apple two-layer design language (opaque content layer + glass functional layer) across the entire customer web app.
- **Zero-Dependency Widget Runtime (`packages/widget`):** Built with Preact for maximum lightweight performance (loader ≤ 8 KB gzip, runtime ≤ 45 KB gzip). Rendered inside a closed Shadow DOM to guarantee zero CSS collisions with host websites.
- **Unified Tenancy & Database (`packages/db`):** Centralizes the Prisma client extension enforcing workspace isolation across all API endpoints.

---

## 2. System Flow Diagrams (Mermaid)

### Flow 1: Tenant-Scoped Dashboard Request

```mermaid
sequenceDiagram
    autonumber
    actor User as Authenticated User
    participant Browser as apps/web (React)
    participant AuthMW as Auth & Context Middleware
    participant CanAuth as can() Permission Engine
    participant PrismaExt as Prisma Tenant Extension
    participant DB as PostgreSQL 16

    User->>Browser: Opens /dashboard
    Browser->>AuthMW: GET /api/v1/dashboard/metrics<br/>Cookie: session_id, Header: X-Workspace-Id
    AuthMW->>AuthMW: Validate session cookie
    AuthMW->>AuthMW: Verify user membership in workspace
    alt Invalid Workspace or No Membership
        AuthMW-->>Browser: 404 Not Found (Leak Prevention)
    else Valid Tenant Session
        AuthMW->>CanAuth: can(ctx, "read", "Dashboard")
        CanAuth-->>AuthMW: Allow
        AuthMW->>PrismaExt: ctx = { userId, workspaceId, role }
        PrismaExt->>DB: SELECT metrics WHERE workspace_id = $workspaceId
        DB-->>PrismaExt: Scoped Rows
        PrismaExt-->>Browser: 200 OK { conversations, leads, resolutionRate, delta }
    end
```

---

### Flow 2: Chat Widget Load on Customer Site

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Customer Site Visitor
    participant HostPage as Customer Website (Host DOM)
    participant Loader as w.js (Loader Script)
    participant API as apps/api (/public/widgets)
    participant CDN as Widget CDN / Static Host
    participant Runtime as widget.js (Preact Shadow Root)

    HostPage->>Loader: <script async src=".../w.js" data-zdoda="wk_pub_123">
    Loader->>API: GET /api/v1/public/widgets/wk_pub_123/config<br/>Origin: https://smiledental.com
    API->>API: Verify Origin matches widget.allowedDomains
    alt Origin Unauthorized
        API-->>Loader: 403 Forbidden
        Loader-->>HostPage: Console warning, no DOM injected
    else Origin Authorized
        API-->>Loader: 200 OK (WidgetConfig JSON, ETag, Cache-Control: 60s)
        Loader->>CDN: Lazy fetch widget.[hash].js
        CDN-->>Loader: Runtime Bundle
        Loader->>HostPage: Attach element with Shadow DOM (mode: "closed")
        Loader->>Runtime: mountWidget(shadowRoot, config, { mode: "live" })
        Runtime-->>HostPage: Render Launcher Button (isolated styles, --zd-* variables)
    end
```

---

### Flow 3: RAG Ingestion and Answering Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Business Owner
    participant Web as apps/web
    participant API as apps/api
    participant Redis as BullMQ Ingestion Queue
    participant Worker as Background Ingestion Worker
    participant Embedder as EmbeddingProvider (OpenAI / Mock)
    participant PGVector as PostgreSQL (pgvector HNSW)
    actor Visitor as Chat Visitor
    participant LLM as LLMProvider (Streaming)

    Admin->>Web: Uploads "Clinic Brochure PDF" or Website URL
    Web->>API: POST /api/v1/knowledge/sources
    API->>Redis: Enqueue job { sourceId, workspaceId, type, payload }
    API-->>Web: Source Status: "Pending"
    Worker->>Redis: Dequeue job
    Worker->>Worker: Update status: "Processing"
    Worker->>Worker: Extract text, clean markup, chunk (~800 tokens, 100 overlap)
    Worker->>Embedder: embedBatch(chunks.map(c => c.content))
    Embedder-->>Worker: Vectors (1536-dim)
    Worker->>PGVector: INSERT INTO knowledge_chunks (workspace_id, source_id, content, embedding)
    Worker->>Worker: Update status: "Active" (chunks_count = N)
    
    Note over Visitor,LLM: Runtime Answering Flow
    Visitor->>API: POST /api/v1/public/chat/messages { query: "What are your root canal prices?" }
    API->>Embedder: embed(query)
    Embedder-->>API: Query Vector
    API->>PGVector: SELECT content, 1 - (embedding <=> query_vector) AS score<br/>WHERE workspace_id = $ws AND source_id IN ($agentSources)<br/>ORDER BY score DESC LIMIT 5
    PGVector-->>API: Top Retrieved Chunks
    API->>LLM: streamGenerate({ system: agent.instructions, context: chunks, history, query })
    LLM-->>Visitor: Streaming answer tokens + cited source titles
```

---

### Flow 4: Stripe Checkout, Webhook & Subscription Sync

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Business Owner
    participant Web as apps/web (Pricing / Billing)
    participant API as apps/api
    participant Stripe as Stripe API & Checkout
    participant WebhookMW as Stripe Webhook Receiver
    participant BullMQ as Webhook Job Queue
    participant DB as PostgreSQL

    Admin->>Web: Selects "Pro Plan ($99/mo)" -> Click Subscribe
    Web->>API: POST /api/v1/billing/checkout-session { planId: "plan_pro" }
    API->>Stripe: stripe.checkout.sessions.create(customer, line_items, metadata: { workspaceId })
    Stripe-->>API: { url: "https://checkout.stripe.com/..." }
    API-->>Web: Redirect to Stripe URL
    Admin->>Stripe: Enters test card 4242... and completes payment
    Stripe-->>Web: Redirects to /billing?session_id=cs_test_... (Status remains Demo/Pending until Webhook)
    Stripe->>WebhookMW: POST /api/v1/webhooks/stripe (raw body + Stripe-Signature)
    WebhookMW->>WebhookMW: Verify signature (STRIPE_WEBHOOK_SECRET)
    WebhookMW->>DB: Check processed_webhook_events (Idempotency)
    WebhookMW->>BullMQ: Enqueue verified event { type: "customer.subscription.created", data }
    WebhookMW-->>Stripe: 200 OK (Received)
    BullMQ->>DB: Upsert Subscription { workspace_id, stripe_subscription_id, status: "active", plan_id }
    BullMQ->>DB: Record AuditLog { action: "subscription.activated", workspace_id }
    Web->>API: GET /api/v1/billing/current
    API-->>Web: 200 OK { plan: "Pro", status: "Active" (StatusPill: Live) }
```

---

### Flow 5: WhatsApp Inbound Webhook -> Agent -> Reply

```mermaid
sequenceDiagram
    autonumber
    actor Customer as WhatsApp User
    participant Meta as Meta WhatsApp Cloud API
    participant Webhook as apps/api /webhooks/whatsapp
    participant Ingestion as WhatsApp Receiver Worker
    participant AgentEngine as Agent Reasoning Engine
    participant DB as PostgreSQL
    participant MetaOut as WhatsAppProvider.sendMessage()

    Customer->>Meta: "Hi, I need an appointment tomorrow at 10 AM"
    Meta->>Webhook: POST /api/v1/webhooks/whatsapp (X-Hub-Signature-256)
    Webhook->>Webhook: Verify signature against WHATSAPP_APP_SECRET
    Webhook-->>Meta: 200 OK (Fast ack)
    Webhook->>Ingestion: Process inbound payload
    Ingestion->>DB: Find Channel by phone_number_id -> Resolve workspace_id & agent_id
    Ingestion->>DB: Upsert Contact { phone, name } & Conversation { channel: "whatsapp" }
    Ingestion->>DB: Store inbound Message { role: "user", content: "..." }
    Ingestion->>AgentEngine: executeAgentTurn({ conversationId, text, agentId })
    AgentEngine->>AgentEngine: Check quota (UsageRecord messages < planLimit)
    AgentEngine->>AgentEngine: Run RAG lookup & generate reply
    AgentEngine->>DB: Store outbound Message { role: "assistant", content: "..." }
    AgentEngine->>MetaOut: POST https://graph.facebook.com/v21.0/{phone_id}/messages
    MetaOut-->>Customer: WhatsApp Message Received
```

---

### Flow 6: Voice Call Pipeline (Twilio -> STT -> Agent -> TTS)

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Phone Caller
    participant Twilio as Twilio Voice Gateway
    participant Webhook as apps/api /webhooks/twilio/voice
    participant MediaWS as WebSocket /media-stream
    participant STT as VoiceEngine (Streaming STT)
    participant Agent as Agent Execution Engine
    participant TTS as VoiceEngine (Streaming TTS)

    Caller->>Twilio: Calls Clinic Inbound Number (+1-555-SMILE)
    Twilio->>Webhook: POST /api/v1/webhooks/twilio/voice (twilio-signature)
    Webhook->>Webhook: Validate signature
    Webhook-->>Twilio: TwiML <Connect><Stream url="wss://zdoda.app/media-stream" /></Connect>
    Twilio->>MediaWS: WebSocket Connected (Audio stream, 8000Hz mulaw)
    MediaWS->>STT: Stream audio chunks
    STT-->>MediaWS: Transcript: "Do you have any openings on Friday?"
    MediaWS->>Agent: Generate response with RAG
    Agent-->>MediaWS: "Yes, we have an appointment available at 2 PM on Friday."
    MediaWS->>TTS: Synthesize audio stream (mulaw 8000Hz)
    TTS-->>MediaWS: Audio buffer chunks
    MediaWS-->>Twilio: Send media frames back to caller
    Twilio-->>Caller: Natural voice audio playback
```

---

## 3. Provider Interfaces & Port-Adapter Architecture

All external integrations adhere to port-and-adapter interfaces located in `apps/api/src/providers/`.

### 1. LLMProvider (`apps/api/src/providers/llm/`)
```typescript
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onToolCall?: (toolCall: { id: string; name: string; arguments: string }) => void;
  onFinish?: (usage: { promptTokens: number; completionTokens: number }) => void;
  onError?: (err: Error) => void;
}

export interface LLMProvider {
  name: 'openai' | 'gemini' | 'anthropic' | 'mock';
  generateText(messages: LLMMessage[], options?: { temperature?: number; model?: string }): Promise<string>;
  streamText(messages: LLMMessage[], callbacks: StreamCallbacks, options?: { temperature?: number; model?: string }): Promise<void>;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}
```

### 2. EmbeddingProvider (`apps/api/src/providers/embedding/`)
```typescript
export interface EmbeddingProvider {
  name: 'openai' | 'gemini' | 'mock';
  dimensions: number; // 1536 for OpenAI / pgvector
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}
```

### 3. PaymentProvider (`apps/api/src/providers/payment/`)
```typescript
export interface CheckoutSessionOptions {
  workspaceId: string;
  planId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentProvider {
  name: 'stripe' | 'mock';
  createCustomer(workspaceId: string, email: string, name: string): Promise<string>;
  createCheckoutSession(opts: CheckoutSessionOptions): Promise<{ url: string; sessionId: string }>;
  createCustomerPortalSession(stripeCustomerId: string, returnUrl: string): Promise<{ url: string }>;
  cancelSubscription(subscriptionId: string, atPeriodEnd: boolean): Promise<void>;
  resumeSubscription(subscriptionId: string): Promise<void>;
  listInvoices(stripeCustomerId: string): Promise<Array<{ id: string; amount: number; status: string; date: Date; pdfUrl?: string }>>;
  verifyWebhookSignature(rawBody: Buffer, signature: string): Promise<any>;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}
```

### 4. WhatsAppProvider (`apps/api/src/providers/whatsapp/`)
```typescript
export interface WhatsAppProvider {
  name: 'meta-cloud' | 'mock';
  sendMessage(toPhone: string, text: string, options?: { previewUrl?: boolean }): Promise<{ messageId: string }>;
  sendTemplate(toPhone: string, templateName: string, language: string, components: any[]): Promise<{ messageId: string }>;
  verifyWebhook(hubMode: string, hubToken: string, verifyToken: string): boolean;
  verifySignature(rawBody: Buffer, signature: string): boolean;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}
```

### 5. TelephonyProvider (`apps/api/src/providers/telephony/`)
```typescript
export interface TelephonyProvider {
  name: 'twilio' | 'mock';
  initiateCall(from: string, to: string, twimlUrl: string): Promise<{ callSid: string }>;
  listAvailableNumbers(countryCode: string, areaCode?: string): Promise<Array<{ phoneNumber: string; friendlyName: string }>>;
  purchaseNumber(phoneNumber: string): Promise<{ sid: string; phoneNumber: string }>;
  verifyWebhookSignature(url: string, params: Record<string, any>, signature: string): boolean;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}
```

### 6. VoiceEngine (`apps/api/src/providers/voice/`)
```typescript
export interface VoiceEngine {
  name: 'pluggable-voice-engine' | 'mock';
  transcribeStream(audioStream: NodeJS.ReadableStream): AsyncIterable<string>;
  synthesizeStream(textStream: AsyncIterable<string>, voiceOptions: { voiceId: string; rate?: number }): NodeJS.ReadableStream;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}
```

### 7. StorageProvider (`apps/api/src/providers/storage/`)
```typescript
export interface StorageProvider {
  name: 's3' | 'minio' | 'local';
  upload(key: string, buffer: Buffer, mimeType: string): Promise<{ url: string; key: string }>;
  getSignedDownloadUrl(key: string, expiresInSec?: number): Promise<string>;
  delete(key: string): Promise<void>;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}
```

### 8. EmailProvider (`apps/api/src/providers/email/`)
```typescript
export interface EmailProvider {
  name: 'smtp' | 'resend' | 'mailpit';
  send(opts: { to: string; subject: string; html: string; text?: string }): Promise<{ messageId: string }>;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}
```

### 9. IntegrationProvider (`apps/api/src/providers/integrations/`)
```typescript
export interface IntegrationProvider {
  name: string; // 'google-calendar' | 'slack' | 'hubspot' | 'make'
  testConnection(encryptedTokens: string): Promise<{ ok: boolean; accountName?: string; error?: string }>;
  executeAction(actionName: string, params: Record<string, any>, tokens: string): Promise<any>;
}
```
