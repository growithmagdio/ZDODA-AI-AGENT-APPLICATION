import { Router, type Request } from 'express';
import { z } from 'zod';
import { WidgetConfigV1Schema } from '@zdoda/shared';
import { paths } from '../firebase.js';
import { h, parse, serialize, AppError } from '../lib/http.js';
import { runTurn } from '../chat/engine.js';

export const publicRouter = Router();

const hits = new Map<string, { n: number; reset: number }>();
function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const e = hits.get(key);
  if (!e || e.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return;
  }
  if (++e.n > max) throw new AppError(429, 'RATE_LIMITED', 'Too many messages — please wait a moment.');
}

async function loadWidget(req: Request) {
  const key = await paths.widgetKeys().doc(req.params.widgetId).get();
  if (!key.exists) throw new AppError(404, 'WIDGET_NOT_FOUND', 'Widget not found');
  const ws = key.get('workspaceId') as string;
  const snap = await paths.widgets(ws).doc(req.params.widgetId).get();
  if (!snap.exists || !snap.get('publishedConfig')) throw new AppError(404, 'WIDGET_NOT_PUBLISHED', 'This widget has not been published yet');
  const origin = req.headers.origin as string | undefined;
  const allowed: string[] = snap.get('allowedOrigins') || [];
  if (origin && allowed.length && !allowed.includes(origin)) throw new AppError(403, 'ORIGIN_NOT_ALLOWED', `This widget is not allowed on ${origin}`);
  return { ws, widget: snap };
}

publicRouter.get(
  '/widgets/:widgetId/config',
  h(async (req, res) => {
    const { ws, widget } = await loadWidget(req);
    const agent = await paths.agents(ws).doc(widget.get('agentId')).get();
    res.setHeader('cache-control', 'public, max-age=60');
    res.json({
      widgetId: widget.id,
      version: widget.get('publishedVersion'),
      config: WidgetConfigV1Schema.parse(widget.get('publishedConfig')),
      agent: { name: agent.get('name'), live: agent.get('status') === 'published' },
    });
  })
);

const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().max(64).optional().nullable(),
  conversationToken: z.string().max(64).optional().nullable(),
  visitorId: z.string().min(4).max(64),
  pageUrl: z.string().max(500).optional().nullable(),
});

publicRouter.post(
  '/widgets/:widgetId/chat',
  h(async (req, res) => {
    const input = parse(ChatSchema, req.body);
    rateLimit(`ip:${req.ip}`, 30, 60_000);
    rateLimit(`v:${input.visitorId}`, 20, 60_000);
    const { ws, widget } = await loadWidget(req);
    const agent = await paths.agents(ws).doc(widget.get('agentId')).get();
    if (agent.get('status') !== 'published') throw new AppError(409, 'AGENT_NOT_PUBLISHED', 'This assistant is not live yet');
    let conversationId = input.conversationId || null;
    if (conversationId) {
      const conv = await paths.conversations(ws).doc(conversationId).get();
      if (!conv.exists || conv.get('token') !== input.conversationToken) conversationId = null; // start fresh rather than leak
      else if ((conv.get('messageCount') || 0) > 200) throw new AppError(429, 'CONVERSATION_LIMIT', 'This conversation is very long — please refresh to start a new one.');
    }
    const out = await runTurn({
      ws,
      agentId: widget.get('agentId'),
      channel: 'web',
      text: input.message,
      conversationId,
      widgetId: widget.id,
      visitor: { visitorId: input.visitorId, pageUrl: input.pageUrl, userAgent: String(req.headers['user-agent'] || '') },
    });
    res.json(out);
  })
);

/** Polled by the widget to receive human replies after a takeover. */
publicRouter.get(
  '/widgets/:widgetId/conversations/:conversationId/messages',
  h(async (req, res) => {
    const { ws } = await loadWidget(req);
    const conv = await paths.conversations(ws).doc(req.params.conversationId).get();
    if (!conv.exists || conv.get('token') !== req.query.token) throw new AppError(404, 'NOT_FOUND', 'Conversation not found');
    const after = String(req.query.after || '');
    const snap = await paths.messages(ws, conv.id).orderBy('createdAt', 'asc').limit(300).get();
    const items = snap.docs
      .map((d) => serialize({ id: d.id, role: d.get('role'), text: d.get('text'), authorName: d.get('authorName') || null, citations: d.get('citations') || [], createdAt: d.get('createdAt') }))
      .filter((m: any) => m.role !== 'system' && (!after || m.createdAt > after));
    res.json({ items, status: conv.get('status'), takeover: Boolean(conv.get('takeover')) });
  })
);
