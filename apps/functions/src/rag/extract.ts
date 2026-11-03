import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { parse as parseHtml } from 'node-html-parser';
import mammoth from 'mammoth';
// Import the library entry directly: the package index runs a debug self-test under ESM.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { config } from '../config.js';

const UA = 'ZdodaBot/1.0 (+https://zdoda.app/bot)';
const MAX_BYTES = 5 * 1024 * 1024;

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const v = ip.toLowerCase();
    return v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:127.') || v === '::';
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

/** SSRF guard: only public http(s) hosts unless ALLOW_PRIVATE_URLS=true (local testing). */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('That does not look like a valid URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http and https URLs are supported');
  if (config.allowPrivateUrls) return url;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Private addresses are not allowed');
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true })).map((r) => r.address);
  if (ips.some(isPrivateIp)) throw new Error('Private addresses are not allowed');
  return url;
}

export async function fetchText(raw: string): Promise<{ body: string; contentType: string; finalUrl: string }> {
  const url = await assertPublicUrl(raw);
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.5' }, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`The page returned HTTP ${res.status}`);
  const len = Number(res.headers.get('content-length') || 0);
  if (len > MAX_BYTES) throw new Error('The page is larger than 5 MB');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error('The page is larger than 5 MB');
  return { body: buf.toString('utf8'), contentType: res.headers.get('content-type') || '', finalUrl: res.url || url.toString() };
}

export interface ExtractedPage {
  url: string;
  title: string;
  text: string;
  links: string[];
}

export function htmlToText(html: string, baseUrl: string): ExtractedPage {
  const root = parseHtml(html, { comment: false, blockTextElements: { script: false, style: false, noscript: false, pre: true } });
  const title = (root.querySelector('title')?.text || root.querySelector('h1')?.text || baseUrl).trim().replace(/\s+/g, ' ');
  const links: string[] = [];
  root.querySelectorAll('a[href]').forEach((a) => {
    try {
      const u = new URL(a.getAttribute('href')!, baseUrl);
      u.hash = '';
      links.push(u.toString());
    } catch {
      /* ignore */
    }
  });
  root.querySelectorAll('script,style,noscript,svg,iframe,nav,footer,header form,template').forEach((n) => n.remove());
  const main = root.querySelector('main') || root.querySelector('article') || root.querySelector('body') || root;
  const text = main.structuredText
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
  return { url: baseUrl, title, text, links };
}

export async function extractUrl(raw: string): Promise<ExtractedPage> {
  const { body, contentType, finalUrl } = await fetchText(raw);
  if (contentType.includes('text/plain')) return { url: finalUrl, title: finalUrl, text: body, links: [] };
  return htmlToText(body, finalUrl);
}

export function parseSitemap(xml: string): { pages: string[]; sitemaps: string[] } {
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(xml)) return { pages: [], sitemaps: locs };
  return { pages: locs, sitemaps: [] };
}

/**
 * Discover pages for a site: tries the given sitemap (or /sitemap.xml), then falls back to a
 * same-origin breadth-first crawl from the start URL.
 */
export async function discoverPages(startUrl: string, maxPages: number): Promise<string[]> {
  const start = await assertPublicUrl(startUrl);
  const candidates = /\.xml(\?|$)/i.test(start.pathname) ? [start.toString()] : [new URL('/sitemap.xml', start).toString()];
  for (const sm of candidates) {
    try {
      const { body } = await fetchText(sm);
      const parsed = parseSitemap(body);
      const pages = [...parsed.pages];
      for (const child of parsed.sitemaps.slice(0, 5)) {
        if (pages.length >= maxPages) break;
        const sub = await fetchText(child).then((r) => parseSitemap(r.body).pages).catch(() => []);
        pages.push(...sub);
      }
      if (pages.length) return [...new Set(pages)].slice(0, maxPages);
    } catch {
      /* no sitemap — crawl */
    }
  }
  if (/\.xml(\?|$)/i.test(start.pathname)) throw new Error('Could not read that sitemap');
  const seen = new Set<string>([start.toString()]);
  const queue = [start.toString()];
  const pages: string[] = [];
  while (queue.length && pages.length < maxPages) {
    const url = queue.shift()!;
    pages.push(url);
    const page = await extractUrl(url).catch(() => null);
    for (const link of page?.links || []) {
      const u = new URL(link);
      if (u.origin !== start.origin || seen.has(link) || /\.(png|jpe?g|gif|svg|webp|pdf|zip|mp4|css|js)$/i.test(u.pathname)) continue;
      seen.add(link);
      queue.push(link);
    }
  }
  return pages;
}

export async function extractFile(buf: Buffer, mimeType: string, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    const out = await pdfParse(buf);
    return out.text;
  }
  if (ext === 'docx' || mimeType.includes('officedocument.wordprocessingml')) {
    const out = await mammoth.extractRawText({ buffer: buf });
    return out.value;
  }
  if (ext === 'html' || ext === 'htm' || mimeType.includes('html')) return htmlToText(buf.toString('utf8'), fileName).text;
  if (['txt', 'md', 'markdown', 'csv', 'json', 'tsv'].includes(ext) || mimeType.startsWith('text/')) return buf.toString('utf8');
  throw new Error('Unsupported file type. Use PDF, DOCX, TXT, MD, CSV or HTML.');
}

export const SUPPORTED_UPLOAD_EXT = ['pdf', 'docx', 'txt', 'md', 'markdown', 'csv', 'json', 'html', 'htm', 'tsv'];
