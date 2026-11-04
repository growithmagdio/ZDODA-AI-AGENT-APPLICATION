import { Router } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { CreateKnowledgeSourceSchema } from '@zdoda/shared';
import { paths } from '../firebase.js';
import { config } from '../config.js';
import { h, parse, serialize, notFound, AppError } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { readMultipart } from '../lib/upload.js';
import { saveFile } from '../lib/storage.js';
import { processSource, deleteSource } from '../rag/ingest.js';
import { retrieve } from '../rag/retrieve.js';
import { SUPPORTED_UPLOAD_EXT, assertPublicUrl } from '../rag/extract.js';
import { embeddingInfo } from '../providers/embeddings.js';
import { audit, clip } from '../lib/util.js';

export const knowledgeRouter = Router();

const DOC_LIMITS: Record<string, number> = { starter: 20, pro: 250 };
const MAX_UPLOAD = 20 * 1024 * 1024;

/** Inline mode runs ingestion in-process (local dev). Trigger mode relies on the Firestore onCreate trigger. */
function schedule(ws: string, id: string) {
  if (config.ingestMode === 'inline') void processSource(ws, id);
}

async function assertDocLimit(ws: string, plan: string) {
  const limit = DOC_LIMITS[plan];
  if (!limit) return;
  const count = (await paths.sources(ws).count().get()).data().count;
  if (count >= limit) throw new AppError(402, 'PLAN_LIMIT', `Your plan includes ${limit} knowledge sources. Upgrade for more.`);
}

knowledgeRouter.get(
  '/sources',
  requirePermission('read', 'Knowledge'),
  h(async (req, res) => {
    const snap = await paths.sources(req.ws!.workspaceId).orderBy('createdAt', 'desc').get();
    const items = snap.docs.map((d) => {
      const { text, items: faq, ...rest } = d.data();
      return serialize({ id: d.id, ...rest, faqCount: faq?.length, textLength: text?.length });
    });
    res.json({ items, embedding: embeddingInfo() });
  })
);

knowledgeRouter.post(
  '/sources',
  requirePermission('create', 'Knowledge'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    await assertDocLimit(ws, req.ws!.workspace.plan);
    const input = parse(CreateKnowledgeSourceSchema, req.body);
    if (input.type === 'url' || input.type === 'sitemap') await assertPublicUrl(input.url).catch((e) => { throw new AppError(400, 'BAD_URL', e.message); });
    const name =
      input.name ||
      (input.type === 'url' || input.type === 'sitemap' ? new URL(input.url).hostname + (input.type === 'url' ? new URL(input.url).pathname.replace(/\/$/, '') : '') : '');
    const ref = await paths.sources(ws).add({
      ...input,
      name: clip(name || 'Untitled', 120),
      status: 'queued',
      chunkCount: 0,
      charCount: 0,
      createdBy: req.user!.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await audit(ws, req.user!, 'knowledge.created', { sourceId: ref.id, type: input.type });
    schedule(ws, ref.id);
    res.status(201).json(serialize({ id: ref.id, ...(await ref.get()).data() }));
  })
);

knowledgeRouter.post(
  '/upload',
  requirePermission('create', 'Knowledge'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    await assertDocLimit(ws, req.ws!.workspace.plan);
    const { files, fields } = await readMultipart(req, MAX_UPLOAD);
    const file = files[0];
    if (!file || !file.buffer.length) throw new AppError(400, 'NO_FILE', 'Please choose a file to upload');
    const ext = file.fileName.toLowerCase().split('.').pop() || '';
    if (!SUPPORTED_UPLOAD_EXT.includes(ext)) throw new AppError(400, 'UNSUPPORTED_FILE', 'Use PDF, DOCX, TXT, MD, CSV or HTML files');
    const ref = paths.sources(ws).doc();
    const safeName = file.fileName.replace(/[^\w.\- ]+/g, '_').slice(0, 120);
    const stored = await saveFile(`workspaces/${ws}/knowledge/${ref.id}/${safeName}`, file.buffer, file.mimeType || 'application/octet-stream');
    await ref.set({
      type: 'file',
      name: clip(fields.name || safeName, 120),
      fileName: safeName,
      mimeType: file.mimeType,
      sizeBytes: file.buffer.length,
      storagePath: stored.path,
      status: 'queued',
      chunkCount: 0,
      charCount: 0,
      createdBy: req.user!.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await audit(ws, req.user!, 'knowledge.uploaded', { sourceId: ref.id, fileName: safeName });
    schedule(ws, ref.id);
    res.status(201).json(serialize({ id: ref.id, ...(await ref.get()).data() }));
  })
);

knowledgeRouter.get(
  '/sources/:id',
  requirePermission('read', 'Knowledge'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const snap = await paths.sources(ws).doc(req.params.id).get();
    if (!snap.exists) throw notFound('Source');
    const chunks = await paths.chunks(ws).where('sourceId', '==', snap.id).limit(25).get();
    res.json({
      source: serialize({ id: snap.id, ...snap.data() }),
      chunks: chunks.docs
        .map((d) => ({ id: d.id, title: d.get('title'), url: d.get('url'), text: d.get('text'), ordinal: d.get('ordinal') }))
        .sort((a, b) => a.ordinal - b.ordinal),
    });
  })
);

knowledgeRouter.patch(
  '/sources/:id',
  requirePermission('update', 'Knowledge'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const ref = paths.sources(ws).doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw notFound('Source');
    const input = parse(
      z.object({
        name: z.string().min(1).max(120).optional(),
        text: z.string().min(1).max(200_000).optional(),
        items: z.array(z.object({ q: z.string().min(1).max(500), a: z.string().min(1).max(4000) })).min(1).max(500).optional(),
      }),
      req.body
    );
    const contentChanged = Boolean(input.text || input.items);
    await ref.update({ ...input, ...(contentChanged ? { status: 'queued' } : {}), updatedAt: FieldValue.serverTimestamp() });
    if (contentChanged) schedule(ws, ref.id);
    res.json(serialize({ id: ref.id, ...(await ref.get()).data() }));
  })
);

knowledgeRouter.post(
  '/sources/:id/reprocess',
  requirePermission('update', 'Knowledge'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const ref = paths.sources(ws).doc(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Source');
    await ref.update({ status: 'queued', error: null, updatedAt: FieldValue.serverTimestamp(), reprocessRequestedAt: FieldValue.serverTimestamp() });
    schedule(ws, ref.id);
    res.json({ ok: true });
  })
);

knowledgeRouter.delete(
  '/sources/:id',
  requirePermission('delete', 'Knowledge'),
  h(async (req, res) => {
    await deleteSource(req.ws!.workspaceId, req.params.id);
    await audit(req.ws!.workspaceId, req.user!, 'knowledge.deleted', { sourceId: req.params.id });
    res.json({ ok: true });
  })
);

/** "Test retrieval" box in the Knowledge Base screen. */
knowledgeRouter.post(
  '/search',
  requirePermission('read', 'Knowledge'),
  h(async (req, res) => {
    const { query, sourceIds } = parse(z.object({ query: z.string().min(2).max(500), sourceIds: z.array(z.string()).optional() }), req.body);
    const results = await retrieve(req.ws!.workspaceId, query, { k: 6, sourceIds });
    res.json({ results: results.map((r) => ({ ...r, text: clip(r.text, 600), score: Math.round(r.score * 1000) / 1000 })) });
  })
);
