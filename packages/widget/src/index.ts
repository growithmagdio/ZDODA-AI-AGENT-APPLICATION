import type { Citation, WidgetConfigV1 } from '@zdoda/shared';

/**
 * Zdoda chat widget runtime.
 * - Renders entirely inside a Shadow DOM (no CSS leaks either way).
 * - Driven by WidgetConfigV1 — the same object Widget Studio edits, so preview === production.
 * - Transport-agnostic: the host passes `onSend` (Studio → test endpoint, embed → public API).
 */

export interface WidgetReply {
  reply: { text: string; citations?: Citation[] } | null;
  takeover?: boolean;
}

export interface WidgetMessage {
  id?: string;
  role: 'user' | 'assistant' | 'human' | 'system';
  text: string;
  citations?: Citation[];
  authorName?: string | null;
}

export interface MountWidgetOptions {
  mode: 'live' | 'preview';
  onSend?: (text: string) => Promise<WidgetReply>;
  /** Start opened (Studio preview). */
  startOpen?: boolean;
  /** Called when the visitor opens/closes the panel. */
  onToggle?: (open: boolean) => void;
  initialMessages?: WidgetMessage[];
}

export interface WidgetInstance {
  update: (config: WidgetConfigV1) => void;
  destroy: () => void;
  open: () => void;
  close: () => void;
  addMessage: (msg: WidgetMessage) => void;
  setMessages: (msgs: WidgetMessage[]) => void;
  setStatus: (text: string | null) => void;
}

// ---------------------------------------------------------------------------
// Theme helpers
// ---------------------------------------------------------------------------
const PRESETS: Record<WidgetConfigV1['theme']['preset'], { primary: string; dark?: boolean }> = {
  violet: { primary: '#6538F5' },
  glass: { primary: '#0A84FF' },
  midnight: { primary: '#7C5CFF', dark: true },
  mint: { primary: '#10B981' },
  coral: { primary: '#F2545B' },
  graphite: { primary: '#3A3A3C' },
};

