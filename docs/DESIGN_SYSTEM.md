# Zdoda Design System — Apple Effect Specification

This document details the visual foundations, tokens, component library, ASCII wireframes, and design audits for **Zdoda — AI Agent Platform**, adhering to Rule 02 (Apple Effect Design Language).

---

## 1. Design Philosophy & Two-Layer Spatial Model

Zdoda is engineered to feel like a first-party Apple pro application running in the browser — calm, mathematically precise, and spatial:
1. **Content Layer (Opaque):** Cards, tables, forms, charts, and transcripts sit on solid surfaces (`--surface`, `--surface-2`). Never frosted glass on cards.
2. **Functional Layer (Glass Chrome):** Floating elements (top bar, sidebar, inspector headers, command palette, toasts, sheets, widget launcher) utilize high-fidelity frosted glass.
3. **Glass Budget:** Maximum 3 glass surfaces simultaneously visible. Content scrolls gracefully under the top bar with a 14px gradient fade mask.

---

## 2. CSS Tokens & Tailwind v4 Theme Configuration

### CSS Custom Properties (`:root` & `[data-theme="dark"]`)

```css
:root {
  /* Canvas & Surfaces */
  --canvas: #F7F8FF;
  --surface: #FFFFFF;
  --surface-2: #F1F2FB;
  --surface-inset: #EAEBF7;

  /* Typography Colors */
  --ink: #15153B;            /* Contrast 17.5:1 against canvas */
  --ink-2: #4A4A6A;          /* Contrast 8.5:1 */
  --ink-3: #6B6B88;          /* Contrast 5.1:1 */

  /* Brand Accent (Violet Identity) */
  --accent: #6538F5;         /* Primary buttons, white text contrast 6.1:1 */
  --accent-ink: #5227E0;     /* Text and iconography contrast 7.7:1 */
  --accent-tint: #EFEAFF;    /* Selected row background, active nav item */

  /* Status Tokens */
  --success: #0A7D3E;        /* Live, Active (5.2:1) */
  --warning: #A15C00;        /* Setup required, Test mode (4.8:1) */
  --danger: #C62834;         /* Destructive, Failed (5.3:1) */
  --separator: rgba(21, 21, 59, 0.08);
  --separator-strong: rgba(21, 21, 59, 0.16);

  /* Glass & Shadows */
  --glass-edge: rgba(255, 255, 255, 0.55);
  --glass-highlight: rgba(255, 255, 255, 0.8);
  --shadow-card: 0 1px 2px rgba(21, 21, 59, 0.04);
  --shadow-float: 0 12px 40px -12px rgba(21, 21, 59, 0.18);
  --focus-ring: 0 0 0 2px var(--canvas), 0 0 0 4px var(--accent);

  /* Typography Stack */
  --font-text: -apple-system, BlinkMacSystemFont, "Inter Variable", "Segoe UI", Roboto, sans-serif;
  --font-display: -apple-system, BlinkMacSystemFont, "Inter Display", "Inter Variable", sans-serif;
  --font-mono: ui-monospace, "SF Mono", "JetBrains Mono", monospace;
}

[data-theme="dark"] {
  --canvas: #0C0C1D;
  --surface: #16162E;
  --surface-2: #1E1E3A;
  --surface-inset: #121226;

  --ink: #F3F3FF;
  --ink-2: #B9B9D6;
  --ink-3: #9090B0;

  --accent: #6538F5;
  --accent-ink: #9B80FF;
  --accent-tint: rgba(101, 56, 245, 0.18);

  --success: #3DD68C;
  --warning: #FFB547;
  --danger: #FF6B75;
  --separator: rgba(255, 255, 255, 0.08);
  --separator-strong: rgba(255, 255, 255, 0.16);

  --glass-edge: rgba(255, 255, 255, 0.08);
  --glass-highlight: rgba(255, 255, 255, 0.12);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-float: 0 16px 48px -12px rgba(0, 0, 0, 0.45);
}
```

### Glass Utilities with Accessibility Fallbacks

```css
.glass {
  background: color-mix(in oklab, var(--surface) 72%, transparent);
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  border: 1px solid var(--glass-edge);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-float);
}

.glass--clear {
  background: color-mix(in oklab, var(--surface) 30%, transparent);
  backdrop-filter: blur(12px) saturate(1.3);
  -webkit-backdrop-filter: blur(12px) saturate(1.3);
}

@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass, .glass--clear {
    background: var(--surface) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border-color: var(--separator-strong) !important;
  }
}

html[data-reduce-transparency="true"] .glass,
html[data-reduce-transparency="true"] .glass--clear {
  background: var(--surface) !important;
  backdrop-filter: none !important;
  border-color: var(--separator-strong) !important;
}
```

---

## 3. Component Kit Catalog (`packages/ui`)

