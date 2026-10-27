# Zdoda UI Reference Board — Screen Inventory

Based on the 12 core screens of the Zdoda platform reference specification (`docs/design/zdoda-reference.png`), this inventory details each screen's information architecture, components, live data requirements, and the phase in which it is implemented.

---

### 1. Landing Page ("How Zdoda Works" & Hero)
- **Phase:** Phase 7 (with preview components in Phase 4)
- **Layout & Structure:**
  - Header: Logo, Navigation links (Features, How it works, Channels, Widget Studio, Pricing, FAQ), Sign In button, "Start free" primary button.
  - Hero Section: Title "One Agent. Every Channel.", Subtitle, and the **Signature Pinned Scroll Sequence**:
    1. Web chat widget answers dental patient query.
    2. Shared-element morphs into a WhatsApp conversation thread.
    3. Shared-element morphs into an active Voice call card with audio waveform.
  - "How Zdoda Works" 6-Step Section:
    1. Connect Knowledge (URLs, PDFs, Sheets)
    2. Design Widget (No-code live studio)
    3. Connect Channels (Web, WhatsApp, Voice)
    4. Configure Agent (Persona, instructions, tools)
    5. Test in Sandbox (Live streaming test panel)
    6. Deploy & Monitor (Instant publish, real-time analytics)
  - Interactive Widget Mini-Studio (3 live controls modifying the real Preact widget).
  - Multi-Channel Showcases, Template Cards, Interactive Pricing Table, Accordion FAQ, Footer.
- **Key Components:** `HeroSequenceMorph`, `InteractiveMiniStudio`, `PricingTable`, `Accordion`, `GlassBar`, `Button`.

---

### 2. Pricing & Plans
- **Phase:** Phase 2
- **Layout & Structure:**
  - Centered header: "Simple, transparent pricing" with "Demo pricing" pill.
  - Segmented control: Monthly / Yearly (Save 20%).
  - 4 Plan Cards:
    - **Starter** ($49/mo): 1 agent, website widget, basic knowledge, essential integrations, 1,000 msgs/mo.
    - **Pro** ($99/mo, "Most popular" badge): 5 agents, chat + WhatsApp, inbound voice, advanced knowledge, tools & integrations, 10,000 msgs/mo.
    - **Business** ($199/mo): Unlimited agents, white-label widget, multi-workspace, custom integrations, priority support, 50,000 msgs/mo.
    - **Agency** ("Talk to sales"): Client workspaces, white-label, custom domains, agency billing.
  - Detailed feature comparison table with checkmarks and quota limits.
  - FAQ and support contact prompt.
- **Key Components:** `SegmentedControl`, `PlanCard`, `StatusPill`, `FeatureComparisonTable`, `Button`.

---

### 3. Customer Dashboard
- **Phase:** Phase 2
- **Layout & Structure:**
  - Top Bar: Workspace switcher, ⌘K search, usage meter ("Demo" pill), notifications popover, profile.
  - Large title header: "Dashboard" with date-range picker (Last 7 days, 30 days, 90 days, Custom).
  - Row 1 — 4 KPI Stat Cards with trend badges and "Demo data" indicators:
    - Total Conversations (e.g. 2,842, +12.4%)
    - Appointments Booked (e.g. 348, +8.1%)
    - Qualified Leads (e.g. 182, +15.3%)
    - Resolution Rate (e.g. 91.2%, +2.0%)
  - Row 2 — Main Grid:
    - Left (65%): Volume Breakdown Chart (stacked bar chart by Web, WhatsApp, Voice).
    - Right (35%): Active Channels summary card (Health status pills, toggle status, quick manage).
  - Row 3 — Secondary Grid:
    - Recent Conversations feed (Thread snippet, channel icon, timestamp, lead status).
    - Top Customer Questions (Ranked list with query frequency and answered status).
    - Quick Action floating or inline card: Create Agent, Add Knowledge, Connect Channel, Customize Widget.
- **Key Components:** `StatCard`, `ChannelVolumeChart`, `ConversationRow`, `QuickActionsBar`, `StatusPill`.

---

