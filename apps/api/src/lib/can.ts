import { RequestContext, WorkspaceRole } from '@zdoda/shared';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'publish' | 'manage_billing' | 'manage_team';
export type Resource =
  | 'Dashboard'
  | 'Agent'
  | 'Knowledge'
  | 'Widget'
  | 'Channel'
  | 'Inbox'
  | 'Billing'
  | 'Team'
  | 'Settings';

const ROLE_PERMISSIONS: Record<WorkspaceRole, Partial<Record<Resource, Action[]>>> = {
  OWNER: {
    Dashboard: ['read'],
    Agent: ['read', 'create', 'update', 'delete', 'publish'],
    Knowledge: ['read', 'create', 'update', 'delete'],
    Widget: ['read', 'update', 'publish'],
    Channel: ['read', 'create', 'update', 'delete'],
    Inbox: ['read', 'create', 'update', 'delete'],
    Billing: ['read', 'manage_billing'],
    Team: ['read', 'manage_team'],
    Settings: ['read', 'update'],
  },
  ADMIN: {
    Dashboard: ['read'],
    Agent: ['read', 'create', 'update', 'delete', 'publish'],
    Knowledge: ['read', 'create', 'update', 'delete'],
    Widget: ['read', 'update', 'publish'],
    Channel: ['read', 'create', 'update'],
    Inbox: ['read', 'create', 'update', 'delete'],
    Billing: ['read'],
    Team: ['read', 'manage_team'],
    Settings: ['read', 'update'],
  },
  BUILDER: {
    Dashboard: ['read'],
    Agent: ['read', 'create', 'update', 'publish'],
    Knowledge: ['read', 'create', 'update', 'delete'],
    Widget: ['read', 'update', 'publish'],
    Channel: ['read'],
    Inbox: ['read', 'create', 'update'],
    Billing: ['read'],
    Team: ['read'],
    Settings: ['read'],
  },
  AGENT: {
    Dashboard: ['read'],
    Agent: ['read'],
    Knowledge: ['read'],
    Widget: ['read'],
    Channel: ['read'],
    Inbox: ['read', 'create', 'update'],
    Billing: [],
    Team: ['read'],
    Settings: [],
  },
  VIEWER: {
    Dashboard: ['read'],
    Agent: ['read'],
    Knowledge: ['read'],
    Widget: ['read'],
    Channel: ['read'],
    Inbox: ['read'],
    Billing: [],
    Team: ['read'],
    Settings: [],
  },
};

export function can(ctx: RequestContext, action: Action, resource: Resource): boolean {
  if (!ctx || !ctx.role) return false;
  const allowedActions = ROLE_PERMISSIONS[ctx.role]?.[resource] || [];
  return allowedActions.includes(action);
}
