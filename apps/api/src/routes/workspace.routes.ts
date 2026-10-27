import { Router } from 'express';
import { prisma } from '@zdoda/db';
import { CreateWorkspaceInputSchema, UpdateOnboardingInputSchema } from '@zdoda/shared';
import { AuthenticatedRequest, requireAuth, requireTenant } from '../middleware/auth';

export const workspaceRouter = Router();

// Apply auth to all workspace routes
workspaceRouter.use(requireAuth);

// GET /api/v1/workspaces - List all workspaces for user
workspaceRouter.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user!.id },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    });

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      logoUrl: m.workspace.logoUrl,
      role: m.role,
    }));

    return res.json({ workspaces });
  } catch (err) {
    console.error('[ListWorkspaces] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list workspaces' } });
  }
});

// POST /api/v1/workspaces - Create new workspace
workspaceRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const parseResult = CreateWorkspaceInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', fields: parseResult.error.flatten().fieldErrors },
    });
  }

  const { name, slug } = parseResult.data;
  const workspaceSlug = slug || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug: workspaceSlug,
      },
    });

    await prisma.membership.create({
      data: {
        userId: req.user!.id,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    });

    await prisma.onboardingProgress.create({
      data: {
        workspaceId: workspace.id,
        currentStep: 2,
        completedStepsJson: [1, 2],
      },
    });

    return res.status(201).json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: 'OWNER',
      },
    });
  } catch (err) {
    console.error('[CreateWorkspace] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create workspace' } });
  }
});

// GET /api/v1/workspaces/:id - Get specific workspace (with strict 404 on cross-tenant)
workspaceRouter.get('/:id', async (req: AuthenticatedRequest, res) => {
  const id = req.params.id as string;

  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user!.id,
          workspaceId: id,
        },
      },
      include: {
        workspace: {
          include: {
            subscription: { include: { plan: true } },
            agents: { select: { id: true, name: true, isPublished: true } },
          },
        },
      },
    });

    // Rule 03: Cross-tenant returns 404, never 403
    if (!membership) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
    }

    const ws = membership.workspace;

    return res.json({
      workspace: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        logoUrl: ws.logoUrl,
        role: membership.role,
        subscription: ws.subscription
          ? {
              status: ws.subscription.status,
              planName: ws.subscription.plan.name,
              planSlug: ws.subscription.plan.slug,
            }
          : null,
        agentsCount: ws.agents.length,
      },
    });
  } catch (err) {
    console.error('[GetWorkspace] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve workspace' } });
  }
});

// GET /api/v1/workspaces/:id/onboarding - Retrieve onboarding progress
workspaceRouter.get('/:id/onboarding', async (req: AuthenticatedRequest, res) => {
  const id = req.params.id as string;

  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user!.id,
          workspaceId: id,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
    }

    const progress = await prisma.onboardingProgress.findUnique({
      where: { workspaceId: id },
    });

    return res.json({
      onboarding: progress || {
        currentStep: 1,
        completedSteps: [1],
        isComplete: false,
      },
    });
  } catch (err) {
    console.error('[GetOnboarding] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch onboarding' } });
  }
});

// PATCH /api/v1/workspaces/:id/onboarding - Update onboarding progress
workspaceRouter.patch('/:id/onboarding', async (req: AuthenticatedRequest, res) => {
  const id = req.params.id as string;

  const parseResult = UpdateOnboardingInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid step' } });
  }

  const { step, businessName } = parseResult.data;

  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user!.id,
          workspaceId: id,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
    }

    if (businessName) {
      await prisma.workspace.update({
        where: { id },
        data: { name: businessName },
      });
    }

    const current = await prisma.onboardingProgress.findUnique({
      where: { workspaceId: id },
    });

    const completed = Array.isArray(current?.completedStepsJson)
      ? (current.completedStepsJson as number[])
      : [1];

    if (!completed.includes(step)) {
      completed.push(step);
    }

    const updated = await prisma.onboardingProgress.upsert({
      where: { workspaceId: id },
      update: {
        currentStep: Math.max(step, current?.currentStep || 1),
        completedStepsJson: completed,
        isComplete: step >= 7,
      },
      create: {
        workspaceId: id,
        currentStep: step,
        completedStepsJson: completed,
        isComplete: step >= 7,
      },
    });

    return res.json({ onboarding: updated });
  } catch (err) {
    console.error('[UpdateOnboarding] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update onboarding' } });
  }
});
