import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatusPill, SegmentedControl, Switch, TextField, Select, Badge, Sheet } from '@zdoda/ui';
import { Monitor, Smartphone, Save, Rocket, History, Upload, Plus, X, RotateCcw, Copy } from 'lucide-react';
import { DEFAULT_WIDGET_CONFIG, type AgentDTO, type WidgetConfigV1, type WidgetDTO } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, useWorkspace, wsKey, timeAgo } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, TextArea } from '../../components/common/Page';
import { useToast } from '../../context/ToastContext';
import { WidgetPreview } from './WidgetPreview';

type Section = 'brand' | 'theme' | 'background' | 'launcher' | 'content' | 'layout' | 'advanced';

// Each preset also sets background colors that keep text readable in its appearance.
const PRESETS: { id: WidgetConfigV1['theme']['preset']; label: string; color: string; bg: string[] }[] = [
  { id: 'violet', label: 'Violet', color: '#6538F5', bg: ['#F3EFFF', '#FFFFFF', '#C9B8FF'] },
  { id: 'glass', label: 'Glass', color: '#0A84FF', bg: ['#EAF4FF', '#F7FAFF', '#B9DAFF'] },
  { id: 'midnight', label: 'Midnight', color: '#7C5CFF', bg: ['#1B1640', '#101827', '#3B2A8C'] },
  { id: 'mint', label: 'Mint', color: '#10B981', bg: ['#E8FBF3', '#FFFFFF', '#A7F0D2'] },
  { id: 'coral', label: 'Coral', color: '#F2545B', bg: ['#FFF0EE', '#FFFFFF', '#FFC2BC'] },
  { id: 'graphite', label: 'Graphite', color: '#3A3A3C', bg: ['#F2F2F4', '#FFFFFF', '#D1D1D6'] },
];

const BACKGROUNDS: { id: WidgetConfigV1['background']['type']; label: string; soon?: boolean }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'bokeh', label: 'Bokeh' },
  { id: 'waves', label: 'Waves' },
  { id: 'particles', label: 'Particles' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'lottie', label: 'Lottie', soon: true },
];

