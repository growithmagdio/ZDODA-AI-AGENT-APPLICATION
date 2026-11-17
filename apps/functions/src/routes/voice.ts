import { Router, type NextFunction, type Request, type Response } from 'express';
import { timingSafeEqual, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { AgentInputSchema, getPlan } from '@zdoda/shared';
import { paths, db } from '../firebase.js';
import { config } from '../config.js';
import { h, parse, serialize, notFound, AppError, forbidden } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { canServeVoice, recordUsage } from '../lib/usage.js';
import { dispatchEvent } from '../lib/integrations.js';
import { buildSystemPrompt } from '../chat/engine.js';
import { retrieve, toCitations } from '../rag/retrieve.js';
import { generate } from '../providers/llm.js';
import { createWebCallToken, livekitConfigured, sipClient, startRecording, webhookReceiver, type CallMetadata } from '../providers/livekit.js';
import { buyNumber, createSipTrunk, releaseNumber, searchNumbers, twilioConfigured } from '../providers/twilio.js';
import { AgentDispatchClient, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';
import { toolDefinitionsFor, runTool } from '../tools/runner.js';
import { audit, clip } from '../lib/util.js';

const E164 = /^\+[1-9]\d{6,14}$/;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
async function telephonyState() {
  const snap = await paths.platform().doc('telephony').get();
  return snap.exists ? (snap.data() as { twilioTrunkSid: string; outboundTrunkId: string; dispatchRuleId: string }) : null;
}

export async function voiceStatus() {
  const tel = await telephonyState();
  return {
    livekit: livekitConfigured(),
    telephony: twilioConfigured(),
    phoneReady: Boolean(livekitConfigured() && twilioConfigured() && tel),
    recording: Boolean(config.recordingBucket && config.recordingGcpCredentials),
    workerSecret: Boolean(config.voiceWorkerSecret),
  };
}

async function createCallConversation(ws: string, agent: FirebaseFirestore.DocumentSnapshot, meta: Omit<Partial<CallMetadata>, 'channel'> & { channel: 'voice' | 'test' }) {
  const ref = paths.conversations(ws).doc();
  await ref.set({
    channel: meta.channel,
    direction: meta.direction || 'web',
    agentId: agent.id,
    agentName: agent.get('name'),
    status: 'open',
    takeover: false,
    contact: { name: null, email: null, phone: meta.direction === 'inbound' ? meta.from || null : meta.direction === 'outbound' ? meta.to || null : null },
    from: meta.from || null,
    to: meta.to || null,
    campaignId: meta.campaignId || null,
    contactId: meta.contactId || null,
    lastMessage: meta.direction === 'web' ? 'Web voice call' : `${meta.direction === 'outbound' ? 'Outbound' : 'Inbound'} call`,
    messageCount: 0,
    durationSec: 0,
    createdAt: FieldValue.serverTimestamp(),
    lastMessageAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// ---------------------------------------------------------------------------
// Dashboard routes (signed-in, workspace scoped)
// ---------------------------------------------------------------------------
export const voiceRouter = Router();

voiceRouter.get('/status', h(async (_req, res) => res.json(await voiceStatus())));

/** Browser test call from the agent builder (does not use plan minutes). */
voiceRouter.post(
  '/test-call',
  requirePermission('read', 'Agent'),
  h(async (req, res) => {
    if (!livekitConfigured()) throw new AppError(400, 'VOICE_NOT_CONFIGURED', 'Voice is not set up yet — add the LiveKit keys on the server.');
    const { agentId } = parse(z.object({ agentId: z.string().min(1) }), req.body);
    const ws = req.ws!.workspaceId;
    const agent = await paths.agents(ws).doc(agentId).get();
    if (!agent.exists) throw notFound('Agent');
    const callId = await createCallConversation(ws, agent, { channel: 'test', direction: 'web' });
    const token = await createWebCallToken({ workspaceId: ws, agentId, callId, channel: 'test', direction: 'web' }, `tester-${req.user!.uid}`);
    res.json({ ...token, callId });
  })
);

export const phoneNumbersRouter = Router();

phoneNumbersRouter.get(
  '/',
  requirePermission('read', 'Channel'),
  h(async (req, res) => {
    const snap = await paths.phoneNumbers(req.ws!.workspaceId).orderBy('createdAt', 'asc').get();
    res.json({ items: snap.docs.map((d) => serialize({ id: d.id, ...d.data() })), status: await voiceStatus() });
  })
);

phoneNumbersRouter.get(
  '/search',
  requirePermission('create', 'Channel'),
  h(async (req, res) => {
    if (!twilioConfigured()) throw new AppError(400, 'TELEPHONY_NOT_CONFIGURED', 'Phone numbers are not set up yet — add the Twilio keys on the server.');
    const q = parse(z.object({ country: z.string().length(2).default('US'), areaCode: z.string().max(6).optional(), contains: z.string().max(10).optional() }), req.query);
    res.json({ items: await searchNumbers(q.country.toUpperCase(), { areaCode: q.areaCode, contains: q.contains }) });
  })
);

phoneNumbersRouter.post(
  '/',
  requirePermission('create', 'Channel'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const input = parse(z.object({ number: z.string().regex(E164, 'Use the +countrycode format'), agentId: z.string().min(1), country: z.string().length(2).default('US') }), req.body);
    const tel = await telephonyState();
    if (!tel || !livekitConfigured() || !twilioConfigured()) throw new AppError(400, 'TELEPHONY_NOT_READY', 'Phone calling is not set up yet. An admin needs to finish the telephony setup.');
    const plan = getPlan(req.ws!.workspace.plan);
    const count = (await paths.phoneNumbers(ws).count().get()).data().count;
    if (count >= plan.numberLimit) throw new AppError(402, 'PLAN_LIMIT', plan.numberLimit ? `Your ${plan.name} plan includes ${plan.numberLimit} phone number${plan.numberLimit > 1 ? 's' : ''}.` : `Phone numbers are not included in the ${plan.name} plan. Upgrade to add one.`);
    if (!(await paths.agents(ws).doc(input.agentId).get()).exists) throw notFound('Agent');
    const bought = await buyNumber(input.number, tel.twilioTrunkSid);
    const lkTrunk = await sipClient().createSipInboundTrunk(`ws-${ws}-${bought.number}`, [bought.number], { metadata: JSON.stringify({ workspaceId: ws }) });
    const batch = db().batch();
    batch.set(paths.phoneNumbers(ws).doc(bought.number), {
      number: bought.number,
      friendlyName: bought.friendlyName,
      country: input.country.toUpperCase(),
      agentId: input.agentId,
      provider: 'twilio',
      twilioSid: bought.sid,
      livekitTrunkId: lkTrunk.sipTrunkId,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    });
    batch.set(paths.numberIndex().doc(bought.number), { workspaceId: ws });
    await batch.commit();
    await audit(ws, req.user!, 'phone.bought', { number: bought.number });
    res.status(201).json(serialize({ id: bought.number, number: bought.number, agentId: input.agentId }));
  })
);

phoneNumbersRouter.patch(
  '/:id',
  requirePermission('update', 'Channel'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const { agentId } = parse(z.object({ agentId: z.string().min(1) }), req.body);
    const ref = paths.phoneNumbers(ws).doc(req.params.id);
    if (!(await ref.get()).exists) throw notFound('Number');
    if (!(await paths.agents(ws).doc(agentId).get()).exists) throw notFound('Agent');
    await ref.update({ agentId });
    res.json({ ok: true });
  })
);

phoneNumbersRouter.delete(
  '/:id',
  requirePermission('delete', 'Channel'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const ref = paths.phoneNumbers(ws).doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw notFound('Number');
    if (snap.get('twilioSid')) await releaseNumber(snap.get('twilioSid')).catch((e) => console.warn('[phone] release failed', e.message));
    if (snap.get('livekitTrunkId')) await sipClient().deleteSipTrunk(snap.get('livekitTrunkId')).catch(() => {});
    await ref.delete();
    await paths.numberIndex().doc(req.params.id).delete();
    await audit(ws, req.user!, 'phone.released', { number: req.params.id });
    res.json({ ok: true });
  })
);

/** Starts one outbound call (also used by campaigns). Returns the call (conversation) id. */
export async function placeOutboundCall(ws: string, agentId: string, to: string, fromNumber: string, extra: { campaignId?: string; contactId?: string; vars?: Record<string, string> } = {}) {
  const tel = await telephonyState();
  if (!tel || !livekitConfigured()) throw new AppError(400, 'TELEPHONY_NOT_READY', 'Phone calling is not set up yet.');
  const agent = await paths.agents(ws).doc(agentId).get();
  if (!agent.exists) throw notFound('Agent');
  const callId = await createCallConversation(ws, agent, { channel: 'voice', direction: 'outbound', to, from: fromNumber, campaignId: extra.campaignId, contactId: extra.contactId });
  const room = `call-out-${callId}`;
  const meta: CallMetadata = { workspaceId: ws, agentId, callId, channel: 'phone', direction: 'outbound', to, from: fromNumber, campaignId: extra.campaignId, contactId: extra.contactId };
  const httpUrl = config.livekitUrl.replace(/^wss:/, 'https:');
  await new AgentDispatchClient(httpUrl, config.livekitApiKey, config.livekitApiSecret).createDispatch(room, config.voiceAgentName, { metadata: JSON.stringify({ ...meta, vars: extra.vars || {} }) });
  await sipClient().createSipParticipant(tel.outboundTrunkId, to, room, { fromNumber, participantIdentity: `callee-${callId}`, participantName: to, playDialtone: false, ringingTimeout: 30 });
  return callId;
}

export const callsRouter = Router();

callsRouter.post(
  '/outbound',
  requirePermission('create', 'Inbox'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const input = parse(z.object({ agentId: z.string().min(1), to: z.string().regex(E164, 'Use the +countrycode format'), fromNumber: z.string().regex(E164) }), req.body);
    if (!(await paths.phoneNumbers(ws).doc(input.fromNumber).get()).exists) throw notFound('Phone number');
    const gate = await canServeVoice(ws, req.ws!.workspace);
    if (!gate.ok) throw new AppError(402, 'VOICE_LIMIT', gate.reason === 'quota' ? 'You have used all voice minutes on your plan this month.' : 'Voice calls are not included in your current plan.');
    const callId = await placeOutboundCall(ws, input.agentId, input.to, input.fromNumber);
    await audit(ws, req.user!, 'call.outbound', { to: input.to });
    res.status(201).json({ callId });
  })
);

callsRouter.get(
  '/:id/recording',
  requirePermission('read', 'Inbox'),
  h(async (req, res) => {
    const conv = await paths.conversations(req.ws!.workspaceId).doc(req.params.id).get();
    const path = conv.get('recordingPath');
    if (!conv.exists || !path || !config.recordingBucket) throw notFound('Recording');
    const [url] = await getStorage().bucket(config.recordingBucket).file(path).getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60_000 });
    res.json({ url });
  })
);

