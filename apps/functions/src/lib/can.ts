import type { WorkspaceRole } from '@zdoda/shared';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'publish' | 'manage_billing' | 'manage_team';
export type Resource = 'Dashboard' | 'Agent' | 'Knowledge' | 'Widget' | 'Channel' | 'Inbox' | 'Billing' | 'Team' | 'Settings' | 'Integration';

const ALL: Action[] = ['read', 'create', 'update', 'delete', 'publish'];

const ROLE_PERMISSIONS: Record<WorkspaceRole, Partial<Record<Resource, Action[]>>> = {
  OWNER: {
    Dashboard: ['read'], Agent: ALL, Knowledge: ALL, Widget: ALL, Channel: ALL, Inbox: ALL, Integration: ALL,
    Billing: ['read', 'manage_billing'], Team: ['read', 'manage_team'], Settings: ['read', 'update', 'delete'],
  },
  ADMIN: {
    Dashboard: ['read'], Agent: ALL, Knowledge: ALL, Widget: ALL, Channel: ['read', 'create', 'update'], Inbox: ALL, Integration: ALL,
    Billing: ['read'], Team: ['read', 'manage_team'], Settings: ['read', 'update'],
  },
  BUILDER: {
    Dashboard: ['read'], Agent: ['read', 'create', 'update', 'publish'], Knowledge: ALL, Widget: ['read', 'update', 'publish'],
    Channel: ['read'], Inbox: ['read', 'create', 'update'], Integration: ['read', 'create', 'update'], Billing: ['read'], Team: ['read'], Settings: ['read'],
  },
  AGENT: {
    Dashboard: ['read'], Agent: ['read'], Knowledge: ['read'], Widget: ['read'], Channel: ['read'], Inbox: ['read', 'create', 'update'],
    Integration: ['read'], Team: ['read'],
  },
  VIEWER: {
    Dashboard: ['read'], Agent: ['read'], Knowledge: ['read'], Widget: ['read'], Channel: ['read'], Inbox: ['read'], Integration: ['read'], Team: ['read'],
  },
};

export function can(role: WorkspaceRole | undefined, action: Action, resource: Resource): boolean {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role]?.[resource] || []).includes(action);
}

export function permissionsFor(role: WorkspaceRole): Record<string, Action[]> {
  return ROLE_PERMISSIONS[role] as Record<string, Action[]>;
}
