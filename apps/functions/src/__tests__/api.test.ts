/**
 * Integration tests against the Firebase emulators (auth, firestore, storage).
 * Run: firebase emulators:exec --only auth,firestore,storage "pnpm --filter @zdoda/functions test"
 */
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`;

async function signUp(email: string) {
  const res = await fetch(`${AUTH}/accounts:signUp?key=fake`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', returnSecureToken: true }),
  });
  const json: any = await res.json();
  if (!json.idToken) throw new Error('signup failed: ' + JSON.stringify(json));
  return json.idToken as string;
}

const waitFor = async <T>(fn: () => Promise<T | undefined>, ms = 15000): Promise<T> => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('timed out');
};

const stamp = Date.now();
let ownerToken = '';
let wsId = '';

const as = (token: string) => ({
  get: (p: string) => request(app).get(`/api/v1${p}`).set('authorization', `Bearer ${token}`).set('x-workspace-id', wsId),
  post: (p: string, body?: object) => request(app).post(`/api/v1${p}`).set('authorization', `Bearer ${token}`).set('x-workspace-id', wsId).send(body),
  patch: (p: string, body?: object) => request(app).patch(`/api/v1${p}`).set('authorization', `Bearer ${token}`).set('x-workspace-id', wsId).send(body),
});

beforeAll(async () => {
  ownerToken = await signUp(`owner-${stamp}@test.dev`);
  const res = await request(app).post('/api/v1/auth/bootstrap').set('authorization', `Bearer ${ownerToken}`).send({ name: 'Olivia Owner', workspaceName: 'Smile Dental Clinic', category: 'Healthcare' });
  expect(res.status).toBe(201);
  wsId = res.body.activeWorkspace.id;
});

describe('auth & tenancy', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the session for a bootstrapped user', async () => {
    const res = await as(ownerToken).get('/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Olivia Owner');
    expect(res.body.workspaces[0]).toMatchObject({ name: 'Smile Dental Clinic', role: 'OWNER' });
  });

  it('blocks access to another workspace', async () => {
    const other = await signUp(`intruder-${stamp}@test.dev`);
    await request(app).post('/api/v1/auth/bootstrap').set('authorization', `Bearer ${other}`).send({ workspaceName: 'Other Co' });
    const res = await as(other).get('/agents');
    expect(res.status).toBe(404);
  });
});

describe('agent + knowledge + widget flow', () => {
  let agentId = '';
  let widgetId = '';

  it('creates a default agent and widget on signup', async () => {
    const agents = await as(ownerToken).get('/agents');
    expect(agents.body.items).toHaveLength(1);
    agentId = agents.body.items[0].id;
    const widgets = await as(ownerToken).get('/widgets');
    widgetId = widgets.body.items[0].id;
    expect(widgets.body.items[0].embedCode).toContain(widgetId);
  });

  it('enforces the Starter agent limit', async () => {
    const res = await as(ownerToken).post('/agents', { name: 'Second agent' });
    expect(res.status).toBe(402);
  });

  it('indexes an FAQ and answers from it', async () => {
    const created = await as(ownerToken).post('/knowledge/sources', {
      type: 'faq',
      name: 'Clinic FAQ',
      items: [
        { q: 'How much does teeth whitening cost?', a: 'Professional teeth whitening costs $299 and takes about one hour.' },
        { q: 'What are your opening hours?', a: 'We are open Monday to Friday from 9am to 6pm and Saturday 9am to 1pm.' },
      ],
    });
    expect(created.status).toBe(201);
    await waitFor(async () => {
      const s = await as(ownerToken).get(`/knowledge/sources/${created.body.id}`);
      return s.body.source.status === 'ready' ? s.body : undefined;
    });
    const search = await as(ownerToken).post('/knowledge/search', { query: 'teeth whitening price' });
    expect(search.body.results[0].text).toContain('$299');

    const chat = await as(ownerToken).post(`/agents/${agentId}/test`, { message: 'How much is teeth whitening?' });
    expect(chat.status).toBe(200);
    expect(chat.body.reply.text).toContain('$299');
    expect(chat.body.demo).toBe(true);
    expect(chat.body.reply.citations[0].title).toBe('Clinic FAQ');
  });

  it('ingests an uploaded file', async () => {
    const res = await request(app)
      .post('/api/v1/knowledge/upload')
      .set('authorization', `Bearer ${ownerToken}`)
      .set('x-workspace-id', wsId)
      .attach('file', Buffer.from('Invisalign treatment starts at $3,500 and includes a free consultation.\nEmergency appointments are available the same day.'), 'pricing.txt');
    expect(res.status).toBe(201);
    const ready = await waitFor(async () => {
      const s = await as(ownerToken).get(`/knowledge/sources/${res.body.id}`);
      return s.body.source.status === 'ready' ? s.body : undefined;
    });
    expect(ready.chunks[0].text).toContain('Invisalign');
    const bad = await request(app).post('/api/v1/knowledge/upload').set('authorization', `Bearer ${ownerToken}`).set('x-workspace-id', wsId).attach('file', Buffer.from('x'), 'virus.exe');
    expect(bad.status).toBe(400);
  });

  it('serves the public widget only after publishing', async () => {
    const before = await request(app).get(`/api/v1/public/widgets/${widgetId}/config`);
    expect(before.status).toBe(404);
    await as(ownerToken).post(`/agents/${agentId}/publish`);
    await as(ownerToken).patch(`/widgets/${widgetId}`, { allowedOrigins: ['https://smiledental.example'] });
    const pub = await as(ownerToken).post(`/widgets/${widgetId}/publish`);
    expect(pub.body.publishedVersion).toBe(1);

    const blocked = await request(app).get(`/api/v1/public/widgets/${widgetId}/config`).set('origin', 'https://evil.example');
    expect(blocked.status).toBe(403);
    const cfg = await request(app).get(`/api/v1/public/widgets/${widgetId}/config`).set('origin', 'https://smiledental.example');
    expect(cfg.status).toBe(200);
    expect(cfg.body.config.schemaVersion).toBe(1);
  });

  it('runs a visitor conversation, captures a lead and supports human takeover', async () => {
    const send = (body: object) => request(app).post(`/api/v1/public/widgets/${widgetId}/chat`).set('origin', 'https://smiledental.example').send({ visitorId: 'visitor-123', ...body });
    const first = await send({ message: 'What are your opening hours?' });
    expect(first.status).toBe(200);
    expect(first.body.reply.text).toMatch(/Monday to Friday/);
    const { conversationId, conversationToken } = first.body;

    const lead = await send({ message: 'My name is Sarah, email sarah@example.com', conversationId, conversationToken });
    expect(lead.body.conversationId).toBe(conversationId);

    const leads = await as(ownerToken).get('/leads');
    expect(leads.body.items[0]).toMatchObject({ email: 'sarah@example.com', name: 'Sarah' });

    const reply = await as(ownerToken).post(`/conversations/${conversationId}/messages`, { text: 'Hi Sarah, this is Dr. Lee!' });
    expect(reply.status).toBe(201);
    const quiet = await send({ message: 'Thanks!', conversationId, conversationToken });
    expect(quiet.body.reply).toBeNull();
    expect(quiet.body.takeover).toBe(true);

    const history = await request(app).get(`/api/v1/public/widgets/${widgetId}/conversations/${conversationId}/messages`).query({ token: conversationToken }).set('origin', 'https://smiledental.example');
    expect(history.body.items.some((m: any) => m.role === 'human' && m.text.includes('Dr. Lee'))).toBe(true);

    const inbox = await as(ownerToken).get('/conversations');
    expect(inbox.body.counts.all).toBe(1);
    const usage = await as(ownerToken).get('/workspaces/current/usage');
    expect(usage.body.messages).toBe(2);

    const analytics = await as(ownerToken).get('/analytics/summary?days=7');
    expect(analytics.body.kpis.conversations.value).toBe(1);
    expect(analytics.body.kpis.leads.value).toBe(1);
  });
});

describe('team & billing', () => {
  it('invites a teammate who joins on signup with the invited role', async () => {
    const email = `viewer-${stamp}@test.dev`;
    const inv = await as(ownerToken).post('/team/invites', { email, role: 'VIEWER' });
    expect(inv.status).toBe(201);
    const viewer = await signUp(email);
    const boot = await request(app).post('/api/v1/auth/bootstrap').set('authorization', `Bearer ${viewer}`).send({ name: 'Vic Viewer' });
    expect(boot.body.workspaces.map((w: any) => w.id)).toContain(wsId);
    const denied = await as(viewer).patch(`/widgets/${(await as(ownerToken).get('/widgets')).body.items[0].id}`, { name: 'hacked' });
    expect(denied.status).toBe(403);
    const members = await as(ownerToken).get('/team/members');
    expect(members.body.members).toHaveLength(2);
  });

  it('activates a plan in demo billing mode', async () => {
    const checkout = await as(ownerToken).post('/billing/checkout', { plan: 'pro', interval: 'month' });
    expect(checkout.body.mode).toBe('mock');
    await as(ownerToken).post('/billing/mock/activate', { plan: 'pro', interval: 'month' });
    const billing = await as(ownerToken).get('/billing');
    expect(billing.body.billing).toMatchObject({ plan: 'pro', status: 'active', provider: 'mock' });
    expect(billing.body.usage.agentLimit).toBe(5);
  });
});
