export class ApiError extends Error {
  code: string;
  fields?: Record<string, string[]>;

  constructor(message: string, code: string = 'ERROR', fields?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const activeWorkspaceId = localStorage.getItem('zdoda_active_workspace_id');

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (activeWorkspaceId) {
    headers.set('X-Workspace-Id', activeWorkspaceId);
  }

  const res = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorInfo = data.error || { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' };
    throw new ApiError(errorInfo.message, errorInfo.code, errorInfo.fields);
  }

  return data as T;
}
