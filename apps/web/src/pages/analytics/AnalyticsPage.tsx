import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, SegmentedControl, StatCard } from '@zdoda/ui';
import { MessageSquare, Sparkles, Shield, UserRound, MessagesSquare } from 'lucide-react';
import { api } from '../../lib/api';
import { wsKey, fmt } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, SectionTitle } from '../../components/common/Page';
import { VolumeChart } from '../../components/common/VolumeChart';

export interface AnalyticsSummary {
  days: number;
  kpis: Record<'conversations' | 'messages' | 'leads' | 'aiResolution' | 'handoffs', { value: number; delta: number }>;
  series: { date: string; web: number; whatsapp: number; voice: number; total: number }[];
  topQuestions: { text: string; count: number }[];
  agents: { agentId: string; name: string; conversations: number; handoffs: number }[];
}

export const useAnalytics = (days: number) => useQuery({ queryKey: wsKey('analytics', days), queryFn: () => api.get<AnalyticsSummary>(`/analytics/summary?days=${days}`), refetchInterval: 60_000 });

export const deltaProps = (d: number, invert = false) => ({
  delta: `${d > 0 ? '+' : ''}${d}%`,
  deltaType: (d === 0 ? 'neutral' : (d > 0) !== invert ? 'positive' : 'negative') as 'positive' | 'negative' | 'neutral',
});

export const AnalyticsPage: React.FC = () => {
  const [days, setDays] = useState('30');
  const q = useAnalytics(Number(days));
  const d = q.data;
  return (
    <Page
      title="Analytics"
      subtitle="How your agents are performing. Compared with the previous period of the same length."
      action={<SegmentedControl value={days} onChange={setDays} items={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }]} />}
    >
      {q.isLoading ? (
        <LoadingBlock rows={4} />
      ) : q.error || !d ? (
        <ErrorBlock error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Conversations" value={fmt(d.kpis.conversations.value)} {...deltaProps(d.kpis.conversations.delta)} icon={<MessageSquare className="w-4 h-4" />} />
            <StatCard title="Messages" value={fmt(d.kpis.messages.value)} {...deltaProps(d.kpis.messages.delta)} icon={<MessagesSquare className="w-4 h-4" />} />
            <StatCard title="Leads captured" value={fmt(d.kpis.leads.value)} {...deltaProps(d.kpis.leads.delta)} icon={<Sparkles className="w-4 h-4" />} />
            <StatCard title="Resolved by AI" value={`${d.kpis.aiResolution.value}%`} delta={`${d.kpis.aiResolution.delta > 0 ? '+' : ''}${d.kpis.aiResolution.delta} pts`} deltaType={d.kpis.aiResolution.delta >= 0 ? 'positive' : 'negative'} icon={<Shield className="w-4 h-4" />} />
            <StatCard title="Handed to humans" value={fmt(d.kpis.handoffs.value)} {...deltaProps(d.kpis.handoffs.delta, true)} icon={<UserRound className="w-4 h-4" />} />
          </div>
          <Card className="space-y-4">
            <SectionTitle title="Conversations per day" description="Website chat (WhatsApp and voice appear here when connected)" />
            <VolumeChart data={d.series} />
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="space-y-3">
              <SectionTitle title="What people ask first" description="Most common opening messages" />
              {!d.topQuestions.length ? (
                <p className="text-[13px] text-[var(--ink-3)]">No conversations in this period.</p>
              ) : (
                <ol className="divide-y divide-[var(--separator)]">
                  {d.topQuestions.map((t, i) => (
                    <li key={i} className="flex items-center gap-3 py-2.5">
                      <span className="w-6 text-[12px] font-semibold text-[var(--ink-3)] tabular-nums">{i + 1}</span>
                      <p className="flex-1 text-[14px] text-[var(--ink)] truncate">{t.text}</p>
                      <span className="text-[13px] font-semibold text-[var(--ink-2)] tabular-nums">{t.count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
            <Card className="space-y-3">
              <SectionTitle title="Agents" />
              {!d.agents.length ? (
                <p className="text-[13px] text-[var(--ink-3)]">No agent activity in this period.</p>
              ) : (
                <table className="w-full text-[13px]">
                  <thead className="text-left text-[12px] text-[var(--ink-3)]">
                    <tr>
                      <th className="py-2 font-semibold">Agent</th>
                      <th className="py-2 font-semibold text-right">Conversations</th>
                      <th className="py-2 font-semibold text-right">Resolved by AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--separator)]">
                    {d.agents.map((a) => (
                      <tr key={a.agentId}>
                        <td className="py-2.5 font-medium text-[var(--ink)]">{a.name}</td>
                        <td className="py-2.5 text-right tabular-nums text-[var(--ink-2)]">{fmt(a.conversations)}</td>
                        <td className="py-2.5 text-right tabular-nums text-[var(--ink-2)]">{a.conversations ? Math.round(((a.conversations - a.handoffs) / a.conversations) * 100) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </>
      )}
    </Page>
  );
};