export const WidgetStudioPage: React.FC = () => {
  const can = useCan();
  const toast = useToast();
  const { data: ws } = useWorkspace();
  const widgets = useQuery({ queryKey: wsKey('widgets'), queryFn: () => api.get<{ items: (WidgetDTO & { embedCode: string })[] }>('/widgets') });
  const agents = useQuery({ queryKey: wsKey('agents'), queryFn: () => api.get<{ items: AgentDTO[] }>('/agents') });
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const widget = widgets.data?.items.find((w) => w.id === widgetId) || widgets.data?.items[0];
  const [cfg, setCfg] = useState<WidgetConfigV1 | null>(null);
  const [section, setSection] = useState<Section>('brand');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showVersions, setShowVersions] = useState(false);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (widget && loadedFor.current !== widget.id + widget.updatedAt) {
      loadedFor.current = widget.id + widget.updatedAt;
      setCfg(widget.draftConfig);
    }
  }, [widget]);

  const dirty = useMemo(() => Boolean(widget && cfg && JSON.stringify(cfg) !== JSON.stringify(widget.draftConfig)), [cfg, widget]);
  const saveDraft = useApiMutation((c: WidgetConfigV1) => api.patch(`/widgets/${widget!.id}`, { draftConfig: c }), { success: 'Draft saved', invalidate: [['widgets']] });
  const setAgent = useApiMutation((agentId: string) => api.patch(`/widgets/${widget!.id}`, { agentId }), { success: 'Agent connected', invalidate: [['widgets']] });
  const publish = useApiMutation(
    async () => {
      if (dirty) await api.patch(`/widgets/${widget!.id}`, { draftConfig: cfg });
      return api.post(`/widgets/${widget!.id}/publish`);
    },
    {
      invalidate: [['widgets']],
      onSuccess: (out: any) => {
        toast(`Published version ${out.publishedVersion}`, { description: out.warnings?.[0] || 'Your website shows the new design within a minute.' });
      },
    }
  );
  const create = useApiMutation((agentId: string) => api.post<WidgetDTO>('/widgets', { name: `Widget ${(widgets.data?.items.length || 0) + 1}`, agentId }), {
    success: 'Widget created',
    invalidate: [['widgets']],
    onSuccess: (w) => setWidgetId(w.id),
  });

  if (widgets.isLoading || (!cfg && !widgets.error)) return <Page title="Widget Studio"><LoadingBlock rows={6} /></Page>;
  if (widgets.error || !widget || !cfg) return <Page title="Widget Studio"><ErrorBlock error={widgets.error} onRetry={() => widgets.refetch()} /></Page>;

  const editable = can('update', 'Widget');
  const set = (patch: (c: WidgetConfigV1) => WidgetConfigV1) => setCfg((c) => (c ? patch(structuredClone(c)) : c));
  const agent = agents.data?.items.find((a) => a.id === widget.agentId);
  const brandingLocked = !['business', 'agency'].includes(ws?.billing.plan || 'starter');

  return (
    <Page
      wide
      title="Widget Studio"
      subtitle="Design your chat widget. The preview is the real widget — exactly what visitors will see."
      action={
        <div className="flex flex-wrap items-center gap-2">
          {widget.publishedVersion ? (
            <StatusPill status={widget.hasUnpublishedChanges || dirty ? 'test_mode' : 'live'} label={widget.hasUnpublishedChanges || dirty ? `Live v${widget.publishedVersion} · unpublished changes` : `Live v${widget.publishedVersion}`} size="md" />
          ) : (
            <StatusPill status="setup_required" label="Not published" size="md" />
          )}
          <Button variant="ghost" icon={<History className="w-4 h-4" />} onClick={() => setShowVersions(true)}>
            History
          </Button>
          {editable && (
            <Button variant="outline" icon={<Save className="w-4 h-4" />} disabled={!dirty} loading={saveDraft.isPending} onClick={() => saveDraft.mutate(cfg)}>
              Save draft
            </Button>
          )}
          {can('publish', 'Widget') && (
            <Button icon={<Rocket className="w-4 h-4" />} loading={publish.isPending} onClick={() => publish.mutate()}>
              Publish
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        {widgets.data!.items.length > 1 && (
          <Select aria-label="Widget" value={widget.id} onChange={(e) => setWidgetId(e.target.value)} options={widgets.data!.items.map((w) => ({ value: w.id, label: w.name }))} />
        )}
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-2)]">
          Answers with
          <select
            aria-label="Agent"
            value={widget.agentId}
            disabled={!editable}
            onChange={(e) => setAgent.mutate(e.target.value)}
            className="h-9 px-2 rounded-[10px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[13px] font-semibold text-[var(--ink)]"
          >
            {agents.data?.items.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.status === 'published' ? '' : '(draft)'}
              </option>
            ))}
          </select>
          {agent && agent.status !== 'published' && <Badge variant="outline">Publish the agent to go live</Badge>}
        </div>
        {can('publish', 'Widget') && agents.data?.items[0] && (
          <Button size="sm" variant="ghost" icon={<Plus className="w-4 h-4" />} onClick={() => create.mutate(widget.agentId)} className="ml-auto">
            New widget
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6 items-start">
        <Card className="p-0 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-[var(--separator)] px-2" role="tablist">
            {(['brand', 'theme', 'background', 'launcher', 'content', 'layout', 'advanced'] as Section[]).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={section === s}
                onClick={() => setSection(s)}
                className={`px-3 py-3 text-[13px] font-semibold capitalize whitespace-nowrap border-b-2 -mb-px ${section === s ? 'border-[var(--accent)] text-[var(--ink)]' : 'border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <fieldset disabled={!editable} className="p-5 space-y-4 max-h-[680px] overflow-y-auto">
            {section === 'brand' && (
              <>
                <TextField label="Assistant name" value={cfg.brand.botName} maxLength={40} onChange={(e) => set((c) => ((c.brand.botName = e.target.value), c))} />
                <TextField label="Tagline" value={cfg.brand.tagline} maxLength={80} onChange={(e) => set((c) => ((c.brand.tagline = e.target.value), c))} />
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Avatar</p>
                  <SegmentedControl
                    size="sm"
                    value={cfg.brand.avatar.type === 'upload' ? 'upload' : 'initials'}
                    onChange={(v) => set((c) => ((c.brand.avatar.type = v as 'upload' | 'initials'), c))}
                    items={[
                      { value: 'initials', label: 'Initials' },
                      { value: 'upload', label: 'Image' },
                    ]}
                  />
                  {cfg.brand.avatar.type === 'upload' ? (
                    <ImageUpload widgetId={widget.id} value={cfg.brand.avatar.url} onChange={(url) => set((c) => ((c.brand.avatar.url = url), c))} />
                  ) : (
                    <TextField value={cfg.brand.avatar.initials} maxLength={3} onChange={(e) => set((c) => ((c.brand.avatar.initials = e.target.value), c))} />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Logo in header (optional)</p>
                  <ImageUpload widgetId={widget.id} value={cfg.brand.logoUrl} onChange={(url) => set((c) => ((c.brand.logoUrl = url), c))} />
                </div>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Header image (optional)</p>
                  <ImageUpload widgetId={widget.id} value={cfg.brand.headerImageUrl} onChange={(url) => set((c) => ((c.brand.headerImageUrl = url), c))} />
                </div>
              </>
            )}

            {section === 'theme' && (
              <>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Preset</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => set((c) => ((c.theme.preset = p.id), (c.theme.primary = p.color), (c.background.colors = [...p.bg]), (c.theme.appearance = p.id === 'midnight' ? 'dark' : c.theme.appearance === 'dark' ? 'light' : c.theme.appearance), c))}
                        className={`flex items-center gap-2 p-2 rounded-[10px] border text-[13px] font-medium ${cfg.theme.preset === p.id ? 'border-[var(--accent)] bg-[var(--accent-tint)]' : 'border-[var(--separator)]'}`}
                      >
                        <span className="w-5 h-5 rounded-full" style={{ background: p.color }} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <ColorField label="Brand color" value={cfg.theme.primary} onChange={(v) => set((c) => ((c.theme.primary = v), c))} />
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Appearance</p>
                  <SegmentedControl size="sm" value={cfg.theme.appearance} onChange={(v) => set((c) => ((c.theme.appearance = v), c))} items={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'auto', label: 'Auto' }]} />
                </div>
                <Select label="Font" value={cfg.theme.fontFamily} onChange={(e) => set((c) => ((c.theme.fontFamily = e.target.value as any), c))} options={[{ value: 'system', label: 'System (SF / Segoe)' }, { value: 'inter', label: 'Inter' }, { value: 'rounded', label: 'Rounded' }, { value: 'serif', label: 'Serif' }]} />
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Corner roundness</p>
                  <SegmentedControl size="sm" value={String(cfg.theme.radius)} onChange={(v) => set((c) => ((c.theme.radius = Number(v) as 8), c))} items={[{ value: '8', label: 'Sharp' }, { value: '14', label: 'Soft' }, { value: '20', label: 'Round' }, { value: '28', label: 'Pill' }]} />
                </div>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Density</p>
                  <SegmentedControl size="sm" value={cfg.theme.density} onChange={(v) => set((c) => ((c.theme.density = v), c))} items={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]} />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-[14px] font-medium text-[var(--ink)]">Custom colors</p>
                    <p className="text-[12px] text-[var(--ink-3)]">Override bubbles, header and buttons</p>
                  </div>
                  <Switch checked={cfg.theme.palette === 'custom'} onCheckedChange={(v) => set((c) => ((c.theme.palette = v ? 'custom' : 'auto'), (c.theme.colors ||= {}), c))} />
                </div>
                {cfg.theme.palette === 'custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    {(['header', 'headerText', 'userBubble', 'userText', 'botBubble', 'botText', 'button', 'buttonText', 'surface', 'text'] as const).map((k) => (
                      <ColorField key={k} compact label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={cfg.theme.colors?.[k] || ''} onChange={(v) => set((c) => ((c.theme.colors = { ...(c.theme.colors || {}), [k]: v }), c))} />
                    ))}
                  </div>
                )}
              </>
            )}

            {section === 'background' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {BACKGROUNDS.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      disabled={b.soon}
                      onClick={() => set((c) => ((c.background.type = b.id), c))}
                      className={`relative p-2.5 rounded-[10px] border text-[13px] font-medium disabled:opacity-50 ${cfg.background.type === b.id ? 'border-[var(--accent)] bg-[var(--accent-tint)]' : 'border-[var(--separator)]'}`}
                    >
                      {b.label}
                      {b.soon && <span className="block text-[10px] text-[var(--ink-3)]">Coming soon</span>}
                    </button>
                  ))}
                </div>
                {['gradient', 'aurora', 'bokeh', 'waves', 'particles', 'solid'].includes(cfg.background.type) && (
                  <div className="grid grid-cols-3 gap-3">
                    {(cfg.background.type === 'solid' ? [0] : cfg.background.type === 'gradient' ? [0, 1] : [0, 1, 2]).map((i) => (
                      <ColorField compact key={i} label={`Color ${i + 1}`} value={cfg.background.colors[i] || '#FFFFFF'} onChange={(v) => set((c) => ((c.background.colors[i] = v), c))} />
                    ))}
                  </div>
                )}
                {cfg.background.type === 'image' && <ImageUpload widgetId={widget.id} value={cfg.background.imageUrl} onChange={(url) => set((c) => ((c.background.imageUrl = url), c))} />}
                {cfg.background.type === 'video' && (
                  <TextField label="Video URL (MP4, muted loop)" value={cfg.background.videoUrl || ''} onChange={(e) => set((c) => ((c.background.videoUrl = e.target.value), c))} placeholder="https://…/loop.mp4" />
                )}
                <Range label="Opacity" min={0} max={1} step={0.05} value={cfg.background.opacity} onChange={(v) => set((c) => ((c.background.opacity = v), c))} format={(v) => `${Math.round(v * 100)}%`} />
                <Range label="Blur" min={0} max={40} step={1} value={cfg.background.blur} onChange={(v) => set((c) => ((c.background.blur = v), c))} format={(v) => `${v}px`} />
                {['aurora', 'bokeh', 'waves', 'particles'].includes(cfg.background.type) && (
                  <Range label="Animation speed" min={0} max={2} step={0.1} value={cfg.background.speed} onChange={(v) => set((c) => ((c.background.speed = v), c))} format={(v) => `${v.toFixed(1)}×`} />
                )}
                <ToggleRow label="Respect “reduce motion”" hint="Stops animations for visitors who prefer less motion" checked={cfg.background.respectReducedMotion} onChange={(v) => set((c) => ((c.background.respectReducedMotion = v), c))} />
              </>
            )}

            {section === 'launcher' && (
              <>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Style</p>
                  <SegmentedControl size="sm" value={cfg.launcher.style} onChange={(v) => set((c) => ((c.launcher.style = v), c))} items={[{ value: 'icon', label: 'Icon' }, { value: 'icon_text', label: 'Icon + text' }, { value: 'text', label: 'Text' }]} />
                </div>
                {cfg.launcher.style !== 'icon' && <TextField label="Label" value={cfg.launcher.label} maxLength={30} onChange={(e) => set((c) => ((c.launcher.label = e.target.value), c))} />}
                <Select label="Icon" value={cfg.launcher.icon} onChange={(e) => set((c) => ((c.launcher.icon = e.target.value), c))} options={[{ value: 'message-circle', label: 'Chat bubble' }, { value: 'sparkles', label: 'Sparkles' }, { value: 'bot', label: 'Robot' }, { value: 'headset', label: 'Headset' }, { value: 'help', label: 'Question mark' }]} />
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Shape</p>
                  <SegmentedControl size="sm" value={cfg.launcher.shape} onChange={(v) => set((c) => ((c.launcher.shape = v), c))} items={[{ value: 'circle', label: 'Circle' }, { value: 'pill', label: 'Pill' }, { value: 'square', label: 'Rounded square' }]} />
                </div>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Position</p>
                  <SegmentedControl size="sm" value={cfg.launcher.position} onChange={(v) => set((c) => ((c.launcher.position = v), c))} items={[{ value: 'left', label: 'Bottom left' }, { value: 'right', label: 'Bottom right' }]} />
                </div>
                <Range label="Size" min={48} max={72} step={2} value={cfg.launcher.size} onChange={(v) => set((c) => ((c.launcher.size = v), c))} format={(v) => `${v}px`} />
                <div className="grid grid-cols-2 gap-3">
                  <Range label="Side offset" min={0} max={60} step={2} value={cfg.launcher.offsetX} onChange={(v) => set((c) => ((c.launcher.offsetX = v), c))} format={(v) => `${v}px`} />
                  <Range label="Bottom offset" min={0} max={60} step={2} value={cfg.launcher.offsetY} onChange={(v) => set((c) => ((c.launcher.offsetY = v), c))} format={(v) => `${v}px`} />
                </div>
                <Select label="Entrance animation" value={cfg.launcher.entrance} onChange={(e) => set((c) => ((c.launcher.entrance = e.target.value as any), c))} options={[{ value: 'pop', label: 'Pop' }, { value: 'fade', label: 'Fade' }, { value: 'slide', label: 'Slide up' }, { value: 'none', label: 'None' }]} />
                <ToggleRow label="Glass effect" checked={cfg.launcher.glass} onChange={(v) => set((c) => ((c.launcher.glass = v), c))} />
                <ToggleRow label="Unread badge" checked={cfg.launcher.unreadBadge} onChange={(v) => set((c) => ((c.launcher.unreadBadge = v), c))} />
              </>
            )}

            {section === 'content' && (
              <>
                <TextField label="Welcome title" value={cfg.texts.welcomeTitle} maxLength={60} onChange={(e) => set((c) => ((c.texts.welcomeTitle = e.target.value), c))} />
                <TextArea label="Welcome message" rows={3} value={cfg.texts.welcomeMessage} maxLength={400} onChange={(e) => set((c) => ((c.texts.welcomeMessage = e.target.value), c))} />
                <TextField label="Input placeholder" value={cfg.texts.placeholder} maxLength={60} onChange={(e) => set((c) => ((c.texts.placeholder = e.target.value), c))} />
                <TextField label="Small print" value={cfg.texts.disclaimer} maxLength={120} onChange={(e) => set((c) => ((c.texts.disclaimer = e.target.value), c))} />
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Quick replies</p>
                  {cfg.texts.quickReplies.map((qr, i) => (
                    <div key={i} className="flex gap-2">
                      <TextField value={qr} maxLength={40} onChange={(e) => set((c) => ((c.texts.quickReplies[i] = e.target.value), c))} />
                      <button type="button" aria-label="Remove quick reply" className="p-2 text-[var(--ink-3)]" onClick={() => set((c) => (c.texts.quickReplies.splice(i, 1), c))}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {cfg.texts.quickReplies.length < 6 && (
                    <Button size="sm" variant="ghost" icon={<Plus className="w-4 h-4" />} onClick={() => set((c) => (c.texts.quickReplies.push('New question'), c))}>
                      Add quick reply
                    </Button>
                  )}
                </div>
                <TextField label="Privacy policy URL" value={cfg.texts.privacyUrl || ''} onChange={(e) => set((c) => ((c.texts.privacyUrl = e.target.value || undefined), c))} placeholder="https://yourbusiness.com/privacy" />
                <div className="space-y-2 pt-2">
                  <ToggleRow
                    label="Proactive greeting"
                    hint="A small message pops up next to the launcher"
                    checked={Boolean(cfg.behavior.proactiveGreeting?.enabled)}
                    onChange={(v) => set((c) => ((c.behavior.proactiveGreeting = { delaySec: 5, message: 'Need help? Ask me anything 👋', ...c.behavior.proactiveGreeting, enabled: v }), c))}
                  />
                  {cfg.behavior.proactiveGreeting?.enabled && (
                    <div className="grid grid-cols-[1fr_100px] gap-2">
                      <TextField value={cfg.behavior.proactiveGreeting.message} onChange={(e) => set((c) => ((c.behavior.proactiveGreeting!.message = e.target.value), c))} />
                      <TextField type="number" min={0} max={120} value={cfg.behavior.proactiveGreeting.delaySec} onChange={(e) => set((c) => ((c.behavior.proactiveGreeting!.delaySec = Number(e.target.value)), c))} hint="seconds" />
                    </div>
                  )}
                  <ToggleRow label="Open automatically" hint="Opens the chat when the page loads" checked={cfg.behavior.openOnLoad} onChange={(v) => set((c) => ((c.behavior.openOnLoad = v), c))} />
                  <ToggleRow label="Sound on new message" checked={cfg.behavior.soundOnMessage} onChange={(v) => set((c) => ((c.behavior.soundOnMessage = v), c))} />
                </div>
              </>
            )}

            {section === 'layout' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['bubble', 'Bubble', 'Launcher opens a chat window'],
                      ['popup', 'Popup', 'Centered window with backdrop'],
                      ['side_panel', 'Side panel', 'Full-height panel on the side'],
                      ['fullpage', 'Full page', 'Chat fills the page'],
                      ['inline', 'Inline', 'Inside an element on your page'],
                    ] as const
                  ).map(([id, label, desc]) => (
                    <button type="button" key={id} onClick={() => set((c) => ((c.layout.mode = id), c))} className={`text-left p-3 rounded-[10px] border ${cfg.layout.mode === id ? 'border-[var(--accent)] bg-[var(--accent-tint)]' : 'border-[var(--separator)]'}`}>
                      <p className="text-[13px] font-semibold text-[var(--ink)]">{label}</p>
                      <p className="text-[11px] text-[var(--ink-3)]">{desc}</p>
                    </button>
                  ))}
                </div>
                {cfg.layout.mode === 'inline' && <TextField label="CSS selector of the container" value={cfg.layout.inlineSelector || ''} onChange={(e) => set((c) => ((c.layout.inlineSelector = e.target.value), c))} placeholder="#chat" />}
                <Range label="Width" min={320} max={520} step={10} value={cfg.layout.width} onChange={(v) => set((c) => ((c.layout.width = v), c))} format={(v) => `${v}px`} />
                <Range label="Height" min={460} max={800} step={10} value={cfg.layout.height} onChange={(v) => set((c) => ((c.layout.height = v), c))} format={(v) => `${v}px`} />
              </>
            )}

            {section === 'advanced' && (
              <>
                <ToggleRow
                  label="Hide “Powered by Zdoda”"
                  hint={brandingLocked ? 'Available on the Business plan' : 'White-label your widget'}
                  checked={cfg.advanced.hideBranding}
                  disabled={brandingLocked}
                  onChange={(v) => set((c) => ((c.advanced.hideBranding = v), c))}
                />
                <TextArea
                  label="Custom CSS"
                  rows={8}
                  className="font-mono text-[12px]"
                  value={cfg.advanced.customCss || ''}
                  onChange={(e) => set((c) => ((c.advanced.customCss = e.target.value), c))}
                  placeholder={'.zd-header { letter-spacing: .02em; }'}
                  hint="Scoped to the widget only (Shadow DOM). Classes: .zd-launcher .zd-panel .zd-header .zd-msg.user .zd-msg.assistant .zd-chip .zd-composer"
                />
                <Button size="sm" variant="ghost" icon={<RotateCcw className="w-4 h-4" />} onClick={() => window.confirm('Reset all design settings to the defaults?') && setCfg({ ...DEFAULT_WIDGET_CONFIG, brand: cfg.brand, texts: cfg.texts })}>
                  Reset design to defaults
                </Button>
              </>
            )}
          </fieldset>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SegmentedControl size="sm" value={device} onChange={setDevice} items={[{ value: 'desktop', label: 'Desktop', icon: <Monitor className="w-3.5 h-3.5" /> }, { value: 'mobile', label: 'Mobile', icon: <Smartphone className="w-3.5 h-3.5" /> }]} />
            <p className="text-[12px] text-[var(--ink-3)]">Live preview — chat with your agent here</p>
          </div>
          <WidgetPreview config={cfg} agentId={widget.agentId} device={device} siteName={ws?.workspace.name || 'Your business'} />
        </div>
      </div>

      <VersionsSheet open={showVersions} onClose={() => setShowVersions(false)} widgetId={widget.id} />
    </Page>
  );
};

const Range: React.FC<{ label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; format: (v: number) => string }> = ({ label, min, max, step, value, onChange, format }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[13px]">
      <span className="font-medium text-[var(--ink-2)]">{label}</span>
      <span className="text-[var(--ink-3)] tabular-nums">{format(value)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label={label} />
  </div>
);

const ToggleRow: React.FC<{ label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ label, hint, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-3 py-1">
    <div>
      <p className="text-[14px] font-medium text-[var(--ink)]">{label}</p>
      {hint && <p className="text-[12px] text-[var(--ink-3)]">{hint}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void; compact?: boolean }> = ({ label, value, onChange, compact }) => (
  <div className="space-y-1.5">
    <label className={`font-medium text-[var(--ink-2)] ${compact ? 'text-[12px]' : 'text-[13px]'}`}>{label}</label>
    <div className="flex items-center gap-2 h-10 px-2 rounded-[10px] border border-[var(--separator-strong)] bg-[var(--surface)]">
      <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'} onChange={(e) => onChange(e.target.value.toUpperCase())} className="w-7 h-7 rounded-md border-0 bg-transparent cursor-pointer" aria-label={`${label} picker`} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Auto" className="flex-1 min-w-0 bg-transparent text-[13px] font-mono text-[var(--ink)] focus:outline-none" aria-label={label} />
    </div>
  </div>
);

const ImageUpload: React.FC<{ widgetId: string; value?: string; onChange: (url: string | undefined) => void }> = ({ widgetId, value, onChange }) => {
  const ref = useRef<HTMLInputElement>(null);
  const upload = useApiMutation((f: File) => api.upload<{ url: string }>(`/widgets/${widgetId}/assets`, f), { onSuccess: (out) => onChange(out.url) });
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-[10px] border border-[var(--separator)] bg-[var(--surface-2)] overflow-hidden flex items-center justify-center shrink-0">
        {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <Upload className="w-4 h-4 text-[var(--ink-3)]" />}
      </div>
      <Button size="sm" variant="outline" loading={upload.isPending} onClick={() => ref.current?.click()}>
        {value ? 'Replace' : 'Upload'}
      </Button>
      {value && (
        <Button size="sm" variant="ghost" onClick={() => onChange(undefined)}>
          Remove
        </Button>
      )}
      <input ref={ref} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
    </div>
  );
};

const VersionsSheet: React.FC<{ open: boolean; onClose: () => void; widgetId: string }> = ({ open, onClose, widgetId }) => {
  const q = useQuery({ queryKey: wsKey('widget-versions', widgetId), queryFn: () => api.get(`/widgets/${widgetId}/versions`), enabled: open });
  const restore = useApiMutation((v: number) => api.post(`/widgets/${widgetId}/versions/${v}/restore`), {
    success: 'Version loaded into your draft — publish to make it live',
    invalidate: [['widgets']],
    onSuccess: onClose,
  });
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="Publish history" description="Restore any version into your draft.">
      {q.isLoading ? (
        <LoadingBlock />
      ) : !q.data?.items.length ? (
        <p className="text-[14px] text-[var(--ink-3)]">Nothing published yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--separator)]">
          {q.data.items.map((v: any) => (
            <li key={v.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-[14px] font-semibold text-[var(--ink)]">Version {v.version}</p>
                <p className="text-[12px] text-[var(--ink-3)]">
                  {v.publishedByEmail} · {timeAgo(v.createdAt)}
                </p>
              </div>
              <Button size="sm" variant="outline" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => restore.mutate(v.version)}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
};
