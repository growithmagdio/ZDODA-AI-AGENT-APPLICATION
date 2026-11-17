import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { BillingDTO, SystemStatusDTO, UsageDTO } from '@zdoda/shared';
import { api, ApiError, getActiveWorkspaceId } from './api';
import { useToast } from '../context/ToastContext';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'publish' | 'manage_billing' | 'manage_team';

export interface WorkspaceDetail {
  workspace: { id: string; name: string; slug: string; category?: string | null; websiteUrl?: string | null; timezone?: string; supportEmail?: string; plan: string; createdAt: string };
  role: 'OWNER' | 'ADMIN' | 'BUILDER' | 'AGENT' | 'VIEWER';
  permissions: Record<string, Action[]>;
  usage: UsageDTO;
  billing: BillingDTO;
}

/** Query keys are scoped to the active workspace so switching never shows stale tenant data. */
export const wsKey = (...parts: unknown[]): QueryKey => [getActiveWorkspaceId(), ...parts];

export function useWorkspace() {
  return useQuery({ queryKey: wsKey('workspace'), queryFn: () => api.get<WorkspaceDetail>('/workspaces/current'), staleTime: 30_000 });
}

export function useCan() {
  const { data } = useWorkspace();
  return (action: Action, resource: string) => Boolean(data?.permissions?.[resource]?.includes(action));
}

export function useSystemStatus() {
  return useQuery({ queryKey: ['system-status'], queryFn: () => api.get<SystemStatusDTO>('/system/status'), staleTime: 5 * 60_000 });
}

/** Mutation helper: toasts errors, optionally toasts success, invalidates keys. */
export function useApiMutation<TVars, TOut = any>(
  fn: (vars: TVars) => Promise<TOut>,
  opts: { success?: string | ((out: TOut) => string); invalidate?: unknown[][]; onSuccess?: (out: TOut, vars: TVars) => void } = {}
) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (out, vars) => {
      opts.invalidate?.forEach((k) => qc.invalidateQueries({ queryKey: wsKey(...k) }));
      if (opts.success) toast(typeof opts.success === 'function' ? opts.success(out) : opts.success);
      opts.onSuccess?.(out, vars);
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Something went wrong', { type: 'error' }),
  });
}

export const timeAgo = (iso?: string | null) => {
  if (!iso) return '';
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

export const fmt = (n: number) => new Intl.NumberFormat().format(n);
