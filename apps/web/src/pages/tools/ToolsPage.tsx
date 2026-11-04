import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatusPill, Sheet, TextField, Badge } from '@zdoda/ui';
import { Webhook, Plus, Trash2, Send, Copy, Check, CalendarDays, Sheet as SheetIcon, Slack, Building2, ShoppingBag, Zap } from 'lucide-react';
import type { IntegrationDTO } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, wsKey, timeAgo } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, SectionTitle } from '../../components/common/Page';
import { useToast } from '../../context/ToastContext';

const EVENT_LABELS: Record<string, string> = {
  'lead.captured': 'New lead captured',
  'conversation.handoff': 'Customer asked for a human',
  'conversation.resolved': 'Conversation resolved',
};

const PLATFORMS = [
  { id: 'make', name: 'Make', hint: 'Add a “Custom webhook” trigger in Make and paste its URL here.' },
  { id: 'zapier', name: 'Zapier', hint: 'Use “Webhooks by Zapier → Catch Hook” and paste the hook URL.' },
  { id: 'n8n', name: 'n8n', hint: 'Add a Webhook node (POST) and paste its production URL.' },
  { id: 'webhook', name: 'Custom webhook', hint: 'Any HTTPS endpoint that accepts JSON POST requests.' },
] as const;

export const ToolsPage: React.FC = () => {
  const can = useCan();
  const toast = useToast();
  const q = useQuery({ queryKey: wsKey('integrations'), queryFn: () => api.get<{ items: (IntegrationDTO & { platform?: string })[]; events: string[] }>('/integrations') });
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]['id']>('make');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['lead.captured']);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = useApiMutation(() => api.post('/integrations', { kind: platform, name: name || PLATFORMS.find((p) => p.id === platform)!.name, url, events }), {
    invalidate: [['integrations']],
    onSuccess: (out) => setSecret(out.signingSecret),
  });
  const test = useApiMutation((id: string) => api.post(`/integrations/${id}/test`), {
    invalidate: [['integrations']],
    onSuccess: (out) => toast(out.ok ? 'Test event delivered' : 'Test failed', { type: out.ok ? 'success' : 'error', description: out.lastError || 'Check your automation for a sample lead.' }),
  });
  const remove = useApiMutation((id: string) => api.del(`/integrations/${id}`), { success: 'Integration removed', invalidate: [['integrations']] });

  return (
    <Page
      title="Tools & Integrations"
      subtitle="Send leads and handoffs to the tools you already use — CRMs, Google Sheets, Slack, email — through Make, Zapier, n8n or your own webhook."
      action={can('create', 'Integration') && <Button icon={<Plus className="w-4 h-4" />} onClick={() => (setOpen(true), setSecret(null), setUrl(''), setName(''))}>Connect</Button>}
    >
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--separator)]">
            <p className="text-[15px] font-semibold text-[var(--ink)]">Connected</p>
          </div>
          {!q.data!.items.length ? (
            <div className="p-8 text-center space-y-2">
              <Webhook className="w-8 h-8 mx-auto text-[var(--accent)]" />
              <p className="text-[14px] font-semibold text-[var(--ink)]">Nothing connected yet</p>
              <p className="text-[13px] text-[var(--ink-3)] max-w-md mx-auto">Connect Make, Zapier or n8n to add every new lead to Google Sheets, HubSpot or Slack automatically.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--separator)]">
              {q.data!.items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-tint)] text-[var(--accent-ink)] flex items-center justify-center">
                    <Webhook className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[14px] font-medium text-[var(--ink)]">
                      {i.name} <Badge variant="outline">{PLATFORMS.find((p) => p.id === i.platform)?.name || 'Webhook'}</Badge>
                    </p>
                    <p className="text-[12px] text-[var(--ink-3)] truncate">
                      {i.events.map((e) => EVENT_LABELS[e] || e).join(' · ')}
                      {i.lastRunAt && ` · last sent ${timeAgo(i.lastRunAt)}`}
                    </p>
                    {i.lastError && <p className="text-[12px] text-[var(--danger)]">{i.lastError}</p>}
                  </div>
                  <StatusPill status={i.status === 'connected' ? 'live' : 'setup_required'} label={i.status === 'connected' ? 'Connected' : 'Error'} />
                  {can('update', 'Integration') && (
                    <Button size="sm" variant="outline" icon={<Send className="w-3.5 h-3.5" />} loading={test.isPending && test.variables === i.id} onClick={() => test.mutate(i.id)}>
                      Send test
                    </Button>
                  )}
                  {can('delete', 'Integration') && (
                    <button aria-label="Remove" className="p-2 rounded-lg text-[var(--ink-3)] hover:text-[var(--danger)]" onClick={() => window.confirm(`Disconnect ${i.name}?`) && remove.mutate(i.id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div>
        <SectionTitle title="Built-in actions" description="Your agent can do these today." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="flex gap-3">
            <CalendarDays className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-[var(--ink)]">Booking link</p>
              <p className="text-[13px] text-[var(--ink-3)]">Add your Calendly, Cal.com or Google booking page in Agent → Leads & handoff. The agent shares it when someone wants to book.</p>
            </div>
          </Card>
          <Card className="flex gap-3">
            <Zap className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-[var(--ink)]">Lead capture & handoff</p>
              <p className="text-[13px] text-[var(--ink-3)]">Emails and phone numbers shared in chat are saved to Leads, and requests for a person are flagged in the Inbox.</p>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <SectionTitle title="Native integrations" description="Direct connections, no automation tool needed." />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-4">
          {[
            { name: 'Google Calendar', icon: <CalendarDays className="w-5 h-5" /> },
            { name: 'Google Sheets', icon: <SheetIcon className="w-5 h-5" /> },
            { name: 'Slack', icon: <Slack className="w-5 h-5" /> },
            { name: 'HubSpot', icon: <Building2 className="w-5 h-5" /> },
            { name: 'Shopify', icon: <ShoppingBag className="w-5 h-5" /> },
          ].map((n) => (
            <Card key={n.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-2)]">{n.icon}</span>
                <StatusPill status="coming_soon" />
              </div>
              <p className="text-[14px] font-semibold text-[var(--ink)]">{n.name}</p>
            </Card>
          ))}
        </div>
      </div>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={secret ? 'Connected' : 'Connect an automation'}
        description={secret ? 'Use this secret to verify requests (header x-zdoda-signature, HMAC-SHA256 of the body). It is shown only once.' : 'We send a JSON POST to your URL when these events happen.'}
        footer={
          !secret && (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button loading={create.isPending} disabled={!/^https:\/\//.test(url) || !events.length} onClick={() => create.mutate()}>
                Connect
              </Button>
            </div>
          )
        }
      >
        {secret ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input readOnly value={secret} className="flex-1 h-10 px-3 rounded-[10px] bg-[var(--surface-2)] border border-[var(--separator)] text-[12px] font-mono text-[var(--ink)]" aria-label="Signing secret" />
              <Button icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onClick={() => navigator.clipboard.writeText(secret).then(() => setCopied(true))}>
                Copy
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <button key={p.id} type="button" onClick={() => setPlatform(p.id)} className={`p-2.5 rounded-[10px] border text-[13px] font-semibold ${platform === p.id ? 'border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--ink)]' : 'border-[var(--separator)] text-[var(--ink-2)]'}`}>
                  {p.name}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-[var(--ink-3)]">{PLATFORMS.find((p) => p.id === platform)!.hint}</p>
            <TextField label="Webhook URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hook.make.com/…" />
            <TextField label="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} placeholder="Leads → Google Sheets" />
            <div className="space-y-2">
              <p className="text-[13px] font-medium text-[var(--ink-2)]">Send when</p>
              {Object.entries(EVENT_LABELS).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-[14px] text-[var(--ink)]">
                  <input type="checkbox" checked={events.includes(k)} onChange={(e) => setEvents(e.target.checked ? [...events, k] : events.filter((x) => x !== k))} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}
      </Sheet>
    </Page>
  );
};
