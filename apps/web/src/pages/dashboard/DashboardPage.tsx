import React from 'react';
import { LargeTitleHeader, StatCard, Card, StatusPill, Button } from '@zdoda/ui';
import { MessageSquare, CalendarCheck, Sparkles, Shield, Radio, Bot, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { activeWorkspace } = useAuth();

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      {/* Large Title Header */}
      <LargeTitleHeader
        title="Dashboard"
        subtitle={`Real-time omnichannel AI agent performance for ${activeWorkspace?.name || 'Smile Dental Clinic'}.`}
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => window.dispatchEvent(new CustomEvent('zdoda:open-onboarding'))}
          >
            Setup Checklist
          </Button>
        }
      />

      {/* Row 1: KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Conversations"
          value="2,842"
          delta="+12.4%"
          isDemo={true}
          icon={<MessageSquare className="w-4 h-4" />}
        />
        <StatCard
          title="Appointments Booked"
          value="348"
          delta="+8.1%"
          isDemo={true}
          icon={<CalendarCheck className="w-4 h-4" />}
        />
        <StatCard
          title="Qualified Leads"
          value="182"
          delta="+15.3%"
          isDemo={true}
          icon={<Sparkles className="w-4 h-4" />}
        />
        <StatCard
          title="Resolution Rate"
          value="91.2%"
          delta="+2.0%"
          isDemo={true}
          icon={<Shield className="w-4 h-4" />}
        />
      </div>

      {/* Row 2: Grid with Volume Breakdown & Active Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Conversation Volume Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[17px] font-bold text-[var(--ink)] tracking-tight">
                Conversation Volume by Channel
              </h3>
              <p className="text-[13px] text-[var(--ink-3)]">Last 30 days omnichannel traffic</p>
            </div>
            <StatusPill status="demo" label="Demo Data" />
          </div>

          <div className="h-64 flex flex-col items-center justify-center rounded-[12px] bg-[var(--surface-2)] border border-[var(--separator)]/60 text-center p-6 space-y-3">
            <Radio className="w-10 h-10 text-[var(--accent)] animate-pulse" />
            <p className="text-[15px] font-semibold text-[var(--ink)]">
              Interactive Recharts Breakdown
            </p>
            <p className="text-[13px] text-[var(--ink-3)] max-w-sm">
              Stacked bar chart tracking Web Chat, WhatsApp, and Voice inbound call volume (Connecting live in Phase 2).
            </p>
          </div>
        </Card>

        {/* Right Column: Active Channels */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-bold text-[var(--ink)] tracking-tight">
              Active Channels
            </h3>
            <span className="text-[12px] text-[var(--ink-3)] font-medium">3 configured</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--separator)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] text-[var(--accent-ink)] flex items-center justify-center font-bold">
                  W
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--ink)]">Website Widget</p>
                  <p className="text-[11px] text-[var(--ink-3)]">Dental Assistant</p>
                </div>
              </div>
              <StatusPill status="live" />
            </div>

            <div className="p-3.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--separator)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  WA
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--ink)]">WhatsApp Business</p>
                  <p className="text-[11px] text-[var(--ink-3)]">+1 (555) 019-9281</p>
                </div>
              </div>
              <StatusPill status="test_mode" />
            </div>

            <div className="p-3.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--separator)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  V
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--ink)]">Inbound Voice AI</p>
                  <p className="text-[11px] text-[var(--ink-3)]">Clinic Phone System</p>
                </div>
              </div>
              <StatusPill status="demo" />
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Recent Activity Feed */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-[var(--ink)] tracking-tight">
            Recent Conversations & Inquiries
          </h3>
          <span className="text-[12px] text-[var(--ink-3)]">Live syncing</span>
        </div>

        <div className="divide-y divide-[var(--separator)]">
          {[
            { name: 'Sarah M.', channel: 'Website Chat', query: 'I would like to book a dental checkup and teeth cleaning next Tuesday.', time: '5m ago' },
            { name: 'John D.', channel: 'WhatsApp', query: 'What is the price for porcelain dental veneers?', time: '22m ago' },
            { name: 'Priya S.', channel: 'Website Chat', query: 'Can I reschedule my root canal follow-up appointment?', time: '1h ago' },
            { name: 'Mike R.', channel: 'Inbound Call', query: 'Do you accept Delta Dental insurance plans?', time: '3h ago' },
          ].map((item, idx) => (
            <div key={idx} className="py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--surface-inset)] flex items-center justify-center text-[12px] font-bold text-[var(--ink)] shrink-0 mt-0.5">
                  {item.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[var(--ink)]">{item.name}</p>
                    <span className="text-[11px] text-[var(--ink-3)]">• {item.channel}</span>
                  </div>
                  <p className="text-[13px] text-[var(--ink-2)] truncate mt-0.5">{item.query}</p>
                </div>
              </div>
              <span className="text-[11px] text-[var(--ink-3)] shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