// ---------------------------------------------------------------------------
// Platform admin: one-time telephony setup (Twilio trunk ↔ LiveKit SIP)
// ---------------------------------------------------------------------------
export async function setupTelephony() {
  if (!livekitConfigured() || !twilioConfigured() || !config.livekitSipUri) throw new AppError(400, 'MISSING_CONFIG', 'Set LIVEKIT_URL/API_KEY/API_SECRET, LIVEKIT_SIP_URI and TWILIO_ACCOUNT_SID/AUTH_TOKEN first.');
  const existing = await telephonyState();
  if (existing) return existing;
  const username = `zdoda${randomBytes(4).toString('hex')}`;
  const password = randomBytes(18).toString('base64url');
  const sipUri = config.livekitSipUri.startsWith('sip:') ? config.livekitSipUri : `sip:${config.livekitSipUri}`;
  const tw = await createSipTrunk(sipUri, username, password);
  const sip = sipClient();
  const outbound = await sip.createSipOutboundTrunk('Zdoda Twilio outbound', tw.terminationHost, [], { authUsername: username, authPassword: password, transport: 0 as any /* SIP_TRANSPORT_AUTO */ });
  const rule = await sip.createSipDispatchRule(
    { type: 'individual', roomPrefix: 'call-' },
    { name: 'Zdoda inbound', roomConfig: new RoomConfiguration({ agents: [new RoomAgentDispatch({ agentName: config.voiceAgentName })] }) }
  );
  const state = { twilioTrunkSid: tw.trunkSid, outboundTrunkId: outbound.sipTrunkId, dispatchRuleId: rule.sipDispatchRuleId, createdAt: Timestamp.now() };
  await paths.platform().doc('telephony').set(state);
  return state;
}

