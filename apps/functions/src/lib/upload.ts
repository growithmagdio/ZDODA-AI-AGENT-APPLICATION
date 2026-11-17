import Busboy from 'busboy';
import type { Request } from 'express';
import { AppError } from './http.js';

export interface UploadedFile {
  fieldName: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

/** Parses multipart/form-data. Works in Cloud Functions (uses req.rawBody) and plain Express (streams). */
export function readMultipart(req: Request, maxBytes: number): Promise<{ files: UploadedFile[]; fields: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    let bb: Busboy.Busboy;
    try {
      bb = Busboy({ headers: req.headers, limits: { fileSize: maxBytes, files: 1 } });
    } catch {
      return reject(new AppError(400, 'BAD_REQUEST', 'Expected a file upload'));
    }
    const files: UploadedFile[] = [];
    const fields: Record<string, string> = {};
    let tooLarge = false;
    bb.on('file', (fieldName, stream, info) => {
      const parts: Buffer[] = [];
      stream.on('data', (d: Buffer) => parts.push(d));
      stream.on('limit', () => (tooLarge = true));
      stream.on('end', () => files.push({ fieldName, fileName: info.filename || 'upload', mimeType: info.mimeType || 'application/octet-stream', buffer: Buffer.concat(parts) }));
    });
    bb.on('field', (name, val) => (fields[name] = val));
    bb.on('error', (e) => reject(e));
    bb.on('close', () => {
      if (tooLarge) return reject(new AppError(413, 'FILE_TOO_LARGE', `Files must be under ${Math.round(maxBytes / 1024 / 1024)} MB`));
      resolve({ files, fields });
    });
    if (req.rawBody) bb.end(req.rawBody);
    else req.pipe(bb);
  });
}
