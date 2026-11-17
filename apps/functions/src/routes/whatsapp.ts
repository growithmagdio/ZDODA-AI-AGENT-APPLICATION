import { Router, type Request } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { paths } from '../firebase.js';
import { config } from '../config.js';
import { h, parse, serialize, AppError, notFound } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { runTurn } from '../chat/engine.js';
import { audit, decrypt, encrypt } from '../lib/util.js';

const graph = (path: string) => `https://graph.facebook.com/${config.metaGraphVersion}/${path}`;

async function graphFetch(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(graph(path), { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers || {}) }, signal: AbortSignal.timeout(15_000) });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Meta API HTTP ${res.status}`);
  return json;
}

async function tokenFor(ws: string) {
  const s = await paths.secrets(ws).doc('whatsapp_token').get();
  if (!s.exists) throw new Error('WhatsApp is not connected');
  return decrypt(s.get('value'));
}

/** Sends a WhatsApp text from the workspace's connected number. */
export async function sendWhatsAppText(ws: string, to: string, body: string) {
  const ch = await paths.workspace(ws).collection('channels').doc('whatsapp').get();
  if (!ch.exists) throw new Error('WhatsApp is not connected');
  await graphFetch(`${ch.get('phoneNumberId')}/messages`, await tokenFor(ws), {
    method: 'POST',
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: true, body: body.slice(0, 4096) } }),
  });
}

// ---------------------------------------------------------------------------
// Dashboard: connect / disconnect
// ---------------------------------------------------------------------------
export const whatsappRouter = Router();

whatsappRouter.get(
  '/',
  requirePermission('read', 'Channel'),
  h(async (req, res) => {
    const ch = await paths.workspace(req.ws!.workspaceId).collection('channels').doc('whatsapp').get();
    res.json({
      connected: ch.exists,
      channel: ch.exists ? serialize(ch.data()) : null,
      webhookUrl: `${config.publicApiUrl}/api/v1/webhooks/whatsapp`,
      verifyTokenSet: Boolean(config.whatsappVerifyToken),
      appSecretSet: Boolean(config.metaAppSecret),
    });
  })
);

whatsappRouter.post(
  '/',
  requirePermission('create', 'Channel'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const input = parse(
      z.object({ phoneNumberId: z.string().regex(/^\d{6,20}$/, 'Phone number ID is a long number from WhatsApp Manager'), wabaId: z.string().regex(/^\d{6,20}$/), accessToken: z.string().min(20), agentId: z.string().min(1) }),
      req.body
    );
    if (!(await paths.agents(ws).doc(input.agentId).get()).exists) throw notFound('Agent');
    const other = await paths.whatsappIndex().doc(input.phoneNumberId).get();
    if (other.exists && other.get('workspaceId') !== ws) throw new AppError(409, 'IN_USE', 'This WhatsApp number is connected to another workspace');
    let info: any;
    try {
      info = await graphFetch(`${input.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`, input.accessToken);
      await graphFetch(`${input.wabaId}/subscribed_apps`, input.accessToken, { method: 'POST' });
    } catch (e: any) {
      throw new AppError(400, 'META_ERROR', `Meta rejected the details: ${e.message}`);
    }
    await paths.secrets(ws).doc('whatsapp_token').set({ value: encrypt(input.accessToken), kind: 'whatsapp_access_token' });
    await paths.workspace(ws).collection('channels').doc('whatsapp').set({
      phoneNumberId: input.phoneNumberId,
      wabaId: input.wabaId,
      displayNumber: info.display_phone_number || null,
      verifiedName: info.verified_name || null,
      agentId: input.agentId,
      connectedAt: FieldValue.serverTimestamp(),
    });
    await paths.whatsappIndex().doc(input.phoneNumberId).set({ workspaceId: ws });
    await audit(ws, req.user!, 'whatsapp.connected', { number: info.display_phone_number });
    res.status(201).json({ ok: true, displayNumber: info.display_phone_number, verifiedName: info.verified_name });
  })
);

whatsappRouter.patch(
  '/',
  requirePermission('update', 'Channel'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const { agentId } = parse(z.object({ agentId: z.string().min(1) }), req.body);
    const ref = paths.workspace(ws).collection('channels').doc('whatsapp');
    if (!(await ref.get()).exists) throw notFound('WhatsApp channel');
    await ref.update({ agentId });
    res.json({ ok: true });
  })
);

whatsappRouter.delete(
  '/',
  requirePermission('delete', 'Channel'),
  h(async (req, res) => {
    const ws = req.ws!.workspaceId;
    const ref = paths.workspace(ws).collection('channels').doc('whatsapp');
    const snap = await ref.get();
    if (snap.exists) await paths.whatsappIndex().doc(snap.get('phoneNumberId')).delete();
    await ref.delete();
    await paths.secrets(ws).doc('whatsapp_token').delete();
    res.json({ ok: true });
  })
);

// ---------------------------------------------------------------------------
// Public webhook from Meta
// ---------------------------------------------------------------------------
export const whatsappWebhookRouter = Router();

whatsappWebhookRouter.get('/', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && config.whatsappVerifyToken && req.query['hub.verify_token'] === config.whatsappVerifyToken) {
    return res.status(200).send(String(req.query['hub.challenge'] || ''));
  }
  res.sendStatus(403);
});

function validSignature(req: Request) {
  if (!config.metaAppSecret) return false;
  const sig = String(req.headers['x-hub-signature-256'] || '');
  const expected = 'sha256=' + createHmac('sha256', config.metaAppSecret).update(req.rawBody || Buffer.from('')).digest('hex');
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function handleWhatsAppPayload(body: any) {
  for (const entry of body?.entry || []) {
    for (const change of entry.changes || []) {
      const v = change.value || {};
      const phoneNumberId = v.metadata?.phone_number_id;
      if (!phoneNumberId || !v.messages?.length) continue;
      const idx = await paths.whatsappIndex().doc(phoneNumberId).get();
      if (!idx.exists) continue;
      const ws = idx.get('workspaceId') as string;
      const ch = await paths.workspace(ws).collection('channels').doc('whatsapp').get();
      const agentId = ch.get('agentId');
      for (const m of v.messages) {
        const from = String(m.from);
        const name = v.contacts?.find((c: any) => c.wa_id === from)?.profile?.name || null;
        const text = m.type === 'text' ? m.text?.body : m.type === 'interactive' ? m.interactive?.button_reply?.title || m.interactive?.list_reply?.title : m.type === 'button' ? m.button?.text : null;
        if (!text) {
          await sendWhatsAppText(ws, from, 'Thanks! I can only read text messages for now — could you type your question?').catch(() => {});
          continue;
        }
        const out = await runTurn({ ws, agentId, channel: 'whatsapp', text, fixedConversationId: `wa_${phoneNumberId}_${from}`, contactHint: { name, phone: `+${from}` } });
        if (out.reply?.text) await sendWhatsAppText(ws, from, out.reply.text).catch((e) => console.error('[whatsapp] send failed', e.message));
      }
    }
  }
}

whatsappWebhookRouter.post(
  '/',
  h(async (req, res) => {
    if (!validSignature(req)) return res.sendStatus(401);
    await handleWhatsAppPayload(req.body);
    res.sendStatus(200);
  })
);
