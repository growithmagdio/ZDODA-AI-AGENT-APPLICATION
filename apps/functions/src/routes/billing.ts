import { Router, type Request } from 'express';
import { z } from 'zod';
import { createHmac as _hmac, timingSafeEqual as _tse } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { DEMO_PLANS } from '@zdoda/shared';
import type Stripe from 'stripe';
import { paths } from '../firebase.js';
import { config } from '../config.js';
import { h, parse, AppError } from '../lib/http.js';
import { requirePermission } from '../middleware/auth.js';
import { stripe, stripeConfigured } from '../providers/payments.js';
import { workspaceSummary } from './workspaces.js';
import { audit } from '../lib/util.js';

export const billingRouter = Router();

const PaidPlan = z.enum(['starter', 'pro', 'business']);

billingRouter.get(
  '/',
  requirePermission('read', 'Billing'),
  h(async (req, res) => {
    const summary = await workspaceSummary(req.ws!.workspaceId, req.ws!.workspace);
    const plans = DEMO_PLANS.map((p) => ({
      ...p,
      purchasable: p.slug !== 'agency' && (!stripeConfigured() || Boolean(config.stripePrice(p.slug, 'month'))),
      inrPurchasable: razorpayConfigured() && Boolean(config.razorpayPlan(p.slug)),
    }));
    res.json({ ...summary, plans, razorpay: razorpayConfigured() });
  })
);

billingRouter.post(
  '/checkout',
  requirePermission('manage_billing', 'Billing'),
  h(async (req, res) => {
    const { plan, interval } = parse(z.object({ plan: PaidPlan, interval: z.enum(['month', 'year']).default('month') }), req.body);
    const ws = req.ws!.workspaceId;
    if (!stripeConfigured()) {
      // Demo mode: no money moves. The UI shows a clearly labelled demo checkout.
      return res.json({ mode: 'mock', url: `${config.webAppUrl}/billing?mock_checkout=${plan}&interval=${interval}` });
    }
    const price = config.stripePrice(plan, interval);
    if (!price) throw new AppError(400, 'PRICE_MISSING', `No Stripe price configured for ${plan} (${interval})`);
    let customer = req.ws!.workspace.billing?.stripeCustomerId as string | undefined;
    if (!customer) {
      const c = await stripe().customers.create({ email: req.user!.email, name: req.ws!.workspace.name, metadata: { workspaceId: ws } });
      customer = c.id;
      await paths.workspace(ws).update({ 'billing.stripeCustomerId': customer });
    }
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [{ price, quantity: 1 }],
      client_reference_id: ws,
      subscription_data: { metadata: { workspaceId: ws, plan } },
      metadata: { workspaceId: ws, plan, interval },
      allow_promotion_codes: true,
      success_url: `${config.webAppUrl}/billing?checkout=success`,
      cancel_url: `${config.webAppUrl}/billing?checkout=cancelled`,
    });
    res.json({ mode: 'stripe', url: session.url });
  })
);

billingRouter.post(
  '/portal',
  requirePermission('manage_billing', 'Billing'),
  h(async (req, res) => {
    const customer = req.ws!.workspace.billing?.stripeCustomerId;
    if (!stripeConfigured() || !customer) throw new AppError(400, 'NO_CUSTOMER', 'There is no Stripe subscription to manage yet');
    const session = await stripe().billingPortal.sessions.create({ customer, return_url: `${config.webAppUrl}/billing` });
    res.json({ url: session.url });
  })
);

/** Demo-mode plan switch — only available when Stripe is NOT configured. */
billingRouter.post(
  '/mock/activate',
  requirePermission('manage_billing', 'Billing'),
  h(async (req, res) => {
    if (stripeConfigured()) throw new AppError(400, 'STRIPE_ENABLED', 'Demo billing is disabled because Stripe is configured');
    const { plan, interval } = parse(z.object({ plan: PaidPlan, interval: z.enum(['month', 'year']).default('month') }), req.body);
    const periodEnd = Timestamp.fromMillis(Date.now() + (interval === 'year' ? 365 : 30) * 86400_000);
    await paths.workspace(req.ws!.workspaceId).update({
      plan,
      billing: { ...(req.ws!.workspace.billing || {}), status: 'active', provider: 'mock', interval, currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false },
      updatedAt: FieldValue.serverTimestamp(),
    });
    await audit(req.ws!.workspaceId, req.user!, 'billing.mock_activated', { plan, interval });
    res.json({ ok: true });
  })
);

billingRouter.post(
  '/mock/cancel',
  requirePermission('manage_billing', 'Billing'),
  h(async (req, res) => {
    if (stripeConfigured()) throw new AppError(400, 'STRIPE_ENABLED', 'Use the Stripe billing portal');
    await paths.workspace(req.ws!.workspaceId).update({ 'billing.cancelAtPeriodEnd': true });
    res.json({ ok: true });
  })
);

function planFromPrice(priceId: string | undefined): string | null {
  for (const p of ['starter', 'pro', 'business']) {
    if (priceId && (config.stripePrice(p, 'month') === priceId || config.stripePrice(p, 'year') === priceId)) return p;
  }
  return null;
}

