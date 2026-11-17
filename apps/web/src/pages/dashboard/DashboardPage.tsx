import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StatCard, Card, StatusPill, Button, Avatar } from '@zdoda/ui';
import { MessageSquare, Sparkles, Shield, UserRound, CheckCircle2, Circle, ArrowRight, Globe, MessageCircle, Phone } from 'lucide-react';
import type { ConversationDTO, WidgetDTO, AgentDTO } from '@zdoda/shared';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useSystemStatus, useWorkspace, wsKey, timeAgo, fmt } from '../../lib/hooks';
import { Page, SectionTitle, LoadingBlock } from '../../components/common/Page';
import { VolumeChart } from '../../components/common/VolumeChart';
import { useAnalytics, deltaProps } from '../analytics/AnalyticsPage';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: ws } = useWorkspace();
  const sys = useSystemStatus();
  const analytics = useAnalytics(30);
  const setup = useQuery({ queryKey: wsKey('setup'), queryFn: () => api.get<{ steps: { key: string; title: string; description: string; done: boolean; to: string }[]; completed: number }>('/workspaces/current/setup') });
  const recent = useQuery({ queryKey: wsKey('conversations', 'recent'), queryFn: () => api.get<{ items: ConversationDTO[] }>('/conversations'), refetchInterval: 15_000 });
  const widgets = useQuery({ queryKey: wsKey('widgets'), queryFn: () => api.get<{ items: WidgetDTO[] }>('/widgets') });
  const agents = useQuery({ queryKey: wsKey('agents'), queryFn: () => api.get<{ items: AgentDTO[] }>('/agents') });

  const k = analytics.data?.kpis;
  const widget = widgets.data?.items[0];
  const agent = agents.data?.items.find((a) => a.id === widget?.agentId);
  const webLive = Boolean(widget?.publishedVersion && agent?.status === 'published');
  const allDone = setup.data && setup.data.completed === setup.data.steps.length;

  return (
    <Page title={`Hi ${user?.name?.split(' ').find((w) => !w.endsWith('.')) || 'there'} 👋`} subtitle={`Here's how ${ws?.workspace.name || 'your workspace'} is doing over the last 30 days.`}>
      {sys.data && !sys.data.llm.live && (
        <Card variant="inset" className="flex flex-wrap items-center gap-3">
          <StatusPill status="demo" label="Demo AI" />
          <p className="text-[13px] text-[var(--ink-2)] flex-1 min-w-[240px]">
            No AI provider key is set on the server yet, so agents answer with the built-in demo model (it quotes your knowledge base). Add an Anthropic, OpenAI or Gemini key to get full answers.
          </p>
        </Card>
      )}

      {setup.data && !allDone && (
        <Card className="space-y-4">
          <SectionTitle title="Get your agent live" description={`${setup.data.completed} of ${setup.data.steps.length} done`} />
          <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full transition-all" style={{ width: `${(setup.data.completed / setup.data.steps.length) * 100}%` }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {setup.data.steps.map((s) => (
              <Link key={s.key} to={s.to} className={`p-3.5 rounded-[12px] border transition-colors ${s.done ? 'border-[var(--separator)] bg-[var(--surface-2)]' : 'border-[var(--separator)] hover:border-[var(--accent)]/50'}`}>
                <div className="flex items-center gap-2">
                  {s.done ? <CheckCircle2 className="w-4 h-4 text-[var(--success)]" /> : <Circle className="w-4 h-4 text-[var(--ink-3)]" />}
                  <p className={`text-[13px] font-semibold ${s.done ? 'text-[var(--ink-3)] line-through' : 'text-[var(--ink)]'}`}>{s.title}</p>
                </div>
                <p className="text-[12px] text-[var(--ink-3)] mt-1">{s.description}</p>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Conversations" value={k ? fmt(k.conversations.value) : '—'} {...(k ? deltaProps(k.conversations.delta) : {})} icon={<MessageSquare className="w-4 h-4" />} />
        <StatCard title="Leads captured" value={k ? fmt(k.leads.value) : '—'} {...(k ? deltaProps(k.leads.delta) : {})} icon={<Sparkles className="w-4 h-4" />} />
        <StatCard title="Resolved by AI" value={k ? `${k.aiResolution.value}%` : '—'} icon={<Shield className="w-4 h-4" />} />
        <StatCard title="Messages this month" value={ws ? `${fmt(ws.usage.messages)} / ${fmt(ws.usage.messageLimit)}` : '—'} icon={<UserRound className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <SectionTitle title="Conversations per day" description="Last 30 days" right={<Button size="sm" variant="ghost" onClick={() => navigate('/analytics')}>Details</Button>} />
          {analytics.data ? <VolumeChart data={analytics.data.series} height={240} /> : <LoadingBlock rows={3} />}
        </Card>
        <Card className="space-y-3">
          <SectionTitle title="Channels" />
          <ChannelRow icon={<Globe className="w-4 h-4" />} name="Website chat" detail={agent?.name || '—'} status={webLive ? 'live' : 'setup_required'} label={webLive ? 'Live' : 'Not live'} to="/channels" />
          <ChannelRow icon={<MessageCircle className="w-4 h-4" />} name="WhatsApp" detail="Coming soon" status="coming_soon" to="/channels" />
          <ChannelRow icon={<Phone className="w-4 h-4" />} name="Voice AI" detail="Coming soon" status="coming_soon" to="/channels" />
        </Card>
      </div>

      <Card className="space-y-2">
        <SectionTitle title="Recent conversations" right={<Button size="sm" variant="ghost" icon={<ArrowRight className="w-4 h-4" />} onClick={() => navigate('/inbox')}>Open inbox</Button>} />
        {recent.isLoading ? (
          <LoadingBlock rows={3} />
        ) : !recent.data?.items.length ? (
          <p className="text-[13px] text-[var(--ink-3)] py-4">No conversations yet. Publish your widget and add it to your website to start receiving chats.</p>
        ) : (
          <div className="divide-y divide-[var(--separator)]">
            {recent.data.items.slice(0, 6).map((c) => {
              const name = c.contact?.name || c.contact?.email || `Visitor ${c.id.slice(0, 4).toUpperCase()}`;
              return (
                <Link to="/inbox" key={c.id} className="py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] -mx-2 px-2 rounded-lg">
                  <Avatar name={name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[var(--ink)]">{name}</p>
                    <p className="text-[13px] text-[var(--ink-2)] truncate">{c.lastMessage}</p>
                  </div>
                  {c.status === 'handoff' && <StatusPill status="test_mode" label="Needs human" />}
                  <span className="text-[11px] text-[var(--ink-3)] shrink-0">{timeAgo(c.lastMessageAt)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </Page>
  );
};

const ChannelRow: React.FC<{ icon: React.ReactNode; name: string; detail: string; status: 'live' | 'setup_required' | 'coming_soon'; label?: string; to: string }> = ({ icon, name, detail, status, label, to }) => (
  <Link to={to} className="p-3 rounded-[12px] bg-[var(--surface-2)] border border-[var(--separator)] flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] text-[var(--accent-ink)] flex items-center justify-center">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-[var(--ink)]">{name}</p>
      <p className="text-[11px] text-[var(--ink-3)] truncate">{detail}</p>
    </div>
    <StatusPill status={status} label={label} />
  </Link>
);
