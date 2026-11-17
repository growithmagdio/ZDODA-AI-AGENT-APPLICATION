import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { DEMO_PLANS, getPlan, usagePeriod } from '@zdoda/shared';
import { db, paths } from '../firebase.js';
import { config } from '../config.js';
import { h, parse, serialize, forbidden, notFound } from '../lib/http.js';
import { billingOf } from '../lib/usage.js';
import { setupTelephony, voiceStatus } from './voice.js';

export async function isSuperadmin(uid: string, email: string) {
  if (config.superadminEmails.includes(email.toLowerCase())) return true;
  const u = await paths.users().doc(uid).get();
  return u.get('globalRole') === 'SUPERADMIN';
}

export async function requireSuperadmin(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!(await isSuperadmin(req.user!.uid, req.user!.email))) return next(forbidden('Platform admins only'));
    next();
  } catch (e) {
    next(e);
  }
}

export const adminRouter = Router();
adminRouter.use(requireSuperadmin);

adminRouter.get(
  '/overview',
  h(async (_req, res) => {
    const period = usagePeriod();
    const [wsSnap, users, usage] = await Promise.all([
      db().collection('workspaces').get(),
      paths.users().count().get(),
      db().collectionGroup('usage').where('period', '==', period).get().catch(() => null),
    ]);
    const plans: Record<string, number> = {};
    const statuses: Record<string, number> = {};
    let mrrCents = 0;
    for (const w of wsSnap.docs) {
      const b = billingOf(w.data());
      plans[b.plan] = (plans[b.plan] || 0) + 1;
      statuses[b.status] = (statuses[b.status] || 0) + 1;
      if (b.status === 'active' && w.get('billing')?.provider !== 'mock' && w.get('billing')?.provider !== 'agency') mrrCents += getPlan(b.plan).priceMonthlyCents;
    }
    const totals = (usage?.docs || []).reduce((t, d) => ({ messages: t.messages + (d.get('messages') || 0), voiceSeconds: t.voiceSeconds + (d.get('voiceSeconds') || 0), tokensIn: t.tokensIn + (d.get('tokensIn') || 0), tokensOut: t.tokensOut + (d.get('tokensOut') || 0) }), { messages: 0, voiceSeconds: 0, tokensIn: 0, tokensOut: 0 });
    res.json({ workspaces: wsSnap.size, users: users.data().count, plans, statuses, mrr: mrrCents / 100, period, usage: totals, voice: await voiceStatus() });
  })
);

adminRouter.get(
  '/workspaces',
  h(async (req, res) => {
    const q = String(req.query.q || '').toLowerCase();
    const period = usagePeriod();
    const snap = await db().collection('workspaces').orderBy('createdAt', 'desc').limit(300).get();
    const rows = await Promise.all(
      snap.docs
        .filter((d) => !q || String(d.get('name')).toLowerCase().includes(q))
        .slice(0, 100)
        .map(async (d) => {
          const u = await paths.usage(d.id).doc(period).get();
          const owner = await paths.membership(d.id, d.get('ownerId')).get();
          return serialize({ id: d.id, name: d.get('name'), ownerEmail: owner.get('email') || null, createdAt: d.get('createdAt'), billing: billingOf(d.data()), parentWorkspaceId: d.get('parentWorkspaceId') || null, messages: u.get('messages') || 0, voiceSeconds: u.get('voiceSeconds') || 0 });
        })
    );
    res.json({ items: rows });
  })
);

adminRouter.post(
  '/workspaces/:id/plan',
  h(async (req, res) => {
    const input = parse(z.object({ plan: z.enum(DEMO_PLANS.map((p) => p.slug) as [string, ...string[]]), status: z.enum(['trialing', 'active', 'canceled', 'expired']), extendTrialDays: z.number().int().min(0).max(90).optional() }), req.body);
    const ref = paths.workspace(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Workspace');
    await ref.update({
      plan: input.plan,
      'billing.status': input.status,
      'billing.provider': 'manual',
      ...(input.extendTrialDays ? { 'billing.trialEndsAt': Timestamp.fromMillis(Date.now() + input.extendTrialDays * 86400_000) } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({ ok: true });
  })
);

adminRouter.post('/telephony/setup', h(async (_req, res) => res.json(serialize(await setupTelephony()))));
