import { createHash } from 'node:crypto';
import { EMBEDDING_DIMENSIONS } from '@zdoda/shared';
import { config } from '../config.js';

export interface EmbeddingInfo {
  provider: 'openai' | 'gemini' | 'mock';
  model: string;
  live: boolean;
}

export function embeddingInfo(): EmbeddingInfo {
  const provider = config.embeddingProvider;
  if (provider === 'openai') return { provider, model: 'openai/text-embedding-3-small@768', live: true };
  if (provider === 'gemini') return { provider, model: 'gemini/gemini-embedding-001@768', live: true };
  return { provider: 'mock', model: 'mock/hashing-v1@768', live: false };
}

function normalize(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

/** Deterministic hashing embedding (unigrams + bigrams). Works offline; lexical, not semantic. */
export function mockEmbed(text: string): number[] {
  const v = new Array(EMBEDDING_DIMENSIONS).fill(0);
  const words = (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter((w) => w.length > 1);
  const add = (token: string, weight: number) => {
    const hash = createHash('md5').update(token).digest();
    const idx = hash.readUInt32BE(0) % EMBEDDING_DIMENSIONS;
    v[idx] += (hash[4] & 1 ? 1 : -1) * weight;
  };
  words.forEach((w, i) => {
    add(w, 1);
    if (w.length > 4) add(w.slice(0, 5), 0.5); // crude stemming
    if (i > 0) add(words[i - 1] + ' ' + w, 0.7);
  });
  return normalize(v);
}

const BATCH = 64;

export async function embed(texts: string[]): Promise<number[][]> {
  const { provider } = embeddingInfo();
  if (provider === 'mock') return texts.map(mockEmbed);
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH).map((t) => t.slice(0, 8000));
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${config.openaiKey}` },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: batch, dimensions: EMBEDDING_DIMENSIONS }),
        signal: AbortSignal.timeout(60_000),
      });
      const json: any = await res.json();
      if (!res.ok) throw new Error(`Embedding error: ${json?.error?.message || res.status}`);
      out.push(...json.data.map((d: any) => normalize(d.embedding)));
    } else {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': config.geminiKey },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: 'models/gemini-embedding-001',
            content: { parts: [{ text }] },
            outputDimensionality: EMBEDDING_DIMENSIONS,
          })),
        }),
        signal: AbortSignal.timeout(60_000),
      });
      const json: any = await res.json();
      if (!res.ok) throw new Error(`Embedding error: ${json?.error?.message || res.status}`);
      out.push(...json.embeddings.map((e: any) => normalize(e.values)));
    }
  }
  return out;
}
