---
trigger: model_decision
description: Widget Studio architecture, WidgetConfig schema, themes, live preview, and runtime specification for the embeddable chat widget.
---

## 4. Widget Studio and widget runtime spec

### Architecture: one renderer, two hosts
```
packages/shared  ── WidgetConfigV1 (Zod) ──┐
                                           ├── packages/widget  mountWidget(el, config, { mode })
apps/web Widget Studio (editor state) ─────┘        ▲                    ▲
        └── <WidgetPreview config={draft}/> ─────────┘ mode:"preview"     │ mode:"live"
customer site: <script async src=".../w.js" data-zdoda="wk_pub_…"> ───────┘ (fetches published config)
```
- `mountWidget(container, config, opts)` returns `{ update(config), destroy(), open(), close() }`. The Studio calls `update()` on every editor change (debounced 16ms) — no remount, no flicker. Target: control change → pixels in < 100ms.
- Preview mode uses a mock conversation transport (scripted Smile Dental demo replies) or, when the agent is published, a real test session to the agent.
- Every Studio control writes to the draft `WidgetConfig`. A control that does not change the preview is a bug.

### WidgetConfigV1 (shape — define in packages/shared with defaults for every field)
```ts
{
  schemaVersion: 1,
  brand:      { botName, tagline, logoUrl?, avatar: { type: "upload"|"initials"|"generated", url?, initials? }, headerImageUrl? },
  theme:      { preset: "violet"|"glass"|"midnight"|"mint"|"coral"|"graphite",
                primary, palette: "auto"|"custom", colors?: { header, headerText, userBubble, userText, botBubble, botText, button, buttonText, surface, text },
                appearance: "light"|"dark"|"auto", fontFamily: "system"|"inter"|"serif"|"rounded", radius: 8|14|20|28, density: "compact"|"comfortable" },
  background: { type: "solid"|"gradient"|"aurora"|"particles"|"waves"|"bokeh"|"image"|"video"|"lottie",
                colors: string[], speed: 0..2, opacity: 0..1, blur: 0..40, imageUrl?, videoUrl?, lottieUrl?, respectReducedMotion: true },
  launcher:   { style: "icon"|"text"|"icon_text", shape: "circle"|"pill"|"square", icon, label?, size: 48..72,
                position: "right"|"left", offsetX, offsetY, entrance: "none"|"fade"|"pop"|"slide", unreadBadge: boolean, glass: boolean },
  texts:      { welcomeTitle, welcomeMessage, placeholder, disclaimer, footerText?, privacyUrl?, quickReplies: string[], language: "auto"|BCP47, translate: boolean },
  layout:     { mode: "bubble"|"inline"|"side_panel"|"popup"|"fullpage", width, height, inlineSelector? },
  behavior:   { proactiveGreeting?: { enabled, delaySec, message }, openOnLoad: boolean, soundOnMessage: boolean },
  advanced:   { customCss?: string, hideBranding: boolean }  // plan-gated
}
```
Unknown/invalid fields fall back to defaults — the widget must always render.

### Themes (MVP: six presets)
| Preset | Character |
|---|---|
| Violet | Zdoda default — #6538F5 header, white surface |
| Glass | Apple-style: clear glass panel over the host page, monochrome text, accent only on send button and user bubble |
| Midnight | Dark navy surface, violet accents |
| Mint | Clinical/healthcare — soft mint, deep teal text |
| Coral | Warm hospitality/restaurants |
| Graphite | Neutral grey, for brands with their own strong colour |
"Auto palette" derives header/bubbles/button from `primary` in OKLCH and guarantees ≥ 4.5:1 text contrast; the Contrast checker (V2) warns live in the inspector when custom colours fail.

### Studio layout (desktop)
`[ sidebar ] [ inspector 360px: Brand · Theme · Background · Launcher · Texts tabs ] [ preview canvas ]`
- Glass toolbar above the canvas: segmented Desktop / Mobile, layout mode menu, Light/Dark/Auto preview toggle, Reset to published, Save draft, Version history, Publish (the one accent button).
- Canvas: desktop shows a browser frame with a sample host page (Smile Dental site mock) so position, offsets and glass are judged in context; mobile shows a 390×844 phone frame. Background animations run in preview and pause when the tab is hidden.
- Unsaved changes indicator next to the title; ⌘S saves draft; leaving with unsaved changes asks to save.
- Tablet/mobile Studio: inspector becomes a bottom sheet over a full-width preview.

### Backgrounds
Implement solid, gradient (CSS), aurora/mesh (CSS radial gradients with slow transform), particles and bokeh (single `<canvas>`, ≤ 60 particles, requestAnimationFrame paused off-screen), waves (SVG path animation). `speed`, `opacity`, `blur` apply live. With `prefers-reduced-motion` or `respectReducedMotion` → render the first frame static. Video/Lottie are Pro and lazy-loaded only when selected.

### Publishing and versions
- Draft lives in `WidgetConfig.draft` (JSON). Save draft = PATCH with optimistic concurrency (`version` field; conflict → sheet offering reload/overwrite).
- Publish = server validates with Zod + plan gates → creates immutable `WidgetVersion { number, config, publishedBy, publishedAt }` → points `WidgetConfig.publishedVersionId` at it → purges CDN/ETag cache. Install snippet never changes.
- Version history sheet: list with author, time, diff summary ("Theme: Violet → Glass; Launcher: right → left"), Preview this version, Restore as draft.

### Runtime requirements (live mode)
- Loader `w.js`: async, no globals except `window.Zdoda` (open/close/identify/on API), reads `data-zdoda` public key, fetches `GET /api/v1/public/widgets/:key/config` (ETag, `Cache-Control: max-age=60, stale-while-revalidate=600`), then lazy-loads the runtime.
- Server checks `Origin` against the widget's allowed domains (wildcards like `*.smiledental.com` allowed); disallowed → 403 and the loader renders nothing (console warning only).
- Shadow DOM (`mode: "closed"`), all styles inside the shadow root, CSS custom properties namespaced `--zd-*`, z-index max-safe, no host CSS leakage either way. Respect host `prefers-color-scheme` when appearance = auto.
- Accessibility: launcher is a `<button>` with `aria-label`, panel is a `role="dialog"` with focus trap and Esc to close, live region for new messages, full keyboard use, 44px touch targets, text scales with browser zoom.
- Performance budget: no layout shift on host page, runtime parsed after `load`, Lighthouse impact < 3 points on a sample page. Add `apps/web/public/embed-test.html` that loads the widget like a customer site, used in Playwright tests.

### Feature phases — label in UI exactly as built
- MVP: brand, theme + six presets, typography & shape, basic launcher, welcome screen, editable texts, desktop/mobile preview, bubble & inline layouts, save draft, publish, version history.
- V2: animated backgrounds, website brand import (fetch site → extract logo, colours, font), proactive greeting, side panel / popup / full-page layouts, A/B design tests, contrast checker.
- Pro/Advanced: video & Lottie backgrounds, custom CSS (sanitised, scoped to shadow root), hide Zdoda branding / white-label, agency controls.
Anything not built in the current phase appears in the inspector with a "Coming soon" pill and disabled controls — never hidden fake controls that do nothing.
