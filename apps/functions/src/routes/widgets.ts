import { Router } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { WidgetConfigV1Schema } from '@zdoda/shared';
import { db, paths } from '../firebase.js';
import { config } from '../config.js';
import { h, parse, serialize, notFound, AppError } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { readMultipart } from '../lib/upload.js';
import { saveFile } from '../lib/storage.js';
import { defaultWidgetConfig, safeOrigin } from '../lib/workspace.js';
import { audit } from '../lib/util.js';

export const widgetsRouter = Router();

const BRANDING_PLANS = ['business', 'agency'];

function toDTO(d: FirebaseFirestore.DocumentSnapshot) {
  const data = serialize<any>({ id: d.id, ...d.data() });
  return {
    ...data,
    hasUnpublishedChanges: !data.publishedConfig || JSON.stringify(data.publishedConfig) !== JSON.stringify(data.draftConfig),
    embedCode: embedSnippet(d.id),
  };
}

export function embedSnippet(widgetId: string) {
  return `<script src="${config.publicApiUrl}/zdoda-widget.js" data-widget-id="${widgetId}" data-api="${config.publicApiUrl}" async></script>`;
}

widgetsRouter.get(
  '/',
  requirePermission('read', 'Widget'),
  h(async (req, res) => {
    const snap = await paths.widgets(req.ws!.workspaceId).orderBy('createdAt', 'asc').get();
    res.json({ items: snap.docs.map(toDTO) });
  })
);

widgetsRouter.post(
  '/',
  requirePermission('publish', 'Widget'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const input = parse(z.object({ name: z.string().min(1).max(60), agentId: z.string().min(1) }), req.body);
    const agent = await paths.agents(ws).doc(input.agentId).get();
    if (!agent.exists) throw notFound('Agent');
    const ref = paths.widgets(ws).doc();
    await ref.set({
      name: input.name,
      agentId: input.agentId,
      draftConfig: defaultWidgetConfig(agent.get('name'), req.ws!.workspace.name, agent.get('greeting')),
      publishedConfig: null,
      publishedVersion: 0,
      allowedOrigins: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await paths.widgetKeys().doc(ref.id).set({ workspaceId: ws });
    res.status(201).json(toDTO(await ref.get()));
  })
);

widgetsRouter.get(
  '/:id',
  requirePermission('read', 'Widget'),
  h(async (req, res) => {
    const snap = await paths.widgets(req.ws!.workspaceId).doc(req.params.id).get();
    if (!snap.exists) throw notFound('Widget');
    res.json(toDTO(snap));
  })
);

widgetsRouter.patch(
  '/:id',
  requirePermission('update', 'Widget'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const ref = paths.widgets(ws).doc(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Widget');
    const input = parse(
      z.object({
        name: z.string().min(1).max(60).optional(),
        agentId: z.string().min(1).optional(),
        draftConfig: WidgetConfigV1Schema.optional(),
        allowedOrigins: z.array(z.string().max(200)).max(20).optional(),
      }),
      req.body
    );
    if (input.agentId && !(await paths.agents(ws).doc(input.agentId).get()).exists) throw notFound('Agent');
    const allowedOrigins = input.allowedOrigins?.map((o) => safeOrigin(o.includes('://') ? o : `https://${o}`)).filter(Boolean);
    await ref.update({ ...input, ...(allowedOrigins ? { allowedOrigins: [...new Set(allowedOrigins)] } : {}), updatedAt: FieldValue.serverTimestamp() });
    res.json(toDTO(await ref.get()));
  })
);

widgetsRouter.post(
  '/:id/publish',
  requirePermission('publish', 'Widget'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const ref = paths.widgets(ws).doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw notFound('Widget');
    const cfg = WidgetConfigV1Schema.parse(snap.get('draftConfig'));
    const warnings: string[] = [];
    if (cfg.advanced.hideBranding && !BRANDING_PLANS.includes(req.ws!.workspace.plan)) {
      cfg.advanced.hideBranding = false;
      warnings.push('Removing "Powered by Zdoda" needs the Business plan — branding stays visible.');
    }
    const version = Number(snap.get('publishedVersion') || 0) + 1;
    const batch = db().batch();
    batch.update(ref, { publishedConfig: cfg, publishedVersion: version, publishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    batch.set(ref.collection('versions').doc(String(version)), { version, config: cfg, publishedBy: req.user!.uid, publishedByEmail: req.user!.email, createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    await audit(ws, req.user!, 'widget.published', { widgetId: ref.id, version });
    res.json({ ...toDTO(await ref.get()), warnings });
  })
);

widgetsRouter.get(
  '/:id/versions',
  requirePermission('read', 'Widget'),
  h(async (req, res) => {
    const snap = await paths.widgets(req.ws!.workspaceId).doc(req.params.id).collection('versions').orderBy('version', 'desc').limit(30).get();
    res.json({ items: snap.docs.map((d) => serialize({ id: d.id, version: d.get('version'), publishedByEmail: d.get('publishedByEmail'), createdAt: d.get('createdAt') })) });
  })
);

widgetsRouter.post(
  '/:id/versions/:version/restore',
  requirePermission('update', 'Widget'),
  h(async (req, res) => {
    const ref = paths.widgets(req.ws!.workspaceId).doc(req.params.id);
    const v = await ref.collection('versions').doc(req.params.version).get();
    if (!v.exists) throw notFound('Version');
    await ref.update({ draftConfig: v.get('config'), updatedAt: FieldValue.serverTimestamp() });
    res.json(toDTO(await ref.get()));
  })
);

widgetsRouter.post(
  '/:id/assets',
  requirePermission('update', 'Widget'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    if (!(await paths.widgets(ws).doc(req.params.id).get()).exists) throw notFound('Widget');
    const { files } = await readMultipart(req, 2 * 1024 * 1024);
    const file = files[0];
    if (!file) throw new AppError(400, 'NO_FILE', 'Choose an image');
    if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.mimeType)) throw new AppError(400, 'UNSUPPORTED_FILE', 'Use a PNG, JPG, WEBP, GIF or SVG image');
    const ext = file.mimeType.split('/')[1].replace('svg+xml', 'svg').replace('jpeg', 'jpg');
    const out = await saveFile(`workspaces/${ws}/widgets/${req.params.id}/${Date.now()}.${ext}`, file.buffer, file.mimeType, { publicUrl: true });
    res.status(201).json({ url: out.url });
  })
);

widgetsRouter.delete(
  '/:id',
  requirePermission('publish', 'Widget'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const count = (await paths.widgets(ws).count().get()).data().count;
    if (count <= 1) throw new AppError(409, 'LAST_WIDGET', 'You need at least one widget');
    await paths.widgets(ws).doc(req.params.id).delete();
    await paths.widgetKeys().doc(req.params.id).delete();
    res.json({ ok: true });
  })
);
