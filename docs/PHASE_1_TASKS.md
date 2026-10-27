# Task List — Phase 1: Foundation Build Order

Tasks are organized strictly in sequential dependency order: Schema & Infra -> Shared Contracts -> Backend API & Tenancy -> Design System Kit -> Web App Shell & Auth UI -> Verification Tests.

---

### Step 1: Monorepo & Infrastructure Scaffold
- [ ] **Task 1.1:** Initialize monorepo root: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, and `.gitignore`.
- [ ] **Task 1.2:** Configure `docker-compose.yml` with PostgreSQL 16 + pgvector, Redis 7, Mailpit, and MinIO.
- [ ] **Task 1.3:** Setup TypeScript root configs (`tsconfig.base.json`) with `strict: true`.
- [ ] **Task 1.4:** Scaffold directory shells: `apps/web`, `apps/api`, `packages/shared`, `packages/ui`, `packages/db`, `packages/widget`.

---

### Step 2: Shared Contracts & DB Tenancy (`packages/shared` & `packages/db`)
- [ ] **Task 2.1:** Define Zod schemas and TypeScript types in `packages/shared`:
  - `UserSchema`, `SignupInput`, `LoginInput`, `PasswordResetInput`
  - `WorkspaceSchema`, `CreateWorkspaceInput`, `WorkspaceRoleEnum`
  - `OnboardingProgressSchema`
- [ ] **Task 2.2:** Configure `packages/db` with Prisma schema for Phase 1 models:
  - `User`, `Session`, `Workspace`, `Membership`, `ClientAccess`, `Plan`, `Subscription` (stub), `OnboardingProgress`, `AuditLog`.
- [ ] **Task 2.3:** Implement the Prisma Client Extension in `packages/db/src/client.ts` to enforce `workspaceId` assertion on all tenant-owned queries.
- [ ] **Task 2.4:** Write the database seed script in `packages/db/src/seed.ts`:
  - Plan records (Starter, Pro, Business, Agency).
  - Primary demo tenant: **Smile Dental Clinic** + Owner User (`owner@smiledental.com`).
  - Secondary isolation test tenant: **Other Co** + Owner User (`owner@otherco.com`).
  - Dual-membership user (`shared@agency.com`) belonging to both workspaces.

---

### Step 3: Backend API, Auth & Tenancy Middleware (`apps/api`)
- [ ] **Task 3.1:** Setup Express server with TypeScript, Helmet, JSON parser, cookieParser, CORS, and request ID logging (Pino).
- [ ] **Task 3.2:** Implement authentication service with `argon2id` password hashing, token generation, and rate limiting.
- [ ] **Task 3.3:** Implement tenancy resolution middleware:
  - Read session cookie + `X-Workspace-Id` header.
  - Verify membership in DB; attach `ctx: { userId, workspaceId, role }` to request.
  - Return HTTP 404 on invalid or unpermitted workspace requests (leak prevention).
- [ ] **Task 3.4:** Implement `can(ctx, action, resource)` permission checking module.
- [ ] **Task 3.5:** Implement Auth routes under `/api/v1/auth`:
  - Signup, login, logout, me, verify-email, forgot-password, reset-password.
- [ ] **Task 3.6:** Implement Workspace routes under `/api/v1/workspaces`:
  - List user workspaces, create workspace, get workspace, onboarding progress GET/PATCH.
- [ ] **Task 3.7:** Integrate Mailpit email provider adapter for verification and reset emails.

---

### Step 4: Design System Component Kit (`packages/ui`)
- [ ] **Task 4.1:** Configure Tailwind CSS v4 and CSS tokens from Rule 02 (`:root` & `[data-theme="dark"]`).
- [ ] **Task 4.2:** Implement glass utilities with `@media (prefers-reduced-transparency: reduce)` and `data-reduce-transparency` attribute support.
- [ ] **Task 4.3:** Build core controls:
  - `Button` (primary accent, secondary, ghost, destructive with confirm sheet).
  - `IconButton` (44px touch target, 28px pointer target).
  - `SegmentedControl` (spring sliding pill).
  - `Switch` (iOS style toggle).
  - `TextField` and `Select`.
- [ ] **Task 4.4:** Build spatial & feedback components:
  - `StatusPill` (Live, Test mode, Demo, Setup required, Coming soon with icons).
  - `Card`, `StatCard` (tabular numerals, demo data badges).
  - `Sheet` (bottom sheet on mobile, centered 24px-radius on desktop).
  - `Popover`, `Menu`, `Toast` (with action echo).
  - `GroupedList` (inset list styling).
  - `EmptyState` and `Skeleton` loaders.
- [ ] **Task 4.5:** Build navigation components:
  - `LargeTitleHeader` (34px collapsing to 17px glass bar).
  - `GlassBar` and `CommandPalette` (⌘K).

---

### Step 5: Web Application Shell & Authentication Flow (`apps/web`)
- [ ] **Task 5.1:** Setup Vite + React 19 + React Router v7 + TanStack Query.
- [ ] **Task 5.2:** Build the `/design` living styleguide displaying every component in all states (light/dark, reduced motion/transparency).
- [ ] **Task 5.3:** Build Auth pages:
  - Login, Signup, Verify Email, Forgot Password, Reset Password.
  - Dynamic Google sign-in button (rendered only when configured).
- [ ] **Task 5.4:** Build App Shell:
  - macOS-inspired sidebar with grouped sections (Build, Operate, Account).
  - Collapsible icon rail toggle.
  - Glass top bar: Workspace switcher dropdown, ⌘K search, Demo usage meter, notifications popover, profile menu.
  - Responsive adapters: sheet drawer (<1024px) and bottom tab bar (<640px).
- [ ] **Task 5.5:** Implement Onboarding Sheet flow (Steps 1 & 2: Business Info & Workspace Setup).
- [ ] **Task 5.6:** Route all unbuilt sidebar destinations to designed `EmptyState` pages with "Coming in Phase N" status pills.

---

### Step 6: Automated Verification & Audit
- [ ] **Task 6.1:** Run `pnpm typecheck`, `pnpm lint`, and unit tests.
- [ ] **Task 6.2:** Vitest multi-tenant isolation tests: assert that user of Other Co receives 404 when querying Smile Dental IDs.
- [ ] **Task 6.3:** End-to-end auth test: signup -> email verification in Mailpit -> login -> onboarding -> app shell.
- [ ] **Task 6.4:** Browser subagent audit at 1440px, 768px, and 390px in light and dark mode.
- [ ] **Task 6.5:** Generate Phase 1 Walkthrough artifact and update `docs/PROGRESS.md`.
