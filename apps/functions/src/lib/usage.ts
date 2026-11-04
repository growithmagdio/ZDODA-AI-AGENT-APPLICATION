import { FieldValue } from 'firebase-admin/firestore';
import { getPlan, usagePeriod, type BillingDTO, type SubscriptionStatus } from '@zdoda/shared';
import { paths } from '../firebase.js';
import { stripeConfigured } from '../providers/payments.js';

export async function getUsage(ws: string) {
  const period = usagePeriod();
  const snap = await paths.usage(ws).doc(period).get();
  return { period, messages: Number(snap.get('messages') || 0), tokensIn: Number(snap.get('tokensIn') || 0), tokensOut: Number(snap.get('tokensOut') || 0) };
}

export async function recordUsage(ws: string, delta: { messages?: number; tokensIn?: number; tokensOut?: number }) {
  const period = usagePeriod();
  await paths.usage(ws).doc(period).set(
    {
      period,
      messages: FieldValue.increment(delta.messages || 0),
      tokensIn: FieldValue.increment(delta.tokensIn || 0),
      tokensOut: FieldValue.increment(delta.tokensOut || 0),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export function billingOf(wsData: FirebaseFirestore.DocumentData): BillingDTO {
  const b = wsData.billing || {};
  let status: SubscriptionStatus = b.status || 'trialing';
  const trialEndsAt: Date | null = b.trialEndsAt?.toDate ? b.trialEndsAt.toDate() : b.trialEndsAt ? new Date(b.trialEndsAt) : null;
  if (status === 'trialing' && trialEndsAt && trialEndsAt.getTime() < Date.now()) status = 'expired';
  return {
    plan: getPlan(wsData.plan).slug,
    status,
    provider: b.provider || (stripeConfigured() ? 'stripe' : 'mock'),
    interval: b.interval || 'month',
    trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
    currentPeriodEnd: b.currentPeriodEnd?.toDate ? b.currentPeriodEnd.toDate().toISOString() : b.currentPeriodEnd || null,
    cancelAtPeriodEnd: Boolean(b.cancelAtPeriodEnd),
    stripeConfigured: stripeConfigured(),
  };
}

/** Whether the workspace may serve AI replies right now (subscription + monthly quota). */
export async function canServe(ws: string, wsData: FirebaseFirestore.DocumentData): Promise<{ ok: true } | { ok: false; reason: 'quota' | 'inactive' }> {
  const billing = billingOf(wsData);
  if (!['trialing', 'active', 'past_due'].includes(billing.status)) return { ok: false, reason: 'inactive' };
  const usage = await getUsage(ws);
  if (usage.messages >= getPlan(wsData.plan).messageLimit) return { ok: false, reason: 'quota' };
  return { ok: true };
}