// ---------------------------------------------------------------------------
// Public: web voice call from the embedded widget
// ---------------------------------------------------------------------------
export async function publicVoiceToken(ws: string, widget: FirebaseFirestore.DocumentSnapshot, visitorId: string) {
  if (!livekitConfigured()) throw new AppError(400, 'VOICE_NOT_CONFIGURED', 'Voice is not available right now.');
  const agent = await paths.agents(ws).doc(widget.get('agentId')).get();
  if (agent.get('status') !== 'published' || !agent.get('voice')?.enabled) throw new AppError(409, 'VOICE_DISABLED', 'Voice is not enabled for this assistant.');
  const wsSnap = await paths.workspace(ws).get();
  const gate = await canServeVoice(ws, wsSnap.data()!);
  if (!gate.ok) throw new AppError(402, 'VOICE_LIMIT', 'Voice calls are unavailable right now. Please use chat instead.');
  const callId = await createCallConversation(ws, agent, { channel: 'voice', direction: 'web' });
  await paths.conversations(ws).doc(callId).update({ widgetId: widget.id, visitorId });
  return { ...(await createWebCallToken({ workspaceId: ws, agentId: agent.id, callId, channel: 'web', direction: 'web' }, `visitor-${visitorId}`)), callId };
}

// ---------------------------------------------------------------------------
// Voice worker API (called by apps/voice with x-voice-secret)
// ---------------------------------------------------------------------------
export function requireVoiceWorker(req: Request, _res: Response, next: NextFunction) {
  const given = Buffer.from(String(req.headers['x-voice-secret'] || ''));
  const expected = Buffer.from(config.voiceWorkerSecret || '');
  if (!expected.length || given.length !== expected.length || !timingSafeEqual(given, expected)) return next(forbidden('Invalid voice worker secret'));
  next();
}

