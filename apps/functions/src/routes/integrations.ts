import { Router } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { paths } from '../firebase.js';
import { h, parse, serialize, notFound, AppError } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { dispatchEvent } from '../lib/integrations.js';
import { assertPublicUrl } from '../rag/extract.js';
import { audit, encrypt, newId } from '../lib/util.js';

export const integrationsRouter = Router();

const EVENTS = ['lead.captured', 'conversation.handoff', 'conversation.resolved'] as const;

integrationsRouter.get(
  '/',
  requirePermission('read', 'Integration'),
  h(async (req, res) => {
    const snap = await paths.integrations(req.ws!.workspaceId).orderBy('createdAt', 'desc').get();
    res.json({ items: snap.docs.map((d) => serialize({ id: d.id, ...d.data() })), events: EVENTS });
  })
);

integrationsRouter.post(
  '/',
  requirePermission('create', 'Integration'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const input = parse(
      z.object({
        kind: z.enum(['webhook', 'make', 'zapier', 'n8n']),
        name: z.string().min(1).max(60),
        url: z.string().url(),
        events: z.array(z.enum(EVENTS)).min(1),
      }),
      req.body
    );
    await assertPublicUrl(input.url).catch((e) => {
      throw new AppError(400, 'BAD_URL', e.message);
    });
    const ref = paths.integrations(ws).doc();
    const secret = newId('whsec_', 24);
    // Automation platforms (Make, Zapier, n8n) receive events through the same signed webhook.
    await ref.set({ kind: 'webhook', platform: input.kind, name: input.name, status: 'connected', config: { url: input.url }, events: input.events, createdAt: FieldValue.serverTimestamp() });
    await paths.secrets(ws).doc(ref.id).set({ value: encrypt(secret), kind: 'webhook_signing_secret' });
    await audit(ws, req.user!, 'integration.connected', { id: ref.id, platform: input.kind });
    res.status(201).json({ ...serialize({ id: ref.id, ...(await ref.get()).data() }), signingSecret: secret });
  })
);

integrationsRouter.patch(
  '/:id',
  requirePermission('update', 'Integration'),
  h(async (req, res) => {
    const ref = paths.integrations(req.ws!.workspaceId).doc(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Integration');
    const input = parse(z.object({ name: z.string().min(1).max(60).optional(), events: z.array(z.enum(EVENTS)).min(1).optional() }), req.body);
    await ref.update(input);
    res.json(serialize({ id: ref.id, ...(await ref.get()).data() }));
  })
);

integrationsRouter.post(
  '/:id/test',
  requirePermission('update', 'Integration'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const ref = paths.integrations(ws).doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw notFound('Integration');
    await dispatchEvent(ws, 'lead.captured', { test: true, conversationId: 'test', contact: { name: 'Test Lead', email: 'test@example.com', phone: null }, channel: 'web' }, { onlyId: ref.id });
    const after = await ref.get();
    res.json({ ok: after.get('status') === 'connected', status: after.get('status'), lastError: after.get('lastError') || null });
  })
);

integrationsRouter.delete(
  '/:id',
  requirePermission('delete', 'Integration'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    await paths.integrations(ws).doc(req.params.id).delete();
    await paths.secrets(ws).doc(req.params.id).delete();
    await audit(ws, req.user!, 'integration.removed', { id: req.params.id });
    res.json({ ok: true });
  })
);
