import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Sheet, TextField, Select, StatusPill, Switch, Badge } from '@zdoda/ui';
import { Plus, Trash2, Play, CalendarDays, Sheet as SheetIcon, Globe, Webhook, Building2, Plug, X } from 'lucide-react';
import type { ToolDTO, ToolKind } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, wsKey, timeAgo } from '../../lib/hooks';
import { SectionTitle, TextArea } from '../../components/common/Page';
import { useToast } from '../../context/ToastContext';

const KINDS: { kind: ToolKind; title: string; desc: string; icon: React.ReactNode }[] = [
  { kind: 'google_calendar', title: 'Google Calendar booking', desc: 'Checks free slots and books appointments', icon: <CalendarDays className="w-5 h-5" /> },
  { kind: 'google_sheets', title: 'Google Sheets', desc: 'Adds a row (e.g. every lead or order)', icon: <SheetIcon className="w-5 h-5" /> },
  { kind: 'gohighlevel', title: 'GoHighLevel', desc: 'Creates or updates a contact with tags', icon: <Building2 className="w-5 h-5" /> },
  { kind: 'api_request', title: 'API request', desc: 'Calls any HTTPS API (order status, CRM…)', icon: <Globe className="w-5 h-5" /> },
  { kind: 'webhook', title: 'Webhook / Make / n8n', desc: 'Sends the collected details to your automation', icon: <Webhook className="w-5 h-5" /> },
  { kind: 'mcp', title: 'MCP server', desc: 'Use every tool from an MCP server', icon: <Plug className="w-5 h-5" /> },
];

const DEFAULTS: Record<ToolKind, { name: string; description: string }> = {
  google_calendar: { name: 'calendar', description: 'Use to check availability and book appointments for customers.' },
  google_sheets: { name: 'save_lead', description: 'Use to save a new lead with their name, phone and what they need.' },
  gohighlevel: { name: 'crm_contact', description: 'Use to add the customer to the CRM once you have their name and phone or email.' },
  api_request: { name: 'order_status', description: 'Use to look up an order status when the customer gives an order number.' },
  webhook: { name: 'send_to_team', description: 'Use to send the customer request to the team once you have their details.' },
  mcp: { name: 'mcp', description: 'Tools provided by an MCP server.' },
};

type Param = { name: string; type: 'string' | 'number' | 'boolean'; description: string; required: boolean };

