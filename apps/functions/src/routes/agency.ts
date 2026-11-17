import { Router } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { usagePeriod } from '@zdoda/shared';
import { db, paths } from '../firebase.js';
import { h, parse, serialize, AppError, notFound } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { createWorkspace } from '../lib/workspace.js';
import { audit } from '../lib/util.js';

/** Agency mode: an Agency-plan workspace creates and manages client sub-workspaces. */
export const agencyRouter = Router();

const requireAgency = (plan: string) => {
  if (plan !== 'agency') throw new AppError(402, 'PLAN_LIMIT', 'Client sub-accounts are part of the Agency plan.');
};

agencyRouter.get(
  '/',
  requirePermission('read', 'Settings'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const isAgency = req.ws!.workspace.plan === 'agency';
    const clients = isAgency ? await db().collection('workspaces').where('parentWorkspaceId', '==', ws).get() : null;
    const period = usagePeriod();
    const items = await Promise.all(
      (clients?.docs || []).map(async (d) => {
        const u = await paths.usage(d.id).doc(period).get();
        return serialize({ id: d.id, name: d.get('name'), createdAt: d.get('createdAt'), messages: u.get('messages') || 0, voiceSeconds: u.get('voiceSeconds') || 0 });
      })
    );
    res.json({ isAgency, branding: req.ws!.workspace.branding || null, clients: items });
  })
);

agencyRouter.post(
  '/clients',
  requirePermission('manage_billing', 'Billing'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    requireAgency(req.ws!.workspace.plan);
    const input = parse(z.object({ name: z.string().min(2).max(80), category: z.string().max(60).optional(), websiteUrl: z.string().url().optional() }), req.body);
    const out = await createWorkspace(req.user!, input);
    await paths.workspace(out.wsId).update({
      parentWorkspaceId: ws,
      plan: 'business',
      billing: { status: 'active', provider: 'agency', interval: 'month', agencyWorkspaceId: ws },
      branding: req.ws!.workspace.branding || null,
    });
    // createWorkspace made it the user's default; keep the agency as default.
    await paths.users().doc(req.user!.uid).set({ defaultWorkspaceId: ws }, { merge: true });
    await audit(ws, req.user!, 'agency.client_created', { clientWorkspaceId: out.wsId, name: input.name });
    res.status(201).json({ id: out.wsId });
  })
);

agencyRouter.patch(
  '/branding',
  requirePermission('update', 'Settings'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    requireAgency(req.ws!.workspace.plan);
    const branding = parse(
      z.object({
        appName: z.string().min(2).max(40),
        logoUrl: z.string().url().optional().or(z.literal('')),
        primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6538F5'),
        widgetFooter: z.string().max(60).default(''),
        customDomain: z.string().max(120).optional().or(z.literal('')),
      }),
      req.body
    );
    await paths.workspace(ws).update({ branding, updatedAt: FieldValue.serverTimestamp() });
    const clients = await db().collection('workspaces').where('parentWorkspaceId', '==', ws).get();
    await Promise.all(clients.docs.map((d) => d.ref.update({ branding })));
    res.json({ ok: true });
  })
);

agencyRouter.delete(
  '/clients/:id',
  requirePermission('manage_billing', 'Billing'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const ref = paths.workspace(req.params.id);
    const snap = await ref.get();
    if (!snap.exists || snap.get('parentWorkspaceId') !== ws) throw notFound('Client workspace');
    // Detach rather than delete data: the client keeps their workspace on a lapsed plan.
    await ref.update({ parentWorkspaceId: null, 'billing.status': 'canceled', 'billing.provider': null });
    res.json({ ok: true });
  })
);
