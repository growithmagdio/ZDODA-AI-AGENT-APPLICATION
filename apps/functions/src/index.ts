/**
 * Cloud Functions entry (2nd gen).
 *  - `api`: the whole REST API (Hosting rewrites /api/** here).
 *  - `ingestKnowledge`: Firestore trigger that indexes knowledge sources when they are queued.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2';
import { createApp } from './app.js';
import { processSource } from './rag/ingest.js';
import { runCampaignTick } from './routes/campaigns.js';
import { runKnowledgeResync } from './routes/knowledge.js';

process.env.INGEST_MODE ??= 'trigger';
setGlobalOptions({ region: process.env.FUNCTIONS_REGION || 'us-central1', maxInstances: 20 });

// Secret Manager secrets to mount, e.g. ZDODA_SECRETS=ENCRYPTION_KEY,ANTHROPIC_API_KEY,STRIPE_SECRET_KEY
// (create each first: firebase functions:secrets:set NAME). Plain config lives in apps/functions/.env.
const secrets = (process.env.ZDODA_SECRETS || '').split(',').map((s) => s.trim()).filter(Boolean);

export const api = onRequest({ memory: '1GiB', timeoutSeconds: 120, concurrency: 40, secrets }, createApp());

export const ingestKnowledge = onDocumentWritten(
  { document: 'workspaces/{ws}/knowledgeSources/{sourceId}', memory: '1GiB', timeoutSeconds: 540, secrets },
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();
    if (!after || after.status !== 'queued') return;
    const requeued = before?.status !== 'queued' || String(before?.reprocessRequestedAt?.toMillis?.()) !== String(after.reprocessRequestedAt?.toMillis?.());
    if (!requeued) return;
    await processSource(event.params.ws, event.params.sourceId);
  }
);

/** Dials outbound campaign contacts inside their calling windows. */
export const campaignDialer = onSchedule({ schedule: 'every 1 minutes', timeoutSeconds: 120, secrets }, async () => {
  await runCampaignTick();
});

/** Re-crawls website knowledge sources on their daily / weekly / monthly schedule. */
export const knowledgeResync = onSchedule({ schedule: 'every day 03:00', timeoutSeconds: 540, memory: '1GiB', secrets }, async () => {
  await runKnowledgeResync();
});
