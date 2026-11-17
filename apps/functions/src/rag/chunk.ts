export interface Chunk {
  text: string;
  title: string;
  url?: string | null;
  ordinal: number;
}

/** Paragraph-aware chunking (~1,200 chars, 200 overlap). Keeps headings with their content. */
export function chunkText(text: string, opts: { title: string; url?: string | null; size?: number; overlap?: number; startOrdinal?: number }): Chunk[] {
  const size = opts.size ?? 1200;
  const overlap = opts.overlap ?? 200;
  const paras = text
    .replace(/\r/g, '')
    .split(/\n{1,}/)
    .map((p) => p.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
  const chunks: Chunk[] = [];
  let buf = '';
  const push = () => {
    const t = buf.trim();
    if (t.length >= 20) chunks.push({ text: t, title: opts.title, url: opts.url ?? null, ordinal: (opts.startOrdinal ?? 0) + chunks.length });
  };
  for (const p of paras) {
    if (p.length > size) {
      // Hard-split very long paragraphs on sentence boundaries.
      const sentences = p.split(/(?<=[.!?])\s+/);
      for (const s of sentences) {
        if ((buf + ' ' + s).length > size && buf) {
          push();
          buf = buf.slice(-overlap);
        }
        buf += (buf ? ' ' : '') + s;
      }
      continue;
    }
    if ((buf + '\n' + p).length > size && buf) {
      push();
      buf = buf.slice(-overlap);
    }
    buf += (buf ? '\n' : '') + p;
  }
  push();
  return chunks;
}