| Component | Props | Apple Design Details |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'ghost' \| 'destructive'`, `size: 'sm' \| 'md' \| 'lg'`, `loading?: boolean` | Primary: solid `--accent` (only 1 per view). Press scale `0.97`. Destructive: red text + confirmation sheet. |
| `IconButton` | `icon: LucideIcon`, `aria-label: string`, `size?: number` | 44×44px touch target, 28×28px pointer target. 8px border radius. |
| `SegmentedControl` | `items: { label, value }[]`, `value: string`, `onChange: (val) => void` | Sliding capsule animation with spring physics (`stiffness: 380, damping: 32`). |
| `Switch` | `checked: boolean`, `onCheckedChange: (val) => void`, `disabled?: boolean` | iOS physical switch style (38×22 desktop, 51×31 touch). Smooth thumb slide. |
| `StatusPill` | `status: 'live' \| 'test_mode' \| 'demo' \| 'setup_required' \| 'coming_soon'`, `label?: string` | Mandatory for Honesty contract. Always icon + label, never color alone. |
| `StatCard` | `title: string`, `value: string \| number`, `delta?: string`, `isDemo?: boolean` | Clean, subtle 1px border. No glass. Tabular numerals. Demo indicator badge when seeded. |
| `GroupedList` | `items: ListItem[]`, `variant?: 'inset'` | macOS/iOS Settings style. Rounded container, hairline separators, chevron rows. |
| `Sheet` | `open: boolean`, `onOpenChange: (open) => void`, `title: string` | Bottom sheet on mobile (<768px), centered 24px-radius modal on desktop. Focus trap. |
| `LargeTitleHeader` | `title: string`, `subtitle?: string`, `action?: ReactNode` | 34px bold title that smoothly collapses into 17px glass bar on scroll. |
| `CommandPalette` | `open: boolean`, `onClose: () => void` | ⌘K / Ctrl+K glass overlay. Global search across agents, threads, settings, and navigation. |
| `Toast` | `title: string`, `type: 'success' \| 'error' \| 'info'` | Floating glass capsule echoing performed action ("Widget published"). |

---

## 4. ASCII Wireframes

### 1. App Shell & Navigation (1440px Desktop)
```
+----------------------------------------------------------------------------------------------------+
| [Zdoda Logo] [Workspace: Smile Dental v]    [Q Search ⌘K...]   [Quota: 1.2k/10k] [🔔] [Help] [Profile] | (Glass Bar)
+----------------+-----------------------------------------------------------------------------------+
| BUILD          |                                                                                   |
| > Dashboard    |  Large Title: Dashboard (collapses to top bar on scroll)       [Last 30 Days v]   |
|   Agents       |                                                                                   |
|   Knowledge    |  +-----------------+ +-----------------+ +-----------------+ +-----------------+  |
|   Tools        |  | Conversations   | | Appointments    | | Leads           | | Resolution      |  |
|   Channels     |  | 2,842   [+12%]  | | 348     [+8%]   | | 182    [+15%]   | | 91.2%   [+2%]   |  |
|   Widget Studio|  +-----------------+ +-----------------+ +-----------------+ +-----------------+  |
| OPERATE        |                                                                                   |
|   Inbox        |  +---------------------------------------+ +-----------------------------------+  |
|   Phone Numbers|  | Conversation Volume Breakdown         | | Active Channels                   |  |
|   Analytics    |  | [Stacked Bar Chart: Web, WA, Voice]   | | * Web Chat      [Live]            |  |
| ACCOUNT        |  |                                       | | * WhatsApp      [Test Mode]       |  |
|   Templates    |  |                                       | | * Voice         [Demo]            |  |
|   Team         |  +---------------------------------------+ +-----------------------------------+  |
|   Billing      |                                                                                   |
|   Settings     |  +-----------------------------------------------------------------------------+  |
|                |  | Recent Activity & Leads                     [Quick Actions: + Agent | + RAG] |  |
| [< Collapse]   |  +-----------------------------------------------------------------------------+  |
+----------------+-----------------------------------------------------------------------------------+
```

### 2. App Shell & Mobile Drawer (390px Mobile)
```
+---------------------------------------+
| [=] [Smile Dental v]          [👤]    | (Top Glass Bar)
+---------------------------------------+
| Dashboard                             | (Large Title)
|                                       |
| +-----------------------------------+ |
| | Total Conversations        [Demo] | |
| | 2,842                    +12.4%   | |
| +-----------------------------------+ |
| +-----------------------------------+ |
| | Qualified Leads            [Demo] | |
| | 182                      +15.3%   | |
| +-----------------------------------+ |
|                                       |
| [Volume Chart: Stacked Bars]          |
|                                       |
| Active Channels:                      |
| * Website Chat Widget       [Live]    |
| * WhatsApp Business         [Demo]    |
| * Voice AI Agent            [Demo]    |
+---------------------------------------+
| [Home]  [Agents]  [Inbox] [Studio] [...] | (Bottom Glass Tab Bar - 5 items)
+---------------------------------------+
```

### 3. Agent Builder & Studio (1440px Desktop)
```
+----------------------------------------------------------------------------------------------------+
| <- Agents / Dental Assistant [Published]                 [Test Agent] [Save Draft] [ Publish ] [...]| (Glass Bar)
+----------------------------------------------------+-----------------------------------------------+
| [ Prompt ] [ Knowledge ] [ Tools ] [ Channels ]    | Interactive Agent Test Sandbox                |
| -------------------------------------------------- | --------------------------------------------- |
| Agent Name                                         | [AI Avatar] Dental Assistant                  |
| [ Dental Assistant                              ]  | "Hello! Welcome to Smile Dental Clinic.       |
|                                                    |  How can I assist you today?"                 |
| Category / Persona                                 |                                               |
| [ Healthcare / Clinic Assistant                 v] | Visitor:                                      |
|                                                    | "What are your root canal pricing plans?"     |
| System Instructions Prompt                         |                                               |
| +------------------------------------------------+ | Dental Assistant:                             |
| | You are an AI Dental Assistant representing     | | "Root canal treatments start from $450...   |
| | Smile Dental Clinic. Always maintain a warm,   | |  [View Cited Source: Services & Prices PDF] |
| | empathetic, professional tone...               | |                                               |
| +------------------------------------------------+ | +-------------------------------------------+ |
|                                                    | | Type a test query...                  [->]| |
| LLM Model Provider                                 | +-------------------------------------------+ |
| [ OpenAI GPT-4o (Streaming)                     v] | Latency: 240ms | Tokens: 412 | Cost: $0.002   |
+----------------------------------------------------+-----------------------------------------------+
```

### 4. Widget Studio (Core Differentiator — 1440px Desktop)
```
+----------------------------------------------------------------------------------------------------+
| Widget Studio: Smile Dental Widget [Draft Unsaved]   [Desktop | Mobile] [Light | Dark] [ Publish ] |
+------------------------+---------------------------------------------------------------------------+
| [Brand][Theme][Bg][Txt]| Canvas Preview (Interactive Smile Dental Host Page Inside Browser Frame)  |
| ---------------------- | +-----------------------------------------------------------------------+ |
| Preset Themes          | | [o][o][o]  https://smiledentalclinic.com                              | |
| [x] Violet (Zdoda)     | |-----------------------------------------------------------------------| |
| [ ] Glass (Apple)      | |  SMILE DENTAL CLINIC                   [Home] [Treatments] [Contact]  | |
| [ ] Midnight           | |  Award-Winning Dental Healthcare...                                   | |
| [ ] Mint (Clinical)    | |                                                                       | |
| [ ] Coral              | |                                         +--------------------------+  | |
| [ ] Graphite           | |                                         | Dental Assistant    [x]  |  | |
|                        | |                                         |--------------------------|  | |
| Primary Accent Color   | |                                         | Hello! How can I help?   |  | |
| [#6538F5  ] [Picker]   | |                                         |                          |  | |
| Contrast: 6.2:1 (AAA)  | |                                         | [Ask Prices] [Book Now]  |  | |
|                        | |                                         |--------------------------|  | |
| Background FX          | |                                         | [Message...]         [^] |  | |
| [ Aurora / Mesh     v] | |                                         +--------------------------+  | |
| Speed: [---o----]      | |                                                      [Launcher (48)]  | |
| Opacity: [-----o--]    | +-----------------------------------------------------------------------+ |
+------------------------+---------------------------------------------------------------------------+
```

---

## 5. Architectural Self-Critique & Anti-Generic Guardrails

### What reads like a generic SaaS template — and how Zdoda fixes it:
1. **Generic Trap 1: Fluffy cards covered in blur on blur.**
   - *Fix:* Strict 2-layer model. Cards are 100% opaque with crisp 1px borders and almost no shadow. Only functional chrome (bars, menus, drawers) gets glass blur.
2. **Generic Trap 2: A fake visual widget preview that uses standard React divs.**
   - *Fix:* Widget Studio renders the genuine `packages/widget` runtime inside a Shadow DOM. If a style works in the Studio, it is guaranteed to look identical when embedded on an external Shopify or Webflow site.
3. **Generic Trap 3: Fake "Connected" badges with no real credentials.**
   - *Fix:* Rule 01 Honesty Contract. Services show "Demo" or "Setup required". A user never sees a green checkmark unless a server round-trip health check verified real provider credentials.
4. **Generic Trap 4: Cluttered dashboards with colorful badges everywhere.**
   - *Fix:* Single accent rule. Exactly one purple accent button per screen. Everything else uses subtle neutrals or semantic icons with labels.

### Each Screen's Signature Element
- **Landing Page:** The 3-channel shared-element morph sequence (Widget -> WhatsApp -> Voice waveform).
- **Dashboard:** Volume breakdown stacked chart with tactile channel filters and honest data markers.
- **Agent Builder:** Split-screen layout with live streaming test chat displaying actual knowledge source citations.
- **Widget Studio:** Real-time host-site browser frame reflecting design token adjustments in under 100ms.
- **Voice Studio:** Interactive animated voice waveform with live transcript streaming and call-state transitions.
- **Inbox:** Seamless Human Takeover toggle that cleanly pauses bot autonomy with instant feedback.
