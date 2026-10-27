import { Router, Response } from 'express';
import { prisma } from '@zdoda/db';
import argon2 from 'argon2';
import crypto from 'crypto';
import {
  SignupInputSchema,
  LoginInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
  VerifyEmailInputSchema,
} from '@zdoda/shared';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { emailService } from '../services/email.service';

export const authRouter = Router();

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function setSessionCookie(res: Response, token: string) {
  res.cookie('zdoda_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  });
}

// In-memory token stores for email verification and password reset (single-use, 30-min expiry)
const verificationTokens = new Map<string, { email: string; expiresAt: number }>();
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

// POST /api/v1/auth/signup
authRouter.post('/signup', async (req, res) => {
  const parseResult = SignupInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', fields: parseResult.error.flatten().fieldErrors },
    });
  }

  const { name, email, password, workspaceName } = parseResult.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' } });
    }

    const passwordHash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: false,
      },
    });

    // Create initial workspace
    const wsName = workspaceName || `${name.split(' ')[0]}'s Workspace`;
    const slug = `${wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: wsName,
        slug,
      },
    });

    // Create OWNER membership
    await prisma.membership.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    });

    // Initialize onboarding progress
    await prisma.onboardingProgress.create({
      data: {
        workspaceId: workspace.id,
        currentStep: 1,
        completedStepsJson: [1],
      },
    });

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    setSessionCookie(res, sessionToken);

    // Generate email verification token & send email
    const verifyToken = crypto.randomBytes(24).toString('hex');
    verificationTokens.set(verifyToken, { email: user.email, expiresAt: Date.now() + 30 * 60 * 1000 });
    await emailService.sendVerificationEmail(user.email, verifyToken, user.name);

    return res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified },
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug, role: 'OWNER' },
    });
  } catch (err) {
    console.error('[Signup] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create account' } });
  }
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req, res) => {
  const parseResult = LoginInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } });
  }

  const { email, password } = parseResult.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { workspace: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    setSessionCookie(res, sessionToken);

    const primaryMembership = user.memberships[0];

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified },
      activeWorkspace: primaryMembership
        ? {
            id: primaryMembership.workspace.id,
            name: primaryMembership.workspace.name,
            slug: primaryMembership.workspace.slug,
            role: primaryMembership.role,
          }
        : null,
      workspaces: user.memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
      })),
    });
  } catch (err) {
    console.error('[Login] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } });
  }
});

// POST /api/v1/auth/logout
authRouter.post('/logout', async (req, res) => {
  const sessionToken = req.cookies?.zdoda_session || req.headers.authorization?.replace('Bearer ', '');
  if (sessionToken) {
    await prisma.session.deleteMany({ where: { token: sessionToken } }).catch(() => {});
  }
  res.clearCookie('zdoda_session');
  return res.json({ success: true });
});

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        memberships: {
          include: { workspace: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    const requestedWorkspaceId = req.headers['x-workspace-id'] as string;
    const activeMembership =
      user.memberships.find((m) => m.workspaceId === requestedWorkspaceId) || user.memberships[0];

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified },
      activeWorkspace: activeMembership
        ? {
            id: activeMembership.workspace.id,
            name: activeMembership.workspace.name,
            slug: activeMembership.workspace.slug,
            role: activeMembership.role,
          }
        : null,
      workspaces: user.memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
      })),
    });
  } catch (err) {
    console.error('[Me] Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user profile' } });
  }
});

// POST /api/v1/auth/verify-email
authRouter.post('/verify-email', async (req, res) => {
  const parseResult = VerifyEmailInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Token is required' } });
  }

  const { token } = parseResult.data;
  const tokenData = verificationTokens.get(token);

  if (!tokenData || tokenData.expiresAt < Date.now()) {
    verificationTokens.delete(token);
    return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'Verification token is invalid or expired' } });
  }

  await prisma.user.update({
    where: { email: tokenData.email },
    data: { emailVerified: true },
  });

  verificationTokens.delete(token);
  return res.json({ success: true, message: 'Email successfully verified' });
});

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', async (req, res) => {
  const parseResult = ForgotPasswordInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Valid email is required' } });
  }

  const { email } = parseResult.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const resetToken = crypto.randomBytes(24).toString('hex');
    resetTokens.set(resetToken, { email, expiresAt: Date.now() + 30 * 60 * 1000 });
    await emailService.sendPasswordResetEmail(email, resetToken);
  }

  // Always return success to prevent email enumeration
  return res.json({ success: true, message: 'If an account exists, a password reset email has been sent' });
});

// POST /api/v1/auth/reset-password
authRouter.post('/reset-password', async (req, res) => {
  const parseResult = ResetPasswordInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Token and new password (min 8 chars) required' } });
  }

  const { token, newPassword } = parseResult.data;
  const tokenData = resetTokens.get(token);

  if (!tokenData || tokenData.expiresAt < Date.now()) {
    resetTokens.delete(token);
    return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'Reset token is invalid or expired' } });
  }

  const passwordHash = await argon2.hash(newPassword);
  await prisma.user.update({
    where: { email: tokenData.email },
    data: { passwordHash },
  });

  resetTokens.delete(token);
  return res.json({ success: true, message: 'Password updated successfully' });
});
