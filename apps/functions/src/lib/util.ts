import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { config } from '../config.js';
import { paths } from '../firebase.js';

export const newId = (prefix = '', bytes = 10) => prefix + randomBytes(bytes).toString('base64url');
export const now = () => FieldValue.serverTimestamp();

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'workspace';

function key(): Buffer {
  const raw = config.encryptionKey;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') throw new Error('ENCRYPTION_KEY is required in production');
    return createHash('sha256').update('zdoda-dev-only-key').digest();
  }
  return /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : createHash('sha256').update(raw).digest();
}

/** AES-256-GCM for integration secrets. Output: iv.tag.ciphertext (base64url). */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64url')).join('.');
}
export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

export async function audit(ws: string, actor: { uid: string; email?: string } | null, action: string, meta: Record<string, unknown> = {}) {
  await paths.audit(ws).add({ action, actorId: actor?.uid ?? 'system', actorEmail: actor?.email ?? null, meta, createdAt: now() }).catch(() => {});
}

export const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
