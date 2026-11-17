import { createHmac } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { paths } from '../firebase.js';
import { decrypt } from './util.js';
import { assertPublicUrl } from '../rag/extract.js';

export type IntegrationEvent = 'lead.captured' | 'conversation.handoff' | 'conversation.resolved' | 'message.created';

/** Delivers an event to every connected webhook that subscribed to it. Signed with HMAC-SHA256. */
export async function dispatchEvent(ws: string, event: IntegrationEvent, payload: Record<string, unknown>, opts: { onlyId?: string } = {}) {
  const snap = await paths.integrations(ws).where('kind', '==', 'webhook').get().catch(() => null);
  if (!snap || snap.empty) return;
  const body = JSON.stringify({ event, workspaceId: ws, sentAt: new Date().toISOString(), data: payload });
  await Promise.allSettled(
    snap.docs
      .filter((d) => (opts.onlyId ? d.id === opts.onlyId : (d.get('events') || []).includes(event)))
      .map(async (d) => {
        try {
          const url = String(d.get('config')?.url || '');
          await assertPublicUrl(url);
          const secretDoc = await paths.secrets(ws).doc(d.id).get();
          const secret = secretDoc.exists ? decrypt(secretDoc.get('value')) : '';
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-zdoda-event': event,
              ...(secret ? { 'x-zdoda-signature': 'sha256=' + createHmac('sha256', secret).update(body).digest('hex') } : {}),
            },
            body,
            signal: AbortSignal.timeout(4000),
          });
          await d.ref.update({ lastRunAt: FieldValue.serverTimestamp(), status: res.ok ? 'connected' : 'error', lastError: res.ok ? null : `HTTP ${res.status}` });
        } catch (err: any) {
          await d.ref.update({ lastRunAt: FieldValue.serverTimestamp(), status: 'error', lastError: String(err?.message || err).slice(0, 200) });
        }
      })
  );
}
