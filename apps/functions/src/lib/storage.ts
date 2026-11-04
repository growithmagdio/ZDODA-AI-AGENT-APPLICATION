import { randomUUID } from 'node:crypto';
import { bucket, storageMode } from '../firebase.js';
import { config } from '../config.js';

/** Saves a file to Firebase Storage and returns a token download URL (works in prod and emulator). */
export async function saveFile(path: string, buffer: Buffer, contentType: string, opts: { publicUrl?: boolean } = {}) {
  const token = randomUUID();
  const file = bucket().file(path);
  await file.save(buffer, { contentType, resumable: false, metadata: { metadata: opts.publicUrl ? { firebaseStorageDownloadTokens: token } : {} } });
  if (!opts.publicUrl) return { path, url: null as string | null };
  if (storageMode() === 'local') return { path, url: `${config.publicApiUrl}/api/v1/dev-files/${path.split('/').map(encodeURIComponent).join('/')}` };
  const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}` : 'https://firebasestorage.googleapis.com';
  return { path, url: `${host}/v0/b/${bucket().name}/o/${encodeURIComponent(path)}?alt=media&token=${token}` };
}
