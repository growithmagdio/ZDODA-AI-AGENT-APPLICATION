---
trigger: glob
globs: apps/web/**, packages/ui/**, packages/widget/**
---

# 05. iOS Liquid Glass & iPhone Touch Interaction Rules

If it conflicts with rule 02, this rule wins for touch/mobile (< 1024px); rule 02 wins on desktop.

## 1. Liquid Glass material (the core of the effect)

Build a reusable `<LiquidGlass>` component in `packages/ui` with variants `regular` (bars, sheets, menus) and `clear` (over photos/video, the voice-call screen, the widget launcher over host sites).

### Layers, bottom to top:
1. **Refraction / lensing** — an SVG filter (`feTurbulence` + `feDisplacementMap`, scale 8–14) applied with `backdrop-filter: url(#zd-lens)` where supported (Chromium). Elsewhere fall back to blur only. Feature-detect with `CSS.supports`; never break Safari/Firefox.
2. **Blur + saturation** — `backdrop-filter: blur(24px) saturate(1.6)` (regular) / `blur(10px) saturate(1.4)` (clear), with `-webkit-` prefix.
3. **Tint** — translucent fill: regular 65–75% of `--surface`, clear 20–30%. For clear glass over bright media add a 35% black dimming layer.
4. **Specular rim** — 1px inner border with a top-left to bottom-right gradient (white 60% → 10% → 30%) via mask / border-image, plus `inset 0 1px 0 rgba(255,255,255,.6)` highlight.
5. **Depth** — soft float shadow `0 8px 32px -8px rgba(21,21,59,.25)`.
6. **Adaptive labels** — sample average luminance under the bar (canvas sample of the hero/media or a precomputed value per section via `IntersectionObserver`) and switch glass labels between dark and light, like iOS.
7. **Press response** — on pointer down the glass scales to 0.96 and brightens slightly (`filter: brightness(1.08)`), springing back on release; a soft radial highlight follows the touch point.

### Strict Glass Rules:
- Glass ONLY on the floating layer (tab bar, nav bar, toolbars, sheets, menus, toasts, launcher, call controls). Never on cards, rows or page backgrounds.
- Max 3 glass surfaces on screen at once.
- **Fallbacks:**
  - `prefers-reduced-transparency` / `prefers-contrast: more` / in-app "Reduce transparency" → opaque `--surface` with a hairline border.
  - Low-end devices (`navigator.hardwareConcurrency <= 4` or a dropped-frames check) → blur-only, no refraction.

## 2. iPhone navigation patterns (< 640px)
- **Floating tab bar**: a glass capsule inset 12px from the screen edges and above the home indicator (`bottom: calc(env(safe-area-inset-bottom) + 8px)`). Five tabs: Home, Agents, Inbox, Studio, More, with a separate round glass Search button beside the capsule. The selected tab shows a glass "lens" pill that slides between tabs with a spring. On scroll down the bar minimises to a smaller capsule showing only the active icon; scroll up or tap restores it.
- **Navigation bar**: large title (34px bold) that collapses into a centered inline title in a glass bar on scroll; back button is a round glass chevron; trailing actions are round glass icon buttons grouped in one capsule.
- **Scroll edge effect**: content fades and blurs as it passes under the bars (gradient mask), no hard divider lines.
- **Push navigation**: new screens slide in from the right with the previous screen moving 30% left and dimming; edge swipe back from the left 20px gesture-drives the transition and is cancellable mid-swipe.
- **Tablet (640–1024px)**: sidebar becomes a glass overlay sidebar; tab bar converts to the sidebar.

## 3. Sheets and modals (the iPhone card stack)
- **Bottom sheets with detents**: medium (~50%) and large (~92%), plus custom detents where useful (Create agent: medium → large as fields expand). Visible grabber; drag between detents with velocity-aware snapping; drag down past threshold to dismiss; rubber-band resistance beyond the top.
- **Stacked-card effect**: When a large sheet is open, the page behind scales to 0.94, rounds its corners to 12px and dims. Nested sheets stack again.
- Sheets have a clear Cancel/close button as well as the gesture. Focus is trapped inside; Esc closes on keyboard.
- **Action sheets** for destructive choices (Delete agent, Remove member): glass panel from the bottom, destructive action in red, separate Cancel button.

## 4. Dynamic Island–style live activity (`<LiveIsland>`)
Pinned top-center (`top: calc(env(safe-area-inset-top) + 8px)`), black in both appearances, rounded 999px:
- **Compact state**: icon + short text (e.g. "Calling… 00:24", "Publishing widget", "Indexing 3 sources 62%").
- **Expanded state**: Tapping or a new event morphs it (spring, layout animation) into an expanded card with details and actions (Mute / End for calls, View for indexing).
- Use for: live voice calls in the Voice Assistant, knowledge ingestion progress, widget publish, incoming handoff requests in Inbox. Max one island; queue events.
- Announce changes through an `aria-live="polite"` region. On desktop it appears top-center of the main content area at a smaller size.

## 5. Gestures and touch feel
- Use `@use-gesture/react` + `motion` springs.
- Springs: Default spring stiffness 400, damping 34; sheets 300 / 30; tab lens 500 / 38.
- **Swipe actions** on Inbox and Agents rows: swipe left reveals Archive (grey) and Delete (red, full-swipe to trigger with confirmation); swipe right reveals Mark read / Pin.
- **Pull to refresh** on Inbox, Dashboard, Knowledge Base with a spinner that grows with pull distance and a short bounce.
- **Long press (500ms)** on agent cards, conversations and knowledge sources → context menu: the item lifts (scale 1.03, shadow), background blurs, menu appears in glass beside it.
- **Rubber-band overscroll** on scroll containers (`overscroll-behavior: contain` + spring on custom scrollers only, never on the page body).
- **Momentum-based carousel** for Templates (scroll-snap + inertia).
- **Haptics**: call `navigator.vibrate(10)` on toggles, snaps and successful actions where supported (Android); no-op elsewhere. On iOS Safari 18+, use native `<input type="checkbox" switch>` for switches so the system provides haptic feedback.
- **Instant press states** (no 300ms delay): `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`, and a visible pressed state on every tappable element.

## 6. Native-app shell on the web (PWA)
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; pad with `env(safe-area-inset-*)`; use `100dvh`, never `100vh`.
- Inputs at 16px or larger to stop iOS zoom on focus. Correct `inputmode`, `autocomplete`, `enterkeyhint` on every field.
- **PWA**: web manifest (`display: standalone`, theme colour `#6538F5`, background `#F7F8FF`), `apple-touch-icon` set, `apple-mobile-web-app-status-bar-style: black-translucent`, splash screens. In standalone mode hide the browser-only UI and keep the same tab bar.
- **Service worker**: cache the app shell for instant launch; offline screen designed like an iOS empty state.
- Appearance follows the system (light/dark) with an override in Settings → Accessibility.

## 7. iPhone device frame (`<PhoneFrame>`)
- CSS-only modern phone (390×844 viewport, 55px outer radius, 6px bezel, camera "island" cutout, side buttons, subtle titanium-grey gradient edge, screen glare reflection). Generic design — do not use Apple logos, Apple product photos or the word "iPhone" in the UI.
- Widget Studio mobile preview renders the real widget inside `<PhoneFrame>` with a sample Smile Dental mobile site behind it, so the glass launcher and sheets are judged in context.
- Landing hero: the "One Agent. Every Channel." sequence plays inside `<PhoneFrame>` — web widget → WhatsApp-style thread → incoming voice call shown in the `<LiveIsland>` expanding into the call screen. Subtle 3D tilt toward the cursor on desktop (max 6°), none on touch, none with reduced motion.

## 8. The widget on customer sites (iPhone feel inside the widget)
- **Launcher**: glass capsule or circle (clear glass) with the agent avatar; tap opens the chat as a bottom sheet with detents on mobile (medium for quick replies, large for full chat) and a floating glass panel on desktop.
- **Messages**: iMessage-like bubbles — user in the brand colour, bot in a light grey/`--surface-2`; bubble tails on the last message of a group; tight grouping (2px) within a sender, 8px between senders; "Delivered"/timestamp on tap.
- **Typing indicator**: three dots with a staggered spring pulse. Composer: glass bar with a round send button that morphs from mic to arrow when text is entered.
- Quick replies as glass chips that scroll horizontally.
- Respect reduced motion (crossfades only) and maintain Shadow DOM isolation.

## 9. Do and Don't
- **Do**: springs for user actions, 44×44px touch targets, one primary tinted action per screen (tint the background, not the label), monochrome icons on glass, Lucide icons at 1.75 stroke.
- **Don't**: glass on content, glass on glass, autoplaying motion except landing sequence, colour-only status, SF Symbols or Apple logos (licensing — use Lucide), heavy refraction on low-end devices, scroll hijacking of the page body.
