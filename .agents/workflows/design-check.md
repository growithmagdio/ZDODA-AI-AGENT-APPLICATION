---
description: Design check workflow — Apple-style audit of a single screen across accessibility, layers, hierarchy, motion, and copy.
---

### /design-check — Apple-style audit of one screen
1. Open the screen I name in the browser subagent at 1440px and 390px, light and dark.
2. Audit it in this order and list findings with severity (Critical / High / Medium / Low):
   - Accessibility: text contrast against the tokens in rule 02 (show ratios), 12px minimum text, 44px touch targets, visible focus, keyboard path, status not colour-only, reduced motion and reduced transparency fallbacks.
   - Layers: glass only on the functional layer (bars, sheets, menus, toolbars, launcher); no glass on cards or rows; ≤ 3 glass surfaces; scroll-edge fade under bars.
   - Hierarchy: one accent-filled primary action; large title present and collapsing; radius by hierarchy; grouped inset lists for settings-like content.
   - Motion: springs on user-triggered transitions only; nothing animates on its own except the defined signature moments.
   - Copy: verbs on buttons, toast echoes the action, errors explain the fix, empty state has one next action.
3. Name the one thing this screen should be remembered by. If nothing, propose one small, specific improvement.
4. Remove one accessory — name a decorative element to delete.
5. Fix all Critical and High findings, re-screenshot, and show before/after in a Walkthrough artifact.
