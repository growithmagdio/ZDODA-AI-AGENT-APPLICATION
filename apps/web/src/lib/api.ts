import { auth } from './firebase';

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string[]>;

  constructor(message: string, code: string = 'ERROR', fields?: Record<string, string[]>, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1';
export const WORKSPACE_KEY = 'zdoda_active_workspace_id';

export function getActiveWorkspaceId(): string | null {
  try {
    return localStorage.getItem(WORKSPACE_KEY);
  } catch {
    return null;
  }
}

export function setActiveWorkspaceId(id: string | null) {
  try {
    if (id) localStorage.setItem(WORKSPACE_KEY, id);
    else localStorage.removeItem(WORKSPACE_KEY);
  } catch {
    /* storage unavailable */
  }
}

async function authHeaders(headers: Headers) {
  const token = await auth.currentUser?.getIdToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const ws = getActiveWorkspaceId();
  if (ws) headers.set('X-Workspace-Id', ws);
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isForm && options.body !== undefined) headers.set('Content-Type', 'application/json');
  await authHeaders(headers);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiError('Cannot reach the Zdoda server. Check your connection and try again.', 'NETWORK');
  }
  if (res.headers.get('content-type')?.includes('text/csv')) return (await res.text()) as unknown as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const info = data.error || { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' };
    throw new ApiError(info.message, info.code, info.fields, res.status);
  }
  return data as T;
}

export const api = {
  get: <T = any>(p: string) => apiRequest<T>(p),
  post: <T = any>(p: string, body?: unknown) => apiRequest<T>(p, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T = any>(p: string, body?: unknown) => apiRequest<T>(p, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T = any>(p: string) => apiRequest<T>(p, { method: 'DELETE' }),
  upload: <T = any>(p: string, file: File, fields: Record<string, string> = {}) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    return apiRequest<T>(p, { method: 'POST', body: fd });
  },
};