const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/i;
const safeColor = (c: string | undefined, fallback: string) => (c && COLOR_RE.test(c.trim()) ? c.trim() : fallback);
const safeUrl = (u: string | undefined) => {
  if (!u) return '';
  try {
    const url = new URL(u, typeof location !== 'undefined' ? location.href : 'https://x.invalid');
    return ['http:', 'https:', 'data:', 'blob:'].includes(url.protocol) ? url.toString().replace(/["\\\n]/g, encodeURIComponent) : '';
  } catch {
    return '';
  }
};

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '');
  if (![3, 6, 8].includes(m.length)) return null;
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readableOn(bg: string): string {
  const rgb = hexToRgb(bg);
  if (!rgb) return '#ffffff';
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#111111' : '#ffffff';
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Minimal, safe formatting: escape first, then links, **bold** and line breaks. */
function formatText(s: string) {
  return escapeHtml(s)
    .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

const FONTS: Record<WidgetConfigV1['theme']['fontFamily'], string> = {
  system: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  inter: '"Inter", -apple-system, "Segoe UI", sans-serif',
  serif: '"Iowan Old Style", "Georgia", "Times New Roman", serif',
  rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", "Quicksand", sans-serif',
};

const ICONS: Record<string, string> = {
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>',
  headset: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
};
const svg = (inner: string, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

interface Palette {
  primary: string;
  onPrimary: string;
  header: string;
  headerText: string;
  userBubble: string;
  userText: string;
  botBubble: string;
  botText: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  button: string;
  buttonText: string;
  dark: boolean;
}

function palette(cfg: WidgetConfigV1, prefersDark: boolean): Palette {
  const preset = PRESETS[cfg.theme.preset] || PRESETS.violet;
  const primary = safeColor(cfg.theme.primary, preset.primary);
  const dark = cfg.theme.appearance === 'dark' || (cfg.theme.appearance === 'auto' && prefersDark) || (cfg.theme.preset === 'midnight' && cfg.theme.appearance !== 'light');
  const onPrimary = readableOn(primary);
  const base: Palette = {
    primary,
    onPrimary,
    header: primary,
    headerText: onPrimary,
    userBubble: primary,
    userText: onPrimary,
    botBubble: dark ? '#2C2C2E' : '#EEEEF2',
    botText: dark ? '#F2F2F7' : '#111114',
    surface: dark ? '#161618' : '#FFFFFF',
    text: dark ? '#F2F2F7' : '#111114',
    muted: dark ? '#9A9AA2' : '#6E6E76',
    border: dark ? 'rgba(255,255,255,0.10)' : 'rgba(17,17,20,0.08)',
    button: primary,
    buttonText: onPrimary,
    dark,
  };
  if (cfg.theme.preset === 'glass') {
    base.header = dark ? 'rgba(30,30,34,0.72)' : 'rgba(255,255,255,0.72)';
    base.headerText = base.text;
  }
  if (cfg.theme.palette === 'custom' && cfg.theme.colors) {
    const c = cfg.theme.colors;
    (Object.keys(c) as (keyof typeof c)[]).forEach((k) => {
      const v = c[k];
      if (v && COLOR_RE.test(v)) (base as any)[k] = v;
    });
  }
  return base;
}

function backgroundCss(cfg: WidgetConfigV1, p: Palette): { css: string; video?: string } {
  const bg = cfg.background;
  const [c0 = p.surface, c1 = p.surface, c2 = p.primary] = (bg.colors || []).map((c) => safeColor(c, p.surface));
  const dur = (s: number) => `${Math.max(4, s / Math.max(bg.speed || 1, 0.1))}s`;
  switch (bg.type) {
    case 'gradient':
      return { css: `background: linear-gradient(160deg, ${c0}, ${c1});` };
    case 'aurora':
      return {
        css: `background: radial-gradient(60% 50% at 20% 20%, ${c0} 0%, transparent 70%), radial-gradient(50% 50% at 80% 30%, ${c1} 0%, transparent 70%), radial-gradient(60% 60% at 50% 90%, ${c2}55 0%, transparent 70%), ${p.surface}; background-size: 200% 200%; animation: zd-aurora ${dur(14)} ease-in-out infinite alternate;`,
      };
    case 'bokeh':
      return {
        css: `background: radial-gradient(circle at 15% 25%, ${c0} 0 40px, transparent 41px), radial-gradient(circle at 75% 15%, ${c1} 0 60px, transparent 61px), radial-gradient(circle at 60% 70%, ${c2}44 0 80px, transparent 81px), radial-gradient(circle at 25% 85%, ${c1}aa 0 30px, transparent 31px), ${p.surface}; animation: zd-float ${dur(10)} ease-in-out infinite alternate;`,
      };
    case 'waves':
      return {
        css: `background: repeating-linear-gradient(120deg, ${c0} 0 40px, ${c1} 40px 80px); background-size: 300% 300%; animation: zd-aurora ${dur(18)} linear infinite;`,
      };
    case 'particles':
      return {
        css: `background-color: ${c0}; background-image: radial-gradient(${c2}66 1.2px, transparent 1.4px), radial-gradient(${c1} 1px, transparent 1.2px); background-size: 22px 22px, 37px 37px; animation: zd-drift ${dur(30)} linear infinite;`,
      };
    case 'image': {
      const url = safeUrl(bg.imageUrl);
      return { css: url ? `background: url("${url}") center/cover no-repeat;` : `background: ${c0};` };
    }
    case 'video':
      return { css: `background: ${c0};`, video: safeUrl(bg.videoUrl) || undefined };
    default:
      return { css: `background: ${c0};` };
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
function styles(cfg: WidgetConfigV1, p: Palette, mode: MountWidgetOptions['mode']): string {
  const pos = mode === 'live' ? 'fixed' : 'absolute';
  const side = cfg.launcher.position === 'left' ? 'left' : 'right';
  const r = cfg.theme.radius;
  const compact = cfg.theme.density === 'compact';
  const size = cfg.launcher.size;
  const ox = cfg.launcher.offsetX;
  const oy = cfg.launcher.offsetY;
  const W = Math.min(Math.max(cfg.layout.width, 300), 520);
  const H = Math.min(Math.max(cfg.layout.height, 420), 820);
  const bg = backgroundCss(cfg, p);
  const glass = cfg.launcher.glass;
  const shape = cfg.launcher.shape === 'square' ? `${Math.round(size / 3.5)}px` : '999px';
  const layout = cfg.layout.mode;

  const panelPlacement =
    layout === 'side_panel'
      ? `top: 0; bottom: 0; ${side}: 0; width: ${W}px; max-width: 100%; height: 100%; border-radius: 0;`
      : layout === 'popup'
        ? `top: 50%; left: 50%; width: ${W}px; height: ${H}px; max-width: calc(100% - 24px); max-height: calc(100% - 24px); transform-origin: center; translate: -50% -50%;`
        : layout === 'fullpage' || layout === 'inline'
          ? `inset: 0; width: 100%; height: 100%; border-radius: ${layout === 'inline' ? r + 'px' : '0'};`
          : `bottom: ${oy + size + 14}px; ${side}: ${ox}px; width: ${W}px; height: ${H}px; max-height: calc(100% - ${oy + size + 28}px); max-width: calc(100% - ${ox * 2}px); transform-origin: bottom ${side};`;

  return `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    .zd-root {
      --p: ${p.primary}; --on-p: ${p.onPrimary};
      font-family: ${FONTS[cfg.theme.fontFamily]}; color: ${p.text};
      -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.45;
    }
    button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
    a { color: inherit; }

    .zd-launcher {
      position: ${pos}; bottom: ${oy}px; ${side}: ${ox}px; z-index: 2147483000;
      height: ${size}px; min-width: ${size}px; padding: 0 ${cfg.launcher.style === 'icon' ? 0 : 18}px;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      border-radius: ${shape}; font-weight: 600; font-size: 15px;
      background: ${glass ? 'rgba(255,255,255,0.55)' : p.button}; color: ${glass ? p.primary : p.buttonText};
      ${glass ? 'backdrop-filter: blur(18px) saturate(1.6); -webkit-backdrop-filter: blur(18px) saturate(1.6); border: 1px solid rgba(255,255,255,0.7);' : ''}
      box-shadow: 0 10px 30px -8px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.12);
      transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
      animation: zd-in-${cfg.launcher.entrance} .5s cubic-bezier(.34,1.56,.64,1) both;
    }
    .zd-launcher:hover { transform: translateY(-2px) scale(1.03); }
    .zd-launcher:active { transform: scale(.94); }
    .zd-launcher:focus-visible, .zd-chip:focus-visible, .zd-send:focus-visible, .zd-icon-btn:focus-visible { outline: 3px solid ${p.primary}55; outline-offset: 2px; }
    .zd-badge { position: absolute; top: -2px; ${side === 'right' ? 'right' : 'left'}: -2px; width: 18px; height: 18px; border-radius: 9px; background: #FF3B30; color: #fff; font-size: 11px; display: none; align-items: center; justify-content: center; border: 2px solid #fff; }
    .zd-badge.show { display: flex; }
    .zd-greeting {
      position: ${pos}; bottom: ${oy + size + 12}px; ${side}: ${ox}px; z-index: 2147483000; max-width: 260px;
      background: ${p.surface}; color: ${p.text}; padding: 12px 14px; border-radius: 16px; font-size: 14px;
      box-shadow: 0 12px 32px -8px rgba(0,0,0,.25); border: 1px solid ${p.border}; cursor: pointer;
      animation: zd-in-pop .45s cubic-bezier(.34,1.56,.64,1) both;
    }

    .zd-backdrop { position: ${pos}; inset: 0; background: rgba(0,0,0,.35); z-index: 2147483000; display: none; }
    .zd-panel {
      position: ${layout === 'inline' ? 'relative' : pos}; ${layout === 'inline' ? `width: 100%; height: ${H}px; border-radius: ${r}px;` : panelPlacement}
      z-index: 2147483001; display: flex; flex-direction: column; overflow: hidden;
      background: ${p.surface}; border-radius: ${layout === 'side_panel' || layout === 'fullpage' ? 0 : Math.max(r + 6, 16)}px;
      border: 1px solid ${p.border}; box-shadow: 0 24px 64px -16px rgba(0,0,0,.35);
      opacity: 0; transform: translateY(16px) scale(.96); pointer-events: none;
      transition: opacity .22s ease, transform .32s cubic-bezier(.32,.72,0,1);
    }
    .zd-root.open .zd-panel { opacity: 1; transform: none; pointer-events: auto; }
    .zd-root.open .zd-backdrop { display: ${layout === 'popup' ? 'block' : 'none'}; }
    .zd-root.always .zd-panel { opacity: 1; transform: none; pointer-events: auto; }
    ${mode === 'live' && layout === 'bubble' ? `@media (max-width: 520px) { .zd-panel { inset: 0 !important; width: 100% !important; height: 100% !important; max-height: none !important; max-width: none !important; border-radius: 0 !important; } }` : ''}

    .zd-bg { position: absolute; inset: 0; z-index: 0; ${bg.css} opacity: ${cfg.background.opacity}; filter: blur(${cfg.background.blur}px); pointer-events: none; }
    .zd-bg video { width: 100%; height: 100%; object-fit: cover; }
    .zd-panel > :not(.zd-bg) { position: relative; z-index: 1; }

    .zd-header { display: flex; align-items: center; gap: 10px; padding: ${compact ? '10px 12px' : '14px 16px'}; background: ${p.header}; color: ${p.headerText}; ${cfg.theme.preset === 'glass' ? 'backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid ' + p.border + ';' : ''} }
    .zd-header-img { height: 64px; background-size: cover; background-position: center; }
    .zd-av { width: ${compact ? 32 : 38}px; height: ${compact ? 32 : 38}px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; background: ${p.headerText === p.text ? p.primary : 'rgba(255,255,255,.22)'}; color: ${p.headerText === p.text ? p.onPrimary : p.headerText}; overflow: hidden; }
    .zd-av img { width: 100%; height: 100%; object-fit: cover; }
    .zd-title { font-weight: 700; font-size: 15px; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zd-sub { font-size: 12px; opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zd-sub::before { content: ''; display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #34C759; margin-right: 6px; vertical-align: 1px; }
    .zd-logo { height: 22px; max-width: 90px; object-fit: contain; margin-left: auto; }
    .zd-icon-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(127,127,127,.16); flex: none; }
    .zd-head-text { min-width: 0; flex: 1; }

    .zd-messages { flex: 1; overflow-y: auto; padding: ${compact ? '12px' : '16px'}; display: flex; flex-direction: column; gap: ${compact ? 6 : 8}px; scroll-behavior: smooth; }
    .zd-welcome { text-align: center; padding: 8px 8px 12px; }
    .zd-welcome h3 { font-size: 16px; font-weight: 700; margin-bottom: 2px; color: ${p.text}; }
    .zd-welcome p { font-size: 12px; color: ${p.muted}; }
    .zd-msg { max-width: 82%; padding: ${compact ? '7px 11px' : '9px 13px'}; border-radius: ${r + 4}px; word-wrap: break-word; overflow-wrap: anywhere; animation: zd-msg .28s cubic-bezier(.34,1.3,.64,1) both; }
    .zd-msg a { text-decoration: underline; }
    .zd-msg.user { align-self: flex-end; background: ${p.userBubble}; color: ${p.userText}; border-bottom-right-radius: 5px; }
    .zd-msg.assistant, .zd-msg.human { align-self: flex-start; background: ${p.botBubble}; color: ${p.botText}; border-bottom-left-radius: 5px; }
    .zd-author { font-size: 11px; color: ${p.muted}; margin: 4px 0 -2px 4px; align-self: flex-start; }
    .zd-sys { align-self: center; font-size: 11px; color: ${p.muted}; padding: 4px 0; }
    .zd-cites { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    .zd-cite { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: ${p.dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)'}; text-decoration: none !important; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zd-typing { align-self: flex-start; display: none; gap: 4px; padding: 12px 14px; background: ${p.botBubble}; border-radius: ${r + 4}px; border-bottom-left-radius: 5px; }
    .zd-typing.on { display: flex; }
    .zd-typing i { width: 7px; height: 7px; border-radius: 50%; background: ${p.muted}; animation: zd-dot 1.2s infinite ease-in-out; }
    .zd-typing i:nth-child(2) { animation-delay: .15s; } .zd-typing i:nth-child(3) { animation-delay: .3s; }

    .zd-chips { display: flex; gap: 6px; padding: 0 ${compact ? 12 : 16}px 8px; overflow-x: auto; scrollbar-width: none; }
    .zd-chips::-webkit-scrollbar { display: none; }
    .zd-chip { white-space: nowrap; padding: 7px 12px; border-radius: 999px; font-size: 13px; font-weight: 500; color: ${p.dark ? p.text : p.primary}; background: ${p.dark ? 'rgba(255,255,255,.06)' : p.surface}; border: 1px solid ${p.dark ? p.border : p.primary + '40'}; transition: transform .15s; }
    .zd-chip:active { transform: scale(.96); }

    .zd-composer { display: flex; gap: 8px; align-items: flex-end; padding: ${compact ? '8px 10px' : '10px 12px'}; border-top: 1px solid ${p.border}; background: ${p.surface}; }
    .zd-input { flex: 1; resize: none; min-height: 40px; max-height: 120px; padding: 9px 14px; border-radius: ${Math.max(r, 12) + 6}px; border: 1px solid ${p.border}; background: ${p.dark ? '#232326' : '#F6F6F8'}; color: ${p.text}; font: inherit; font-size: 15px; outline: none; }
    .zd-input:focus { border-color: ${p.primary}; box-shadow: 0 0 0 3px ${p.primary}22; }
    .zd-send { width: 40px; height: 40px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; background: ${p.button}; color: ${p.buttonText}; transition: transform .15s, opacity .15s; }
    .zd-send:disabled { opacity: .4; cursor: default; }
    .zd-send:not(:disabled):active { transform: scale(.9); }
    .zd-foot { text-align: center; font-size: 11px; color: ${p.muted}; padding: 0 12px 8px; background: ${p.surface}; }
    .zd-foot a { text-decoration: none; font-weight: 600; }
    .zd-status { text-align: center; font-size: 12px; color: ${p.muted}; padding: 6px 12px; background: ${p.dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'}; display: none; }
    .zd-status.on { display: block; }

    @keyframes zd-dot { 0%, 100% { transform: translateY(0); opacity: .5; } 50% { transform: translateY(-3px); opacity: 1; } }
    @keyframes zd-msg { from { opacity: 0; transform: translateY(6px) scale(.98); } }
    @keyframes zd-in-pop { from { opacity: 0; transform: scale(.6); } }
    @keyframes zd-in-fade { from { opacity: 0; } }
    @keyframes zd-in-slide { from { opacity: 0; transform: translateY(24px); } }
    @keyframes zd-in-none { from { opacity: 1; } }
    @keyframes zd-aurora { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
    @keyframes zd-float { 0% { background-position: 0 0, 0 0, 0 0, 0 0; } 100% { background-position: 10px -14px, -16px 10px, 12px 8px, -6px -10px; } }
    @keyframes zd-drift { from { background-position: 0 0, 0 0; } to { background-position: 220px 440px, -370px 370px; } }
    ${cfg.background.respectReducedMotion ? '@media (prefers-reduced-motion: reduce) { .zd-bg, .zd-launcher, .zd-msg, .zd-greeting { animation: none !important; } .zd-panel { transition: none; } }' : ''}
    ${cfg.advanced.customCss ? cfg.advanced.customCss.replace(/<\/?style/gi, '') : ''}
  `;
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
export function mountWidget(container: HTMLElement, config: WidgetConfigV1, options: MountWidgetOptions = { mode: 'preview' }): WidgetInstance {
  let cfg = config;
  let isOpen = Boolean(options.startOpen);
  let sending = false;
  let unread = 0;
  let statusText: string | null = null;
  let greetingTimer: ReturnType<typeof setTimeout> | undefined;
  let greetingShown = false;
  const messages: WidgetMessage[] = [...(options.initialMessages || [])];
  const shadow = container.shadowRoot || container.attachShadow({ mode: 'open' });
  const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null;

  let els: {
    root: HTMLElement;
    panel: HTMLElement;
    list: HTMLElement;
    typing: HTMLElement;
    input: HTMLTextAreaElement;
    send: HTMLButtonElement;
    chips: HTMLElement;
    launcher: HTMLElement | null;
    badge: HTMLElement | null;
    status: HTMLElement;
  };

  const alwaysOpen = () => cfg.layout.mode === 'fullpage' || cfg.layout.mode === 'inline';

  function avatarHtml() {
    const a = cfg.brand.avatar;
    const url = safeUrl(a?.url);
    if (a?.type === 'upload' && url) return `<img src="${url}" alt="">`;
    return escapeHtml((a?.initials || cfg.brand.botName.slice(0, 2)).slice(0, 3).toUpperCase());
  }

  function messageNode(m: WidgetMessage): DocumentFragment {
    const frag = document.createDocumentFragment();
    if (m.role === 'system') {
      const s = document.createElement('div');
      s.className = 'zd-sys';
      s.textContent = m.text;
      frag.appendChild(s);
      return frag;
    }
    if (m.role === 'human' && m.authorName) {
      const a = document.createElement('div');
      a.className = 'zd-author';
      a.textContent = m.authorName;
      frag.appendChild(a);
    }
    const el = document.createElement('div');
    el.className = `zd-msg ${m.role}`;
    if (m.role === 'user') el.textContent = m.text;
    else el.innerHTML = formatText(m.text);
    const cites = (m.citations || []).filter((c) => c.url || c.title);
    if (cites.length && m.role === 'assistant') {
      const box = document.createElement('div');
      box.className = 'zd-cites';
      for (const c of cites.slice(0, 3)) {
        const link = document.createElement(c.url ? 'a' : 'span');
        link.className = 'zd-cite';
        link.textContent = c.title || 'Source';
        if (c.url && link instanceof HTMLAnchorElement) {
          link.href = safeUrl(c.url) || '#';
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        box.appendChild(link);
      }
      el.appendChild(box);
    }
    frag.appendChild(el);
    return frag;
  }

  function scrollToEnd() {
    requestAnimationFrame(() => (els.list.scrollTop = els.list.scrollHeight));
  }

  function beep() {
    if (!cfg.behavior.soundOnMessage || options.mode !== 'live') return;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.04, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.2);
    } catch {
      /* audio not allowed */
    }
  }

  function render() {
    const p = palette(cfg, Boolean(mq?.matches));
    const bg = backgroundCss(cfg, p);
    const always = alwaysOpen();
    const showLauncher = !always;
    const hideBranding = cfg.advanced.hideBranding;
    const icon = ICONS[cfg.launcher.icon] || ICONS['message-circle'];
    const launcherInner =
      cfg.launcher.style === 'text'
        ? `<span>${escapeHtml(cfg.launcher.label)}</span>`
        : cfg.launcher.style === 'icon_text'
          ? `${svg(icon)}<span>${escapeHtml(cfg.launcher.label)}</span>`
          : svg(icon, Math.round(cfg.launcher.size * 0.44));
    const logo = safeUrl(cfg.brand.logoUrl);
    const headerImg = safeUrl(cfg.brand.headerImageUrl);

    shadow.innerHTML = `
      <style>${styles(cfg, p, options.mode)}</style>
      <div class="zd-root ${isOpen || always ? 'open' : ''} ${always ? 'always' : ''}" part="root">
        <div class="zd-backdrop"></div>
        <section class="zd-panel" role="dialog" aria-label="${escapeHtml(cfg.brand.botName)} chat" aria-hidden="${!(isOpen || always)}">
          <div class="zd-bg">${bg.video ? `<video src="${bg.video}" autoplay muted loop playsinline></video>` : ''}</div>
          ${headerImg ? `<div class="zd-header-img" style="background-image:url(&quot;${headerImg}&quot;)"></div>` : ''}
          <header class="zd-header">
            <div class="zd-av">${avatarHtml()}</div>
            <div class="zd-head-text">
              <div class="zd-title">${escapeHtml(cfg.brand.botName)}</div>
              <div class="zd-sub">${escapeHtml(cfg.brand.tagline || 'Typically replies instantly')}</div>
            </div>
            ${logo ? `<img class="zd-logo" src="${logo}" alt="">` : ''}
            ${always ? '' : `<button class="zd-icon-btn" data-close aria-label="Close chat">${svg('<path d="M18 6 6 18M6 6l12 12"/>', 16)}</button>`}
          </header>
          <div class="zd-status" aria-live="polite"></div>
          <div class="zd-messages" role="log" aria-live="polite">
            <div class="zd-welcome"><h3>${escapeHtml(cfg.texts.welcomeTitle)}</h3>${cfg.texts.disclaimer ? `<p>${escapeHtml(cfg.texts.disclaimer)}</p>` : ''}</div>
            <div class="zd-typing" aria-label="Typing"><i></i><i></i><i></i></div>
          </div>
          <div class="zd-chips"></div>
          <form class="zd-composer">
            <textarea class="zd-input" rows="1" placeholder="${escapeHtml(cfg.texts.placeholder)}" aria-label="Message" maxlength="2000" enterkeyhint="send"></textarea>
            <button class="zd-send" type="submit" aria-label="Send" disabled>${svg('<path d="M12 19V5M5 12l7-7 7 7"/>', 18)}</button>
          </form>
          ${
            hideBranding && !cfg.texts.privacyUrl
              ? ''
              : `<div class="zd-foot">${hideBranding ? '' : `<a href="https://zdoda.app" target="_blank" rel="noopener">${escapeHtml(cfg.texts.footerText || 'Powered by Zdoda')}</a>`}${
                  cfg.texts.privacyUrl ? `${hideBranding ? '' : ' · '}<a href="${safeUrl(cfg.texts.privacyUrl)}" target="_blank" rel="noopener">Privacy</a>` : ''
                }</div>`
          }
        </section>
        ${showLauncher ? `<button class="zd-launcher" aria-label="${isOpen ? 'Close' : 'Open'} chat with ${escapeHtml(cfg.brand.botName)}" aria-expanded="${isOpen}">${launcherInner}<span class="zd-badge">1</span></button>` : ''}
      </div>`;

    const q = <T extends Element>(s: string) => shadow.querySelector(s) as T;
    els = {
      root: q('.zd-root'),
      panel: q('.zd-panel'),
      list: q('.zd-messages'),
      typing: q('.zd-typing'),
      input: q('.zd-input'),
      send: q('.zd-send'),
      chips: q('.zd-chips'),
      launcher: q<HTMLElement>('.zd-launcher'),
      badge: q<HTMLElement>('.zd-badge'),
      status: q('.zd-status'),
    };

    // Welcome + history
    const welcome: WidgetMessage = { role: 'assistant', text: cfg.texts.welcomeMessage };
    for (const m of [welcome, ...messages]) els.list.insertBefore(messageNode(m), els.typing);
    renderChips();
    setStatusEl();
    if (unread && els.badge) els.badge.classList.add('show');

    els.launcher?.addEventListener('click', () => (isOpen ? close() : open()));
    q<HTMLElement>('[data-close]')?.addEventListener('click', close);
    q<HTMLElement>('.zd-backdrop')?.addEventListener('click', close);
    els.input.addEventListener('input', () => {
      els.send.disabled = !els.input.value.trim() || sending;
      els.input.style.height = 'auto';
      els.input.style.height = Math.min(els.input.scrollHeight, 120) + 'px';
    });
    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        submit(els.input.value);
      }
      if (e.key === 'Escape' && !alwaysOpen()) close();
    });
    q<HTMLFormElement>('.zd-composer').addEventListener('submit', (e) => {
      e.preventDefault();
      submit(els.input.value);
    });
    scrollToEnd();
  }

  function renderChips() {
    els.chips.innerHTML = '';
    if (messages.some((m) => m.role === 'user')) return;
    for (const text of cfg.texts.quickReplies.slice(0, 6)) {
      const b = document.createElement('button');
      b.className = 'zd-chip';
      b.type = 'button';
      b.textContent = text;
      b.addEventListener('click', () => submit(text));
      els.chips.appendChild(b);
    }
  }

  function setStatusEl() {
    els.status.textContent = statusText || '';
    els.status.classList.toggle('on', Boolean(statusText));
  }

  function addMessage(m: WidgetMessage) {
    messages.push(m);
    els.list.insertBefore(messageNode(m), els.typing);
    if (m.role === 'user') renderChips();
    if (m.role !== 'user' && !isOpen && !alwaysOpen()) {
      unread++;
      els.badge?.classList.add('show');
      if (els.badge) els.badge.textContent = String(Math.min(unread, 9));
    }
    if (m.role !== 'user') beep();
    scrollToEnd();
  }

  async function submit(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;
    sending = true;
    els.input.value = '';
    els.input.style.height = 'auto';
    els.send.disabled = true;
    addMessage({ role: 'user', text });
    els.typing.classList.add('on');
    scrollToEnd();
    try {
      if (!options.onSend) {
        await new Promise((r) => setTimeout(r, 700));
        addMessage({ role: 'assistant', text: 'This is a preview — connect an agent to get real answers.' });
      } else {
        const res = await options.onSend(text);
        if (res.reply) addMessage({ role: 'assistant', text: res.reply.text, citations: res.reply.citations });
      }
    } catch (err: any) {
      addMessage({ role: 'system', text: err?.message || 'Message not sent. Please try again.' });
    } finally {
      sending = false;
      els.typing.classList.remove('on');
      els.send.disabled = !els.input.value.trim();
    }
  }

  function open() {
    if (alwaysOpen()) return;
    isOpen = true;
    unread = 0;
    els.root.classList.add('open');
    els.panel.setAttribute('aria-hidden', 'false');
    els.badge?.classList.remove('show');
    shadow.querySelector('.zd-greeting')?.remove();
    els.launcher?.setAttribute('aria-expanded', 'true');
    options.onToggle?.(true);
    setTimeout(() => (options.mode === 'live' ? els.input.focus({ preventScroll: true }) : null), 220);
    scrollToEnd();
  }

  function close() {
    if (alwaysOpen()) return;
    isOpen = false;
    els.root.classList.remove('open');
    els.panel.setAttribute('aria-hidden', 'true');
    els.launcher?.setAttribute('aria-expanded', 'false');
    options.onToggle?.(false);
    els.launcher?.focus({ preventScroll: true });
  }

  function scheduleGreeting() {
    clearTimeout(greetingTimer);
    const g = cfg.behavior.proactiveGreeting;
    if (!g?.enabled || alwaysOpen() || greetingShown) return;
    greetingTimer = setTimeout(
      () => {
        if (isOpen) return;
        greetingShown = options.mode === 'live';
        const el = document.createElement('div');
        el.className = 'zd-greeting';
        el.textContent = g.message;
        el.addEventListener('click', open);
        els.root.appendChild(el);
      },
      options.mode === 'preview' ? 600 : Math.max(0, g.delaySec) * 1000
    );
  }

  render();
  scheduleGreeting();
  const onScheme = () => cfg.theme.appearance === 'auto' && render();
  mq?.addEventListener?.('change', onScheme);
  if (cfg.behavior.openOnLoad && options.mode === 'live' && !isOpen) setTimeout(open, 400);

  return {
    update(next) {
      const draft = els.input?.value || '';
      cfg = next;
      render();
      els.input.value = draft;
      els.send.disabled = !draft.trim();
      scheduleGreeting();
    },
    destroy() {
      clearTimeout(greetingTimer);
      mq?.removeEventListener?.('change', onScheme);
      shadow.innerHTML = '';
    },
    open,
    close,
    addMessage,
    setMessages(list) {
      messages.length = 0;
      messages.push(...list);
      render();
    },
    setStatus(text) {
      statusText = text;
      setStatusEl();
    },
  };
}
