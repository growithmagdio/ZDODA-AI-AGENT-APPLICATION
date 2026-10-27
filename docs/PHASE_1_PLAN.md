# Implementation Plan — Phase 1: Foundation (Monorepo, Design System, Auth, Workspace, App Shell)

## 1. Executive Summary & Objective
Phase 1 establishes the rock-solid production foundation for **Zdoda — AI Agent Platform**:
1. Configure a high-performance monorepo using **pnpm workspaces** and **Turborepo**.
2. Build the Apple-style design system kit in `packages/ui` and expose the `/design` living style guide.
3. Implement secure multi-tenant authentication (email/password with argon2id, session cookies, rate limiting, and optional Google OAuth).
4. Implement strict database tenancy isolation via a Prisma Client extension enforcing `workspaceId` assertion and returning HTTP 404 for cross-tenant access.
5. Create the responsive Apple-effect app shell with glass chrome, large titles, collapsible macOS sidebar, command palette (⌘K), and mobile drawer/tabs.
6. Seed the primary demo workspace (**Smile Dental Clinic**) and a secondary tenant (**Other Co**) for tenant isolation testing.

---

## 2. Scope & Out of Scope

### In Scope
- **Monorepo Architecture:** `apps/web`, `apps/api`, `packages/shared`, `packages/ui`, `packages/widget` (shell), `packages/db`.
- **Infrastructure:** `docker-compose.yml` defining PostgreSQL 16 + pgvector, Redis, Mailpit, MinIO.
- **Database & Tenancy:**
  - Prisma schema for Core Identity & Tenant models: `User`, `Session`, `Workspace`, `Membership`, `ClientAccess`, `Plan`, `Subscription` (stub), `OnboardingProgress`, `AuditLog`.
  - Migration: `20261027_init_core_tenancy`.
  - Seed script: Smile Dental Clinic + Owner, Other Co + Owner, Dual-member user.
  - Prisma client extension enforcing workspace isolation on all tenant queries.
- **Authentication & Security:**
  - Signup, email verification flow (via Mailpit in dev), login, logout, password reset tokens.
  - httpOnly Secure SameSite=Lax session cookies, CSRF protection, login rate limiting and lockout backoff.
  - Social login: Google sign-in button conditionally rendered only when `GOOGLE_CLIENT_ID` is present.
  - `can(ctx, action, resource)` role-based access module.
- **Design System (`packages/ui`):**
  - Apple design tokens (light/dark, reduced motion, reduced transparency fallbacks).
  - Components: `Button`, `IconButton`, `SegmentedControl`, `Switch`, `TextField`, `Select`, `Sheet`, `Popover`, `Menu`, `Toast`, `StatusPill`, `Card`, `StatCard`, `GroupedList`, `EmptyState`, `Skeleton`, `LargeTitleHeader`, `GlassBar`, `Avatar`, `Badge`, `Tooltip`, `CommandPalette`.
  - Living Styleguide route: `/design`.
- **App Shell & Layout:**
  - macOS-inspired sidebar (grouped into Build, Operate, Account), collapsible to icon rail.
  - Top glass bar with workspace switcher, global search (⌘K), usage meter placeholder ("Demo"), notifications, help, and user profile.
  - Responsive adapters: sheet drawer on tablets (<1024px) and 5-item bottom tab bar on mobile (<640px).
  - Empty states for unbuilt modules with "Coming in Phase N" status pills.
  - Onboarding Steps 1–2 (business details and workspace creation) with state persistence.

### Out of Scope
- Stripe checkout integration, billing invoices, and usage record metering (Phase 2).
- Agent Builder prompt editor, knowledge base ingestion, and RAG vector search (Phase 3).
- Real widget runtime and no-code Widget Studio editor (Phase 4).
- WhatsApp Meta Cloud API, Twilio telephony, and voice streaming engine (Phase 5).
- Analytics SQL aggregations and agency white-label domain configuration (Phase 6).
- Public marketing landing page (Phase 7).

---

## 3. Files & Packages to Touch

| Package / App | Key Paths | Purpose |
|---|---|---|
| **Root** | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `docker-compose.yml`, `README.md` | Workspace coordination, scripts, Docker setup |
| `packages/shared` | `src/types/`, `src/schemas/auth.ts`, `src/schemas/workspace.ts`, `src/index.ts` | Zod contracts for auth, session, and workspace DTOs |
| `packages/db` | `prisma/schema.prisma`, `prisma/migrations/`, `src/client.ts`, `src/seed.ts` | Tenancy extension, DB connection, seed runner |
| `packages/ui` | `src/components/`, `src/tokens/`, `src/styles/glass.css`, `src/index.ts` | Component library kit & CSS variables |
| `packages/widget` | `package.json`, `src/index.ts` | Package shell ready for Phase 4 |
| `apps/api` | `src/server.ts`, `src/middleware/`, `src/routes/`, `src/services/`, `src/lib/can.ts` | Express API, auth handlers, tenancy middleware |
| `apps/web` | `src/App.tsx`, `src/routes/`, `src/components/shell/`, `src/pages/design/` | React app shell, auth screens, `/design` styleguide |

---

## 4. API Endpoints to Implement

### Auth (`/api/v1/auth`)
- `POST /api/v1/auth/signup` — Create account, trigger email verification.
- `POST /api/v1/auth/login` — Authenticate, set session cookie.
- `POST /api/v1/auth/logout` — Revoke session, clear cookie.
- `GET /api/v1/auth/me` — Return authenticated user and workspace memberships.
- `POST /api/v1/auth/verify-email` — Verify email token.
- `POST /api/v1/auth/forgot-password` — Request password reset email.
- `POST /api/v1/auth/reset-password` — Validate reset token and update password.

### Workspaces (`/api/v1/workspaces`)
- `GET /api/v1/workspaces` — List workspaces current user has access to.
- `POST /api/v1/workspaces` — Create new workspace (Onboarding Step 2).
- `GET /api/v1/workspaces/:id` — Get workspace details (requires membership; 404 otherwise).
- `GET /api/v1/workspaces/:id/onboarding` — Retrieve onboarding progress.
- `PATCH /api/v1/workspaces/:id/onboarding` — Update onboarding step.

---

## 5. Providers & Mock Adapters
- **EmailProvider:** Mailpit adapter enabled by default (`localhost:1025`) for viewing verification and password reset emails locally at `http://localhost:8025`.
- **Google OAuth:** Configured dynamically; button rendered only when `GOOGLE_CLIENT_ID` exists in environment.

---

## 6. Definition of Done (copied from PROMPTS_PHASES.md)
1. Fresh clone → `pnpm i && docker compose up -d && pnpm db:migrate && pnpm db:seed && pnpm dev` works, documented in README.
2. Signup → verify email (via mailpit) → onboarding → app shell, on desktop and 390px mobile.
3. Password reset works end to end; reused or expired tokens are rejected.
4. User of "Other Co" gets 404 for Smile Dental workspace routes and API IDs (automated test).
5. `/design` shows all components; light/dark and reduced-transparency look correct.
6. Lighthouse accessibility ≥ 95 on login and dashboard shell.
