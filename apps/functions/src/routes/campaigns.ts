import { Router } from 'express';
import { z } from 'zod';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db, paths } from '../firebase.js';
import { h, parse, serialize, notFound, AppError } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { canServeVoice } from '../lib/usage.js';
import { placeOutboundCall } from './voice.js';
import { audit } from '../lib/util.js';

export const campaignsRouter = Router();
const OUTBOUND_PLANS = ['business', 'agency'];
const E164 = /^\+[1-9]\d{6,14}$/;

const CampaignSchema = z.object({
  name: z.string().min(2).max(80),
  agentId: z.string().min(1),
  fromNumber: z.string().regex(E164),
  timezone: z.string().max(60).default('UTC'),
  windowStart: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
  windowEnd: z.string().regex(/^\d{2}:\d{2}$/).default('18:00'),
  maxConcurrent: z.number().int().min(1).max(10).default(2),
  maxAttempts: z.number().int().min(1).max(3).default(1),
  consentConfirmed: z.literal(true, { errorMap: () => ({ message: 'Confirm you have consent to call these contacts' }) }),
});

async function stats(ws: string, id: string) {
  const snap = await paths.campaignContacts(ws, id).get();
  const s = { total: snap.size, pending: 0, calling: 0, completed: 0, failed: 0, noAnswer: 0 };
  snap.docs.forEach((d) => {
    const st = d.get('status');
    if (st === 'pending') s.pending++;
    else if (st === 'calling') s.calling++;
    else if (st === 'completed') s.completed++;
    else if (st === 'no_answer') s.noAnswer++;
    else s.failed++;
  });
  return s;
}

campaignsRouter.get(
  '/',
  requirePermission('read', 'Inbox'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const snap = await paths.campaigns(ws).orderBy('createdAt', 'desc').get();
    res.json({ items: await Promise.all(snap.docs.map(async (d) => serialize({ id: d.id, ...d.data(), stats: await stats(ws, d.id) }))), allowed: OUTBOUND_PLANS.includes(req.ws!.workspace.plan) });
  })
);

campaignsRouter.post(
  '/',
  requirePermission('create', 'Inbox'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    if (!OUTBOUND_PLANS.includes(req.ws!.workspace.plan)) throw new AppError(402, 'PLAN_LIMIT', 'Outbound call campaigns are available on the Business plan.');
    const input = parse(CampaignSchema, req.body);
    if (!(await paths.phoneNumbers(ws).doc(input.fromNumber).get()).exists) throw notFound('Phone number');
    const ref = await paths.campaigns(ws).add({ ...input, status: 'draft', createdBy: req.user!.uid, createdAt: FieldValue.serverTimestamp() });
    res.status(201).json({ id: ref.id });
  })
);

campaignsRouter.get(
  '/:id',
  requirePermission('read', 'Inbox'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const snap = await paths.campaigns(ws).doc(req.params.id).get();
    if (!snap.exists) throw notFound('Campaign');
    const contacts = await paths.campaignContacts(ws, snap.id).orderBy('createdAt', 'asc').limit(500).get();
    res.json({ campaign: serialize({ id: snap.id, ...snap.data(), stats: await stats(ws, snap.id) }), contacts: contacts.docs.map((d) => serialize({ id: d.id, ...d.data() })) });
  })
);

/** Adds contacts from CSV text: phone,name,anything-else (header row optional). Extra columns become {{variables}}. */
campaignsRouter.post(
  '/:id/contacts',
  requirePermission('update', 'Inbox'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const camp = await paths.campaigns(ws).doc(req.params.id).get();
    if (!camp.exists) throw notFound('Campaign');
    const { csv } = parse(z.object({ csv: z.string().min(5).max(500_000) }), req.body);
    const rows = csv.split(/\r?\n/).map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))).filter((r) => r.some(Boolean));
    let header = ['phone', 'name'];
    if (rows[0] && !E164.test(rows[0][0].replace(/[\s()-]/g, ''))) header = rows.shift()!.map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    const phoneCol = Math.max(0, header.findIndex((h) => /phone|number|mobile/.test(h)));
    let added = 0;
    let skipped = 0;
    for (let i = 0; i < rows.length; i += 400) {
      const batch = db().batch();
      for (const r of rows.slice(i, i + 400)) {
        const phone = (r[phoneCol] || '').replace(/[\s()-]/g, '');
        if (!E164.test(phone)) {
          skipped++;
          continue;
        }
        const vars = Object.fromEntries(header.map((h, j) => [h, r[j] || '']).filter(([h]) => h && h !== header[phoneCol]));
        batch.set(paths.campaignContacts(ws, camp.id).doc(phone), { phone, name: vars.name || null, vars, status: 'pending', attempts: 0, createdAt: FieldValue.serverTimestamp() });
        added++;
      }
      await batch.commit();
    }
    res.json({ added, skipped });
  })
);

