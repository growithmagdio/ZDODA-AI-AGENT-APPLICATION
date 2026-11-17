# Credentials you need

Put browser-safe values in the root `.env` (see `.env.example`). Put server secrets in Firebase Secret Manager for production:
`firebase functions:secrets:set ANTHROPIC_API_KEY`, then list the secret names in `apps/functions/.env` as `ZDODA_SECRETS=ENCRYPTION_KEY,ANTHROPIC_API_KEY,...` before deploying.

| What | Where to get it | Variable(s) | Without it |
|---|---|---|---|
| Firebase project (Blaze plan) | console.firebase.google.com → Project settings → Your apps → Web | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID` | Runs against local emulators only |
| AI answers (one of) | console.anthropic.com · platform.openai.com · aistudio.google.com | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` | Demo model (extractive) |
| Semantic search | OpenAI or Gemini key above | `EMBEDDING_PROVIDER=openai|gemini` (auto) | Keyword hashing (demo) |
| Payments | dashboard.stripe.com → Developers | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_{STARTER,PRO,BUSINESS}_{MONTHLY,YEARLY}` | Demo billing |
| Email (team invites) | resend.com | `RESEND_API_KEY`, `EMAIL_FROM` | Copy invite link manually |
| Encryption key | `openssl rand -hex 32` | `ENCRYPTION_KEY` | Dev-only fallback key (refused in production) |

Stripe webhook endpoint: `https://YOUR_DOMAIN/api/v1/billing/webhook` with events `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.payment_failed`.
