---
description: Start a phase workflow — setup branch, check types, inspect references, produce Implementation Plan and Task List.
---

### /start-phase — run at the start of every phase
1. Read `docs/PROGRESS.md`, `docs/FEATURE_STATUS.md`, `docs/DECISIONS.md` and the phase section in `docs/PROMPTS_PHASES.md` for the phase number I gave you.
2. Look at `docs/design/zdoda-reference.png` and note which reference screens this phase covers.
3. Run `git status` and `git branch`. If there are uncommitted changes, stop and ask me what to do with them.
4. Create a branch `phase-<n>-<short-name>` from the latest `main`.
5. Run `pnpm install` (if a lockfile changed) and `pnpm typecheck`. Record any pre-existing failures — do not hide them.
6. Produce an **Implementation Plan** artifact with: scope, out of scope, files/packages to touch, DB changes (with migration names), new API routes, new screens/components, provider adapters (real vs mock), credentials needed, risks, and the phase Definition of Done copied from PROMPTS_PHASES.md.
7. Produce a **Task List** artifact with small, verifiable tasks in build order (schema → API → UI → tests → verification).
8. Stop and wait for my approval or comments on the plan. Do not write code until I approve.
