import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('Multi-Tenant Isolation & Authentication Tests', () => {
  let smileToken: string;
  let otherToken: string;
  let dualToken: string;

  beforeAll(async () => {
    // 1. Authenticate Smile Dental Owner
    const smileRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@smiledental.com', password: 'Password123!' });

    if (smileRes.status === 200) {
      smileToken = smileRes.headers['set-cookie'][0].split(';')[0].replace('zdoda_session=', '');
    }

    // 2. Authenticate Other Co Owner
    const otherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@otherco.com', password: 'Password123!' });

    if (otherRes.status === 200) {
      otherToken = otherRes.headers['set-cookie'][0].split(';')[0].replace('zdoda_session=', '');
    }

    // 3. Authenticate Dual Member User
    const dualRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'shared@agency.com', password: 'Password123!' });

    if (dualRes.status === 200) {
      dualToken = dualRes.headers['set-cookie'][0].split(';')[0].replace('zdoda_session=', '');
    }
  });

  it('Health endpoint returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('zdoda-api');
  });

  it('Unauthenticated requests to workspaces are rejected with 401', async () => {
    const res = await request(app).get('/api/v1/workspaces');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('User of Other Co gets 404 when querying Smile Dental workspace (Rule 03 isolation)', async () => {
    if (!otherToken) return;

    const res = await request(app)
      .get('/api/v1/workspaces/ws_smile_dental')
      .set('Cookie', `zdoda_session=${otherToken}`);

    // Must return 404, NEVER 403 (prevent resource existence enumeration)
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('User of Smile Dental gets 404 when querying Other Co workspace', async () => {
    if (!smileToken) return;

    const res = await request(app)
      .get('/api/v1/workspaces/ws_other_co')
      .set('Cookie', `zdoda_session=${smileToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('Dual-member user can access both workspaces', async () => {
    if (!dualToken) return;

    const resSmile = await request(app)
      .get('/api/v1/workspaces/ws_smile_dental')
      .set('Cookie', `zdoda_session=${dualToken}`);

    expect(resSmile.status).toBe(200);
    expect(resSmile.body.workspace.name).toBe('Smile Dental Clinic');

    const resOther = await request(app)
      .get('/api/v1/workspaces/ws_other_co')
      .set('Cookie', `zdoda_session=${dualToken}`);

    expect(resOther.status).toBe(200);
    expect(resOther.body.workspace.name).toBe('Other Co');
  });
});
