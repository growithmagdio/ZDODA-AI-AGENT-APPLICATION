import { describe, expect, it } from 'vitest';
import { chunkText } from '../rag/chunk.js';
import { mockEmbed } from '../providers/embeddings.js';
import { htmlToText, parseSitemap } from '../rag/extract.js';
import { can } from '../lib/can.js';
import { encrypt, decrypt } from '../lib/util.js';
import { buildSystemPrompt } from '../chat/engine.js';

describe('rag helpers', () => {
  it('chunks long text with overlap and keeps short docs whole', () => {
    const text = Array.from({ length: 40 }, (_, i) => `Paragraph ${i} about dental cleaning prices and opening hours.`).join('\n');
    const chunks = chunkText(text, { title: 'Doc', size: 400, overlap: 80 });
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.every((c) => c.text.length <= 480)).toBe(true);
    expect(chunkText('Short but meaningful content here.', { title: 'x' })).toHaveLength(1);
  });

  it('mock embeddings are normalised and lexically similar', () => {
    const a = mockEmbed('teeth whitening price');
    const b = mockEmbed('how much is teeth whitening');
    const c = mockEmbed('parking near the clinic');
    const dot = (x: number[], y: number[]) => x.reduce((s, v, i) => s + v * y[i], 0);
    expect(Math.abs(dot(a, a) - 1)).toBeLessThan(1e-6);
    expect(dot(a, b)).toBeGreaterThan(dot(a, c));
  });

  it('extracts readable text from html and parses sitemaps', () => {
    const page = htmlToText('<html><head><title>Hours</title><script>x()</script></head><body><nav>menu</nav><main><h1>Opening hours</h1><p>Mon–Fri 9–6</p></main></body></html>', 'https://a.com/hours');
    expect(page.title).toBe('Hours');
    expect(page.text).toContain('Mon–Fri 9–6');
    expect(page.text).not.toContain('x()');
    expect(parseSitemap('<urlset><url><loc>https://a.com/</loc></url><url><loc>https://a.com/b</loc></url></urlset>').pages).toHaveLength(2);
  });
});

describe('security helpers', () => {
  it('enforces the role matrix', () => {
    expect(can('OWNER', 'manage_billing', 'Billing')).toBe(true);
    expect(can('ADMIN', 'manage_billing', 'Billing')).toBe(false);
    expect(can('BUILDER', 'publish', 'Widget')).toBe(true);
    expect(can('AGENT', 'update', 'Inbox')).toBe(true);
    expect(can('VIEWER', 'update', 'Agent')).toBe(false);
  });

  it('round-trips AES-256-GCM secrets', () => {
    const enc = encrypt('whsec_123');
    expect(enc).not.toContain('whsec');
    expect(decrypt(enc)).toBe('whsec_123');
  });

  it('builds a grounded system prompt', () => {
    const p = buildSystemPrompt({ name: 'Bot', strictKnowledge: true, fallbackMessage: 'Ask the team', leadCapture: true, bookingUrl: 'https://cal.com/x' }, 'Smile', ['Cleaning costs $80'], true);
    expect(p).toContain('KNOWLEDGE');
    expect(p).toContain('Cleaning costs $80');
    expect(p).toContain('https://cal.com/x');
  });
});
