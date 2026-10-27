---
trigger: always_on
---

## 1. Product rules (always on)

You are building **Zdoda**, an AI-Agent-as-a-Service platform. Tagline: **One Agent. Every Channel.**
A business creates one AI agent, teaches it about the business, and deploys the same agent to website chat, WhatsApp and phone/voice — from one dashboard.

### Who uses it
- Small business owners (clinics, restaurants, real estate, home services, e-commerce) — non-technical. Every screen must make sense to them without docs.
- Agencies who build agents for many clients — need client workspaces, white-label, agency billing.
- Startups and enterprise teams — need roles, audit logs, API tools.

### Source-of-truth files (read before planning any task)
- `docs/design/zdoda-reference.png` — the approved UI reference board (12 screens). Match its information architecture, density and component vocabulary. Apply the Apple-style design language from rule `02-design-system-apple.md` on top of it.
- `docs/PROGRESS.md` — what is done, mocked and pending. Update it at the end of every task.
- `docs/FEATURE_STATUS.md` — the Live / Test mode / Demo / Setup required / Coming soon matrix.
- `docs/DECISIONS.md` — architecture decisions (append-only log, one entry per decision).

### Product surface (sidebar order)
Dashboard · Agents · Knowledge Base · Tools & Integrations · Channels · Widget Studio · Inbox · Phone Numbers · Analytics · Templates · Team & Workspace · Billing & Subscription · Settings

Top bar: workspace switcher · global search (⌘K / Ctrl+K command palette) · usage meter · notifications · help · profile menu.

### The core differentiator
**Widget Studio** — a no-code editor for the website chat widget with a live preview. The preview MUST render the real widget runtime (`packages/widget`) inside a Shadow DOM, fed by the same `WidgetConfig` object the editor edits. Never a screenshot, never a look-alike React copy.

### Honesty contract (non-negotiable)
Every external capability shows exactly one of these states, using the shared `<StatusPill>`:

| State | Meaning | When |
|---|---|---|
| Live | Real provider, real credentials, verified by a server round-trip | Provider configured AND last health check passed |
| Test mode | Real provider in sandbox (Stripe test keys, Meta test number) | Sandbox credentials present |
| Demo | Mock adapter or seeded data | No credentials; seed data |
| Setup required | Feature exists but needs credentials/config | Show what is missing and a "How to set up" sheet |
| Coming soon | Planned, not built | Never clickable as if it works |

Never:
- show a subscription as active unless the backend received and verified the Stripe webhook;
- show an integration as Connected unless a server-side token exists and a test call succeeded;
- mark an agent "Live" unless its published version is deployed to at least one channel that passed a health check;
- fake WhatsApp delivery, call connection, number purchase or payment success;
- render another workspace's data — every read and write is workspace-scoped on the server;
- put secrets, API keys or provider tokens in frontend code, URLs, logs or `localStorage`;
- leave a button, toggle, menu item or link without a real action. If it cannot work yet, it is disabled with a tooltip and a Coming soon / Setup required pill.

### Demo workspace (seed data)
Seed one workspace named **Smile Dental Clinic** matching the reference board: agent "Dental Assistant" (friendly, professional, helpful; English + auto-detect), knowledge sources (smiledental.com site, sitemap, Clinic Brochure PDF, FAQ doc, Services & Prices sheet), website chat channel, ~2,800 demo conversations across 30 days, ~180 leads, sample inbox threads (Sarah M. – book appointment, John D. – pricing, Priya S. – reschedule, Mike R. – product info). Every seeded number renders a small "Demo data" pill in its card header.

### Plans (configurable, demo prices)
Plans, prices and quotas live in the `Plan` table / server config — never in components. Demo values, all labelled "Demo pricing":
- Starter $49/mo — 1 agent, website widget, basic knowledge, essential integrations, 1,000 messages/mo
- Pro $99/mo (Most popular) — 5 agents, chat + WhatsApp, inbound voice, advanced knowledge, tools & integrations, 10,000 messages/mo
- Business $199/mo — unlimited agents, white-label widget, multi-workspace, custom integrations, priority support, 50,000 messages/mo
- Agency — client workspaces, white-label, custom domains, agency billing. Support `showPrice=false` per plan so a plan can show "Talk to sales" instead of a price.
Monthly/Yearly toggle, yearly = save 20% (configurable).

### Language and copy
- Plain verbs, sentence case for body and labels, title case only for page titles. Name things by what the user controls: "Notifications", not "Webhook config".
- A button says what happens ("Publish widget"), and the toast echoes it ("Widget published").
- Errors say what went wrong and how to fix it, never apologise, never "Something went wrong".
- Empty states invite the next action with one primary button.
