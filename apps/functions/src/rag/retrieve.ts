import { FieldValue } from 'firebase-admin/firestore';
import type { Citation } from '@zdoda/shared';
import { paths } from '../firebase.js';
import { embed } from '../providers/embeddings.js';
import { clip } from '../lib/util.js';

export interface RetrievedChunk {
  id: string;
  sourceId: string;
  title: string;
  url: string | null;
  text: string;
  score: number; // cosine similarity (1 = identical)
}

let vectorSearchWorks: boolean | null = null;

function cosine(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s; // vectors are L2-normalised
}

/** Firestore KNN vector search, with a brute-force fallback (emulator / index still building). */
export async function retrieve(ws: string, query: string, opts: { k?: number; sourceIds?: string[] } = {}): Promise<RetrievedChunk[]> {
  const k = opts.k ?? 5;
  const [vec] = await embed([query]);
  const allowed = opts.sourceIds?.length ? new Set(opts.sourceIds) : null;
  let results: RetrievedChunk[] = [];

  if (vectorSearchWorks !== false) {
    try {
      const snap = await paths
        .chunks(ws)
        .findNearest({ vectorField: 'embedding', queryVector: FieldValue.vector(vec), limit: Math.min(50, k * 6), distanceMeasure: 'COSINE', distanceResultField: '_distance' })
        .get();
      vectorSearchWorks = true;
      results = snap.docs.map((d) => ({
        id: d.id,
        sourceId: d.get('sourceId'),
        title: d.get('title'),
        url: d.get('url') ?? null,
        text: d.get('text'),
        score: 1 - Number(d.get('_distance') ?? 1),
      }));
    } catch (err: any) {
      if (vectorSearchWorks === null) console.warn('[retrieve] vector search unavailable, using fallback:', err?.message);
      vectorSearchWorks = vectorSearchWorks ?? false;
    }
  }

  if (vectorSearchWorks === false) {
    const snap = await paths.chunks(ws).limit(3000).get();
    results = snap.docs
      .map((d) => {
        const emb = d.get('embedding');
        const arr: number[] = emb?.toArray ? emb.toArray() : emb || [];
        return { id: d.id, sourceId: d.get('sourceId'), title: d.get('title'), url: d.get('url') ?? null, text: d.get('text'), score: arr.length ? cosine(vec, arr) : 0 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, k * 6);
  }

  return results.filter((r) => (!allowed || allowed.has(r.sourceId)) && r.score > 0.05).slice(0, k);
}

export const toCitations = (chunks: RetrievedChunk[]): Citation[] => {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of chunks) {
    const key = c.url || c.sourceId;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ sourceId: c.sourceId, title: c.title, url: c.url, snippet: clip(c.text.replace(/\s+/g, ' '), 180) });
  }
  return out.slice(0, 3);
};
