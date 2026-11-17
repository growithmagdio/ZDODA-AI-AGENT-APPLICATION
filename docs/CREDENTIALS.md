# Credentials you need

Add these as **GitHub repository secrets** (Settings → Secrets and variables → Actions). The deploy workflow copies server secrets into Firebase Secret Manager and writes the rest into the functions config. Nothing secret is stored in the repo.

| What | Where to get it | Secrets | Without it |
|---|---|---|---|
| Firebase (required) | Firebase Console → Project settings | `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT` (JSON; roles: Editor, Firebase Admin, Secret Manager Admin, Service Account User, Cloud Run Admin, Cloud Build Editor), `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID` | Can't deploy |
| Encryption (required) | `openssl rand -hex 32` | `ENCRYPTION_KEY` | Can't deploy |
| AI answers | Anthropic / OpenAI / Google AI Studio | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` | Demo model |
| Knowledge search | OpenAI or Gemini key above | (automatic) | Keyword search |
| Voice engine | cloud.livekit.io → project → Settings → Keys; SIP URI under Telephony | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_SIP_URI`, `VOICE_WORKER_SECRET` (any long random string) | No voice |
| Speech-to-text | deepgram.com | `DEEPGRAM_API_KEY` | No voice |
| Voices | elevenlabs.io or cartesia.ai (or OpenAI) | `ELEVENLABS_API_KEY` / `CARTESIA_API_KEY` | OpenAI voices if `OPENAI_API_KEY` is set |
| Phone numbers | twilio.com console | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Web calls only |
| Call recordings (optional) | A GCS bucket + a service-account JSON with write access | `RECORDING_GCS_BUCKET`, `RECORDING_GCP_CREDENTIALS` | No recordings |
| WhatsApp | developers.facebook.com → your app | `META_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (any word) | WhatsApp can't connect |
| Calendar & Sheets tools | console.cloud.google.com → Credentials → OAuth client (web); redirect `https://YOUR_DOMAIN/api/v1/oauth/google/callback` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Those two tools can't connect |
| Card payments | dashboard.stripe.com | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Demo billing |
| INR payments | dashboard.razorpay.com | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_STARTER/PRO/BUSINESS` | No ₹ option |
| Emails | resend.com | `RESEND_API_KEY` | Invite links are copied manually |
| Admin access | your email | `SUPERADMIN_EMAILS` | No admin panel |
| Custom domain | — | `APP_URL` (e.g. `https://app.zdoda.com`) | Uses `<project>.web.app` |

Webhooks to register: Stripe `…/api/v1/billing/webhook`, Razorpay `…/api/v1/billing/razorpay/webhook`, WhatsApp `…/api/v1/webhooks/whatsapp`.
After the first deploy: open **Admin → Run one-time telephony setup** to connect Twilio to LiveKit.
