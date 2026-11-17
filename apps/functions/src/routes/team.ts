import { Router } from 'express';
import { z } from 'zod';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { WorkspaceRoleEnum } from '@zdoda/shared';
import { paths } from '../firebase.js';
import { config } from '../config.js';
import { h, parse, serialize, notFound, AppError, forbidden } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { sendEmail, emailLive } from '../providers/email.js';
import { audit, newId } from '../lib/util.js';

export const teamRouter = Router();

teamRouter.get(
  '/members',
  requirePermission('read', 'Team'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const [members, invites] = await Promise.all([
      paths.memberships().where('workspaceId', '==', ws).get(),
      paths.invites().where('workspaceId', '==', ws).where('status', '==', 'pending').get(),
    ]);
    res.json({
      members: members.docs.map((d) => serialize({ uid: d.get('uid'), email: d.get('email'), name: d.get('name'), role: d.get('role'), joinedAt: d.get('joinedAt') })),
      invites: invites.docs.map((d) => serialize({ token: d.id, email: d.get('email'), role: d.get('role'), createdAt: d.get('createdAt'), expiresAt: d.get('expiresAt'), link: `${config.webAppUrl}/invite/${d.id}` })),
      emailLive: emailLive(),
    });
  })
);

teamRouter.post(
  '/invites',
  requirePermission('manage_team', 'Team'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const input = parse(z.object({ email: z.string().email(), role: WorkspaceRoleEnum.exclude(['OWNER']) }), req.body);
    const email = input.email.toLowerCase();
    if (input.role === 'ADMIN' && req.ws!.role !== 'OWNER') throw forbidden('Only owners can invite admins');
    const existing = await paths.memberships().where('workspaceId', '==', ws).where('email', '==', email).limit(1).get();
    if (!existing.empty) throw new AppError(409, 'ALREADY_MEMBER', 'That person is already in this workspace');
    const token = newId('inv_', 18);
    await paths.invites().doc(token).set({
      workspaceId: ws,
      workspaceName: req.ws!.workspace.name,
      email,
      role: input.role,
      invitedBy: req.user!.uid,
      invitedByName: req.user!.name,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 86400_000),
    });
    const link = `${config.webAppUrl}/invite/${token}`;
    const sent = await sendEmail(
      email,
      `${req.user!.name} invited you to ${req.ws!.workspace.name} on Zdoda`,
      `<p>${req.user!.name} invited you to join <b>${req.ws!.workspace.name}</b> on Zdoda as ${input.role.toLowerCase()}.</p><p><a href="${link}">Accept the invite</a> (expires in 7 days)</p>`
    );
    await audit(ws, req.user!, 'team.invited', { email, role: input.role });
    res.status(201).json({ token, link, emailSent: sent });
  })
);

teamRouter.delete(
  '/invites/:token',
  requirePermission('manage_team', 'Team'),
  h(async (req, res) => {
    const ref = paths.invites().doc(req.params.token);
    const snap = await ref.get();
    if (!snap.exists || snap.get('workspaceId') !== req.ws!.workspaceId) throw notFound('Invite');
    await ref.update({ status: 'revoked' });
    res.json({ ok: true });
  })
);

teamRouter.patch(
  '/members/:uid',
  requirePermission('manage_team', 'Team'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const { role } = parse(z.object({ role: WorkspaceRoleEnum }), req.body);
    const ref = paths.membership(ws, req.params.uid);
    const snap = await ref.get();
    if (!snap.exists) throw notFound('Member');
    if (req.ws!.role !== 'OWNER' && (snap.get('role') === 'OWNER' || role === 'OWNER' || role === 'ADMIN')) throw forbidden('Only owners can change admin or owner roles');
    if (snap.get('role') === 'OWNER' && role !== 'OWNER') {
      const owners = await paths.memberships().where('workspaceId', '==', ws).where('role', '==', 'OWNER').get();
      if (owners.size <= 1) throw new AppError(409, 'LAST_OWNER', 'A workspace needs at least one owner');
    }
    await ref.update({ role });
    await audit(ws, req.user!, 'team.role_changed', { uid: req.params.uid, role });
    res.json({ ok: true });
  })
);

teamRouter.delete(
  '/members/:uid',
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const self = req.params.uid === req.user!.uid;
    if (!self && !['OWNER', 'ADMIN'].includes(req.ws!.role)) throw forbidden();
    const ref = paths.membership(ws, req.params.uid);
    const snap = await ref.get();
    if (!snap.exists) throw notFound('Member');
    if (snap.get('role') === 'OWNER') {
      if (req.ws!.role !== 'OWNER') throw forbidden('Only owners can remove an owner');
      const owners = await paths.memberships().where('workspaceId', '==', ws).where('role', '==', 'OWNER').get();
      if (owners.size <= 1) throw new AppError(409, 'LAST_OWNER', 'A workspace needs at least one owner');
    }
    await ref.delete();
    await audit(ws, req.user!, 'team.removed', { uid: req.params.uid });
    res.json({ ok: true });
  })
);

/** Invite lookup + accept. Mounted without the workspace middleware (the user is not a member yet). */
export const invitesRouter = Router();

invitesRouter.get(
  '/:token',
  h(async (req, res) => {
    const snap = await paths.invites().doc(req.params.token).get();
    if (!snap.exists) throw notFound('Invite');
    const expired = snap.get('expiresAt')?.toMillis() < Date.now();
    res.json({
      workspaceName: snap.get('workspaceName'),
      role: snap.get('role'),
      email: snap.get('email'),
      invitedByName: snap.get('invitedByName'),
      status: expired && snap.get('status') === 'pending' ? 'expired' : snap.get('status'),
    });
  })
);

invitesRouter.post(
  '/:token/accept',
  h(async (req, res) => {
    const ref = paths.invites().doc(req.params.token);
    const snap = await ref.get();
    if (snap.exists && snap.get('status') === 'accepted' && snap.get('acceptedBy') === req.user!.uid) return res.json({ workspaceId: snap.get('workspaceId') });
    if (!snap.exists || snap.get('status') !== 'pending') throw new AppError(410, 'INVITE_INVALID', 'This invite is no longer valid');
    if (snap.get('expiresAt')?.toMillis() < Date.now()) throw new AppError(410, 'INVITE_EXPIRED', 'This invite has expired. Ask for a new one.');
    if (snap.get('email') !== req.user!.email) throw forbidden(`This invite was sent to ${snap.get('email')}. Sign in with that email to accept it.`);
    const wsId = snap.get('workspaceId');
    await paths.membership(wsId, req.user!.uid).set({
      workspaceId: wsId,
      workspaceName: snap.get('workspaceName'),
      uid: req.user!.uid,
      email: req.user!.email,
      name: req.user!.name,
      role: snap.get('role'),
      joinedAt: FieldValue.serverTimestamp(),
    });
    await paths.users().doc(req.user!.uid).set({ defaultWorkspaceId: wsId }, { merge: true });
    await ref.update({ status: 'accepted', acceptedBy: req.user!.uid, acceptedAt: FieldValue.serverTimestamp() });
    await audit(wsId, req.user!, 'team.joined', { role: snap.get('role') });
    res.json({ workspaceId: wsId });
  })
);