async function loadCall(callId: string, ws?: string) {
  if (!ws) throw new AppError(400, 'BAD_REQUEST', 'workspaceId required');
  const conv = await paths.conversations(ws).doc(callId).get();
  if (!conv.exists) throw notFound('Call');
  return conv;
}

export const voiceWorkerRouter = Router();

const SessionSchema = z.object({
  room: z.string().min(1),
  metadata: z.string().optional().default(''),
  calledNumber: z.string().optional().nullable(),
  callerNumber: z.string().optional().nullable(),
});

voiceWorkerRouter.post(
  '/session',
  h(async (req, res) => {
    const input = parse(SessionSchema, req.body);
    let meta: (Partial<CallMetadata> & { vars?: Record<string, string> }) = {};
    try {
      meta = input.metadata ? JSON.parse(input.metadata) : {};
    } catch {
      meta = {};
    }
    let ws = meta.workspaceId;
    let agentId = meta.agentId;
    let callId = meta.callId;

    // Inbound phone call: route by the dialled number.
    if (!callId) {
      const called = input.calledNumber || '';
      const idx = called ? await paths.numberIndex().doc(called).get() : null;
      if (!idx?.exists) return res.json({ allowed: false, message: 'Sorry, this number is not in service.' });
      ws = idx.get('workspaceId') as string;
      const num = await paths.phoneNumbers(ws).doc(called).get();
      agentId = num.get('agentId');
      const agent = await paths.agents(ws).doc(agentId!).get();
      if (!agent.exists) return res.json({ allowed: false, message: 'Sorry, this line is not available right now.' });
      callId = await createCallConversation(ws, agent, { channel: 'voice', direction: 'inbound', from: input.callerNumber || null, to: called });
      meta = { ...meta, channel: 'phone', direction: 'inbound' };
    }

    const [wsSnap, agentSnap] = await Promise.all([paths.workspace(ws!).get(), paths.agents(ws!).doc(agentId!).get()]);
    if (!wsSnap.exists || !agentSnap.exists) return res.json({ allowed: false, message: 'Sorry, this line is not available right now.' });
    const agent = AgentInputSchema.parse(agentSnap.data());
    let maxSeconds = agent.voice.maxCallMinutes * 60;
    if (meta.channel !== 'test') {
      const gate = await canServeVoice(ws!, wsSnap.data()!);
      if (!gate.ok) return res.json({ allowed: false, callId, workspaceId: ws, message: 'Thanks for calling. Our assistant is unavailable right now, please try again later or contact us by email.' });
      maxSeconds = Math.min(maxSeconds, gate.secondsLeft);
    }
    await paths.conversations(ws!).doc(callId!).update({ room: input.room, startedAt: FieldValue.serverTimestamp() });

    if (agent.voice.recordCalls && meta.channel !== 'test') {
      const path = `recordings/${ws}/${callId}.ogg`;
      startRecording(input.room, path)
        .then(async (egressId) => {
          if (egressId) await paths.conversations(ws!).doc(callId!).update({ recordingPath: path, egressId });
        })
        .catch((e) => console.warn('[voice] recording failed', e.message));
    }

    const instructions = buildSystemPrompt(agentSnap.data()!, wsSnap.get('name'), null, Boolean(agent.bookingUrl), {
      channel: 'voice',
      vars: { caller_number: input.callerNumber || meta.from || '', ...(meta.vars || {}) },
    });
    const greeting = agent.voice.firstMessage || agent.greeting;
    res.json({
      allowed: true,
      callId,
      workspaceId: ws,
      agentId,
      direction: meta.direction || 'web',
      test: meta.channel === 'test',
      instructions: `${instructions}\n- Facts from the knowledge base are added to the conversation as "KNOWLEDGE:" notes; use them.\n- To end the call use the end_call tool; to reach a person use transfer_to_human (only if available).`,
      greeting,
      greetingFirst: meta.direction !== 'outbound',
      model: { provider: agent.model.provider, id: agent.model.id, temperature: agent.model.temperature },
      voice: agent.voice,
      language: agent.language,
      useKnowledge: agent.useKnowledge,
      maxDurationSec: Math.max(30, Math.floor(maxSeconds)),
      canTransfer: Boolean(agent.voice.transferNumber) && meta.channel === 'phone',
      tools: await toolDefinitionsFor(ws!, agent.toolIds),
    });
  })
);

