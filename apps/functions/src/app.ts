import express, { type Express } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { bucket, storageMode } from './firebase.js';
import { errorHandler, h } from './lib/http.js';
import { requireUser, requireWorkspace } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { workspaceRouter } from './routes/workspaces.js';
import { agentsRouter } from './routes/agents.js';
import { knowledgeRouter } from './routes/knowledge.js';
import { widgetsRouter } from './routes/widgets.js';
import { conversationsRouter, leadsRouter } from './routes/conversations.js';
import { analyticsRouter } from './routes/analytics.js';
import { teamRouter, invitesRouter } from './routes/team.js';
import { billingRouter, handleStripeWebhook } from './routes/billing.js';
import { integrationsRouter } from './routes/integrations.js';
import { publicRouter } from './routes/public.js';
import { systemRouter } from './routes/system.js';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);

  // Keep the raw body for Stripe signature checks (Cloud Functions already sets req.rawBody).
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as any).rawBody ??= buf;
      },
    })
  );
  app.use((_req, res, next) => {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
    next();
  });

  const v1 = express.Router();
  v1.get('/health', (_req, res) => res.json({ ok: true, service: 'zdoda-api' }));
  if (storageMode() === 'local') {
    // Serves widget images saved by the local storage adapter (dev only).
    v1.get(/^\/dev-files\/(.+)$/, h(async (req, res) => {
      const path = decodeURIComponent((req.params as any)[0]);
      if (!/^workspaces\/[^/]+\/widgets\//.test(path)) return res.status(404).end();
      const f = (bucket() as any).file(path);
      const [buf] = await f.download().catch(() => [null]);
      if (!buf) return res.status(404).end();
      res.setHeader('content-type', (await f.contentType()) || 'application/octet-stream');
      res.setHeader('access-control-allow-origin', '*');
      res.send(buf);
    }));
  }

  // Public widget endpoints: any origin (per-widget allow-list is enforced inside).
  v1.use('/public', cors({ origin: true, credentials: false, maxAge: 600 }), publicRouter);
  v1.post('/billing/webhook', h(async (req, res) => res.json(await handleStripeWebhook(req))));

  // Dashboard API: our web origins only + Firebase ID token.
  const dashboardCors = cors({ origin: config.corsOrigins, credentials: true });
  v1.use(dashboardCors);
  v1.use('/auth', requireUser, authRouter);
  v1.use('/invites', requireUser, invitesRouter);
  v1.use('/workspaces', requireUser, workspaceRouter);
  v1.use('/system', requireUser, systemRouter);
  const scoped = [requireUser, requireWorkspace];
  v1.use('/agents', ...scoped, agentsRouter);
  v1.use('/knowledge', ...scoped, knowledgeRouter);
  v1.use('/widgets', ...scoped, widgetsRouter);
  v1.use('/conversations', ...scoped, conversationsRouter);
  v1.use('/leads', ...scoped, leadsRouter);
  v1.use('/analytics', ...scoped, analyticsRouter);
  v1.use('/team', ...scoped, teamRouter);
  v1.use('/billing', ...scoped, billingRouter);
  v1.use('/integrations', ...scoped, integrationsRouter);

  app.use('/api/v1', v1);
  app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown API route' } }));
  app.use(errorHandler);
  return app;
}
