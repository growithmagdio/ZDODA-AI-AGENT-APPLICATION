---
description: Verify a completed phase — tests, lint, docker stack, browser subagent audit, honesty audit, tenant isolation, and walkthrough artifact.
---

### /verify-phase — run when a phase is built
1. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`. Fix every failure in code (no skips, no `@ts-ignore`, no disabled lint rules). Re-run until green.
2. Run `pnpm test:e2e` (Playwright). Fix failures.
3. Start the stack (`docker compose up -d`, `pnpm dev`). Seed if needed (`pnpm db:seed`).
4. With the browser subagent, open every screen touched in this phase and capture screenshots at 1440px, 768px and 390px, in light and dark appearance. Also capture one screenshot with reduced motion emulated.
5. Compare each screenshot with `docs/design/zdoda-reference.png` and rule `02-design-system-apple.md`. List mismatches (spacing, radius, hierarchy, glass misuse, more than one accent button, colour-only status) and fix them.
6. Click through every button, toggle, menu item and link on those screens. Each must do something real, or be disabled with a Coming soon / Setup required pill. Fix any dead control.
7. Honesty audit: for every external capability on these screens, confirm the StatusPill matches reality (Live / Test mode / Demo / Setup required / Coming soon). Confirm no secret appears in the network tab, page source, console or logs.
8. Tenant check: log in as the second seeded user (other workspace) and try opening three URLs/IDs from the first workspace. Each must return 404.
9. Write a **Walkthrough** artifact: what was built, screenshots, how to demo it in 60 seconds, what is mocked and why, credentials still needed.
10. Update `docs/PROGRESS.md` and `docs/FEATURE_STATUS.md`. Append any decisions to `docs/DECISIONS.md`.
11. Commit with a conventional message and tell me the phase is ready for review. Do not merge to `main` without my OK.
