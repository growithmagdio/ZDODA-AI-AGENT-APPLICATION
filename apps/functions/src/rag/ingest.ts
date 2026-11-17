import { FieldValue } from 'firebase-admin/firestore';
import { bucket, paths, db } from '../firebase.js';
import { config } from '../config.js';
import { embed, embeddingInfo } from '../providers/embeddings.js';
import { chunkText, type Chunk } from './chunk.js';
import { discoverPages, extractFile, extractUrl } from './extract.js';
import { clip } from '../lib/util.js';

async function deleteChunks(ws: string, sourceId: string) {
  const snap = await paths.chunks(ws).where('sourceId', '==', sourceId).get();
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db().batch();
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/** Fetch/parse → chunk → embed → write. Idempotent: replaces previous chunks for the source. */
export async function processSource(ws: string, sourceId: string): Promise<void> {
  const ref = paths.sources(ws).doc(sourceId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const src = snap.data()!;
  await ref.update({ status: 'processing', error: null, updatedAt: FieldValue.serverTimestamp() });

  try {
    let chunks: Chunk[] = [];
    let pageCount = 1;
    let title = src.name as string;

    if (src.type === 'url') {
      const page = await extractUrl(src.url);
      title = src.name || page.title;
      chunks = chunkText(page.text, { title: page.title, url: page.url });
    } else if (src.type === 'sitemap') {
      const pages = await discoverPages(src.url, Math.min(src.maxPages || config.maxSitemapPages, config.maxSitemapPages));
      pageCount = 0;
      for (const url of pages) {
        const page = await extractUrl(url).catch(() => null);
        if (!page || page.text.length < 50) continue;
        pageCount++;
        chunks.push(...chunkText(page.text, { title: page.title, url: page.url, startOrdinal: chunks.length }));
        await ref.update({ pageCount, updatedAt: FieldValue.serverTimestamp() });
      }
      if (!pageCount) throw new Error('No readable pages were found on that site');
    } else if (src.type === 'file') {
      const [buf] = await bucket().file(src.storagePath).download();
      const text = await extractFile(buf, src.mimeType || '', src.fileName || '');
      chunks = chunkText(text, { title: src.name, url: null });
    } else if (src.type === 'text') {
      chunks = chunkText(src.text || '', { title: src.name, url: null });
    } else if (src.type === 'faq') {
      chunks = (src.items || []).map((it: { q: string; a: string }, i: number) => ({ text: `Q: ${it.q}\nA: ${it.a}`, title: src.name, url: null, ordinal: i }));
    }

    if (!chunks.length) throw new Error('We could not find any readable text in this source');
    const MAX_CHUNKS = 2000;
    if (chunks.length > MAX_CHUNKS) chunks = chunks.slice(0, MAX_CHUNKS);

    const vectors = await embed(chunks.map((c) => `${c.title}\n${c.text}`));
    await deleteChunks(ws, sourceId);
    const info = embeddingInfo();
    for (let i = 0; i < chunks.length; i += 200) {
      const batch = db().batch();
      chunks.slice(i, i + 200).forEach((c, j) => {
        batch.set(paths.chunks(ws).doc(), {
          sourceId,
          sourceType: src.type,
          title: clip(c.title, 200),
          url: c.url ?? null,
          text: c.text,
          ordinal: c.ordinal,
          embedding: FieldValue.vector(vectors[i + j]),
          embeddingModel: info.model,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    }

    await ref.update({
      status: 'ready',
      name: src.name || title,
      chunkCount: chunks.length,
      charCount: chunks.reduce((s, c) => s + c.text.length, 0),
      pageCount,
      embeddingModel: info.model,
      error: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (err: any) {
    console.error('[ingest] failed', ws, sourceId, err);
    await ref.update({ status: 'failed', error: clip(String(err?.message || err), 300), updatedAt: FieldValue.serverTimestamp() });
  }
}

export async function deleteSource(ws: string, sourceId: string) {
  const ref = paths.sources(ws).doc(sourceId);
  const snap = await ref.get();
  if (snap.get('storagePath')) await bucket().file(snap.get('storagePath')).delete().catch(() => {});
  await deleteChunks(ws, sourceId);
  await ref.delete();
}
