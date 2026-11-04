import type { NextFunction, Request, Response, RequestHandler } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, fields?: Record<string, string[]>) => new AppError(400, 'BAD_REQUEST', msg, fields);
export const notFound = (what = 'Resource') => new AppError(404, 'NOT_FOUND', `${what} not found`);
export const forbidden = (msg = 'You do not have permission to do this') => new AppError(403, 'FORBIDDEN', msg);

/** Wrap async handlers so thrown errors reach the error middleware (Express 4). */
export const h =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Please check the highlighted fields', result.error.flatten().fieldErrors as Record<string, string[]>);
  }
  return result.data;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', fields: err.flatten().fieldErrors } });
  }
  console.error('[api] unhandled error', err);
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong on our side. Please try again.' } });
}

/** Convert Firestore Timestamps to ISO strings recursively for JSON responses. */
export function serialize<T = any>(value: any): T {
  if (value === null || value === undefined) return value;
  if (value instanceof Timestamp) return value.toDate().toISOString() as any;
  if (value instanceof Date) return value.toISOString() as any;
  if (Array.isArray(value)) return value.map((v) => serialize(v)) as any;
  if (typeof value === 'object') {
    if (typeof (value as any).toArray === 'function' && (value as any).constructor?.name === 'VectorValue') return undefined as any;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out as T;
  }
  return value;
}

export const docData = <T = any>(snap: FirebaseFirestore.DocumentSnapshot): T => serialize({ id: snap.id, ...snap.data() });