### 4. Agent Builder & Studio
- **Phase:** Phase 3
- **Layout & Structure:**
  - Glass top action bar: Agent Name, StatusPill (Draft, Published, Live), Save Draft, Version History, "Publish" (single accent button), More Actions menu (Pause, Duplicate, Delete).
  - Split Workspace (60% Editor / 40% Live Test Panel):
    - **Left Column (Tabs):**
      - **Prompt:** Name, Role/Category, Personality & Tone sliders, System Instructions prompt editor, Model selector (OpenAI / Claude / Gemini / Mock), Temperature, Language auto-detect.
      - **Knowledge:** Multi-select checklist of connected sources with search and relevance sliders.
      - **Tools:** Enabled function tools (Calendar Booking, CRM sync, Custom API).
      - **Channels:** Channel assignment checkboxes (Web Chat, WhatsApp, Voice).
      - **Settings:** Fallback response, Escalation triggers, Human handoff phone/inbox.
    - **Right Column (Interactive Test Sandbox):**
      - Live chat simulator connected to draft agent configuration.
      - Streaming response tokens.
      - Collapsible "Retrieved Sources" card citing chunks used for each answer.
      - Latency & token counter stats.
- **Key Components:** `TabNav`, `PromptEditor`, `TestChatPanel`, `SourceCitationCard`, `VersionHistorySheet`, `Switch`.

---

### 5. Knowledge Base
- **Phase:** Phase 3
- **Layout & Structure:**
  - Large title: "Knowledge Base" with "Add Knowledge Source" primary button.
  - Filter bar: All, Web pages, Sitemap, Files (PDF/DOCX), Text & FAQs, Structured (CSV/XLSX).
  - Search input with debounce.
  - Data table:
    - Icon & Source Name
    - Type (URL / PDF / Document)
    - Extracted Chunks count
    - Last Synced timestamp
    - StatusPill: Pending (amber), Processing (spinner/blue), Active (green), Failed (red with tooltip & Retry action)
    - Row actions: Re-sync, View Chunks, Delete (with confirm dialog).
  - "Add Source" Sheet:
    - Tab 1: Website / Sitemap crawler (URL input, max depth, include patterns).
    - Tab 2: Document upload (drag & drop, MIME validation, max file size).
    - Tab 3: Q&A / FAQ manual editor.
    - Tab 4: Plain text notes.
- **Key Components:** `DataTable`, `AddSourceSheet`, `StatusPill`, `UploadZone`, `ConfirmDialog`.

---

### 6. Channels Directory
- **Phase:** Phase 4 & Phase 5
- **Layout & Structure:**
  - Segmented header: Overview, Website Chat, WhatsApp, Voice.
  - 3 Prominent Channel Cards:
    - **Website Chat Widget:** Live status, Assigned Agent, Domain whitelist count, "Open Widget Studio" button, Embed snippet copy box.
    - **WhatsApp Business:** Meta Cloud API connection status, Assigned Agent, Business phone number, Webhook URL, "Configure WhatsApp" sheet.
    - **Inbound/Outbound Voice:** Twilio connection status, Assigned Agent, Primary phone number, Voice selection, "Configure Voice" sheet.
  - Health check indicators with real round-trip timestamps or Honest "Setup required" / "Demo" pills.
- **Key Components:** `ChannelCard`, `CodeSnippetBox`, `ConfigureChannelSheet`, `StatusPill`.

---

### 7. Widget Studio (Core Differentiator)
- **Phase:** Phase 4
- **Layout & Structure:**
  - **Top Glass Toolbar:**
    - Segmented control: Desktop Browser Frame / Mobile Phone Frame (390×844)
    - Layout selector: Bubble / Inline (V2: Side panel, Popup, Full page)
    - Appearance preview toggle: Light / Dark / Auto (follows host)
    - Unsaved changes indicator ("Draft unsaved")
    - Actions: Reset to Published, Version History, Save Draft (⌘S), "Publish" (primary accent).
  - **Left Inspector (360px):**
    - **Brand Tab:** Bot name, tagline, avatar uploader (image / initials / generated), header logo.
    - **Theme Tab:** 6 Presets (Violet, Glass, Midnight, Mint, Coral, Graphite), Primary color picker, Auto-palette generator, Contrast validation score, Radius & Density selectors.
    - **Background Tab:** Background shaders (Solid, Gradient, Aurora, Particles, Waves, Bokeh), speed/opacity/blur controls, Reduced-motion indicator.
    - **Launcher Tab:** Style (Icon / Text / Both), Shape (Circle / Pill / Square), Position (Right / Left), Offset X/Y, Entrance animation, Glass toggle, Unread badge.
    - **Texts Tab:** Welcome title, Welcome message, Input placeholder, Quick reply chips editor, Disclaimer, Footer links.
  - **Right Preview Canvas:**
    - Live host site simulator (Smile Dental mockup page).
    - Real Preact Widget mounted inside Shadow DOM (`mode: "closed"`).
    - Sub-100ms real-time parameter reflection.
