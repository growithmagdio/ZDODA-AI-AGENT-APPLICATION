import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { AgentInputSchema, DEFAULT_WIDGET_CONFIG, WidgetConfigV1Schema, type WidgetConfigV1, type WorkspaceRole } from '@zdoda/shared';
import { db, paths } from '../firebase.js';
import { config } from '../config.js';
import { slugify } from './util.js';
import type { AuthedUser } from '../middleware/auth.js';

export function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || 'AI';
}

export function defaultWidgetConfig(agentName: string, workspaceName: string, greeting: string): WidgetConfigV1 {
  return WidgetConfigV1Schema.parse({
    ...DEFAULT_WIDGET_CONFIG,
    brand: { ...DEFAULT_WIDGET_CONFIG.brand, botName: agentName, tagline: `Ask ${workspaceName} anything`, avatar: { type: 'initials', initials: initialsOf(agentName) } },
    texts: {
      ...DEFAULT_WIDGET_CONFIG.texts,
      welcomeTitle: workspaceName,
      welcomeMessage: greeting,
      disclaimer: 'AI assistant — answers may be imperfect.',
      quickReplies: ['What do you offer?', 'Pricing', 'Opening hours', 'Talk to a person'],
    },
  });
}

export async function createWorkspace(
  user: AuthedUser,
  input: { name: string; category?: string; websiteUrl?: string },
  opts: { role?: WorkspaceRole; agent?: Partial<ReturnType<typeof AgentInputSchema.parse>> } = {}
) {
  const wsRef = paths.workspace(db().collection('workspaces').doc().id);
  const wsId = wsRef.id;
  const trialEndsAt = Timestamp.fromMillis(Date.now() + config.trialDays * 86400_000);
  const agentRef = paths.agents(wsId).doc();
  const widgetRef = paths.widgets(wsId).doc();
  const agent = AgentInputSchema.parse({
    name: `${input.name.split(' ')[0]} Assistant`.slice(0, 60),
    description: 'Answers customer questions on your website',
    systemPrompt: `You help visitors of ${input.name}${input.category ? ` (${input.category})` : ''}. Answer questions about services, pricing and opening hours, and help people book or get in touch.`,
    greeting: `Hi! 👋 I'm the ${input.name} assistant. How can I help?`,
    ...opts.agent,
  });
  const widgetConfig = defaultWidgetConfig(agent.name, input.name, agent.greeting);
  const batch = db().batch();
  batch.set(wsRef, {
    name: input.name,
    slug: `${slugify(input.name)}-${wsId.slice(0, 5).toLowerCase()}`,
    category: input.category || null,
    websiteUrl: input.websiteUrl || null,
    ownerId: user.uid,
    plan: 'starter',
    billing: { status: 'trialing', provider: null, interval: 'month', trialEndsAt },
    onboarding: { currentStep: 1, completedSteps: [], isComplete: false },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(paths.membership(wsId, user.uid), {
    workspaceId: wsId,
    workspaceName: input.name,
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: opts.role || 'OWNER',
    joinedAt: FieldValue.serverTimestamp(),
  });
  batch.set(agentRef, { ...agent, status: 'draft', publishedAt: null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  batch.set(widgetRef, {
    name: 'Website widget',
    agentId: agentRef.id,
    draftConfig: widgetConfig,
    publishedConfig: null,
    publishedVersion: 0,
    allowedOrigins: input.websiteUrl ? [safeOrigin(input.websiteUrl)].filter(Boolean) : [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(paths.widgetKeys().doc(widgetRef.id), { workspaceId: wsId });
  batch.set(paths.users().doc(user.uid), { defaultWorkspaceId: wsId }, { merge: true });
  await batch.commit();
  return { wsId, agentId: agentRef.id, widgetId: widgetRef.id };
}

export function safeOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

export async function listWorkspacesFor(uid: string) {
  const snap = await paths.memberships().where('uid', '==', uid).get();
  return snap.docs.map((d) => ({ id: d.get('workspaceId') as string, role: d.get('role') as WorkspaceRole, name: d.get('workspaceName') as string }));
}
