import type { NextFunction, Request, Response } from 'express';
import type { WorkspaceRole } from '@zdoda/shared';
import { auth, paths } from '../firebase.js';
import { AppError, forbidden } from '../lib/http.js';
import { can, type Action, type Resource } from '../lib/can.js';

export interface AuthedUser {
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
  picture?: string;
}

export interface WorkspaceCtx {
  workspaceId: string;
  role: WorkspaceRole;
  workspace: FirebaseFirestore.DocumentData;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
      ws?: WorkspaceCtx;
      rawBody?: Buffer;
    }
  }
}

/** Verifies the Firebase ID token sent as `Authorization: Bearer <token>`. */
export async function requireUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue');
    const decoded = await auth().verifyIdToken(token).catch(() => {
      throw new AppError(401, 'UNAUTHENTICATED', 'Your session has expired. Please sign in again.');
    });
    req.user = {
      uid: decoded.uid,
      email: (decoded.email || '').toLowerCase(),
      name: (decoded.name as string) || (decoded.email || '').split('@')[0],
      emailVerified: Boolean(decoded.email_verified),
      picture: decoded.picture,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Resolves the active workspace from `X-Workspace-Id` and checks membership. Tenancy boundary. */
export async function requireWorkspace(req: Request, _res: Response, next: NextFunction) {
  try {
    const wsId = String(req.headers['x-workspace-id'] || req.params.workspaceId || '');
    if (!wsId) throw new AppError(400, 'WORKSPACE_REQUIRED', 'No workspace selected');
    const [member, ws] = await Promise.all([paths.membership(wsId, req.user!.uid).get(), paths.workspace(wsId).get()]);
    if (!member.exists || !ws.exists) throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'Workspace not found');
    req.ws = { workspaceId: wsId, role: member.get('role'), workspace: ws.data()! };
    next();
  } catch (err) {
    next(err);
  }
}

export const requirePermission =
  (action: Action, resource: Resource) => (req: Request, _res: Response, next: NextFunction) => {
    if (!can(req.ws?.role, action, resource)) return next(forbidden(`Your role (${req.ws?.role}) can't ${action.replace('_', ' ')} ${resource.toLowerCase()}`));
    next();
  };
