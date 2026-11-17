import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatusPill, Sheet, TextField, Select, EmptyState, Badge } from '@zdoda/ui';
import { Megaphone, Plus, Play, Pause, Trash2, Upload } from 'lucide-react';
import type { AgentDTO, CampaignDTO, PhoneNumberDTO } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, wsKey, timeAgo } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, TextArea } from '../../components/common/Page';

const STATUS: Record<CampaignDTO['status'], ['live' | 'test_mode' | 'setup_required' | 'demo', string]> = {
  draft: ['setup_required', 'Draft'],
  running: ['live', 'Running'],
  paused: ['test_mode', 'Paused'],
  completed: ['demo', 'Completed'],
};

export const CampaignsPage: React.FC = () => {
  const can = useCan();
  const q = useQuery({ queryKey: wsKey('campaigns'), queryFn: () => api.get<{ items: CampaignDTO[]; allowed: boolean }>('/campaigns'), refetchInterval: 8000 });
  const [creating, setCreating] = useState(false);
  const [contactsFor, setContactsFor] = useState<string | null>(null);
  const action = useApiMutation(({ id, a }: { id: string; a: 'start' | 'pause' }) => api.post(`/campaigns/${id}/${a}`), { invalidate: [['campaigns']] });
  const remove = useApiMutation((id: string) => api.del(`/campaigns/${id}`), { success: 'Campaign deleted', invalidate: [['campaigns']] });

  return (
    <Page
      title="Outbound Campaigns"
      subtitle="Your agent calls a list of contacts — reminders, follow-ups, lead qualification — within the hours you set."
      action={can('create', 'Inbox') && q.data?.allowed && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreating(true)}>New campaign</Button>}
    >
      {q.data && !q.data.allowed && (
        <Card variant="inset">
          <p className="text-[13px] text-[var(--ink-2)]">Outbound campaigns are included from the Business plan.</p>
        </Card>
      )}
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.items.length ? (
        <EmptyState icon={<Megaphone className="w-8 h-8" />} title="No campaigns yet" description="Create a campaign, upload a CSV of contacts who agreed to be called, then press Start." />
      ) : (
        <div className="space-y-3">
          {q.data.items.map((c) => {
            const done = c.stats.completed + c.stats.failed + c.stats.noAnswer;
            const pct = c.stats.total ? Math.round((done / c.stats.total) * 100) : 0;
            return (
              <Card key={c.id} className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[16px] font-semibold text-[var(--ink)]">{c.name}</p>
                  <StatusPill status={STATUS[c.status][0]} label={STATUS[c.status][1]} />
                  <span className="text-[12px] text-[var(--ink-3)]">
                    From {c.fromNumber} · {c.windowStart}–{c.windowEnd} {c.timezone} · created {timeAgo(c.createdAt)}
                  </span>
                  <div className="ml-auto flex gap-2">
                    {can('update', 'Inbox') && (
                      <Button size="sm" variant="outline" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setContactsFor(c.id)}>
                        Add contacts
                      </Button>
                    )}
                    {can('update', 'Inbox') &&
                      (c.status === 'running' ? (
                        <Button size="sm" variant="outline" icon={<Pause className="w-3.5 h-3.5" />} onClick={() => action.mutate({ id: c.id, a: 'pause' })}>
                          Pause
                        </Button>
                      ) : (
                        c.status !== 'completed' && (
                          <Button size="sm" icon={<Play className="w-3.5 h-3.5" />} disabled={!c.stats.pending} onClick={() => action.mutate({ id: c.id, a: 'start' })}>
                            Start
                          </Button>
                        )
                      ))}
                    {can('delete', 'Inbox') && (
                      <button aria-label="Delete campaign" className="p-2 text-[var(--ink-3)] hover:text-[var(--danger)]" onClick={() => window.confirm(`Delete “${c.name}” and its contact list?`) && remove.mutate(c.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex flex-wrap gap-2 text-[12px]">
                  <Badge variant="outline">{c.stats.total} contacts</Badge>
                  <Badge variant="outline">{c.stats.pending} waiting</Badge>
                  <Badge variant="outline">{c.stats.calling} calling</Badge>
                  <Badge variant="outline">{c.stats.completed} completed</Badge>
                  <Badge variant="outline">{c.stats.noAnswer} no answer</Badge>
                  <Badge variant="outline">{c.stats.failed} failed</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <CreateSheet open={creating} onClose={() => setCreating(false)} />
      <ContactsSheet id={contactsFor} onClose={() => setContactsFor(null)} />
    </Page>
  );
};

const CreateSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const agents = useQuery({ queryKey: wsKey('agents'), queryFn: () => api.get<{ items: AgentDTO[] }>('/agents'), enabled: open });
  const numbers = useQuery({ queryKey: wsKey('phone-numbers'), queryFn: () => api.get<{ items: PhoneNumberDTO[] }>('/phone-numbers'), enabled: open });
  const [f, setF] = useState({ name: '', agentId: '', fromNumber: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, windowStart: '09:00', windowEnd: '18:00', maxConcurrent: 2, maxAttempts: 1, consentConfirmed: false });
  const create = useApiMutation(
    () => api.post('/campaigns', { ...f, agentId: f.agentId || agents.data?.items[0]?.id, fromNumber: f.fromNumber || numbers.data?.items[0]?.number, consentConfirmed: f.consentConfirmed || undefined }),
    { success: 'Campaign created — now add contacts', invalidate: [['campaigns']], onSuccess: onClose }
  );
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="New campaign"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={create.isPending} disabled={f.name.trim().length < 2 || !f.consentConfirmed || !numbers.data?.items.length} onClick={() => create.mutate(undefined)}>
            Create
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <TextField label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Appointment reminders — March" />
        <Select label="Agent" value={f.agentId || agents.data?.items[0]?.id || ''} onChange={(e) => setF({ ...f, agentId: e.target.value })} options={(agents.data?.items || []).map((a) => ({ value: a.id, label: a.name }))} />
        <Select label="Call from" value={f.fromNumber || numbers.data?.items[0]?.number || ''} onChange={(e) => setF({ ...f, fromNumber: e.target.value })} options={(numbers.data?.items || []).map((n) => ({ value: n.number, label: n.friendlyName || n.number }))} />
        {!numbers.data?.items.length && <p className="text-[12px] text-[var(--danger)]">Get a phone number first (Phone Numbers).</p>}
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Calls from" type="time" value={f.windowStart} onChange={(e) => setF({ ...f, windowStart: e.target.value })} />
          <TextField label="Until" type="time" value={f.windowEnd} onChange={(e) => setF({ ...f, windowEnd: e.target.value })} />
          <TextField label="Time zone" value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Calls at the same time" type="number" min={1} max={10} value={f.maxConcurrent} onChange={(e) => setF({ ...f, maxConcurrent: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })} />
          <TextField label="Attempts per contact" type="number" min={1} max={3} value={f.maxAttempts} onChange={(e) => setF({ ...f, maxAttempts: Math.max(1, Math.min(3, Number(e.target.value) || 1)) })} />
        </div>
        <label className="flex items-start gap-2 text-[13px] text-[var(--ink-2)]">
          <input type="checkbox" checked={f.consentConfirmed} onChange={(e) => setF({ ...f, consentConfirmed: e.target.checked })} className="mt-0.5" />
          Everyone on my list agreed to be called by us. I'm responsible for following calling laws (TCPA, GDPR, TRAI/DLT and local rules).
        </label>
      </div>
    </Sheet>
  );
};

const ContactsSheet: React.FC<{ id: string | null; onClose: () => void }> = ({ id, onClose }) => {
  const [csv, setCsv] = useState('');
  const upload = useApiMutation(() => api.post<{ added: number; skipped: number }>(`/campaigns/${id}/contacts`, { csv }), {
    success: (o) => `Added ${o.added} contacts${o.skipped ? ` · ${o.skipped} skipped (bad or duplicate numbers)` : ''}`,
    invalidate: [['campaigns']],
    onSuccess: () => {
      setCsv('');
      onClose();
    },
  });
  return (
    <Sheet
      open={Boolean(id)}
      onOpenChange={(o) => !o && onClose()}
      title="Add contacts"
      description="CSV with a header row. Required: phone (+countrycode). Optional: name and any other columns — the agent can use them as {{variables}}."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={upload.isPending} disabled={csv.trim().length < 5} onClick={() => upload.mutate(undefined)}>
            Import
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setCsv(await f.text());
          }}
          className="text-[13px]"
        />
        <TextArea rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={'name,phone,appointment\nSarah,+15550102020,Tuesday 3pm'} className="font-mono text-[12px]" />
      </div>
    </Sheet>
  );
};
