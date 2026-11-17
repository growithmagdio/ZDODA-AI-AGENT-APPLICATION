import { Router } from 'express';
import type { SystemStatusDTO } from '@zdoda/shared';
import { config } from '../config.js';
import { h } from '../lib/http.js';
import { availableProviders } from '../providers/llm.js';
import { embeddingInfo } from '../providers/embeddings.js';
import { stripeConfigured } from '../providers/payments.js';
import { emailLive } from '../providers/email.js';

export const systemRouter = Router();

/** Tells the UI which integrations are live vs demo, so status pills never lie. */
systemRouter.get(
  '/status',
  h(async (_req, res) => {
    const llm = config.llmProvider;
    const emb = embeddingInfo();
    const body: SystemStatusDTO = {
      llm: { provider: llm, live: llm !== 'mock', available: availableProviders() },
      embeddings: { provider: emb.provider, live: emb.live, model: emb.model },
      payments: { provider: stripeConfigured() ? 'stripe' : 'mock', live: stripeConfigured() },
      email: { provider: emailLive() ? 'resend' : 'log', live: emailLive() },
      storage: { live: true },
    };
    res.json(body);
  })
);
