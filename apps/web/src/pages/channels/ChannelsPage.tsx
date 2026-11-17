import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatusPill, TextField, Badge, Select } from '@zdoda/ui';
import { Globe, MessageCircle, Phone, Instagram, Mail, Copy, Check, Palette, Plus, X } from 'lucide-react';
import type { WidgetDTO, AgentDTO } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, wsKey } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, SectionTitle } from '../../components/common/Page';

type W = WidgetDTO & { embedCode: string };

export const ChannelsPage: React.FC = () => {
  const navigate = useNavigate();
  const widgets = useQuery({ queryKey: wsKey('widgets'), queryFn: () => api.get<{ items: W[] }>('/widgets') });
  const agents = useQuery({ queryKey: wsKey('agents'), queryFn: () => api.get<{ items: AgentDTO[] }>('/agents') });

  return (
    <Page title="Channels" subtitle="Where customers talk to your agents. One agent can answer on every channel.">
      {widgets.isLoading ? (
        <LoadingBlock />
      ) : widgets.error ? (
        <ErrorBlock error={widgets.error} onRetry={() => widgets.refetch()} />
      ) : (
        <div className="space-y-6">
          {widgets.data!.items.map((w) => (
            <WebsiteChannel key={w.id} widget={w} agent={agents.data?.items.find((a) => a.id === w.agentId)} onDesign={() => navigate('/widget-studio')} />
          ))}
          <WhatsAppChannel agents={agents.data?.items || []} />
          <VoiceChannel onNumbers={() => navigate('/phone-numbers')} />
          <div>
            <SectionTitle title="More channels" description="Same agent, same knowledge — on the apps your customers already use." />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {[
                { icon: <Instagram className="w-5 h-5" />, name: 'Instagram & Messenger', desc: 'Reply to DMs and comments automatically.', color: 'bg-pink-500/15 text-pink-600' },
                { icon: <Mail className="w-5 h-5" />, name: 'Email', desc: 'Draft and send replies to your support inbox.', color: 'bg-sky-500/15 text-sky-600' },
                { icon: <MessageCircle className="w-5 h-5" />, name: 'Telegram & SMS', desc: 'Answer on Telegram and by text message.', color: 'bg-cyan-500/15 text-cyan-600' },
              ].map((c) => (
                <Card key={c.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${c.color}`}>{c.icon}</div>
                    <StatusPill status="coming_soon" />
                  </div>
                  <p className="text-[15px] font-semibold text-[var(--ink)]">{c.name}</p>
                  <p className="text-[13px] text-[var(--ink-3)]">{c.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

const WebsiteChannel: React.FC<{ widget: W; agent?: AgentDTO; onDesign: () => void }> = ({ widget, agent, onDesign }) => {
  const can = useCan();
  const [copied, setCopied] = useState(false);
  const [origins, setOrigins] = useState<string[]>(widget.allowedOrigins);
  const [newOrigin, setNewOrigin] = useState('');
  useEffect(() => setOrigins(widget.allowedOrigins), [widget.allowedOrigins]);
  const saveOrigins = useApiMutation((list: string[]) => api.patch(`/widgets/${widget.id}`, { allowedOrigins: list }), { success: 'Allowed websites updated', invalidate: [['widgets']] });

  const live = widget.publishedVersion > 0 && agent?.status === 'published';
  const status = live ? 'live' : 'setup_required';
  const missing = [!widget.publishedVersion && 'publish the widget in Widget Studio', agent?.status !== 'published' && `publish the agent “${agent?.name || ''}”`].filter(Boolean);

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-11 h-11 rounded-[12px] bg-[var(--accent-tint)] text-[var(--accent-ink)] flex items-center justify-center">
          <Globe className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[16px] font-semibold text-[var(--ink)]">Website chat · {widget.name}</p>
            <StatusPill status={status} label={live ? 'Live' : 'Not live yet'} />
          </div>
          <p className="text-[13px] text-[var(--ink-3)]">
            Answers with <b className="text-[var(--ink-2)]">{agent?.name || '—'}</b>
            {missing.length > 0 && <> · To go live: {missing.join(' and ')}.</>}
          </p>
        </div>
        <Button variant="outline" icon={<Palette className="w-4 h-4" />} onClick={onDesign}>
          Design widget
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-[14px] font-semibold text-[var(--ink)]">1. Add this code to your website</p>
        <p className="text-[13px] text-[var(--ink-3)]">Paste it before the closing &lt;/body&gt; tag on every page (or in your site builder's “custom code” section).</p>
        <div className="relative">
          <pre className="p-4 pr-24 rounded-[12px] bg-[#0f0f14] text-[#e6e6f0] text-[12px] font-mono overflow-x-auto whitespace-pre-wrap break-all">{widget.embedCode}</pre>
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-3 right-3"
            icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={() => {
              navigator.clipboard.writeText(widget.embedCode).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            ['WordPress', 'Appearance → Theme File Editor → footer.php, or a “Insert Headers and Footers” plugin'],
            ['Shopify', 'Online Store → Themes → Edit code → theme.liquid, before </body>'],
            ['Wix', 'Settings → Custom code → Add code to Body – end'],
            ['Webflow', 'Project settings → Custom code → Footer code'],
          ].map(([name, how]) => (
            <Badge key={name} variant="outline" title={how}>
              {name}: {how}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[14px] font-semibold text-[var(--ink)]">2. Allowed websites</p>
        <p className="text-[13px] text-[var(--ink-3)]">{origins.length ? 'The widget only loads on these domains.' : 'Anyone can embed this widget right now. Add your domain to lock it down.'}</p>
        <div className="flex flex-wrap gap-2">
          {origins.map((o) => (
            <span key={o} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--separator)] text-[13px] text-[var(--ink)]">
              {o}
              {can('update', 'Widget') && (
                <button aria-label={`Remove ${o}`} className="p-1 text-[var(--ink-3)]" onClick={() => saveOrigins.mutate(origins.filter((x) => x !== o))}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
        {can('update', 'Widget') && (
          <form
            className="flex gap-2 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              if (newOrigin.trim()) {
                saveOrigins.mutate([...origins, newOrigin.trim()]);
                setNewOrigin('');
              }
            }}
          >
            <TextField value={newOrigin} onChange={(e) => setNewOrigin(e.target.value)} placeholder="yourbusiness.com" />
            <Button type="submit" variant="outline" icon={<Plus className="w-4 h-4" />} disabled={!newOrigin.trim()}>
              Add
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
};

const WhatsAppChannel: React.FC<{ agents: AgentDTO[] }> = ({ agents }) => {
  const can = useCan();
  const q = useQuery({ queryKey: wsKey('whatsapp'), queryFn: () => api.get<{ connected: boolean; channel: any; webhookUrl: string; verifyTokenSet: boolean; appSecretSet: boolean }>('/channels/whatsapp') });
  const [f, setF] = useState({ phoneNumberId: '', wabaId: '', accessToken: '', agentId: '' });
  const [copied, setCopied] = useState(false);
  const connect = useApiMutation(() => api.post('/channels/whatsapp', { ...f, agentId: f.agentId || agents[0]?.id }), {
    success: 'WhatsApp connected',
    invalidate: [['whatsapp']],
    onSuccess: () => setF({ phoneNumberId: '', wabaId: '', accessToken: '', agentId: '' }),
  });
  const setAgent = useApiMutation((agentId: string) => api.patch('/channels/whatsapp', { agentId }), { success: 'Agent updated', invalidate: [['whatsapp']] });
  const disconnect = useApiMutation(() => api.del('/channels/whatsapp'), { success: 'WhatsApp disconnected', invalidate: [['whatsapp']] });
  const d = q.data;
  const serverReady = d?.verifyTokenSet && d?.appSecretSet;
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-11 h-11 rounded-[12px] bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[16px] font-semibold text-[var(--ink)]">WhatsApp Business</p>
            <StatusPill status={d?.connected ? 'live' : serverReady ? 'setup_required' : 'setup_required'} label={d?.connected ? 'Connected' : 'Not connected'} />
          </div>
          <p className="text-[13px] text-[var(--ink-3)]">
            {d?.connected ? `${d.channel.verifiedName || ''} ${d.channel.displayNumber || ''} · answers with ${agents.find((a) => a.id === d.channel.agentId)?.name || '—'}` : 'Official Meta WhatsApp Cloud API. Your agent replies to every WhatsApp message.'}
          </p>
        </div>
        {d?.connected && can('delete', 'Channel') && (
          <Button variant="ghost" className="text-[var(--danger)]" onClick={() => window.confirm('Disconnect WhatsApp?') && disconnect.mutate(undefined)}>
            Disconnect
          </Button>
        )}
      </div>
      {d && !serverReady && <p className="text-[13px] text-[var(--danger)]">The server is missing META_APP_SECRET or WHATSAPP_VERIFY_TOKEN — ask your admin to add them first.</p>}
      {d?.connected ? (
        can('update', 'Channel') && (
          <div className="flex items-center gap-2 text-[13px] text-[var(--ink-2)]">
            Answers with
            <select aria-label="WhatsApp agent" value={d.channel.agentId} onChange={(e) => setAgent.mutate(e.target.value)} className="h-9 px-2 rounded-[10px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[13px] text-[var(--ink)]">
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )
      ) : (
        can('create', 'Channel') && (
          <div className="space-y-3">
            <ol className="text-[13px] text-[var(--ink-2)] list-decimal ml-5 space-y-1">
              <li>developers.facebook.com → your app → WhatsApp → API Setup.</li>
              <li>
                Webhooks → Callback URL:{' '}
                <code className="text-[12px] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{d?.webhookUrl}</code>{' '}
                <button className="text-[var(--accent-ink)] font-semibold" onClick={() => d && navigator.clipboard.writeText(d.webhookUrl).then(() => setCopied(true))}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
                ; verify token = the one your admin set; subscribe to <b>messages</b>.
              </li>
              <li>Create a permanent access token (System user in Business Settings) and paste the details below.</li>
            </ol>
            <div className="grid sm:grid-cols-2 gap-3">
              <TextField label="Phone number ID" value={f.phoneNumberId} onChange={(e) => setF({ ...f, phoneNumberId: e.target.value.trim() })} />
              <TextField label="WhatsApp Business Account ID" value={f.wabaId} onChange={(e) => setF({ ...f, wabaId: e.target.value.trim() })} />
              <TextField label="Permanent access token" type="password" value={f.accessToken} onChange={(e) => setF({ ...f, accessToken: e.target.value.trim() })} />
              <Select label="Answers with" value={f.agentId || agents[0]?.id || ''} onChange={(e) => setF({ ...f, agentId: e.target.value })} options={agents.map((a) => ({ value: a.id, label: a.name }))} />
            </div>
            <Button loading={connect.isPending} disabled={!serverReady || !f.phoneNumberId || !f.wabaId || f.accessToken.length < 20} onClick={() => connect.mutate(undefined)}>
              Connect WhatsApp
            </Button>
          </div>
        )
      )}
    </Card>
  );
};

const VoiceChannel: React.FC<{ onNumbers: () => void }> = ({ onNumbers }) => {
  const st = useQuery({ queryKey: ['voice-status'], queryFn: () => api.get<{ livekit: boolean; phoneReady: boolean }>('/voice/status'), staleTime: 60_000 });
  return (
    <Card className="flex flex-wrap items-start gap-4">
      <div className="w-11 h-11 rounded-[12px] bg-indigo-500/15 text-indigo-600 flex items-center justify-center">
        <Phone className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[16px] font-semibold text-[var(--ink)]">Voice AI</p>
          <StatusPill status={st.data?.livekit ? 'live' : 'setup_required'} label={st.data?.livekit ? 'Web calls ready' : 'Voice not set up'} />
          <StatusPill status={st.data?.phoneReady ? 'live' : 'setup_required'} label={st.data?.phoneReady ? 'Phone ready' : 'Phone not set up'} />
        </div>
        <p className="text-[13px] text-[var(--ink-3)]">Turn on Voice in an agent's settings. Website visitors get a call button in the chat widget; give the agent a phone number to answer real calls.</p>
      </div>
      <Button variant="outline" icon={<Phone className="w-4 h-4" />} onClick={onNumbers}>
        Phone numbers
      </Button>
    </Card>
  );
};