async function applySubscription(sub: Stripe.Subscription) {
  const ws = sub.metadata?.workspaceId;
  if (!ws) return;
  const item = sub.items.data[0];
  const plan = planFromPrice(item?.price?.id) || sub.metadata?.plan || 'starter';
  const statusMap: Record<string, string> = { active: 'active', trialing: 'trialing', past_due: 'past_due', unpaid: 'past_due', canceled: 'canceled', incomplete_expired: 'canceled' };
  const periodEnd = (item as any)?.current_period_end ?? (sub as any).current_period_end;
  await paths.workspace(ws).update({
    plan,
    'billing.status': statusMap[sub.status] || 'past_due',
    'billing.provider': 'stripe',
    'billing.interval': item?.price?.recurring?.interval || 'month',
    'billing.stripeSubscriptionId': sub.id,
    'billing.stripeCustomerId': typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    'billing.currentPeriodEnd': periodEnd ? Timestamp.fromMillis(periodEnd * 1000) : null,
    'billing.cancelAtPeriodEnd': sub.cancel_at_period_end,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/** Stripe webhook. Must receive the raw body (Cloud Functions provides req.rawBody). */
export async function handleStripeWebhook(req: Request) {
  if (!stripeConfigured() || !config.stripeWebhookSecret) throw new AppError(400, 'STRIPE_DISABLED', 'Stripe webhooks are not configured');
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(req.rawBody!, sig, config.stripeWebhookSecret);
  } catch (err: any) {
    throw new AppError(400, 'BAD_SIGNATURE', `Webhook signature verification failed: ${err.message}`);
  }
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.subscription) await applySubscription(await stripe().subscriptions.retrieve(String(s.subscription)));
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await applySubscription(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.payment_failed': {
      const inv = event.data.object as any;
      const subId = inv.subscription || inv.parent?.subscription_details?.subscription;
      if (subId) await applySubscription(await stripe().subscriptions.retrieve(String(subId)));
      break;
    }
    default:
      break;
  }
  return { received: true, type: event.type };
}

// ---------------------------------------------------------------------------
// Razorpay (INR subscriptions for India)
// ---------------------------------------------------------------------------

export const razorpayConfigured = () => Boolean(config.razorpayKeyId && config.razorpayKeySecret);

async function rzp(method: 'GET' | 'POST', path: string, body?: unknown) {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: { authorization: 'Basic ' + Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64'), 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new AppError(400, 'RAZORPAY_ERROR', json?.error?.description || `Razorpay HTTP ${res.status}`);
  return json;
}

billingRouter.post(
  '/razorpay/subscribe',
  requirePermission('manage_billing', 'Billing'),
  h(async (req, res) => {
    if (!razorpayConfigured()) throw new AppError(400, 'RAZORPAY_NOT_CONFIGURED', 'INR payments are not set up yet');
    const { plan } = parse(z.object({ plan: PaidPlan }), req.body);
    const planId = config.razorpayPlan(plan);
    if (!planId) throw new AppError(400, 'PRICE_MISSING', `No Razorpay plan configured for ${plan}`);
    const sub = await rzp('POST', '/subscriptions', { plan_id: planId, total_count: 120, customer_notify: 1, notes: { workspaceId: req.ws!.workspaceId, plan } });
    await paths.workspace(req.ws!.workspaceId).update({ 'billing.razorpaySubscriptionId': sub.id });
    res.json({ keyId: config.razorpayKeyId, subscriptionId: sub.id, shortUrl: sub.short_url || null });
  })
);

/** Razorpay webhook (raw body, header x-razorpay-signature). */
export async function handleRazorpayWebhook(req: Request) {
  if (!config.razorpayWebhookSecret) throw new AppError(400, 'RAZORPAY_DISABLED', 'Razorpay webhooks are not configured');
  const sig = String(req.headers['x-razorpay-signature'] || '');
  const expected = _hmac('sha256', config.razorpayWebhookSecret).update(req.rawBody || Buffer.from('')).digest('hex');
  if (sig.length !== expected.length || !_tse(Buffer.from(sig), Buffer.from(expected))) throw new AppError(400, 'BAD_SIGNATURE', 'Invalid signature');
  const event = req.body?.event as string;
  const sub = req.body?.payload?.subscription?.entity;
  const ws = sub?.notes?.workspaceId;
  if (!ws) return { received: true };
  const statusMap: Record<string, string> = {
    'subscription.activated': 'active',
    'subscription.charged': 'active',
    'subscription.resumed': 'active',
    'subscription.pending': 'past_due',
    'subscription.halted': 'past_due',
    'subscription.cancelled': 'canceled',
    'subscription.completed': 'canceled',
  };
  if (statusMap[event]) {
    await paths.workspace(ws).update({
      ...(sub.notes?.plan ? { plan: sub.notes.plan } : {}),
      'billing.status': statusMap[event],
      'billing.provider': 'razorpay',
      'billing.interval': 'month',
      'billing.razorpaySubscriptionId': sub.id,
      'billing.currentPeriodEnd': sub.current_end ? Timestamp.fromMillis(sub.current_end * 1000) : null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  return { received: true, event };
}
