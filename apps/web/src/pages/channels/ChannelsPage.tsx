import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatusPill, TextField, Badge } from '@zdoda/ui';
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
          <div>
            <SectionTitle title="More channels" description="Same agent, same knowledge — on the apps your customers already use." />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
              {[
                { icon: <MessageCircle className="w-5 h-5" />, name: 'WhatsApp Business', desc: 'Official WhatsApp Cloud API — answer chats and send booking reminders.', color: 'bg-emerald-500/15 text-emerald-600' },
                { icon: <Phone className="w-5 h-5" />, name: 'Voice AI', desc: 'Answer phone calls with a natural voice, 24/7, using the same agent.', color: 'bg-indigo-500/15 text-indigo-600' },
                { icon: <Instagram className="w-5 h-5" />, name: 'Instagram & Messenger', desc: 'Reply to DMs and comments automatically.', color: 'bg-pink-500/15 text-pink-600' },
                { icon: <Mail className="w-5 h-5" />, name: 'Email', desc: 'Draft and send replies to your support inbox.', color: 'bg-sky-500/15 text-sky-600' },
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