campaignsRouter.post(
  '/:id/:action(start|pause)',
  requirePermission('update', 'Inbox'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const ref = paths.campaigns(ws).doc(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Campaign');
    await ref.update({ status: req.params.action === 'start' ? 'running' : 'paused' });
    await audit(ws, req.user!, `campaign.${req.params.action}`, { campaignId: ref.id });
    res.json({ ok: true });
  })
);

campaignsRouter.delete(
  '/:id',
  requirePermission('delete', 'Inbox'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const contacts = await paths.campaignContacts(ws, req.params.id).get();
    for (let i = 0; i < contacts.docs.length; i += 400) {
      const b = db().batch();
      contacts.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
      await b.commit();
    }
    await paths.campaigns(ws).doc(req.params.id).delete();
    res.json({ ok: true });
  })
);

function inWindow(tz: string, start: string, end: string, now = new Date()) {
  const hm = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  return hm >= start && hm < end;
}

/** Called every minute by the scheduler: dials pending contacts within each running campaign's window. */
export async function runCampaignTick() {
  const running = await db().collectionGroup('campaigns').where('status', '==', 'running').get().catch(() => null);
  if (!running) return { dialed: 0 };
  let dialed = 0;
  for (const camp of running.docs) {
    const ws = camp.ref.parent.parent!.id;
    const c = camp.data();
    if (!inWindow(c.timezone || 'UTC', c.windowStart, c.windowEnd)) continue;
    const contacts = paths.campaignContacts(ws, camp.id);
    // Calls stuck in "calling" for 30+ minutes are marked failed.
    const stuck = await contacts.where('status', '==', 'calling').get();
    let calling = 0;
    for (const d of stuck.docs) {
      if (((d.get('dialedAt') as Timestamp | undefined)?.toMillis?.() ?? 0) < Date.now() - 30 * 60_000) await d.ref.update({ status: 'failed', error: 'timeout' });
      else calling++;
    }
    const wsSnap = await paths.workspace(ws).get();
    const gate = await canServeVoice(ws, wsSnap.data() || {});
    if (!gate.ok) {
      await camp.ref.update({ status: 'paused', pausedReason: 'Voice minutes used up' });
      continue;
    }
    const free = Math.max(0, (c.maxConcurrent || 1) - calling);
    if (!free) continue;
    const pending = await contacts.where('status', '==', 'pending').limit(free).get();
    // Retry no-answers when attempts remain.
    if (pending.empty) {
      const retry = await contacts.where('status', '==', 'no_answer').get();
      const again = retry.docs.filter((d) => (d.get('attempts') || 0) < (c.maxAttempts || 1));
      if (!again.length && !calling) await camp.ref.update({ status: 'completed', completedAt: FieldValue.serverTimestamp() });
      for (const d of again.slice(0, free)) await d.ref.update({ status: 'pending' });
      continue;
    }
    for (const d of pending.docs) {
      try {
        await d.ref.update({ status: 'calling', attempts: FieldValue.increment(1), dialedAt: FieldValue.serverTimestamp() });
        await placeOutboundCall(ws, c.agentId, d.get('phone'), c.fromNumber, { campaignId: camp.id, contactId: d.id, vars: d.get('vars') || {} });
        dialed++;
      } catch (e: any) {
        await d.ref.update({ status: 'failed', error: String(e.message).slice(0, 200) });
      }
    }
  }
  return { dialed };
}
