# Zdoda — AI agents for every business

One agent, every channel. Businesses train an AI agent on their website and documents, style a chat widget in **Widget Studio**, paste one line of code, and manage conversations, leads and handoffs from one inbox. Monthly subscription (Starter $49 · Pro $99 · Business $199 · Agency).

This repo is the **chat MVP on Firebase**. WhatsApp and Voice AI are the next releases.

## What's inside

```
apps/web          React 19 + Vite dashboard (Firebase Auth, TanStack Query, Tailwind v4)
apps/functions    API: Express on Cloud Functions 2nd gen + Firestore + Storage + ingestion trigger
packages/widget   Shadow-DOM chat widget runtime + zdoda-widget.js embed loader
packages/shared   Zod schemas & types shared by all apps (WidgetConfigV1, plans, DTOs)
packages/ui       Apple-inspired design system
firebase/         Firestore & Storage rules, indexes (incl. 768-dim vector index)
docs/             Architecture, decisions (ADR-0012 = Firebase), feature status, credentials
```

How a chat works: visitor message → `POST /api/v1/public/widgets/:id/chat` → domain allow-list + rate limit + plan quota → Firestore vector search over the knowledge base → LLM with a grounded prompt → answer with citations, lead capture, or handoff to a human in the Inbox.

## Run locally

Requirements: Node 22, pnpm 10+, and `npm i -g firebase-tools`.

```bash
pnpm install
cp .env.example .env          # optional: add AI / Stripe keys
```

**Option A — no Java needed (fastest):**

```bash
pnpm dev:local
```

Starts the Auth emulator, seeds the **Smile Dental Clinic** demo, then runs the API (in-memory Firestore persisted to `apps/functions/.emulator-data`) and the web app.
Open http://localhost:5173 and sign in with `owner@smiledental.com` / `Password123!`.

**Option B — full Firebase Emulator Suite (needs Java 11+):**

```bash
pnpm emulators                              # terminal 1
pnpm seed && pnpm --filter @zdoda/functions dev   # terminal 2
pnpm --filter @zdoda/web dev                # terminal 3
```

Without any API keys everything works in clearly-labelled **demo mode**: the demo model answers by quoting your knowledge base, search is keyword-based, and billing is simulated.

### Tests

```bash
firebase emulators:start --only auth --project demo-zdoda &   # tests use the Auth emulator
pnpm --filter @zdoda/functions test
pnpm typecheck
```

## Deploy automatically (GitHub Actions)

`.github/workflows/deploy.yml` tests and deploys to Firebase on every push to `main` (or run it from the Actions tab). Add these repo secrets (Settings → Secrets and variables → Actions):

| Secret | Required | Value |
|---|---|---|
| `FIREBASE_PROJECT_ID` | yes | e.g. `zdoda-app` |
| `FIREBASE_SERVICE_ACCOUNT` | yes | full JSON key of a service account with Editor, Firebase Admin, Secret Manager Admin, Service Account User |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID` | yes | from the Firebase web app config |
| `ENCRYPTION_KEY` | yes | `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` | one recommended | AI answers + semantic search |
| `APP_URL` | optional | custom domain, e.g. `https://app.zdoda.com` |
| `VITE_FIREBASE_STORAGE_BUCKET` | optional | defaults to `<project>.firebasestorage.app` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `RESEND_API_KEY` | optional | billing and invite emails |

Server keys are copied into Firebase Secret Manager on each run; they never land in the repo.

## Deploy to Firebase (manually)

1. Create a Firebase project on the **Blaze** plan. Enable Authentication (Email/Password + Google), Firestore (Native mode) and Storage.
2. `firebase use --add` and pick the project (replaces `demo-zdoda` in `.firebaserc`).
3. Put the web config (`VITE_FIREBASE_*`) in the root `.env`.
4. Create `apps/functions/.env` with server config:
   ```
   WEB_APP_URL=https://YOUR_PROJECT.web.app
   CORS_ALLOWED_ORIGINS=https://YOUR_PROJECT.web.app
   ZDODA_SECRETS=ENCRYPTION_KEY,ANTHROPIC_API_KEY
   ```
   and set each secret: `firebase functions:secrets:set ENCRYPTION_KEY` (value from `openssl rand -hex 32`), `firebase functions:secrets:set ANTHROPIC_API_KEY`, etc.
5. `pnpm deploy` — builds the web app + widget, bundles the functions, deploys rules, indexes (the vector index takes a few minutes), functions and hosting.
6. In Firebase Console → Authentication → Templates, set the action URL to `https://YOUR_DOMAIN/auth/action`. Add your domain under Authorized domains.
7. Stripe (optional): create products/prices, set `STRIPE_*` (see `docs/CREDENTIALS.md`) and add the webhook `https://YOUR_DOMAIN/api/v1/billing/webhook`.

Customers embed the widget with the snippet from **Channels**:

```html
<script src="https://YOUR_DOMAIN/zdoda-widget.js" data-widget-id="WIDGET_ID" async></script>
```

See `docs/FEATURE_STATUS.md` for exactly what is live, demo or coming soon.
