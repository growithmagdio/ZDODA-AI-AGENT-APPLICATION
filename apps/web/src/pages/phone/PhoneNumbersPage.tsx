import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatusPill, Sheet, TextField, Select, EmptyState } from '@zdoda/ui';
import { Phone, Plus, Search, Trash2, PhoneOutgoing } from 'lucide-react';
import type { AgentDTO, PhoneNumberDTO } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, useWorkspace, wsKey } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock } from '../../components/common/Page';

type Status = { livekit: boolean; telephony: boolean; phoneReady: boolean };
const COUNTRIES = [
  ['US', 'United States'],
  ['CA', 'Canada'],
  ['GB', 'United Kingdom'],
  ['AU', 'Australia'],
  ['AE', 'United Arab Emirates'],
  ['IN', 'India'],
  ['DE', 'Germany'],
  ['FR', 'France'],
  ['NL', 'Netherlands'],
  ['SG', 'Singapore'],
];

export const PhoneNumbersPage: React.FC = () => {
  const can = useCan();
  const { data: ws } = useWorkspace();
  const q = useQuery({ queryKey: wsKey('phone-numbers'), queryFn: () => api.get<{ items: PhoneNumberDTO[]; status: Status }>('/phone-numbers') });
  const agents = useQuery({ queryKey: wsKey('agents'), queryFn: () => api.get<{ items: AgentDTO[] }>('/agents') });
  const [buying, setBuying] = useState(false);
  const [calling, setCalling] = useState<string | null>(null);
  const assign = useApiMutation(({ id, agentId }: { id: string; agentId: string }) => api.patch(`/phone-numbers/${encodeURIComponent(id)}`, { agentId }), { success: 'Number updated', invalidate: [['phone-numbers']] });
  const release = useApiMutation((id: string) => api.del(`/phone-numbers/${encodeURIComponent(id)}`), { success: 'Number released', invalidate: [['phone-numbers'], ['workspace']] });

  const st = q.data?.status;
  const items = q.data?.items || [];
  const limit = ws?.usage.numberLimit ?? 0;
  const agentName = (id: string | null) => agents.data?.items.find((a) => a.id === id)?.name || '—';

  return (
    <Page
      title="Phone Numbers"
      subtitle="Give your agent a phone number. Calls are answered 24/7 by the Zdoda Voice Engine."
      action={
        can('create', 'Channel') && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setBuying(true)} disabled={!st?.phoneReady || items.length >= limit} title={items.length >= limit ? 'Upgrade your plan for more numbers' : undefined}>
            Get a number
          </Button>
        )
      }
    >
      {st && !st.phoneReady && (
        <Card variant="inset" className="flex flex-wrap items-center gap-3">
          <StatusPill status="setup_required" />
          <p className="text-[13px] text-[var(--ink-2)] flex-1 min-w-[240px]">
            {!st.livekit ? 'The voice engine (LiveKit) is not connected yet.' : !st.telephony ? 'Twilio is not connected yet.' : 'An admin needs to run the one-time telephony setup (Admin → Telephony).'} Browser voice calls work once LiveKit is connected.
          </p>
        </Card>
      )}
      <p className="text-[13px] text-[var(--ink-3)]">
        Using {items.length} of {limit} numbers on your plan · {ws?.usage.voiceMinutes ?? 0} / {ws?.usage.voiceMinuteLimit ?? 0} voice minutes this month
      </p>
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock error={q.error} onRetry={() => q.refetch()} />
      ) : !items.length ? (
        <EmptyState icon={<Phone className="w-8 h-8" />} title="No phone numbers yet" description={limit ? 'Get a local number in seconds and connect it to an agent.' : 'Phone numbers are included from the Pro plan.'} />
      ) : (
        <Card className="p-0 overflow-hidden">
          <ul className="divide-y divide-[var(--separator)]">
            {items.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-tint)] text-[var(--accent-ink)] flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-[15px] font-semibold text-[var(--ink)] tabular-nums">{n.friendlyName || n.number}</p>
                  <p className="text-[12px] text-[var(--ink-3)]">
                    {n.country} · answers with {agentName(n.agentId)}
                  </p>
                </div>
                <StatusPill status="live" label="Active" />
                {can('update', 'Channel') && (
                  <select
                    aria-label={`Agent for ${n.number}`}
                    value={n.agentId || ''}
                    onChange={(e) => assign.mutate({ id: n.id, agentId: e.target.value })}
                    className="h-9 px-2 rounded-[10px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[13px] text-[var(--ink)]"
                  >
                    {agents.data?.items.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
                {can('create', 'Inbox') && (
                  <Button size="sm" variant="outline" icon={<PhoneOutgoing className="w-3.5 h-3.5" />} onClick={() => setCalling(n.number)}>
                    Call someone
                  </Button>
                )}
                {can('delete', 'Channel') && (
                  <button aria-label={`Release ${n.number}`} className="p-2 rounded-lg text-[var(--ink-3)] hover:text-[var(--danger)]" onClick={() => window.confirm(`Release ${n.number}? You may not get the same number back.`) && release.mutate(n.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <BuySheet open={buying} onClose={() => setBuying(false)} agents={agents.data?.items || []} />
      <OutboundSheet from={calling} onClose={() => setCalling(null)} agents={agents.data?.items || []} />
    </Page>
  );
};

const BuySheet: React.FC<{ open: boolean; onClose: () => void; agents: AgentDTO[] }> = ({ open, onClose, agents }) => {
  const [country, setCountry] = useState('US');
  const [areaCode, setAreaCode] = useState('');
  const [agentId, setAgentId] = useState('');
  const search = useApiMutation(() => api.get<{ items: { number: string; friendlyName: string; locality: string }[] }>(`/phone-numbers/search?country=${country}${areaCode ? `&areaCode=${encodeURIComponent(areaCode)}` : ''}`));
  const buy = useApiMutation((number: string) => api.post('/phone-numbers', { number, agentId: agentId || agents[0]?.id, country }), {
    success: (out: any) => `${out.number} is live`,
    invalidate: [['phone-numbers'], ['workspace']],
    onSuccess: onClose,
  });
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="Get a phone number" description="Local numbers cost about $1–2 a month and are included in your plan's number allowance.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Country" value={country} onChange={(e) => setCountry(e.target.value)} options={COUNTRIES.map(([v, l]) => ({ value: v, label: l }))} />
          <TextField label="Area code (optional)" value={areaCode} onChange={(e) => setAreaCode(e.target.value)} placeholder="415" />
        </div>
        <Select label="Answers with" value={agentId || agents[0]?.id || ''} onChange={(e) => setAgentId(e.target.value)} options={agents.map((a) => ({ value: a.id, label: a.name }))} />
        <Button variant="outline" icon={<Search className="w-4 h-4" />} loading={search.isPending} onClick={() => search.mutate(undefined)}>
          Search numbers
        </Button>
        {search.data && (
          <ul className="divide-y divide-[var(--separator)] border border-[var(--separator)] rounded-[12px]">
            {!search.data.items.length && <li className="p-3 text-[13px] text-[var(--ink-3)]">No numbers found. Try another area code. Some countries need address documents first.</li>}
            {search.data.items.map((n) => (
              <li key={n.number} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--ink)] tabular-nums">{n.friendlyName}</p>
                  <p className="text-[12px] text-[var(--ink-3)]">{n.locality || country}</p>
                </div>
                <Button size="sm" loading={buy.isPending && buy.variables === n.number} onClick={() => buy.mutate(n.number)}>
                  Buy
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
};

const OutboundSheet: React.FC<{ from: string | null; onClose: () => void; agents: AgentDTO[] }> = ({ from, onClose, agents }) => {
  const [to, setTo] = useState('');
  const [agentId, setAgentId] = useState('');
  const [consent, setConsent] = useState(false);
  const call = useApiMutation(() => api.post('/calls/outbound', { agentId: agentId || agents[0]?.id, to: to.replace(/[^\d+]/g, ''), fromNumber: from }), {
    success: 'Calling now — the call will appear in the Inbox',
    invalidate: [['conversations']],
    onSuccess: onClose,
  });
  return (
    <Sheet
      open={Boolean(from)}
      onOpenChange={(o) => !o && onClose()}
      title="Have the agent call someone"
      description={`From ${from}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={call.isPending} disabled={!/^\+\d{8,15}$/.test(to.replace(/[^\d+]/g, '')) || !consent} onClick={() => call.mutate(undefined)}>
            Call now
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <TextField label="Phone number" value={to} onChange={(e) => setTo(e.target.value)} placeholder="+15550102020" hint="International format with + and country code" />
        <Select label="Agent" value={agentId || agents[0]?.id || ''} onChange={(e) => setAgentId(e.target.value)} options={agents.map((a) => ({ value: a.id, label: a.name }))} />
        <label className="flex items-start gap-2 text-[13px] text-[var(--ink-2)]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" /> This person agreed to receive a call from us (required by calling laws like TCPA and GDPR).
        </label>
      </div>
    </Sheet>
  );
};
