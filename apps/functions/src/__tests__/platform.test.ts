/**
 * Voice, WhatsApp, tools, campaigns, agency, API keys, admin, Razorpay — against the Auth emulator.
 * External services (LiveKit, Meta, Razorpay) are configured with fake keys; outbound fetches are stubbed.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createServer, type Server } from 'node:http';
import { createHmac } from 'node:crypto';
import { AddressInfo } from 'node:net';

process.env.LIVEKIT_URL = 'wss://zdoda-test.livekit.cloud';
process.env.LIVEKIT_API_KEY = 'APItestkey';
process.env.LIVEKIT_API_SECRET = 'testsecret_testsecret_testsecret_1234';
process.env.VOICE_WORKER_SECRET = 'worker-secret';
process.env.META_APP_SECRET = 'meta-secret';
process.env.WHATSAPP_VERIFY_TOKEN = 'verify-me';
process.env.RAZORPAY_WEBHOOK_SECRET = 'rzp-secret';
process.env.SUPERADMIN_EMAILS = '';
process.env.ALLOW_PRIVATE_URLS = 'true';

const { createApp } = await import('../app.js');
const { paths } = await import('../firebase.js');
const app = createApp();
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`;
const stamp = Date.now();

async function signUp(email: string) {
  const res = await fetch(`${AUTH}/accounts:signUp?key=fake`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'password123', returnSecureToken: true }) });
  return ((await res.json()) as any).idToken as string;
}

let token = '';
let ws = '';
let agentId = '';
const as = () => ({
  get: (p: string) => request(app).get(`/api/v1${p}`).set('authorization', `Bearer ${token}`).set('x-workspace-id', ws),
  post: (p: string, b?: object) => request(app).post(`/api/v1${p}`).set('authorization', `Bearer ${token}`).set('x-workspace-id', ws).send(b),
  patch: (p: string, b?: object) => request(app).patch(`/api/v1${p}`).set('authorization', `Bearer ${token}`).set('x-workspace-id', ws).send(b),
});
const worker = (p: string, b: object) => request(app).post(`/api/v1/voice-worker${p}`).set('x-voice-secret', 'worker-secret').send(b);

// Local endpoint standing in for a customer's API / webhook / MCP server.
let hookServer: Server;
let hookUrl = '';
const hookHits: any[] = [];

beforeAll(async () => {
  hookServer = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      hookHits.push({ url: req.url, body: body ? JSON.parse(body) : null, headers: req.headers });
      res.setHeader('content-type', 'application/json');
      if (req.url?.startsWith('/mcp')) {
        const msg = JSON.parse(body);
        const result = msg.method === 'initialize' ? { protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 't', version: '1' } } : msg.method === 'tools/list' ? { tools: [{ name: 'lookup-order', description: 'Find an order', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } }] } : msg.method === 'tools/call' ? { content: [{ type: 'text', text: `Order ${msg.params.arguments.id} shipped` }] } : {};
        return res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }));
      }
      res.end(JSON.stringify({ ok: true, eta: '2 days' }));
    });
  });
  await new Promise<void>((r) => hookServer.listen(0, '127.0.0.1', () => r()));
  hookUrl = `http://127.0.0.1:${(hookServer.address() as AddressInfo).port}`;

  token = await signUp(`platform-${stamp}@test.dev`);
  const boot = await request(app).post('/api/v1/auth/bootstrap').set('authorization', `Bearer ${token}`).send({ name: 'Pat Platform', workspaceName: 'Voice Clinic' });
  ws = boot.body.activeWorkspace.id;
  agentId = (await as().get('/agents')).body.items[0].id;
});

afterAll(() => hookServer?.close());

describe('voice', () => {
  it('reports status and issues a signed test-call token', async () => {
    const st = await as().get('/voice/status');
    expect(st.body.livekit).toBe(true);
    const res = await as().post('/voice/test-call', { agentId });
    expect(res.status).toBe(200);
    expect(res.body.serverUrl).toBe('wss://zdoda-test.livekit.cloud');
    const claims = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64url').toString());
    expect(claims.video.room).toBe(res.body.room);
    expect(claims.roomConfig.agents[0].agentName).toBe('zdoda-voice');
    expect(JSON.parse(claims.roomConfig.agents[0].metadata)).toMatchObject({ workspaceId: ws, agentId, channel: 'test' });
  });

  it('runs a worker session: config, transcript, knowledge, end with usage', async () => {
    const t = await as().post('/voice/test-call', { agentId });
    const claims = JSON.parse(Buffer.from(t.body.token.split('.')[1], 'base64url').toString());
    const meta = claims.roomConfig.agents[0].metadata;

    expect((await request(app).post('/api/v1/voice-worker/session').send({ room: 'x' })).status).toBe(403);
    const s = await worker('/session', { room: t.body.room, metadata: meta });
    expect(s.body.allowed).toBe(true);
    expect(s.body.instructions).toContain('live phone/voice call');
    expect(s.body.maxDurationSec).toBe(15 * 60);

    await as().post('/knowledge/sources', { type: 'faq', name: 'Hours', items: [{ q: 'When are you open?', a: 'We are open nine to five, Monday to Friday.' }] });
    await new Promise((r) => setTimeout(r, 400));
    const k = await worker('/retrieve', { workspaceId: ws, callId: s.body.callId, query: 'when are you open' });
    expect(k.body.context).toContain('nine to five');

    await worker('/events', { workspaceId: ws, callId: s.body.callId, items: [{ role: 'user', text: 'When are you open?' }, { role: 'assistant', text: 'Nine to five on weekdays.' }] });
    const end = await worker('/end', { workspaceId: ws, callId: s.body.callId, durationSec: 42 });
    expect(end.body.ok).toBe(true);
    const conv = await as().get(`/conversations/${s.body.callId}`);
    expect(conv.body.messages).toHaveLength(2);
    expect(conv.body.conversation.durationSec).toBe(42);
    // Test calls never use plan minutes.
    expect((await paths.usage(ws).get()).docs.reduce((a, d) => a + (d.get('voiceSeconds') || 0), 0)).toBe(0);
  });

  it('rejects inbound calls to unknown numbers and blocks voice on plans without minutes', async () => {
    const s = await worker('/session', { room: 'call-abc', calledNumber: '+15550001111', callerNumber: '+15550002222' });
    expect(s.body.allowed).toBe(false);
    const pub = await as().get('/widgets');
    const widgetId = pub.body.items[0].id;
    await as().post(`/agents/${agentId}/publish`);
    await as().post(`/widgets/${widgetId}/publish`);
    const noVoice = await request(app).post(`/api/v1/public/widgets/${widgetId}/voice-token`).send({ visitorId: 'visitor-1' });
    expect(noVoice.status).toBe(409); // voice not enabled on the agent yet
    await as().patch(`/agents/${agentId}`, { voice: { enabled: true, ttsProvider: 'elevenlabs', voiceId: '', sttLanguage: 'multi', firstMessage: 'Hello!', maxCallMinutes: 10, idleSeconds: 20, transferNumber: '', recordCalls: false, endCallPhrases: [], keywords: [], backgroundSound: false } });
    const ok = await request(app).post(`/api/v1/public/widgets/${widgetId}/voice-token`).send({ visitorId: 'visitor-1' });
    expect(ok.status).toBe(200); // trial includes a 10-minute voice sandbox
    expect(ok.body.token).toBeTruthy();
  });

  it('requires telephony setup before buying numbers', async () => {
    const res = await as().post('/phone-numbers', { number: '+15551234567', agentId });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TELEPHONY_NOT_READY');
  });
});

describe('tools', () => {
  it('creates an API tool and an MCP tool and runs them', async () => {
    const api = await as().post('/tools', {
      kind: 'api_request',
      name: 'check_order',
      description: 'Look up an order status by order number',
      parameters: [{ name: 'order_id', type: 'string', description: 'Order number', required: true }],
      config: { method: 'POST', url: `${hookUrl}/orders/{{order_id}}` },
    });
    expect(api.status).toBe(201);
    const run = await as().post(`/tools/${api.body.id}/test`, { args: { order_id: 'A-42' } });
    expect(run.body.ok).toBe(true);
    expect(run.body.result).toContain('2 days');
    expect(hookHits.some((h) => h.url === '/orders/A-42')).toBe(true);

    const mcp = await as().post('/tools', { kind: 'mcp', name: 'shop', description: 'The shop MCP server with order tools', config: { url: `${hookUrl}/mcp` } });
    const mrun = await as().post(`/tools/${mcp.body.id}/test`, { fn: 'shop__lookup_order', args: { id: '77' } });
    expect(mrun.body.functions).toContain('shop__lookup_order');
    expect(mrun.body.result).toBe('Order 77 shipped');
  });
});

describe('whatsapp', () => {
  it('verifies the webhook and answers a message', async () => {
    const v = await request(app).get('/api/v1/webhooks/whatsapp').query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'verify-me', 'hub.challenge': '12345' });
    expect(v.text).toBe('12345');

    await paths.workspace(ws).collection('channels').doc('whatsapp').set({ phoneNumberId: '1098765', agentId });
    await paths.whatsappIndex().doc('1098765').set({ workspaceId: ws });
    await paths.secrets(ws).doc('whatsapp_token').set({ value: (await import('../lib/util.js')).encrypt('EAAtoken') });

    const sent: any[] = [];
    const realFetch = globalThis.fetch;
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init?: any) => {
      if (String(url).includes('graph.facebook.com')) {
        sent.push(JSON.parse(init.body));
        return new Response(JSON.stringify({ messages: [{ id: 'wamid' }] }), { status: 200 });
      }
      return realFetch(url, init);
    });
    const payload = { entry: [{ changes: [{ value: { metadata: { phone_number_id: '1098765' }, contacts: [{ wa_id: '919800000000', profile: { name: 'Ravi' } }], messages: [{ from: '919800000000', type: 'text', text: { body: 'When are you open?' } }] } }] }] };
    const raw = JSON.stringify(payload);
    const bad = await request(app).post('/api/v1/webhooks/whatsapp').set('content-type', 'application/json').set('x-hub-signature-256', 'sha256=nope').send(raw);
    expect(bad.status).toBe(401);
    const sig = 'sha256=' + createHmac('sha256', 'meta-secret').update(raw).digest('hex');
    const ok = await request(app).post('/api/v1/webhooks/whatsapp').set('content-type', 'application/json').set('x-hub-signature-256', sig).send(raw);
    spy.mockRestore();
    expect(ok.status).toBe(200);
    expect(sent[0]).toMatchObject({ to: '919800000000', type: 'text' });
    expect(sent[0].text.body).toMatch(/nine to five/i);
    const conv = await as().get('/conversations/wa_1098765_919800000000');
    expect(conv.body.conversation).toMatchObject({ channel: 'whatsapp', contact: { name: 'Ravi', phone: '+919800000000' } });
  });
});

describe('agent versions, campaigns, agency, API, admin, razorpay', () => {
  it('keeps a version per publish', async () => {
    await as().post(`/agents/${agentId}/publish`);
    const v = await as().get(`/agents/${agentId}/versions`);
    expect(v.body.items.length).toBeGreaterThanOrEqual(2);
  });

  it('gates campaigns, API keys and agency mode by plan', async () => {
    expect((await as().post('/campaigns', { name: 'Reactivation', agentId, fromNumber: '+15551230000', consentConfirmed: true })).status).toBe(402);
    expect((await as().post('/api-keys', { name: 'Zapier' })).status).toBe(402);
    expect((await as().post('/agency/clients', { name: 'Client A' })).status).toBe(402);
  });

  it('lets an agency create clients and use the REST API', async () => {
    await paths.workspace(ws).update({ plan: 'agency', 'billing.status': 'active' });
    const client = await as().post('/agency/clients', { name: 'Client Dental' });
    expect(client.status).toBe(201);
    await as().patch('/agency/branding', { appName: 'Acme AI', primaryColor: '#112233', widgetFooter: 'Powered by Acme AI' });
    const list = await as().get('/agency');
    expect(list.body.clients[0]).toMatchObject({ name: 'Client Dental' });
    const clientWs = await paths.workspace(client.body.id).get();
    expect(clientWs.get('billing')).toMatchObject({ status: 'active', provider: 'agency' });
    expect(clientWs.get('branding').appName).toBe('Acme AI');

    const key = await as().post('/api-keys', { name: 'Zapier' });
    expect(key.body.key).toMatch(/^zk_live_/);
    const agents = await request(app).get('/api/v1/rest/agents').set('authorization', `Bearer ${key.body.key}`);
    expect(agents.body.data[0].id).toBe(agentId);
    const chat = await request(app).post(`/api/v1/rest/agents/${agentId}/messages`).set('authorization', `Bearer ${key.body.key}`).send({ message: 'When are you open?' });
    expect(chat.body.reply).toMatch(/nine to five/i);
    expect((await request(app).get('/api/v1/rest/agents').set('authorization', 'Bearer zk_wrong')).status).toBe(401);
  });

  it('imports campaign contacts and the dialer fails safely without telephony', async () => {
    await paths.phoneNumbers(ws).doc('+15551230000').set({ number: '+15551230000', agentId });
    const c = await as().post('/campaigns', { name: 'Reactivation', agentId, fromNumber: '+15551230000', consentConfirmed: true, windowStart: '00:00', windowEnd: '23:59' });
    expect(c.status).toBe(201);
    const imp = await as().post(`/campaigns/${c.body.id}/contacts`, { csv: 'phone,name,last_visit\n+15557654321,Maria,March\nnot-a-number,Bob,May\n+15557654322,Ann,June' });
    expect(imp.body).toEqual({ added: 2, skipped: 1 });
    await as().post(`/campaigns/${c.body.id}/start`);
    const { runCampaignTick } = await import('../routes/campaigns.js');
    await runCampaignTick();
    const detail = await as().get(`/campaigns/${c.body.id}`);
    expect(detail.body.contacts.find((x: any) => x.name === 'Maria')).toMatchObject({ status: 'failed', vars: { last_visit: 'March' } });
  });

  it('protects the admin panel', async () => {
    expect((await as().get('/admin/overview')).status).toBe(403);
    const { paths: p } = await import('../firebase.js');
    const uid = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).user_id;
    await p.users().doc(uid).set({ globalRole: 'SUPERADMIN' }, { merge: true });
    const o = await as().get('/admin/overview');
    expect(o.status).toBe(200);
    expect(o.body.workspaces).toBeGreaterThan(0);
  });

  it('activates a plan from a signed Razorpay webhook', async () => {
    const body = JSON.stringify({ event: 'subscription.activated', payload: { subscription: { entity: { id: 'sub_1', current_end: 1900000000, notes: { workspaceId: ws, plan: 'pro' } } } } });
    const bad = await request(app).post('/api/v1/billing/razorpay/webhook').set('content-type', 'application/json').set('x-razorpay-signature', 'x').send(body);
    expect(bad.status).toBe(400);
    const sig = createHmac('sha256', 'rzp-secret').update(body).digest('hex');
    const ok = await request(app).post('/api/v1/billing/razorpay/webhook').set('content-type', 'application/json').set('x-razorpay-signature', sig).send(body);
    expect(ok.status).toBe(200);
    const w = await paths.workspace(ws).get();
    expect(w.get('plan')).toBe('pro');
    expect(w.get('billing')).toMatchObject({ status: 'active', provider: 'razorpay' });
  });
});
