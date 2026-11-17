import { Router } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserProfile, WorkspaceListItem } from '@zdoda/shared';
import { db, paths } from '../firebase.js';
import { h, parse, AppError, serialize } from '../lib/http.js';
import { createWorkspace, listWorkspacesFor } from '../lib/workspace.js';
import type { AuthedUser } from '../middleware/auth.js';

export async function sessionPayload(user: AuthedUser) {
  const userSnap = await paths.users().doc(user.uid).get();
  if (!userSnap.exists || !userSnap.get('createdAt')) throw new AppError(404, 'NEEDS_BOOTSTRAP', 'Account setup not finished');
  const u = userSnap.data()!;
  const memberships = await listWorkspacesFor(user.uid);
  const wsDocs = memberships.length ? await db().getAll(...memberships.map((m) => paths.workspace(m.id))) : [];
  const workspaces: WorkspaceListItem[] = wsDocs
    .filter((d) => d.exists)
    .map((d) => {
      const m = memberships.find((x) => x.id === d.id)!;
      return { id: d.id, name: d.get('name'), slug: d.get('slug'), logoUrl: d.get('logoUrl') || null, role: m.role, isDefault: d.id === u.defaultWorkspaceId };
    });
  const profile: UserProfile = {
    id: user.uid,
    email: user.email,
    name: u.name || user.name,
    avatarUrl: u.avatarUrl || user.picture || null,
    emailVerified: user.emailVerified,
    role: u.globalRole === 'SUPERADMIN' ? 'SUPERADMIN' : 'USER',
    createdAt: serialize(u.createdAt) as unknown as string,
  };
  const activeWorkspace = workspaces.find((w) => w.isDefault) || workspaces[0] || null;
  return { user: profile, workspaces, activeWorkspace };
}

export const authRouter = Router();

authRouter.get('/me', h(async (req, res) => res.json(await sessionPayload(req.user!))));

const BootstrapSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  workspaceName: z.string().min(2).max(80).optional(),
  category: z.string().max(60).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
});

/** Called right after Firebase sign-up / first Google sign-in. Idempotent. */
authRouter.post(
  '/bootstrap',
  h(async (req, res) => {
    const input = parse(BootstrapSchema, req.body || {});
    const user = { ...req.user!, name: input.name || req.user!.name };
    const ref = paths.users().doc(user.uid);
    const existing = await ref.get();
    if (!existing.exists || !existing.get('createdAt')) {
      await ref.set({ email: user.email, name: user.name, avatarUrl: user.picture || null, createdAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    const memberships = await listWorkspacesFor(user.uid);
    // Accept any pending invites addressed to this email first.
    const invites = await paths.invites().where('email', '==', user.email).where('status', '==', 'pending').get();
    for (const inv of invites.docs) {
      if (inv.get('expiresAt')?.toMillis?.() < Date.now()) continue;
      const wsId = inv.get('workspaceId');
      await paths.membership(wsId, user.uid).set({
        workspaceId: wsId,
        workspaceName: inv.get('workspaceName'),
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: inv.get('role'),
        joinedAt: FieldValue.serverTimestamp(),
      });
      await inv.ref.update({ status: 'accepted', acceptedBy: user.uid, acceptedAt: FieldValue.serverTimestamp() });
      memberships.push({ id: wsId, role: inv.get('role'), name: inv.get('workspaceName') });
    }
    if (!memberships.length) {
      await createWorkspace(user, { name: input.workspaceName || `${user.name.split(' ')[0]}'s Workspace`, category: input.category, websiteUrl: input.websiteUrl || undefined });
    }
    res.status(201).json(await sessionPayload(user));
  })
);

authRouter.patch(
  '/profile',
  h(async (req, res) => {
    const { name } = parse(z.object({ name: z.string().min(2).max(80) }), req.body);
    await paths.users().doc(req.user!.uid).set({ name, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const ms = await paths.memberships().where('uid', '==', req.user!.uid).get();
    await Promise.all(ms.docs.map((d) => d.ref.update({ name })));
    res.json(await sessionPayload({ ...req.user!, name }));
  })
);

authRouter.post(
  '/default-workspace',
  h(async (req, res) => {
    const { workspaceId } = parse(z.object({ workspaceId: z.string().min(1) }), req.body);
    const m = await paths.membership(workspaceId, req.user!.uid).get();
    if (!m.exists) throw new AppError(404, 'NOT_FOUND', 'Workspace not found');
    await paths.users().doc(req.user!.uid).set({ defaultWorkspaceId: workspaceId }, { merge: true });
    res.json({ ok: true });
  })
);
