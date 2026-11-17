import { Router } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { ToolInputSchema } from '@zdoda/shared';
import { paths } from '../firebase.js';
import { config } from '../config.js';
import { h, parse, serialize, notFound, AppError } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { audit, encrypt } from '../lib/util.js';
import { runTool, toolDefinitionsFor } from '../tools/runner.js';
import { googleAuthUrl, googleConfigured, exchangeCode, saveGoogleToken, verifyState } from '../tools/google.js';
import { assertPublicUrl } from '../rag/extract.js';

export const toolsRouter = Router();

const strip = (d: FirebaseFirestore.DocumentSnapshot) => serialize({ id: d.id, ...d.data() });

toolsRouter.get(
  '/',
  requirePermission('read', 'Integration'),
  h(async (req, res) => {
    const snap = await paths.tools(req.ws!.workspaceId).orderBy('createdAt', 'asc').get();
    res.json({ items: snap.docs.map(strip), googleConfigured: googleConfigured() });
  })
);

const CreateToolSchema = ToolInputSchema.extend({ secret: z.string().max(4000).optional() });

toolsRouter.post(
  '/',
  requirePermission('create', 'Integration'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const { secret, ...input } = parse(CreateToolSchema, req.body);
    if (input.kind === 'api_request' || input.kind === 'webhook' || input.kind === 'mcp') {
      await assertPublicUrl(String(input.config.url || '').replace(/\{\{[^}]+\}\}/g, 'x')).catch((e) => {
        throw new AppError(400, 'BAD_URL', e.message);
      });
    }
    if (input.kind === 'gohighlevel' && (!input.config.locationId || !secret)) throw new AppError(400, 'MISSING_FIELDS', 'GoHighLevel needs a Location ID and a Private Integration token');
    if (input.kind === 'google_sheets' && !input.config.spreadsheetId) throw new AppError(400, 'MISSING_FIELDS', 'Paste the spreadsheet link or ID');
    const dup = await paths.tools(ws).where('name', '==', input.name).limit(1).get();
    if (!dup.empty) throw new AppError(409, 'DUPLICATE', 'A tool with that name already exists');
    if (input.kind === 'google_sheets') input.config.spreadsheetId = String(input.config.spreadsheetId).match(/\/d\/([\w-]+)/)?.[1] || input.config.spreadsheetId;
    const ref = paths.tools(ws).doc();
    const needsGoogle = input.kind === 'google_calendar' || input.kind === 'google_sheets';
    await ref.set({ ...input, connected: !needsGoogle, lastError: null, createdAt: FieldValue.serverTimestamp() });
    if (secret) await paths.secrets(ws).doc(`tool_${ref.id}`).set({ value: encrypt(secret), kind: `tool_${input.kind}` });
    await audit(ws, req.user!, 'tool.created', { toolId: ref.id, kind: input.kind });
    res.status(201).json({ ...strip(await ref.get()), connectUrl: needsGoogle && googleConfigured() ? googleAuthUrl(ws, ref.id) : null });
  })
);

toolsRouter.patch(
  '/:id',
  requirePermission('update', 'Integration'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const ref = paths.tools(ws).doc(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Tool');
    const { secret, ...input } = parse(CreateToolSchema.partial(), req.body);
    const update = Object.fromEntries(Object.entries(input).filter(([k]) => k in (req.body || {})));
    await ref.update(update);
    if (secret) await paths.secrets(ws).doc(`tool_${ref.id}`).set({ value: encrypt(secret), kind: 'tool_secret' });
    res.json(strip(await ref.get()));
  })
);

toolsRouter.delete(
  '/:id',
  requirePermission('delete', 'Integration'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    await paths.tools(ws).doc(req.params.id).delete();
    await paths.secrets(ws).doc(`tool_${req.params.id}`).delete();
    res.json({ ok: true });
  })
);

toolsRouter.get(
  '/:id/connect-google',
  requirePermission('update', 'Integration'),
  h(async (req, res) => {
    if (!googleConfigured()) throw new AppError(400, 'GOOGLE_NOT_CONFIGURED', 'Google sign-in for tools is not set up on the server yet');
    res.json({ url: googleAuthUrl(req.ws!.workspaceId, req.params.id) });
  })
);

/** Runs the tool once with sample arguments so the user can see it work. */
toolsRouter.post(
  '/:id/test',
  requirePermission('update', 'Integration'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const tool = await paths.tools(ws).doc(req.params.id).get();
    if (!tool.exists) throw notFound('Tool');
    const { fn, args } = parse(z.object({ fn: z.string().optional(), args: z.record(z.any()).default({}) }), req.body);
    const defs = await toolDefinitionsFor(ws, [tool.id]);
    const name = fn || defs[0]?.name || tool.get('name');
    res.json({ name, functions: defs.map((d) => d.name), ...(await runTool(ws, name, args, { conversationId: 'test', channel: 'test' })) });
  })
);

/** Google OAuth callback (no auth: identity comes from the signed state). */
export const oauthRouter = Router();
oauthRouter.get(
  '/google/callback',
  h(async (req, res) => {
    const back = `${config.webAppUrl}/tools`;
    try {
      const { ws, toolId } = verifyState(String(req.query.state || ''));
      const refresh = await exchangeCode(String(req.query.code || ''));
      await saveGoogleToken(ws, toolId, refresh);
      res.redirect(`${back}?google=connected`);
    } catch (e: any) {
      res.redirect(`${back}?google=error&message=${encodeURIComponent(String(e.message).slice(0, 120))}`);
    }
  })
);
