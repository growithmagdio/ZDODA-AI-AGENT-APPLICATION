import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatCard, StatusPill, Badge } from '@zdoda/ui';
import { Building2, Users, DollarSign, PhoneCall, Search } from 'lucide-react';
import { DEMO_PLANS } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, fmt, timeAgo } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, SectionTitle } from '../../components/common/Page';

interface Overview {
  workspaces: number;
  users: number;
  plans: Record<string, number>;
  statuses: Record<string, number>;
  mrr: number;
  period: string;
  usage: { messages: number; voiceSeconds: number };
  voice: { livekit: boolean; telephony: boolean; phoneReady: boolean; recording: boolean; workerSecret: boolean };
}

/** Platform super-admin (SUPERADMIN users or SUPERADMIN_EMAILS). */
export const AdminPage: React.FC = () => {
  const [q, setQ] = useState('');
  const ov = useQuery({ queryKey: ['admin-overview'], queryFn: () => api.get<Overview>('/admin/overview'), retry: false });
  const list = useQuery({ queryKey: ['admin-workspaces', q], queryFn: () => api.get<{ items: any[] }>(`/admin/workspaces?q=${encodeURIComponent(q)}`), enabled: ov.isSuccess });
  const setPlan = useApiMutation(({ id, plan, status }: { id: string; plan: string; status: string }) => api.post(`/admin/workspaces/${id}/plan`, { plan, status }), {
    success: 'Workspace updated',
    onSuccess: () => list.refetch(),
  });
  const telephony = useApiMutation(() => api.post('/admin/telephony/setup'), { success: 'Telephony connected (Twilio ↔ LiveKit)', onSuccess: () => ov.refetch() });

  if (ov.isLoading) return <Page title="Admin"><LoadingBlock rows={4} /></Page>;
  if (ov.error || !ov.data) return <Page title="Admin"><ErrorBlock error={ov.error} /></Page>;
  const d = ov.data;
  return (
    <Page title="Platform admin" subtitle={`All customers · usage period ${d.period}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Workspaces" value={fmt(d.workspaces)} icon={<Building2 className="w-4 h-4" />} />
        <StatCard title="Users" value={fmt(d.users)} icon={<Users className="w-4 h-4" />} />
        <StatCard title="MRR (USD)" value={`$${fmt(Math.round(d.mrr))}`} icon={<DollarSign className="w-4 h-4" />} />
        <StatCard title="Voice minutes" value={fmt(Math.ceil(d.usage.voiceSeconds / 60))} icon={<PhoneCall className="w-4 h-4" />} />
      </div>
      <Card className="space-y-3">
        <SectionTitle title="Voice & telephony" />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['LiveKit', d.voice.livekit],
              ['Twilio', d.voice.telephony],
              ['Phone calls ready', d.voice.phoneReady],
              ['Recording', d.voice.recording],
              ['Voice worker secret', d.voice.workerSecret],
            ] as [string, boolean][]
          ).map(([l, ok]) => (
            <StatusPill key={l} status={ok ? 'live' : 'setup_required'} label={l} />
          ))}
        </div>
        {!d.voice.phoneReady && d.voice.livekit && d.voice.telephony && (
          <Button loading={telephony.isPending} onClick={() => telephony.mutate(undefined)}>
            Run one-time telephony setup
          </Button>
        )}
      </Card>
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[var(--separator)]">
          <p className="text-[15px] font-semibold text-[var(--ink)]">Workspaces</p>
          <div className="relative ml-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="h-9 pl-9 pr-3 rounded-[10px] bg-[var(--surface-2)] text-[13px] text-[var(--ink)]" aria-label="Search workspaces" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[12px] text-[var(--ink-3)] bg-[var(--surface-2)]">
              <tr>
                {['Workspace', 'Owner', 'Plan', 'Status', 'Messages', 'Voice min', 'Created'].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--separator)]">
              {list.data?.items.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-2.5 font-medium text-[var(--ink)]">
                    {w.name} {w.parentWorkspaceId && <Badge variant="outline">client</Badge>}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--ink-2)]">{w.ownerEmail}</td>
                  <td className="px-4 py-2.5">
                    <select aria-label={`Plan for ${w.name}`} value={w.billing.plan} onChange={(e) => setPlan.mutate({ id: w.id, plan: e.target.value, status: w.billing.status === 'expired' ? 'active' : w.billing.status })} className="h-8 px-2 rounded-[8px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[12px] text-[var(--ink)]">
                      {DEMO_PLANS.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select aria-label={`Status for ${w.name}`} value={w.billing.status === 'past_due' ? 'active' : w.billing.status} onChange={(e) => setPlan.mutate({ id: w.id, plan: w.billing.plan, status: e.target.value })} className="h-8 px-2 rounded-[8px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[12px] text-[var(--ink)]">
                      {['trialing', 'active', 'canceled', 'expired'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{fmt(w.messages)}</td>
                  <td className="px-4 py-2.5 tabular-nums">{Math.ceil(w.voiceSeconds / 60)}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-3)]">{timeAgo(w.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
};
