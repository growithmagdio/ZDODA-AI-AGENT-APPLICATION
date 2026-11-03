/**
 * Zdoda embed loader — the file customers paste on their site:
 *   <script src="https://YOUR_APP/zdoda-widget.js" data-widget-id="WIDGET_ID" async></script>
 * Optional: data-api="https://api.example.com" (defaults to the script's origin).
 * Programmatic API: window.Zdoda.open() / .close()
 */
import type { WidgetConfigV1 } from '@zdoda/shared';
import { mountWidget, type WidgetInstance, type WidgetMessage } from './index';

interface ChatResponse {
  conversationId: string;
  conversationToken?: string;
  reply: { text: string; citations?: any[] } | null;
  takeover: boolean;
  status: string;
}

(function boot() {
  const w = window as any;
  if (w.__zdodaLoaded) return;
  w.__zdodaLoaded = true;

  const script = (document.currentScript as HTMLScriptElement | null) || document.querySelector<HTMLScriptElement>('script[data-widget-id]');
  const widgetId = script?.dataset.widgetId;
  if (!widgetId) return console.warn('[zdoda] missing data-widget-id');
  const api = (script?.dataset.api || new URL(script!.src).origin).replace(/\/$/, '') + '/api/v1/public';

  const store = {
    get(k: string) {
      try {
        return localStorage.getItem(`zdoda:${widgetId}:${k}`);
      } catch {
        return null;
      }
    },
    set(k: string, v: string) {
      try {
        localStorage.setItem(`zdoda:${widgetId}:${k}`, v);
      } catch {
        /* storage blocked */
      }
    },
  };
  let visitorId = store.get('visitor');
  if (!visitorId) {
    visitorId = (crypto as any).randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
    store.set('visitor', visitorId!);
  }
  let conversationId = store.get('conversation');
  let conversationToken = store.get('token');
  let lastSeen = '';
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let instance: WidgetInstance;
  const seen = new Set<string>();

  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(api + path, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message || 'Something went wrong. Please try again.');
    return json as T;
  }

  async function fetchHistory(): Promise<{ items: (WidgetMessage & { id: string; createdAt: string })[]; takeover: boolean }> {
    if (!conversationId || !conversationToken) return { items: [], takeover: false };
    const q = new URLSearchParams({ token: conversationToken, ...(lastSeen ? { after: lastSeen } : {}) });
    return call(`/widgets/${widgetId}/conversations/${conversationId}/messages?${q}`);
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(async () => {
      if (document.hidden) return;
      const out = await fetchHistory().catch(() => null);
      if (!out) return;
      for (const m of out.items) {
        lastSeen = m.createdAt > lastSeen ? m.createdAt : lastSeen;
        if (seen.has(m.id) || m.role === 'user') continue;
        seen.add(m.id);
        instance.addMessage(m);
      }
      instance.setStatus(out.takeover ? 'You are chatting with our team' : null);
    }, 5000);
  }

  async function start() {
    const { config } = await call<{ config: WidgetConfigV1 }>(`/widgets/${widgetId}/config`);
    const host = document.createElement('div');
    host.id = 'zdoda-widget';
    const inlineTarget = config.layout.mode === 'inline' && config.layout.inlineSelector ? document.querySelector(config.layout.inlineSelector) : null;
    (inlineTarget || document.body).appendChild(host);

    let initial: WidgetMessage[] = [];
    let takeover = false;
    try {
      const hist = await fetchHistory();
      initial = hist.items;
      takeover = hist.takeover;
      hist.items.forEach((m) => {
        seen.add(m.id);
        lastSeen = m.createdAt > lastSeen ? m.createdAt : lastSeen;
      });
    } catch {
      conversationId = conversationToken = null;
    }

    instance = mountWidget(host, config, {
      mode: 'live',
      initialMessages: initial,
      onToggle: (open) => (open && conversationId ? startPolling() : undefined),
      onSend: async (text) => {
        const out = await call<ChatResponse & { reply: (ChatResponse['reply'] & { id?: string }) | null }>(`/widgets/${widgetId}/chat`, {
          method: 'POST',
          body: JSON.stringify({ message: text, conversationId, conversationToken, visitorId, pageUrl: location.href.slice(0, 500) }),
        });
        if (out.conversationId !== conversationId) {
          conversationId = out.conversationId;
          store.set('conversation', conversationId);
        }
        if (out.conversationToken) {
          conversationToken = out.conversationToken;
          store.set('token', conversationToken);
        }
        if (out.reply?.id) seen.add(out.reply.id);
        lastSeen = new Date().toISOString();
        startPolling();
        instance.setStatus(out.takeover ? 'You are chatting with our team' : null);
        return out;
      },
    });
    if (takeover) instance.setStatus('You are chatting with our team');
    if (conversationId) startPolling();

    w.Zdoda = { open: () => instance.open(), close: () => instance.close(), destroy: () => instance.destroy() };
  }

  const run = () => start().catch((e) => console.warn('[zdoda] widget not loaded:', e.message));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
