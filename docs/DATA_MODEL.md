# Zdoda Data Model Specification

This document outlines the complete data model for **Zdoda — AI Agent Platform**, including tenant scoping, relations, indexing, and compliance with Rule 03 (Engineering Guardrails).

---

## 1. Multi-Tenant Scoping Model

All workspace-owned entities include an indexed `workspaceId` column referencing `Workspace(id)`:
```
Workspace (Root Tenant)
├── Memberships & Permissions
├── ClientAccess (Agency Grants)
├── Subscription, UsageRecords & Invoices
├── Agents, Versions & AgentKnowledge
├── KnowledgeSources & KnowledgeChunks (pgvector)
├── Tools, AgentTools & IntegrationConnections (encrypted)
├── Channels, PhoneNumbers & WidgetConfigs
├── Contacts, Leads, Conversations & Messages
├── CallRecords (Voice Transcripts)
├── OnboardingProgress
└── AuditLogs
```

### Tenancy Isolation Guarantee
1. **Repository & Prisma Extension Layer:** Every tenant query asserts `workspaceId = ctx.workspaceId`.
2. **Cross-Tenant Access Leakage Prevention:** Unauthorized tenant access triggers an immediate HTTP 404 rather than 403, preventing resource enumeration.
3. **Agency Hierarchy:** Workspaces can optionally have a `parentWorkspaceId` designating an agency relationship. Access to child workspaces requires an explicit `ClientAccess` record.

---

## 2. Model Catalog & Definitions

### Identity & Access
- **`User`**: Base user account with argon2id password hash, email verification flag, and global role.
- **`Session`**: Server-side session store with token, expiration, IP, and user-agent metadata.
- **`Workspace`**: Tenant boundary, slug, branding logo, timezone, and optional agency parent reference (`parentWorkspaceId`).
- **`Membership`**: User-to-Workspace association with role (`OWNER`, `ADMIN`, `BUILDER`, `AGENT`, `VIEWER`). Composite unique on `(userId, workspaceId)`.
- **`ClientAccess`**: Delegated access grant permitting an agency user to manage a client workspace.

### Billing, Subscriptions & Metering
- **`Plan`**: System-defined subscription tier (`Starter`, `Pro`, `Business`, `Agency`) with quota definitions and `showPrice` visibility.
- **`Subscription`**: Tenant's Stripe subscription tracking status (`ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`), current period dates, and cancellation state.
- **`UsageRecord`**: Aggregated usage tracking for messages, voice minutes, and active agents per billing period.
- **`Invoice`**: Stripe invoice mirrors for the in-app billing history view.

### AI Agents & Versioning
- **`Agent`**: Core agent entity holding name, personality, instructions, assigned model (OpenAI, Gemini, Anthropic, Mock), temperature, and welcome/fallback responses.
- **`AgentVersion`**: Immutable historical snapshot created upon publishing an agent. Supports rollbacks.
- **`AgentKnowledge`**: Many-to-many junction binding agents to specific knowledge sources.
- **`AgentTool`**: Many-to-many junction binding agents to custom API tools and integrations.

### Knowledge Base & Vector Store
- **`KnowledgeSource`**: Ingested resource (Website URL, Sitemap, PDF, DOCX, FAQ, Text) with lifecycle status (`PENDING`, `PROCESSING`, `ACTIVE`, `FAILED`).
- **`KnowledgeChunk`**: Text segment (~800 tokens, 100 overlap) with pgvector `vector(1536)` embedding and HNSW index.

### Tools & Integrations
- **`IntegrationConnection`**: Connected third-party provider (Google, Slack, HubSpot, Make) with AES-256-GCM encrypted tokens.
- **`Tool`**: Callable tool definition (Custom REST API builder, Function, MCP) with JSON Schema parameters.

### Channels, Widget & Telephony
- **`Channel`**: Channel configuration for Website Chat, WhatsApp, or Voice.
- **`WidgetConfig`**: Live and draft configuration JSON adhering to `WidgetConfigV1`, with public key and domain whitelisting.
- **`WidgetVersion`**: Immutable published version snapshot of the chat widget design.
- **`PhoneNumber`**: Telephony inventory assigned to an agent for inbound/outbound calls.

### Conversations, CRM & Voice
- **`Contact`**: Customer or patient record with name, email, phone, and extracted profile attributes.
- **`Lead`**: CRM qualification record tracking status (`NEW`, `QUALIFIED`, `WON`, `LOST`) and AI summary.
- **`Conversation`**: Multi-channel thread with lifecycle status (`OPEN`, `PENDING`, `RESOLVED`) and human takeover flag.
- **`Message`**: Individual conversational turn (`USER`, `ASSISTANT`, `HUMAN_AGENT`, `SYSTEM`).
- **`CallRecord`**: Voice call metadata, audio recording URL, duration, and full conversation transcript.

### System, Security & Operations
- **`Template`**: Pre-configured agent blueprints for Healthcare/Dental, Restaurants, Real Estate, etc.
- **`OnboardingProgress`**: Tracks completion of the 7-step guided setup flow.
- **`Notification`**: In-app notifications for alerts, usage warnings, and handoff requests.
- **`AuditLog`**: Append-only security audit log recording sensitive administrative events.
- **`ProcessedWebhookEvent`**: Idempotency ledger storing processed webhook event IDs to prevent duplicate actions.
