import { Router } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { paths } from '../firebase.js';
import { h, parse, serialize, notFound } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { dispatchEvent } from '../lib/integrations.js';
import { clip } from '../lib/util.js';

export const conversationsRouter = Router();

const strip = (d: FirebaseFirestore.DocumentSnapshot) => {
  const { token, userAgent, ...rest } = d.data() || {};
  return serialize({ id: d.id, ...rest });
};

conversationsRouter.get(
  '/',
  requirePermission('read', 'Inbox'),
  h(async (req, res) => {
    const { status, channel, q, includeTest } = req.query as Record<string, string>;
    const snap = await paths.conversations(req.ws!.workspaceId).orderBy('lastMessageAt', 'desc').limit(300).get();
    const needle = (q || '').toLowerCase();
    const items = snap.docs
      .map(strip)
      .filter((c: any) => (includeTest === 'true' ? true : c.channel !== 'test'))
      .filter((c: any) => !status || status === 'all' || c.status === status)
      .filter((c: any) => !channel || channel === 'all' || c.channel === channel)
      .filter((c: any) => !needle || [c.lastMessage, c.firstMessage, c.contact?.name, c.contact?.email].some((v: string) => v?.toLowerCase().includes(needle)));
    const counts = snap.docs.reduce(
      (acc, d) => {
        if (d.get('channel') === 'test') return acc;
        acc.all++;
        acc[d.get('status') as 'open' | 'handoff' | 'resolved']++;
        return acc;
      },
      { all: 0, open: 0, handoff: 0, resolved: 0 }
    );
    res.json({ items: items.slice(0, 100), counts });
  })
);

conversationsRouter.get(
  '/:id',
  requirePermission('read', 'Inbox'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const snap = await paths.conversations(ws).doc(req.params.id).get();
    if (!snap.exists) throw notFound('Conversation');
    const msgs = await paths.messages(ws, snap.id).orderBy('createdAt', 'asc').limit(500).get();
    res.json({ conversation: strip(snap), messages: msgs.docs.map((d) => serialize({ id: d.id, ...d.data() })) });
  })
);

/** Human reply from the inbox. Automatically takes over the conversation from the AI. */
conversationsRouter.post(
  '/:id/messages',
  requirePermission('update', 'Inbox'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const { text } = parse(z.object({ text: z.string().min(1).max(4000) }), req.body);
    const ref = paths.conversations(ws).doc(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Conversation');
    const msg = paths.messages(ws, ref.id).doc();
    await msg.set({ role: 'human', text, authorId: req.user!.uid, authorName: req.user!.name, createdAt: FieldValue.serverTimestamp() });
    await ref.update({
      takeover: true,
      assignedTo: req.user!.uid,
      status: 'handoff',
      lastMessage: clip(text, 160),
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
    });
    res.status(201).json({ id: msg.id });
  })
);

conversationsRouter.patch(
  '/:id',
  requirePermission('update', 'Inbox'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const input = parse(
      z.object({ status: z.enum(['open', 'handoff', 'resolved']).optional(), takeover: z.boolean().optional(), assignedTo: z.string().nullable().optional() }),
      req.body
    );
    const ref = paths.conversations(ws).doc(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Conversation');
    const update: Record<string, unknown> = { ...input };
    if (input.takeover === false && !input.status) update.status = 'open';
    if (input.status === 'resolved') update.resolvedAt = FieldValue.serverTimestamp();
    await ref.update(update);
    if (input.takeover !== undefined) {
      await paths.messages(ws, ref.id).add({
        role: 'system',
        text: input.takeover ? `${req.user!.name} joined the conversation` : 'The AI assistant is back in the conversation',
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    if (input.status === 'resolved') dispatchEvent(ws, 'conversation.resolved', { conversationId: ref.id }).catch(() => {});
    res.json(strip(await ref.get()));
  })
);

export const leadsRouter = Router();

leadsRouter.get(
  '/',
  requirePermission('read', 'Inbox'),
  h(async (req, res) => {
    const snap = await paths.leads(req.ws!.workspaceId).orderBy('createdAt', 'desc').limit(500).get();
    const items = snap.docs.map((d) => serialize({ id: d.id, ...d.data() }));
    if (req.query.format === 'csv') {
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = [['Name', 'Email', 'Phone', 'Channel', 'First message', 'Captured at'], ...items.map((l: any) => [l.name, l.email, l.phone, l.channel, l.firstMessage, l.createdAt])];
      res.setHeader('content-type', 'text/csv; charset=utf-8');
      res.setHeader('content-disposition', 'attachment; filename="zdoda-leads.csv"');
      return res.send(rows.map((r) => r.map(esc).join(',')).join('\n'));
    }
    res.json({ items });
  })
);
