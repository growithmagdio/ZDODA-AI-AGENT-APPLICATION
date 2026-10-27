# Architecture Decision Records (ADR) Log

This file is an append-only log of significant technical and architectural decisions for the Zdoda AI Agent platform.

---

## ADR-0001: Adoption of Antigravity Specification and Phased Development

- **Date:** 2026-10-27
- **Status:** Accepted
- **Context:**
  The project requires building a multi-tenant AI-Agent-as-a-Service SaaS ("Zdoda: One Agent. Every Channel.") adhering to strict Apple-inspired UI design principles, rock-solid multi-tenancy, an honesty contract for mock vs. live capabilities, and a no-code Widget Studio featuring an in-situ Shadow DOM preview.
- **Decision:**
  Adopt the 7-phase build plan specified in `ZDODA_ANTIGRAVITY_COMPLETE_PROMPT.md`. Structure instructions into `.agents/rules/` (`01-zdoda-product.md`, `02-design-system-apple.md`, `03-engineering-guardrails.md`, `04-widget-studio.md`) and `.agents/workflows/` (`start-phase.md`, `verify-phase.md`, `design-check.md`) to ensure all subsequent development cycles inherit project guardrails automatically.
- **Consequences:**
  Every phase will be strictly planned and verified before committing or advancing, maintaining an up-to-date `docs/PROGRESS.md` and `docs/FEATURE_STATUS.md`.

---

## ADR-0002: Monorepo Structure (Turborepo + pnpm)

- **Date:** 2026-10-27
- **Status:** Accepted
- **Context:**
  The platform consists of a web dashboard (`apps/web`), an API server (`apps/api`), an embeddable widget runtime (`packages/widget`), a design system (`packages/ui`), a database package (`packages/db`), and shared types/contracts (`packages/shared`).
- **Decision:**
  Use pnpm workspaces with Turborepo for fast caching, deterministic dependency resolution, and clean boundary separation.
- **Consequences:**
  Shared Zod schemas in `packages/shared` act as the single source of truth for API contracts, database DTOs, and widget configurations across both web and widget runtimes.

---

## ADR-0003: Multi-Tenancy Isolation via Prisma Client Extension

- **Date:** 2026-10-27
- **Status:** Accepted
- **Context:**
  SaaS data leakage across workspaces must be strictly prevented at the persistence layer, not left solely to developer memory in route handlers.
- **Decision:**
  Implement a Prisma client extension that intercepts all queries on tenant models and automatically injects/verifies `workspaceId` derived from the authenticated request context (`ctx: { userId, workspaceId, role }`). Any cross-tenant data query attempt returns HTTP 404 rather than 403 to prevent resource existence enumeration.
- **Consequences:**
  Every tenant-owned table must include `workspaceId` in its schema and composite indices.

---

## ADR-0004: Ports & Adapters Architecture for External Providers

- **Date:** 2026-10-27
- **Status:** Accepted
- **Context:**
  The platform interacts with multiple external vendors: LLMs (OpenAI, Gemini, Anthropic), Vector Embeddings, Payments (Stripe), WhatsApp (Meta Cloud API), and Telephony (Twilio). Developers and demo users without active vendor API keys must be able to explore the application realistically without broken UI states.
- **Decision:**
  Every external service is abstracted behind a TypeScript interface with a mock adapter and real provider adapters. Each adapter implements a `healthCheck()` method. The UI utilizes `<StatusPill>` to honestly reflect whether a service is in `Live`, `Test mode`, `Demo`, `Setup required`, or `Coming soon`.
- **Consequences:**
  Zero mock secrets or fake API responses disguised as live traffic. Clear transparency on system state.

---

## ADR-0005: Shadow DOM Isolation for Widget Studio and Embed Runtime

- **Date:** 2026-10-27
- **Status:** Accepted
- **Context:**
  The chat widget must be embeddable on customer websites without external CSS leaking in or widget styles breaking host websites. Additionally, the Widget Studio must render the exact same widget runtime in real-time rather than a mocked React preview.
- **Decision:**
  Build `packages/widget` using Preact in Vite library mode, packaging into an async loader (`w.js`) and a Shadow DOM runtime (`widget.[hash].js`). Expose a programmatic `mountWidget(container, config, { mode })` API returning `{ update, destroy, open, close }`. Widget Studio imports this exact runtime and passes debounced config changes to `update()` for live, flicker-free rendering under 100ms.
- **Consequences:**
  Complete style encapsulation; high fidelity between editor preview and live customer deployment.

---

### ADR-0008: Apple Liquid Glass Landing Page & Non-Overlapping Satellite Architecture

- **Date:** 2026-10-27
- **Status:** Accepted
- **Context:**
  The public landing page required an Apple-inspired Liquid Glass aesthetic featuring a live dashboard mockup (Smile Dental Clinic) and 3 floating integration channel badges (Website Chat, WhatsApp Cloud, Telephony Voice). Prior positioning resulted in badges overlapping dashboard metric cards and conversation previews.
- **Decision:**
  1. Positioned the 3 satellite badges around the outer perimeter of the dashboard card (Website Chat at `-top-5 -right-3`, WhatsApp Cloud at `-bottom-5 -left-3`, and Telephony Voice at `-bottom-5 -right-3`), guaranteeing 100% clearance over all metric cards, workspace titles, and chat bubbles.
  2. Applied Apple-inspired design tokens: exact brand colors (`#6538F5`, `#5B78FF`, `#D946EF`, `#F7F8FF`, `#15153B`), multi-stop gradient on headline, `backdrop-filter: blur(20px)`, realistic soft shadows, and inner glass highlights.
  3. Replaced floating desktop badges with a clean horizontal satellite pill row below the dashboard on tablet portrait and mobile (`< lg`) viewports to prevent viewport clipping and guarantee zero overlap.
- **Consequences:**
  Eliminates visual clutter, preserves complete dashboard legibility, and maintains responsive integrity across all device viewports.

