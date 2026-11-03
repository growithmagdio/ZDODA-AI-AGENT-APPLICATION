import { Router } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { AgentInputSchema, getPlan } from '@zdoda/shared';
import { paths } from '../firebase.js';
import { h, parse, serialize, notFound, AppError } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { runTurn } from '../chat/engine.js';
import { audit } from '../lib/util.js';

export const agentsRouter = Router();

agentsRouter.get(
  '/',
  requirePermission('read', 'Agent'),
  h(async (req, res) => {
    const snap = await paths.agents(req.ws!.workspaceId).orderBy('createdAt', 'asc').get();
    res.json({ items: snap.docs.map((d) => serialize({ id: d.id, ...d.data() })) });
  })
);

agentsRouter.post(
  '/',
  requirePermission('create', 'Agent'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const plan = getPlan(req.ws!.workspace.plan);
    const count = (await paths.agents(ws).count().get()).data().count;
    if (count >= plan.agentLimit) throw new AppError(402, 'PLAN_LIMIT', `Your ${plan.name} plan includes ${plan.agentLimit} agent${plan.agentLimit > 1 ? 's' : ''}. Upgrade to add more.`);
    const input = parse(AgentInputSchema, req.body);
    const ref = await paths.agents(ws).add({ ...input, status: 'draft', publishedAt: null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await audit(ws, req.user!, 'agent.created', { agentId: ref.id, name: input.name });
    res.status(201).json(serialize({ id: ref.id, ...(await ref.get()).data() }));
  })
);

agentsRouter.get(
  '/:id',
  requirePermission('read', 'Agent'),
  h(async (req, res) => {
    const snap = await paths.agents(req.ws!.workspaceId).doc(req.params.id).get();
    if (!snap.exists) throw notFound('Agent');
    res.json(serialize({ id: snap.id, ...snap.data() }));
  })
);

agentsRouter.patch(
  '/:id',
  requirePermission('update', 'Agent'),
  h(async (req, res) => {
    const ref = paths.agents(req.ws!.workspaceId).doc(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Agent');
    const input = parse(AgentInputSchema.partial(), req.body);
    // zod .partial() keeps defaults — only write keys the client actually sent.
    const update = Object.fromEntries(Object.entries(input).filter(([k]) => k in (req.body || {})));
    await ref.update({ ...update, updatedAt: FieldValue.serverTimestamp() });
    res.json(serialize({ id: ref.id, ...(await ref.get()).data() }));
  })
);

agentsRouter.post(
  '/:id/publish',
  requirePermission('publish', 'Agent'),
  h(async (req, res) => {
    const ref = paths.agents(req.ws!.workspaceId).doc(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Agent');
    const published = req.body?.unpublish ? { status: 'draft', publishedAt: null } : { status: 'published', publishedAt: FieldValue.serverTimestamp() };
    await ref.update({ ...published, updatedAt: FieldValue.serverTimestamp() });
    await audit(req.ws!.workspaceId, req.user!, req.body?.unpublish ? 'agent.unpublished' : 'agent.published', { agentId: ref.id });
    res.json(serialize({ id: ref.id, ...(await ref.get()).data() }));
  })
);

agentsRouter.post(
  '/:id/duplicate',
  requirePermission('create', 'Agent'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const plan = getPlan(req.ws!.workspace.plan);
    if ((await paths.agents(ws).count().get()).data().count >= plan.agentLimit) throw new AppError(402, 'PLAN_LIMIT', 'Agent limit reached for your plan');
    const src = await paths.agents(ws).doc(req.params.id).get();
    if (!src.exists) throw notFound('Agent');
    const ref = await paths.agents(ws).add({ ...src.data(), name: `${src.get('name')} (copy)`.slice(0, 60), status: 'draft', publishedAt: null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    res.status(201).json({ id: ref.id });
  })
);

agentsRouter.delete(
  '/:id',
  requirePermission('delete', 'Agent'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const used = await paths.widgets(ws).where('agentId', '==', req.params.id).limit(1).get();
    if (!used.empty) throw new AppError(409, 'IN_USE', 'This agent is connected to a widget. Pick another agent for the widget first.');
    await paths.agents(ws).doc(req.params.id).delete();
    await audit(ws, req.user!, 'agent.deleted', { agentId: req.params.id });
    res.json({ ok: true });
  })
);

/** Test chat from the builder. Uses the saved (draft) agent; does not count toward usage. */
agentsRouter.post(
  '/:id/test',
  requirePermission('read', 'Agent'),
  h(async (req, res) => {
    const input = parse(z.object({ message: z.string().min(1).max(2000), conversationId: z.string().optional().nullable() }), req.body);
    const out = await runTurn({ ws: req.ws!.workspaceId, agentId: req.params.id, channel: 'test', text: input.message, conversationId: input.conversationId });
    res.json(out);
  })
);
