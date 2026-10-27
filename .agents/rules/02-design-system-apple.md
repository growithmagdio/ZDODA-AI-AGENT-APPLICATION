---
trigger: glob
globs: apps/web/**, packages/ui/**, packages/widget/**
---

## 2. Design language — "Apple effect" (all UI code)

Goal: Zdoda should feel like a first-party Apple pro app that happens to run in a browser — calm, precise, spatial — while keeping Zdoda's violet identity from the reference board. Familiar controls carry navigation; brand lives in colour, type, the agent avatar and one signature moment per surface.

### 1. The two-layer model (most important rule)
- **Content layer** — cards, tables, lists, charts, forms, chat transcripts. Opaque surfaces. No glass, no blur.
- **Functional layer** — floating chrome above content: sidebar, top bar, page toolbars (e.g. Agent Builder "Test agent / Publish" bar), sheets, popovers, menus, command palette, toasts, the Widget Studio preview toolbar, the widget launcher on customer sites. Only here may you use glass.
- Content scrolls *under* the top bar and sidebar so the glass has something to reflect. Use a scroll-edge fade (12–16px gradient mask) where content meets a bar instead of a hard border.
- Glass budget: at most 3 glass surfaces visible at once. Never glass on glass. Never glass on cards or rows.

### 2. Glass recipe (CSS)
```css
.glass {            /* regular — default for bars, sheets, menus */
  background: color-mix(in oklab, var(--surface) 72%, transparent);
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  border: 1px solid var(--glass-edge);          /* rgba(255,255,255,.55) light / rgba(255,255,255,.08) dark */
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-float);
}
.glass--clear {     /* only over rich media: widget over host site, voice call screen */
  background: color-mix(in oklab, var(--surface) 30%, transparent);
  backdrop-filter: blur(12px) saturate(1.3);
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass, .glass--clear { background: var(--surface); backdrop-filter: none; border-color: var(--separator-strong); }
}
```
Also expose a user setting "Reduce transparency" (Settings → Accessibility) that adds `data-reduce-transparency` on `<html>` for browsers without the media query.

### 3. Colour tokens (CSS variables on :root, dark under [data-theme=dark] and prefers-color-scheme)
| Token | Light | Dark | Use |
|---|---|---|---|
| --canvas | #F7F8FF | #0C0C1D | App background |
| --surface | #FFFFFF | #16162E | Cards, sheets |
| --surface-2 | #F1F2FB | #1E1E3A | Grouped-inset backgrounds, input fills |
| --ink | #15153B | #F3F3FF | Primary text (17.5:1 / 17.6:1) |
| --ink-2 | #4A4A6A | #B9B9D6 | Secondary text (8.5:1 / 9.2:1) |
| --ink-3 | #6B6B88 | #9090B0 | Tertiary, captions, placeholders (5.1:1 / 5.7:1) |
| --accent | #6538F5 | #6538F5 | Primary buttons (white label 6.1:1), selected states |
| --accent-ink | #5227E0 | #9B80FF | Accent text and icons (7.7:1 / 5.8:1) |
| --accent-tint | #EFEAFF | rgba(101,56,245,.18) | Selected row, active nav |
| --success | #0A7D3E | #3DD68C | Live, Active (5.2:1 / 9.4:1) |
| --warning | #A15C00 | #FFB547 | Setup required, Test mode |
| --danger | #C62834 | #FF6B75 | Failed, destructive |
| --separator | rgba(21,21,59,.08) | rgba(255,255,255,.08) | Hairlines |

Rules: accent colour only on the one primary action per view, the selected nav item, focus rings, and status. Status is never colour-only — always icon + label. Charts use a validated categorical palette led by the accent (violet, teal #12A7A0, amber #E0A100, slate #7B8199, coral #E2626B).

### 4. Typography — SF-style system stack
```css
--font-text: -apple-system, BlinkMacSystemFont, "Inter Variable", "Segoe UI", Roboto, sans-serif;
--font-display: -apple-system, BlinkMacSystemFont, "Inter Display", "Inter Variable", sans-serif;
--font-mono: ui-monospace, "SF Mono", "JetBrains Mono", monospace;  /* code snippets ONLY */
```
Apple devices get SF Pro natively; others get Inter (self-hosted, `font-display: swap`). Do not bundle SF fonts.
Scale (px / line-height / weight / tracking): Large title 34/41/700/-0.022em · Title 1 28/34/700/-0.02em · Title 2 22/28/600/-0.017em · Headline 17/22/600 · Body 15/22/400 (web app body) · Callout 14/20/400 · Footnote 13/18/400 · Caption 12/16/500. Minimum 12px anywhere. Numbers in stats and tables use `font-variant-numeric: tabular-nums`. No ALL-CAPS eyebrow labels; no single highlighted word in headlines.

### 5. Shape, spacing, depth
- 4px base grid; spacing scale 4, 8, 12, 16, 20, 24, 32, 40, 56, 80.
- Radius by hierarchy, not one radius for everything: controls 10px · inputs 12px · cards 16px · sheets/modals 24px · app windows/preview frames 28px · pills 999px. Inner radius = outer radius − padding.
- Shadows: content cards get almost none (`0 1px 2px rgba(21,21,59,.04)` + 1px separator border). Floating layer gets `--shadow-float: 0 12px 40px -12px rgba(21,21,59,.18)`.
- Hit targets ≥ 44×44px on touch, ≥ 28×28px with pointer. Visible focus ring: 2px `--accent` + 2px offset.

### 6. Apple-native patterns to use
- **Large titles** that collapse into the glass top bar on scroll (sticky, 34px → 17px, crossfade, 200ms).
- **Sidebar** like macOS: grouped sections (Build: Agents, Knowledge, Tools, Channels, Widget Studio · Operate: Inbox, Phone Numbers, Analytics · Account: Templates, Team, Billing, Settings), SF-Symbols-style Lucide icons at 1.75 stroke, collapsible to an icon rail; on < 1024px it becomes a sheet drawer; on < 640px a bottom tab bar with 5 tabs (Home, Agents, Inbox, Studio, More).
- **Segmented controls** for 2–5 peer views (Monthly/Yearly, Chat/Voice/WhatsApp, Desktop/Mobile preview).
- **Grouped inset lists** for Settings, Billing details and Agent settings (rounded group, hairline separators, chevron rows, switches right-aligned).
- **Sheets** (bottom sheet on mobile, centered 24px-radius sheet on desktop) for create flows: Create agent, Add source, Connect channel. One task per sheet, clear Cancel.
- **Popovers/menus** with glass, 8px radius items, keyboard navigable.
- **Toggles** are iOS-style switches (51×31 on touch, 38×22 desktop) — the reference board already uses them.
- **Inspector panel** (right column) in Agent Builder and Widget Studio, like Xcode/Keynote inspectors.
- **Command palette** (⌘K) with glass, search across agents, conversations, settings and actions.

### 7. Motion — springs, brief, purposeful
- Use `motion` (Framer Motion). Default spring: `{ type: "spring", stiffness: 380, damping: 32, mass: 0.9 }`. Sheets: stiffness 300, damping 30. Durations for fades 150–220ms, ease `cubic-bezier(0.32, 0.72, 0, 1)`.
- Motion answers user actions (open, expand, confirm, reorder). No scroll-triggered fade-ups on every section, no hover bounce on every card.
- Press feedback: scale 0.97 on primary buttons and cards that open something.
- Shared-element transitions: agent card → Agent Builder header; template card → create-agent sheet.
- `prefers-reduced-motion: reduce` → replace movement with opacity changes; stop all background animations in the widget and landing page.

### 8. Signature moments (spend boldness here, keep the rest quiet)
1. **Landing hero — "One Agent. Every Channel."** A pinned scroll sequence: the same Dental Assistant answers one question in the web widget, then the conversation morphs into a WhatsApp thread, then into a live voice-call card with a waveform (shared-element morph between the three). This is the only scroll-driven animation on the site.
2. **Widget Studio preview** — the device frame (28px radius, realistic browser chrome for desktop, phone frame for mobile) with the real widget responding instantly to every control.
3. **Publish** — on successful publish, the Publish button morphs into a check and the version number ticks up (no confetti).

### 9. Craft checklist (run before marking any UI task done)
- Light and dark both checked; reduced motion and reduced transparency both checked.
- 1440, 1024, 768 and 390px widths: no horizontal scroll, no clipped text, sidebar adapts.
- One primary (accent-filled) button per view. Destructive actions are red text buttons with a confirm sheet.
- Every async action shows: immediate pressed state → inline progress → success toast or inline error.
- Skeletons match the final layout shape; no spinners for whole pages.
- Remove one accessory: before finishing a screen, delete one decorative element that adds nothing.
