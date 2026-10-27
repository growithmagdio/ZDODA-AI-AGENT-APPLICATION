import { Request, Response, NextFunction } from 'express';
import { prisma, createTenantClient } from '@zdoda/db';
import { RequestContext } from '@zdoda/shared';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  ctx?: RequestContext;
  tenantPrisma?: ReturnType<typeof createTenantClient>;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionToken = req.cookies?.zdoda_session || req.headers.authorization?.replace('Bearer ', '');

  if (!sessionToken) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      res.clearCookie('zdoda_session');
      return res.status(401).json({ error: { code: 'SESSION_EXPIRED', message: 'Session expired, please sign in again' } });
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    };

    return next();
  } catch (err) {
    console.error('[AuthMiddleware] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Authentication verification failed' } });
  }
}

export async function requireTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  const requestedWorkspaceId = (req.headers['x-workspace-id'] as string) || (req.query.workspaceId as string);

  try {
    let membership;

    if (requestedWorkspaceId) {
      membership = await prisma.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId: requestedWorkspaceId,
          },
        },
        include: { workspace: true },
      });

      // Strict Rule 03 Tenancy check: cross-tenant access returns 404, never 403
      if (!membership) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
      }
    } else {
      // Default to first membership
      membership = await prisma.membership.findFirst({
        where: { userId: req.user.id },
        include: { workspace: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!membership) {
        return res.status(404).json({ error: { code: 'NO_WORKSPACE', message: 'No workspace found for user' } });
      }
    }

    req.ctx = {
      userId: req.user.id,
      workspaceId: membership.workspaceId,
      role: membership.role as any,
      email: req.user.email,
    };

    req.tenantPrisma = createTenantClient(membership.workspaceId);

    return next();
  } catch (err) {
    console.error('[TenantMiddleware] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve workspace' } });
  }
}