voiceWorkerRouter.post(
  '/retrieve',
  h(async (req, res) => {
    const input = parse(z.object({ workspaceId: z.string(), callId: z.string(), query: z.string().min(1).max(1000) }), req.body);
    const conv = await loadCall(input.callId, input.workspaceId);
    const agent = await paths.agents(input.workspaceId).doc(conv.get('agentId')).get();
    const chunks = await retrieve(input.workspaceId, input.query, { k: 4, sourceIds: agent.get('knowledgeSourceIds') || [] }).catch(() => []);
    res.json({ context: chunks.map((c) => `${c.title}: ${c.text}`).join('\n\n'), citations: toCitations(chunks) });
  })
);

voiceWorkerRouter.post(
  '/events',
  h(async (req, res) => {
    const input = parse(
      z.object({ workspaceId: z.string(), callId: z.string(), items: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']), text: z.string().max(4000) })).max(50) }),
      req.body
    );
    const conv = await loadCall(input.callId, input.workspaceId);
    const items = input.items.filter((i) => i.text.trim());
    if (!items.length) return res.json({ ok: true });
    const batch = db().batch();
    const base = Date.now();
    items.forEach((it, i) =>
      batch.set(paths.messages(input.workspaceId, conv.id).doc(), { role: it.role, text: it.text, createdAt: Timestamp.fromMillis(base + i) })
    );
    const last = items[items.length - 1];
    batch.update(conv.ref, { lastMessage: clip(last.text, 160), lastMessageAt: FieldValue.serverTimestamp(), messageCount: FieldValue.increment(items.length), firstMessage: conv.get('firstMessage') || clip(items.find((i) => i.role === 'user')?.text || '', 200) || null });
    await batch.commit();
    res.json({ ok: true });
  })
);

voiceWorkerRouter.post(
  '/tool',
  h(async (req, res) => {
    const input = parse(z.object({ workspaceId: z.string(), callId: z.string(), name: z.string(), args: z.record(z.any()).default({}) }), req.body);
    const conv = await loadCall(input.callId, input.workspaceId);
    if (input.name === 'transfer_to_human') {
      await conv.ref.update({ status: 'handoff', transferredAt: FieldValue.serverTimestamp() });
      const agent = await paths.agents(input.workspaceId).doc(conv.get('agentId')).get();
      return res.json({ result: 'transferring', transferNumber: agent.get('voice')?.transferNumber || null });
    }
    const out = await runTool(input.workspaceId, input.name, input.args, { conversationId: conv.id, channel: 'voice' });
    res.json(out);
  })
);

voiceWorkerRouter.post(
  '/end',
  h(async (req, res) => {
    const input = parse(z.object({ workspaceId: z.string(), callId: z.string(), durationSec: z.number().min(0).max(24 * 3600), endedReason: z.string().max(80).default('completed') }), req.body);
    const conv = await loadCall(input.callId, input.workspaceId);
    const ws = input.workspaceId;
    const msgs = await paths.messages(ws, conv.id).orderBy('createdAt', 'asc').limit(400).get();
    const transcript = msgs.docs.map((d) => `${d.get('role') === 'user' ? 'Caller' : 'Agent'}: ${d.get('text')}`).join('\n');
    let summary = '';
    let extracted: Record<string, string | null> = {};
    if (transcript.length > 20) {
      try {
        const agent = await paths.agents(ws).doc(conv.get('agentId')).get();
        const out = await generate({
          provider: agent.get('model')?.provider || 'mock',
          model: agent.get('model')?.id || 'zdoda-demo',
          temperature: 0,
          maxTokens: 400,
          system:
            'You summarise phone calls for a business. Reply with JSON only: {"summary": "2-3 sentences", "name": string|null, "email": string|null, "phone": string|null, "intent": "short phrase"|null, "outcome": "resolved"|"needs_follow_up"|"booked"|"not_interested"|null}',
          messages: [{ role: 'user', content: transcript.slice(-12000) }],
          context: { snippets: [], fallback: '' },
        });
        const json = JSON.parse(out.text.slice(out.text.indexOf('{'), out.text.lastIndexOf('}') + 1));
        summary = String(json.summary || '');
        extracted = { name: json.name || null, email: json.email || null, phone: json.phone || null, intent: json.intent || null, outcome: json.outcome || null };
      } catch {
        summary = clip(transcript.replace(/\n/g, ' '), 280);
      }
    }
    const contact = { ...(conv.get('contact') || {}) };
    for (const k of ['name', 'email', 'phone'] as const) if (!contact[k] && extracted[k]) contact[k] = extracted[k];
    await conv.ref.update({
      durationSec: Math.round(input.durationSec),
      endedReason: input.endedReason,
      endedAt: FieldValue.serverTimestamp(),
      summary: summary || null,
      extracted,
      contact,
      status: conv.get('status') === 'handoff' ? 'handoff' : extracted.outcome === 'needs_follow_up' ? 'handoff' : 'resolved',
    });
    if (conv.get('channel') !== 'test') await recordUsage(ws, { voiceSeconds: Math.ceil(input.durationSec) });
    if ((contact.email || contact.phone) && conv.get('channel') !== 'test') {
      await paths.leads(ws).doc(conv.id).set({ conversationId: conv.id, agentId: conv.get('agentId'), channel: 'voice', ...contact, firstMessage: summary || conv.get('firstMessage') || 'Phone call', createdAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    if (conv.get('campaignId') && conv.get('contactId')) {
      const status = input.durationSec < 3 || /no.?answer|busy|failed/i.test(input.endedReason) ? 'no_answer' : 'completed';
      await paths.campaignContacts(ws, conv.get('campaignId')).doc(conv.get('contactId')).update({ status, lastCallId: conv.id, summary: summary || null, updatedAt: FieldValue.serverTimestamp() }).catch(() => {});
    }
    dispatchEvent(ws, 'call.ended', { conversationId: conv.id, direction: conv.get('direction'), from: conv.get('from'), to: conv.get('to'), durationSec: Math.round(input.durationSec), summary, contact, extracted }).catch(() => {});
    res.json({ ok: true, summary });
  })
);

// ---------------------------------------------------------------------------
// LiveKit webhook (egress finished → recording available)
// ---------------------------------------------------------------------------
export async function handleLivekitWebhook(req: Request) {
  if (!livekitConfigured()) throw new AppError(400, 'VOICE_NOT_CONFIGURED', 'LiveKit not configured');
  const raw = Buffer.isBuffer(req.body) ? req.body : req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const event = await webhookReceiver().receive(raw.toString('utf8'), String(req.headers.authorization || ''));
  if (event.event === 'egress_ended' && event.egressInfo) {
    const snap = await db().collectionGroup('conversations').where('egressId', '==', event.egressInfo.egressId).limit(1).get().catch(() => null);
    if (snap && !snap.empty) await snap.docs[0].ref.update({ recordingReady: true });
  }
  return { ok: true };
}
