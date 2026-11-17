import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, SegmentedControl, StatusPill, Badge } from '@zdoda/ui';
import { Check, CreditCard, ExternalLink } from 'lucide-react';
import type { BillingDTO, PlanQuota, UsageDTO } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, wsKey, fmt } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, SectionTitle } from '../../components/common/Page';
import { useToast } from '../../context/ToastContext';

type Resp = { billing: BillingDTO; usage: UsageDTO; plans: (PlanQuota & { purchasable: boolean })[] };

const STATUS: Record<BillingDTO['status'], { pill: 'live' | 'test_mode' | 'setup_required' | 'demo'; label: string }> = {
  active: { pill: 'live', label: 'Active' },
  trialing: { pill: 'test_mode', label: 'Free trial' },
  past_due: { pill: 'setup_required', label: 'Payment failed' },
  canceled: { pill: 'setup_required', label: 'Canceled' },
  expired: { pill: 'setup_required', label: 'Trial ended' },
};

export const BillingPage: React.FC = () => {
  const can = useCan();
  const toast = useToast();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const q = useQuery({ queryKey: wsKey('billing'), queryFn: () => api.get<Resp>('/billing') });
  const manage = can('manage_billing', 'Billing');
  const mockPlan = params.get('mock_checkout');

  useEffect(() => {
    const c = params.get('checkout');
    if (c === 'success') toast('Payment received — your plan is updating', { description: 'It can take a few seconds for Stripe to confirm.' });
    if (c === 'cancelled') toast('Checkout cancelled', { type: 'info' });
    if (c) {
      params.delete('checkout');
      setParams(params, { replace: true });
      setTimeout(() => qc.invalidateQueries(), 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkout = useApiMutation((plan: string) => api.post<{ url: string }>('/billing/checkout', { plan, interval }), { onSuccess: (out) => window.location.assign(out.url) });
  const portal = useApiMutation(() => api.post<{ url: string }>('/billing/portal'), { onSuccess: (out) => window.location.assign(out.url) });
  const activate = useApiMutation((plan: string) => api.post('/billing/mock/activate', { plan, interval: params.get('interval') || interval }), {
    success: 'Plan activated (demo billing)',
    invalidate: [['billing'], ['workspace'], ['setup']],
    onSuccess: () => setParams({}, { replace: true }),
  });

  if (q.isLoading) return <Page title="Billing"><LoadingBlock rows={4} /></Page>;
  if (q.error || !q.data) return <Page title="Billing"><ErrorBlock error={q.error} onRetry={() => q.refetch()} /></Page>;
  const { billing, usage, plans } = q.data;
  const current = plans.find((p) => p.slug === billing.plan)!;
  const pct = Math.min(100, Math.round((usage.messages / Math.max(usage.messageLimit, 1)) * 100));
  const st = STATUS[billing.status];

  return (
    <Page title="Billing & plan" subtitle="Monthly subscription. Change or cancel any time.">
      {!billing.stripeConfigured && (
        <Card variant="inset" className="flex flex-wrap items-center gap-3">
          <StatusPill status="demo" label="Demo billing" />
          <p className="text-[13px] text-[var(--ink-2)] flex-1 min-w-[240px]">Stripe isn't connected yet, so plan changes are simulated and no card is charged. Add your Stripe keys on the server to take real payments.</p>
        </Card>
      )}
      {mockPlan && manage && (
        <Card className="flex flex-wrap items-center gap-4 border-[var(--accent)]/40">
          <CreditCard className="w-6 h-6 text-[var(--accent)]" />
          <div className="flex-1 min-w-[220px]">
            <p className="text-[15px] font-semibold text-[var(--ink)]">Demo checkout · {plans.find((p) => p.slug === mockPlan)?.name} plan</p>
            <p className="text-[13px] text-[var(--ink-3)]">This simulates a successful payment. No money moves.</p>
          </div>
          <Button variant="ghost" onClick={() => setParams({}, { replace: true })}>
            Cancel
          </Button>
          <Button loading={activate.isPending} onClick={() => activate.mutate(mockPlan)}>
            Activate plan
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <SectionTitle title="Current plan" right={<StatusPill status={st.pill} label={st.label} size="md" />} />
          <div>
            <p className="text-[28px] font-bold text-[var(--ink)] tracking-tight">{current.name}</p>
            <p className="text-[13px] text-[var(--ink-3)]">
              {billing.status === 'trialing' && billing.trialEndsAt && `Trial ends ${new Date(billing.trialEndsAt).toLocaleDateString()}`}
              {billing.status === 'active' && billing.currentPeriodEnd && `${billing.cancelAtPeriodEnd ? 'Ends' : 'Renews'} ${new Date(billing.currentPeriodEnd).toLocaleDateString()} · billed ${billing.interval}ly`}
              {billing.status === 'expired' && 'Your agents stop answering until you choose a plan.'}
              {billing.status === 'past_due' && 'Update your card to keep your agents live.'}
            </p>
          </div>
          {manage && billing.provider === 'stripe' && billing.stripeConfigured && (
            <Button variant="outline" icon={<ExternalLink className="w-4 h-4" />} loading={portal.isPending} onClick={() => portal.mutate()}>
              Manage payment & invoices
            </Button>
          )}
        </Card>
        <Card className="space-y-4">
          <SectionTitle title="Usage this month" description={`Resets on the 1st · period ${usage.period}`} />
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--ink-2)]">AI replies</span>
              <span className="font-semibold text-[var(--ink)] tabular-nums">
                {fmt(usage.messages)} / {fmt(usage.messageLimit)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full ${pct >= 90 ? 'bg-[var(--danger)]' : pct >= 75 ? 'bg-[var(--warning)]' : 'bg-[var(--accent)]'}`} style={{ width: `${pct}%` }} />
            </div>
            {pct >= 90 && <p className="text-[12px] text-[var(--danger)]">You're close to your limit. When it's reached, chats go to your inbox for a human reply.</p>}
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[var(--ink-2)]">Agents</span>
            <span className="font-semibold text-[var(--ink)] tabular-nums">
              {usage.agents} / {usage.agentLimit > 9999 ? 'Unlimited' : usage.agentLimit}
            </span>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <SectionTitle title="Plans" />
        <SegmentedControl value={interval} onChange={setInterval} items={[{ value: 'month', label: 'Monthly' }, { value: 'year', label: 'Yearly · save ~20%' }]} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((p) => {
          const isCurrent = p.slug === billing.plan && billing.status === 'active';
          const price = interval === 'month' ? p.priceMonthlyCents / 100 : p.priceYearlyCents / 1200;
          return (
            <Card key={p.slug} className={`flex flex-col gap-4 ${p.slug === 'pro' ? 'border-[var(--accent)]/50' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="text-[17px] font-bold text-[var(--ink)]">{p.name}</p>
                {p.slug === 'pro' && <Badge variant="accent">Popular</Badge>}
              </div>
              <p className="text-[28px] font-bold text-[var(--ink)] tracking-tight">
                {p.showPrice ? (
                  <>
                    ${Math.round(price)}
                    <span className="text-[13px] font-medium text-[var(--ink-3)]">/mo</span>
                  </>
                ) : (
                  'Custom'
                )}
              </p>
              <ul className="space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] text-[var(--ink-2)]">
                    <Check className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {p.slug === 'agency' ? (
                <Button variant="outline" onClick={() => window.open('mailto:sales@zdoda.app?subject=Zdoda%20Agency%20plan')}>
                  Contact sales
                </Button>
              ) : isCurrent ? (
                <Button variant="secondary" disabled>
                  Current plan
                </Button>
              ) : (
                <Button variant={p.slug === 'pro' ? 'primary' : 'outline'} disabled={!manage || !p.purchasable} loading={checkout.isPending && checkout.variables === p.slug} onClick={() => (billing.provider === 'stripe' && billing.status === 'active' ? portal.mutate() : checkout.mutate(p.slug))} title={!manage ? 'Only the workspace owner can change the plan' : undefined}>
                  {billing.status === 'active' ? 'Switch plan' : 'Choose plan'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </Page>
  );
};
