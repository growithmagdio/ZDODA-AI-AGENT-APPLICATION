import { Router, type NextFunction, type Request, type Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { paths } from '../firebase.js';
import { h, parse, serialize, AppError, notFound } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { runTurn } from '../chat/engine.js';
import { placeOutboundCall } from './voice.js';
import { audit } from '../lib/util.js';

const hash = (key: string) => createHash('sha256').update(key).digest('hex');
const API_PLANS = ['business', 'agency'];

export const apiKeysRouter = Router();

apiKeysRouter.get(
  '/',
  requirePermission('read', 'Settings'),
  h(async (req, res) => {
    const snap = await paths.apiKeys().where('workspaceId', '==', req.ws!.workspaceId).get();
    res.json({ items: snap.docs.map((d) => serialize({ id: d.id.slice(0, 12), name: d.get('name'), prefix: d.get('prefix'), lastUsedAt: d.get('lastUsedAt') || null, createdAt: d.get('createdAt') })), allowed: API_PLANS.includes(req.ws!.workspace.plan) });
  })
);

apiKeysRouter.post(
  '/',
  requirePermission('update', 'Settings'),
  h(async (req, res) => {
    if (!API_PLANS.includes(req.ws!.workspace.plan)) throw new AppError(402, 'PLAN_LIMIT', 'The REST API is available on the Business plan.');
    const { name } = parse(z.object({ name: z.string().min(2).max(60) }), req.body);
    const key = `zk_live_${randomBytes(24).toString('base64url')}`;
    await paths.apiKeys().doc(hash(key)).set({ workspaceId: req.ws!.workspaceId, name, prefix: key.slice(0, 12), createdBy: req.user!.uid, createdAt: FieldValue.serverTimestamp() });
    await audit(req.ws!.workspaceId, req.user!, 'apikey.created', { name });
    res.status(201).json({ key, prefix: key.slice(0, 12) });
  })
);

apiKeysRouter.delete(
  '/:id',
  requirePermission('update', 'Settings'),
  h(async (req, res) => {
    const snap = await paths.apiKeys().where('workspaceId', '==', req.ws!.workspaceId).get();
    const doc = snap.docs.find((d) => d.id.startsWith(req.params.id));
    if (!doc) throw notFound('API key');
    await doc.ref.delete();
    res.json({ ok: true });
  })
);

// ---------------------------------------------------------------------------
// Public REST API (Authorization: Bearer zk_live_...)
// ---------------------------------------------------------------------------
async function requireApiKey(req: Request, _res: Response, next: NextFunction) {
  try {
    const key = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!key.startsWith('zk_')) throw new AppError(401, 'UNAUTHENTICATED', 'Missing API key');
    const doc = await paths.apiKeys().doc(hash(key)).get();
    if (!doc.exists) throw new AppError(401, 'UNAUTHENTICATED', 'Invalid API key');
    const ws = await paths.workspace(doc.get('workspaceId')).get();
    if (!ws.exists) throw new AppError(401, 'UNAUTHENTICATED', 'Invalid API key');
    req.ws = { workspaceId: ws.id, role: 'ADMIN', workspace: ws.data()! };
    doc.ref.update({ lastUsedAt: FieldValue.serverTimestamp() }).catch(() => {});
    next();
  } catch (e) {
    next(e);
  }
}

export const restApiRouter = Router();
restApiRouter.use(requireApiKey);

restApiRouter.get(
  '/agents',
  h(async (req, res) => {
    const snap = await paths.agents(req.ws!.workspaceId).get();
    res.json({ data: snap.docs.map((d) => ({ id: d.id, name: d.get('name'), status: d.get('status') })) });
  })
);

restApiRouter.post(
  '/agents/:id/messages',
  h(async (req, res) => {
    const input = parse(z.object({ message: z.string().min(1).max(2000), conversation_id: z.string().optional().nullable() }), req.body);
    if (!(await paths.agents(req.ws!.workspaceId).doc(req.params.id).get()).exists) throw notFound('Agent');
    const out = await runTurn({ ws: req.ws!.workspaceId, agentId: req.params.id, channel: 'web', text: input.message, conversationId: input.conversation_id });
    res.json({ conversation_id: out.conversationId, reply: out.reply?.text ?? null, citations: out.reply?.citations || [], status: out.status });
  })
);

restApiRouter.get(
  '/conversations',
  h(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const snap = await paths.conversations(req.ws!.workspaceId).orderBy('lastMessageAt', 'desc').limit(limit).get();
    res.json({ data: snap.docs.map((d) => { const { token, userAgent, ...rest } = d.data(); return serialize({ id: d.id, ...rest }); }) });
  })
);

restApiRouter.get(
  '/conversations/:id',
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const c = await paths.conversations(ws).doc(req.params.id).get();
    if (!c.exists) throw notFound('Conversation');
    const m = await paths.messages(ws, c.id).orderBy('createdAt', 'asc').get();
    const { token, userAgent, ...rest } = c.data()!;
    res.json({ data: serialize({ id: c.id, ...rest, messages: m.docs.map((d) => ({ id: d.id, ...d.data() })) }) });
  })
);

restApiRouter.get(
  '/leads',
  h(async (req, res) => {
    const snap = await paths.leads(req.ws!.workspaceId).orderBy('createdAt', 'desc').limit(500).get();
    res.json({ data: snap.docs.map((d) => serialize({ id: d.id, ...d.data() })) });
  })
);

restApiRouter.post(
  '/calls',
  h(async (req, res) => {
    const input = parse(z.object({ agent_id: z.string(), to: z.string().regex(/^\+[1-9]\d{6,14}$/), from: z.string().regex(/^\+[1-9]\d{6,14}$/), variables: z.record(z.string()).optional() }), req.body);
    if (!(await paths.phoneNumbers(req.ws!.workspaceId).doc(input.from).get()).exists) throw notFound('Phone number');
    const callId = await placeOutboundCall(req.ws!.workspaceId, input.agent_id, input.to, input.from, { vars: input.variables });
    res.status(201).json({ call_id: callId });
  })
);