export const AgentToolsSection: React.FC = () => {
  const can = useCan();
  const toast = useToast();
  const q = useQuery({ queryKey: wsKey('tools'), queryFn: () => api.get<{ items: ToolDTO[]; googleConfigured: boolean }>('/tools') });
  const [kind, setKind] = useState<ToolKind | null>(null);
  const toggle = useApiMutation(({ id, enabled }: { id: string; enabled: boolean }) => api.patch(`/tools/${id}`, { enabled }), { invalidate: [['tools']] });
  const remove = useApiMutation((id: string) => api.del(`/tools/${id}`), { success: 'Tool removed', invalidate: [['tools']] });
  const connect = useApiMutation((id: string) => api.get<{ url: string }>(`/tools/${id}/connect-google`), { onSuccess: (o) => window.location.assign(o.url) });
  const test = useApiMutation((id: string) => api.post(`/tools/${id}/test`, { args: {} }), {
    invalidate: [['tools']],
    onSuccess: (o: any) => toast(o.ok === false || o.error ? 'Tool returned an error' : 'Tool ran', { type: o.ok === false || o.error ? 'error' : 'success', description: String(o.error || o.result || '').slice(0, 200) }),
  });

  return (
    <div className="space-y-4">
      <SectionTitle title="Agent tools" description="Actions your agents can take by themselves during chats and calls. Pick which agent uses which tool in the agent's Tools tab." />
      {can('create', 'Integration') && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {KINDS.map((k) => (
            <button key={k.kind} onClick={() => setKind(k.kind)} className="text-left p-3.5 rounded-[14px] border border-[var(--separator)] bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-colors">
              <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-tint)] text-[var(--accent-ink)] flex items-center justify-center mb-2">{k.icon}</div>
              <p className="text-[13px] font-semibold text-[var(--ink)]">{k.title}</p>
              <p className="text-[11px] text-[var(--ink-3)] leading-snug mt-0.5">{k.desc}</p>
            </button>
          ))}
        </div>
      )}
      <Card className="p-0 overflow-hidden">
        {!q.data?.items.length ? (
          <p className="p-6 text-[13px] text-[var(--ink-3)]">No agent tools yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--separator)]">
            {q.data.items.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-[10px] bg-[var(--surface-2)] text-[var(--ink-2)] flex items-center justify-center">{KINDS.find((k) => k.kind === t.kind)?.icon}</div>
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[14px] font-medium text-[var(--ink)] font-mono">
                    {t.name} <Badge variant="outline">{KINDS.find((k) => k.kind === t.kind)?.title}</Badge>
                  </p>
                  <p className="text-[12px] text-[var(--ink-3)] truncate">{t.description}</p>
                  {t.lastError && <p className="text-[12px] text-[var(--danger)]">{t.lastError}</p>}
                  {t.lastRunAt && !t.lastError && <p className="text-[12px] text-[var(--ink-3)]">Last used {timeAgo(t.lastRunAt)}</p>}
                </div>
                {!t.connected ? (
                  <Button size="sm" onClick={() => connect.mutate(t.id)} disabled={!q.data?.googleConfigured} title={!q.data?.googleConfigured ? 'Google sign-in is not set up on the server yet' : undefined}>
                    Connect Google
                  </Button>
                ) : (
                  <StatusPill status="live" label="Connected" />
                )}
                {can('update', 'Integration') && (
                  <>
                    <Switch checked={t.enabled} onCheckedChange={(v) => toggle.mutate({ id: t.id, enabled: v })} />
                    {t.kind !== 'google_calendar' && (
                      <Button size="sm" variant="outline" icon={<Play className="w-3.5 h-3.5" />} loading={test.isPending && test.variables === t.id} onClick={() => test.mutate(t.id)} disabled={!t.connected}>
                        Test
                      </Button>
                    )}
                  </>
                )}
                {can('delete', 'Integration') && (
                  <button aria-label={`Delete ${t.name}`} className="p-2 text-[var(--ink-3)] hover:text-[var(--danger)]" onClick={() => window.confirm(`Delete the ${t.name} tool?`) && remove.mutate(t.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <CreateToolSheet kind={kind} onClose={() => setKind(null)} googleConfigured={Boolean(q.data?.googleConfigured)} />
    </div>
  );
};

const CreateToolSheet: React.FC<{ kind: ToolKind | null; onClose: () => void; googleConfigured: boolean }> = ({ kind, onClose, googleConfigured }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [secret, setSecret] = useState('');
  const [params, setParams] = useState<Param[]>([]);
  const [speak, setSpeak] = useState('One moment while I check that.');
  const meta = KINDS.find((k) => k.kind === kind);

  React.useEffect(() => {
    if (!kind) return;
    setName(DEFAULTS[kind].name);
    setDescription(DEFAULTS[kind].description);
    setCfg(kind === 'google_calendar' ? { calendarId: 'primary', durationMin: '30', openTime: '09:00', closeTime: '17:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, eventTitle: 'Appointment' } : kind === 'api_request' ? { method: 'GET' } : kind === 'google_sheets' ? { sheetName: 'Sheet1' } : {});
    setParams(kind === 'google_sheets' ? [{ name: 'name', type: 'string', description: 'Customer name', required: true }, { name: 'phone', type: 'string', description: 'Phone number', required: false }, { name: 'need', type: 'string', description: 'What they want', required: false }] : kind === 'api_request' ? [{ name: 'order_number', type: 'string', description: 'The order number', required: true }] : kind === 'webhook' ? [{ name: 'name', type: 'string', description: 'Customer name', required: true }, { name: 'details', type: 'string', description: 'What they need', required: true }] : []);
    setSecret('');
  }, [kind]);

  const create = useApiMutation(
    () => {
      const config: Record<string, unknown> = { ...cfg };
      if (kind === 'api_request' && cfg.headers) {
        try {
          config.headers = JSON.parse(cfg.headers);
        } catch {
          throw new Error('Headers must be valid JSON, e.g. {"Accept":"application/json"}');
        }
      }
      return api.post<ToolDTO & { connectUrl?: string | null }>('/tools', { kind, name, description, config, parameters: params, speakWhileRunning: speak, secret: secret || undefined });
    },
    {
      invalidate: [['tools']],
      onSuccess: (out) => {
        onClose();
        if (out.connectUrl) window.location.assign(out.connectUrl);
      },
    }
  );
  const c = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCfg({ ...cfg, [k]: e.target.value });
  const showParams = kind === 'api_request' || kind === 'webhook' || kind === 'google_sheets';

  return (
    <Sheet
      open={Boolean(kind)}
      onOpenChange={(o) => !o && onClose()}
      title={meta ? `New tool: ${meta.title}` : ''}
      description={meta?.desc}
      className="md:max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={create.isPending} disabled={!/^[a-z][a-z0-9_]{1,47}$/.test(name) || description.length < 10} onClick={() => create.mutate(undefined)}>
            {kind === 'google_calendar' || kind === 'google_sheets' ? 'Create & connect Google' : 'Create tool'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {(kind === 'google_calendar' || kind === 'google_sheets') && !googleConfigured && <p className="text-[13px] text-[var(--danger)]">Google sign-in for tools isn't set up on the server yet (GOOGLE_CLIENT_ID / SECRET). You can create the tool now and connect later.</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField label="Tool name" value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} hint="lowercase_with_underscores" />
          <TextField label="Say while it runs (voice)" value={speak} onChange={(e) => setSpeak(e.target.value)} />
        </div>
        <TextArea label="When should the agent use it?" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

        {kind === 'google_calendar' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <TextField label="Calendar ID" value={cfg.calendarId || ''} onChange={c('calendarId')} hint="primary = your main calendar" />
            <TextField label="Time zone" value={cfg.timezone || ''} onChange={c('timezone')} />
            <TextField label="Opens" type="time" value={cfg.openTime || ''} onChange={c('openTime')} />
            <TextField label="Closes" type="time" value={cfg.closeTime || ''} onChange={c('closeTime')} />
            <TextField label="Appointment length (min)" type="number" value={cfg.durationMin || ''} onChange={c('durationMin')} />
            <TextField label="Event title" value={cfg.eventTitle || ''} onChange={c('eventTitle')} />
          </div>
        )}
        {kind === 'google_sheets' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <TextField label="Spreadsheet link" value={cfg.spreadsheetId || ''} onChange={c('spreadsheetId')} placeholder="https://docs.google.com/spreadsheets/d/…" />
            <TextField label="Tab name" value={cfg.sheetName || ''} onChange={c('sheetName')} />
          </div>
        )}
        {kind === 'gohighlevel' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <TextField label="Location ID" value={cfg.locationId || ''} onChange={c('locationId')} />
            <TextField label="Private Integration token" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} hint="GHL → Settings → Private Integrations (contacts.write)" />
            <TextField label="Tags (comma separated)" value={cfg.tags || ''} onChange={c('tags')} placeholder="zdoda, website-lead" />
          </div>
        )}
        {(kind === 'api_request' || kind === 'webhook' || kind === 'mcp') && (
          <div className="grid sm:grid-cols-[120px_1fr] gap-3">
            {kind === 'api_request' ? (
              <Select label="Method" value={cfg.method || 'GET'} onChange={c('method')} options={['GET', 'POST', 'PUT', 'PATCH'].map((m) => ({ value: m, label: m }))} />
            ) : (
              <div />
            )}
            <TextField label={kind === 'mcp' ? 'MCP server URL (Streamable HTTP)' : 'URL'} value={cfg.url || ''} onChange={c('url')} placeholder={kind === 'api_request' ? 'https://api.shop.com/orders/{{order_number}}' : 'https://'} hint={kind === 'api_request' ? 'Use {{param}} to insert values the agent collected' : undefined} />
          </div>
        )}
        {kind === 'api_request' && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <TextField label="Auth header name (optional)" value={cfg.secretHeader || ''} onChange={c('secretHeader')} placeholder="Authorization" />
              <TextField label="Auth header value" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Bearer sk_..." />
            </div>
            <TextField label='Extra headers (JSON, optional)' value={cfg.headers || ''} onChange={c('headers')} placeholder='{"Accept":"application/json"}' />
            {cfg.method !== 'GET' && <TextArea label="Body template (optional)" rows={3} className="font-mono text-[12px]" value={cfg.bodyTemplate || ''} onChange={c('bodyTemplate')} placeholder={'{"order":"{{order_number}}"}'} hint="Leave empty to send the collected values as JSON" />}
          </>
        )}
        {kind === 'webhook' && <TextField label="Signing secret (optional)" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} hint="We sign each request with HMAC-SHA256 in x-zdoda-signature" />}
        {kind === 'mcp' && <TextField label="Bearer token (optional)" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />}

        {showParams && (
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-[var(--ink-2)]">Details the agent must collect first</p>
            {params.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_110px_1.5fr_auto_auto] gap-2 items-center">
                <input aria-label="Field name" value={p.name} onChange={(e) => setParams(params.map((x, j) => (j === i ? { ...x, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') } : x)))} className="h-9 px-2 rounded-[8px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[13px] font-mono text-[var(--ink)]" />
                <select aria-label="Type" value={p.type} onChange={(e) => setParams(params.map((x, j) => (j === i ? { ...x, type: e.target.value as Param['type'] } : x)))} className="h-9 px-2 rounded-[8px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[13px] text-[var(--ink)]">
                  <option value="string">text</option>
                  <option value="number">number</option>
                  <option value="boolean">yes/no</option>
                </select>
                <input aria-label="Description" value={p.description} placeholder="What it is" onChange={(e) => setParams(params.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} className="h-9 px-2 rounded-[8px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[13px] text-[var(--ink)]" />
                <label className="text-[12px] text-[var(--ink-3)] flex items-center gap-1">
                  <input type="checkbox" checked={p.required} onChange={(e) => setParams(params.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} /> required
                </label>
                <button type="button" aria-label="Remove field" className="p-1 text-[var(--ink-3)]" onClick={() => setParams(params.filter((_, j) => j !== i))}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {params.length < 15 && (
              <Button size="sm" variant="ghost" icon={<Plus className="w-4 h-4" />} onClick={() => setParams([...params, { name: 'field', type: 'string', description: '', required: false }])}>
                Add field
              </Button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
};