- **Key Components:** `WidgetInspector`, `WidgetPreviewCanvas`, `DeviceFrame`, `ShadowDOMMount`, `VersionHistorySheet`.

---

### 8. Voice Assistant Studio
- **Phase:** Phase 5
- **Layout & Structure:**
  - Active Voice Call Screen:
    - Center call card with agent avatar and glowing interactive audio waveform (`<canvas>`).
    - Active call timer, Mute audio toggle, End call red button, Numeric keypad popover.
    - Live streaming transcript window (Customer voice in, Agent voice out).
    - Call-flow diagram / state machine tab showing intent recognition and routing.
  - Voice Configuration Panel:
    - Telephony provider status (Twilio / Mock).
    - Voice model picker (OpenAI Realtime / ElevenLabs / Cartesia / Web Speech).
    - Accent & language selector, Speech rate, Interruption sensitivity.
    - Human escalation phone number & consent disclaimer setting.
- **Key Components:** `WaveformVisualizer`, `TranscriptStream`, `CallControls`, `PhoneKeypad`, `StatusPill`.

---

### 9. Omnichannel Inbox
- **Phase:** Phase 5
- **Layout & Structure:**
  - 3-Column Communication Hub:
    - **Left Column (Thread List):** Filter by channel (All, Web, WhatsApp, Voice), filter by status (Open, Pending, Resolved), search box. Thread items show user name, channel badge, preview snippet, time, lead status.
    - **Center Column (Active Thread):** Message history with timestamps, delivery status, audio recording player (for voice calls) with audio scrubber, message composer with canned responses, Human Takeover banner ("Agent Paused — You are speaking directly to user").
    - **Right Column (Contact & CRM Dossier):** Contact name, email, phone number, extracted lead qualifiers, appointment history, internal staff notes, "Return control to AI Agent" button.
- **Key Components:** `ThreadList`, `MessageTimeline`, `AudioPlayer`, `TakeoverBanner`, `ContactDossier`.

---

### 10. Tools & Integrations Directory
- **Phase:** Phase 5
- **Layout & Structure:**
  - Category tabs: All, Business Apps, Workflow Automations, Custom APIs, Model Context Protocol (MCP).
  - Cards grid:
    - Google Calendar (Bookings & availability)
    - Google Sheets (Lead export & data lookup)
    - Slack (Staff alerts on escalations)
    - Make & n8n (Webhook triggering)
    - HubSpot & GoHighLevel (CRM contact synchronization)
    - Custom REST Tool Builder (Header authentication, JSON schema input params, test payload tester)
  - Connection status: Live, Test mode, Setup required, Coming soon.
- **Key Components:** `IntegrationCard`, `ToolBuilderModal`, `OAuthConnectModal`, `JsonSchemaEditor`.

---

### 11. Analytics & Reports
- **Phase:** Phase 6
- **Layout & Structure:**
  - Date filter: 24h, 7d, 30d, 90d, Custom Range + "Export CSV" button.
  - KPI Tiles: Total Conversations, Average Handling Time, Resolution Rate, Lead Conversion %.
  - Visualizations:
    - Conversations by Channel Donut & Line charts.
    - Heatmap of peak contact hours.
    - Agent Performance Comparison table (Conversations, CSAT, Fallback count).
    - Quota Consumption Gauge (Messages used vs plan limit).
- **Key Components:** `DateRangePicker`, `DonutChart`, `LineChart`, `HeatmapGrid`, `ExportButton`.

---

### 12. Team, Workspace, Billing & Settings
- **Phase:** Phase 6 (Settings & Team), Phase 2 (Billing)
- **Layout & Structure:**
  - Apple-style Grouped Inset Lists:
    - **Workspace:** Name, Slug, Logo, Timezone, Agency Client Workspaces.
    - **Team Members:** Member list, Role badge (Owner, Admin, Builder, Agent, Viewer), Invite modal with role selector, Ownership transfer.
    - **Audit Log:** Chronological table of sensitive actions (logins, publishes, billing changes).
    - **Billing & Subscription:** Current plan, billing cycle, invoice history, payment card details, upgrade/cancel flow.
    - **Accessibility & Preferences:** Reduced motion toggle, Reduced transparency toggle, Light/Dark/System theme selector.
    - **API Keys:** Workspaces developer keys (hashed at rest, generated once).
- **Key Components:** `GroupedInsetList`, `MemberTable`, `InviteModal`, `AuditLogTable`, `ThemeSwitcher`.
