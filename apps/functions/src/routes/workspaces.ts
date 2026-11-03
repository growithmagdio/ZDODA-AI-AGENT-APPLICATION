import { Router } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { getPlan } from '@zdoda/shared';
import { paths } from '../firebase.js';
import { h, parse, serialize, AppError } from '../lib/http.js';
import { requirePermission, requireWorkspace } from '../middleware/auth.js';
import { createWorkspace } from '../lib/workspace.js';
import { billingOf, getUsage } from '../lib/usage.js';
import { permissionsFor } from '../lib/can.js';
import { audit } from '../lib/util.js';

export const workspaceRouter = Router();

workspaceRouter.post(
  '/',
  h(async (req, res) => {
    const input = parse(z.object({ name: z.string().min(2).max(80), category: z.string().max(60).optional(), websiteUrl: z.string().url().optional() }), req.body);
    const out = await createWorkspace(req.user!, input);
    res.status(201).json({ id: out.wsId });
  })
);

export async function workspaceSummary(wsId: string, wsData: FirebaseFirestore.DocumentData) {
  const [usage, agents] = await Promise.all([getUsage(wsId), paths.agents(wsId).count().get()]);
  const plan = getPlan(wsData.plan);
  return {
    usage: { period: usage.period, messages: usage.messages, messageLimit: plan.messageLimit, agents: agents.data().count, agentLimit: plan.agentLimit },
    billing: billingOf(wsData),
  };
}

workspaceRouter.get(
  '/current',
  requireWorkspace,
  h(async (req, res) => {
    const { workspaceId, workspace, role } = req.ws!;
    res.json({ workspace: serialize({ id: workspaceId, ...workspace }), role, permissions: permissionsFor(role), ...(await workspaceSummary(workspaceId, workspace)) });
  })
);

workspaceRouter.get('/current/usage', requireWorkspace, h(async (req, res) => res.json((await workspaceSummary(req.ws!.workspaceId, req.ws!.workspace)).usage)));

workspaceRouter.patch(
  '/current',
  requireWorkspace,
  requirePermission('update', 'Settings'),
  h(async (req, res) => {
    const input = parse(
      z.object({
        name: z.string().min(2).max(80).optional(),
        category: z.string().max(60).optional(),
        websiteUrl: z.string().url().optional().or(z.literal('')),
        timezone: z.string().max(60).optional(),
        supportEmail: z.string().email().optional().or(z.literal('')),
      }),
      req.body
    );
    const ws = req.ws!.workspaceId;
    await paths.workspace(ws).update({ ...input, updatedAt: FieldValue.serverTimestamp() });
    if (input.name) {
      const ms = await paths.memberships().where('workspaceId', '==', ws).get();
      await Promise.all(ms.docs.map((d) => d.ref.update({ workspaceName: input.name })));
    }
    await audit(ws, req.user!, 'workspace.updated', input);
    res.json({ ok: true });
  })
);

/** Setup checklist shown on the dashboard. Computed from real data. */
workspaceRouter.get(
  '/current/setup',
  requireWorkspace,
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const [agents, sources, widgets, convs] = await Promise.all([
      paths.agents(ws).where('status', '==', 'published').limit(1).get(),
      paths.sources(ws).where('status', '==', 'ready').limit(1).get(),
      paths.widgets(ws).where('publishedVersion', '>', 0).limit(1).get(),
      paths.conversations(ws).where('channel', '==', 'web').limit(1).get(),
    ]);
    const billing = billingOf(req.ws!.workspace);
    const steps = [
      { key: 'knowledge', title: 'Add knowledge', description: 'Upload a document or add your website', done: !sources.empty, to: '/knowledge' },
      { key: 'agent', title: 'Publish your agent', description: 'Test answers, then publish', done: !agents.empty, to: '/agents' },
      { key: 'widget', title: 'Publish the widget', description: 'Style it in Widget Studio', done: !widgets.empty, to: '/widget-studio' },
      { key: 'install', title: 'Install on your site', description: 'Paste one line of code', done: !convs.empty, to: '/channels' },
      { key: 'plan', title: 'Choose a plan', description: 'Keep your agent live after the trial', done: billing.status === 'active', to: '/billing' },
    ];
    res.json({ steps, completed: steps.filter((s) => s.done).length });
  })
);

// Backwards-compatible onboarding endpoint used by the existing onboarding screens.
workspaceRouter.patch(
  '/:workspaceId/onboarding',
  requireWorkspace,
  h(async (req, res) => {
    if (req.ws!.workspaceId !== req.params.workspaceId) throw new AppError(400, 'BAD_REQUEST', 'Workspace mismatch');
    const input = parse(
      z.object({
        step: z.number().int().min(1).max(8),
        businessName: z.string().min(2).max(80).optional(),
        category: z.string().max(60).optional(),
        websiteUrl: z.string().url().optional().or(z.literal('')),
        agentName: z.string().min(2).max(60).optional(),
        persona: z.string().max(200).optional(),
        language: z.string().max(60).optional(),
        channels: z.record(z.boolean()).optional(),
      }),
      req.body
    );
    const ws = req.ws!.workspaceId;
    const prev = req.ws!.workspace.onboarding || { completedSteps: [] };
    const completed = Array.from(new Set([...(prev.completedSteps || []), ...Array.from({ length: input.step - 1 }, (_, i) => i + 1)]));
    await paths.workspace(ws).update({
      ...(input.businessName ? { name: input.businessName } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.websiteUrl !== undefined ? { websiteUrl: input.websiteUrl || null } : {}),
      onboarding: { currentStep: input.step, completedSteps: completed, isComplete: input.step >= 4, channels: input.channels || prev.channels || null },
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (input.businessName) {
      const ms = await paths.memberships().where('workspaceId', '==', ws).get();
      await Promise.all(ms.docs.map((d) => d.ref.update({ workspaceName: input.businessName })));
    }
    if (input.agentName || input.persona) {
      const first = await paths.agents(ws).orderBy('createdAt').limit(1).get();
      if (!first.empty) {
        await first.docs[0].ref.update({
          ...(input.agentName ? { name: input.agentName } : {}),
          ...(input.persona ? { systemPrompt: `${first.docs[0].get('systemPrompt')}\nTone: ${input.persona}.` } : {}),
          ...(input.language && !/auto/i.test(input.language) ? { language: input.language } : {}),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    res.json({ ok: true });
  })
);

workspaceRouter.get(
  '/current/audit-log',
  requireWorkspace,
  requirePermission('manage_team', 'Team'),
  h(async (req, res) => {
    const snap = await paths.audit(req.ws!.workspaceId).orderBy('createdAt', 'desc').limit(100).get();
    res.json({ items: snap.docs.map((d) => serialize({ id: d.id, ...d.data() })) });
  })
);
