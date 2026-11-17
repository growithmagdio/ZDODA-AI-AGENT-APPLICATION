import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatusPill, SegmentedControl, Switch, TextField, Select, Badge } from '@zdoda/ui';
import { ArrowLeft, Save, Rocket, AlertCircle, History, Wrench } from 'lucide-react';
import { MODEL_CATALOG, TTS_VOICES, type AgentDTO, type KnowledgeSourceDTO, type LlmProvider, type ToolDTO } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, useSystemStatus, wsKey } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, TextArea, Field } from '../../components/common/Page';
import { ChatTester } from '../../components/common/ChatTester';
import { VoiceTestPanel } from '../../components/voice/VoiceTestPanel';
import { timeAgo } from '../../lib/hooks';

type Tab = 'behavior' | 'knowledge' | 'model' | 'voice' | 'tools' | 'handoff' | 'versions';

const LANGS = ['auto', 'English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Hindi', 'Indonesian', 'Japanese', 'Chinese'];

export const AgentBuilderPage: React.FC = () => {
  const { id = '' } = useParams();
  const can = useCan();
  const editable = can('update', 'Agent');
  const q = useQuery({ queryKey: wsKey('agent', id), queryFn: () => api.get<AgentDTO>(`/agents/${id}`) });
  const sources = useQuery({ queryKey: wsKey('knowledge'), queryFn: () => api.get<{ items: KnowledgeSourceDTO[] }>('/knowledge/sources') });
  const sys = useSystemStatus();
  const voiceStatus = useQuery({ queryKey: ['voice-status'], queryFn: () => api.get<{ livekit: boolean; phoneReady: boolean }>('/voice/status'), staleTime: 60_000 });
  const tools = useQuery({ queryKey: wsKey('tools'), queryFn: () => api.get<{ items: ToolDTO[] }>('/tools') });
  const versions = useQuery({ queryKey: wsKey('agent-versions', id), queryFn: () => api.get<{ items: { id: string; version: number; publishedByEmail: string; createdAt: string }[] }>(`/agents/${id}/versions`) });
  const restore = useApiMutation((v: number) => api.post(`/agents/${id}/versions/${v}/restore`), { success: 'Version restored into the draft — publish to make it live', invalidate: [['agent', id], ['agent-versions', id]] });
  const [tab, setTab] = useState<Tab>('behavior');
  const [draft, setDraft] = useState<AgentDTO | null>(null);

  useEffect(() => {
    if (q.data) setDraft(q.data);
  }, [q.data]);

  const dirty = useMemo(() => draft && q.data && JSON.stringify(draft) !== JSON.stringify(q.data), [draft, q.data]);
  const save = useApiMutation(
    (d: AgentDTO) => {
      const { id: _id, status, publishedAt, createdAt, updatedAt, ...body } = d;
      return api.patch<AgentDTO>(`/agents/${id}`, body);
    },
    { success: 'Agent saved', invalidate: [['agent', id], ['agents']] }
  );
  const publish = useApiMutation((unpublish: boolean) => api.post<AgentDTO>(`/agents/${id}/publish`, { unpublish }), {
    success: (a) => (a.status === 'published' ? 'Agent published — it can now answer on your channels' : 'Agent moved back to draft'),
    invalidate: [['agent', id], ['agents'], ['agent-versions', id]],
  });

  if (q.isLoading || !draft) return <Page title="Agent">{q.error ? <ErrorBlock error={q.error} onRetry={() => q.refetch()} /> : <LoadingBlock rows={5} />}</Page>;

  const set = <K extends keyof AgentDTO>(k: K, v: AgentDTO[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const available = new Set<LlmProvider>(sys.data?.llm.available || ['mock']);
  const selectedModel = MODEL_CATALOG.find((m) => m.id === draft.model.id);
  const providerMissing = draft.model.provider !== 'mock' && sys.data && !available.has(draft.model.provider);
  const readySources = sources.data?.items.filter((s) => s.status === 'ready') || [];

  return (
    <Page
      wide
      title={draft.name}
      subtitle={draft.description || 'Configure how this agent behaves, what it knows and which model it uses.'}
      action={
        <div className="flex items-center gap-2">
          <StatusPill status={q.data?.status === 'published' ? 'live' : 'setup_required'} label={q.data?.status === 'published' ? 'Published' : 'Draft'} size="md" />
          {editable && (
            <Button variant="outline" icon={<Save className="w-4 h-4" />} disabled={!dirty} loading={save.isPending} onClick={() => save.mutate(draft)}>
              Save
            </Button>
          )}
          {can('publish', 'Agent') && (
            <Button
              icon={<Rocket className="w-4 h-4" />}
              loading={publish.isPending}
              disabled={Boolean(dirty)}
              title={dirty ? 'Save your changes first' : undefined}
              variant={q.data?.status === 'published' ? 'secondary' : 'primary'}
              onClick={() => publish.mutate(q.data?.status === 'published')}
            >
              {q.data?.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
          )}
        </div>
      }
    >
      <Link to="/agents" className="inline-flex items-center gap-1 text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] -mt-3">
        <ArrowLeft className="w-3.5 h-3.5" /> All agents
      </Link>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        <Card className="space-y-5">
          <div className="overflow-x-auto -mx-1 px-1">
          <SegmentedControl<Tab>
            value={tab}
            onChange={setTab}
            items={[
              { value: 'behavior', label: 'Behavior' },
              { value: 'knowledge', label: 'Knowledge' },
              { value: 'model', label: 'Model' },
              { value: 'voice', label: 'Voice' },
              { value: 'tools', label: 'Tools' },
              { value: 'handoff', label: 'Leads & handoff' },
              { value: 'versions', label: 'History' },
            ]}
          />
          </div>
          <fieldset disabled={!editable} className="space-y-4">
            {tab === 'behavior' && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextField label="Name" value={draft.name} onChange={(e) => set('name', e.target.value)} maxLength={60} />
                  <Select label="Reply language" value={draft.language} onChange={(e) => set('language', e.target.value)} options={LANGS.map((l) => ({ value: l, label: l === 'auto' ? 'Match the customer' : l }))} />
                </div>
                <TextField label="Short description" value={draft.description} onChange={(e) => set('description', e.target.value)} maxLength={280} placeholder="What this agent is for" />
                <TextArea
                  label="Instructions"
                  rows={9}
                  value={draft.systemPrompt}
                  onChange={(e) => set('systemPrompt', e.target.value)}
                  maxLength={8000}
                  hint="Tell the agent who it is, its tone, what it should and shouldn't do. Example: “You are the friendly front desk of Smile Dental. Help people book check-ups. Never give medical diagnoses.”"
                />
                <TextArea label="Greeting" rows={2} value={draft.greeting} onChange={(e) => set('greeting', e.target.value)} maxLength={500} hint="Shown when a chat starts. The widget's welcome text can override this." />
                <TextArea label="When it doesn't know" rows={2} value={draft.fallbackMessage} onChange={(e) => set('fallbackMessage', e.target.value)} maxLength={500} />
              </>
            )}

            {tab === 'knowledge' && (
              <div className="divide-y divide-[var(--separator)]">
                <Field label="Use the knowledge base" hint="Search your documents and website before answering">
                  <Switch checked={draft.useKnowledge} onCheckedChange={(v) => set('useKnowledge', v)} />
                </Field>
                <Field label="Only answer from knowledge" hint="Recommended. Prevents made-up answers; unknown questions get the fallback message">
                  <Switch checked={draft.strictKnowledge} onCheckedChange={(v) => set('strictKnowledge', v)} />
                </Field>
                <div className="pt-4 space-y-3">
                  <p className="text-[14px] font-medium text-[var(--ink)]">Sources this agent can use</p>
                  <label className="flex items-center gap-2 text-[14px] text-[var(--ink-2)]">
                    <input type="radio" checked={!draft.knowledgeSourceIds.length} onChange={() => set('knowledgeSourceIds', [])} /> All sources in this workspace
                  </label>
                  <label className="flex items-center gap-2 text-[14px] text-[var(--ink-2)]">
                    <input type="radio" checked={draft.knowledgeSourceIds.length > 0} onChange={() => readySources[0] && set('knowledgeSourceIds', [readySources[0].id])} disabled={!readySources.length} /> Only selected sources
                  </label>
                  {draft.knowledgeSourceIds.length > 0 && (
                    <div className="ml-6 space-y-2">
                      {readySources.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-[13px] text-[var(--ink)]">
                          <input
                            type="checkbox"
                            checked={draft.knowledgeSourceIds.includes(s.id)}
                            onChange={(e) => set('knowledgeSourceIds', e.target.checked ? [...draft.knowledgeSourceIds, s.id] : draft.knowledgeSourceIds.filter((x) => x !== s.id))}
                          />
                          {s.name} <span className="text-[var(--ink-3)]">· {s.chunkCount} chunks</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {!sources.data?.items.length && (
                    <p className="text-[13px] text-[var(--ink-3)]">
                      No knowledge yet. <Link className="text-[var(--accent-ink)] font-semibold" to="/knowledge">Add your website or documents →</Link>
                    </p>
                  )}
                </div>
              </div>
            )}

            {tab === 'model' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  {MODEL_CATALOG.map((m) => {
                    const ok = available.has(m.provider);
                    const active = draft.model.id === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => set('model', { ...draft.model, provider: m.provider, id: m.id })}
                        className={`text-left p-3.5 rounded-[12px] border transition-colors ${active ? 'border-[var(--accent)] bg-[var(--accent-tint)]' : 'border-[var(--separator)] hover:border-[var(--separator-strong)]'}`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold text-[var(--ink)]">{m.label}</p>
                          {!ok && <Badge variant="outline">Key needed</Badge>}
                        </div>
                        <p className="text-[12px] text-[var(--ink-3)] mt-0.5">{m.note || m.provider}</p>
                      </button>
                    );
                  })}
                </div>
                <TextField
                  label="Custom model ID (optional)"
                  value={selectedModel ? '' : draft.model.id}
                  placeholder={`Use another ${draft.model.provider === 'mock' ? 'provider' : draft.model.provider} model, e.g. a newer release`}
                  onChange={(e) => e.target.value && set('model', { ...draft.model, id: e.target.value })}
                />
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[var(--ink-2)]">Creativity: {draft.model.temperature.toFixed(1)}</label>
                  <input type="range" min={0} max={1} step={0.1} value={draft.model.temperature} onChange={(e) => set('model', { ...draft.model, temperature: Number(e.target.value) })} className="w-full accent-[var(--accent)]" />
                  <p className="text-[12px] text-[var(--ink-3)]">Lower = more factual and consistent. 0.2–0.4 suits customer support.</p>
                </div>
                {providerMissing && (
                  <div className="flex gap-2 p-3 rounded-[10px] bg-amber-500/10 border border-amber-500/30 text-[13px] text-[var(--ink-2)]">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    No {draft.model.provider} API key is configured on the server, so replies will use {sys.data?.llm.live ? `the default ${sys.data.llm.provider} model` : 'the demo model'} until one is added.
                  </div>
                )}
              </div>
            )}


            {tab === 'voice' && (
              <div className="space-y-4">
                <div className="divide-y divide-[var(--separator)]">
                  <Field label="Voice agent" hint="Answer website voice calls and phone calls with this agent">
                    <Switch checked={draft.voice.enabled} onCheckedChange={(v) => set('voice', { ...draft.voice, enabled: v })} />
                  </Field>
                  <Field label="Record calls" hint="Saves audio for the Inbox. Tell callers they are recorded where the law requires it.">
                    <Switch checked={draft.voice.recordCalls} onCheckedChange={(v) => set('voice', { ...draft.voice, recordCalls: v })} />
                  </Field>
                </div>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-[var(--ink-2)]">Voice</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {TTS_VOICES.map((v) => {
                      const active = draft.voice.ttsProvider === v.provider && draft.voice.voiceId === v.id;
                      return (
                        <button
                          type="button"
                          key={v.provider + v.id}
                          onClick={() => set('voice', { ...draft.voice, ttsProvider: v.provider, voiceId: v.id })}
                          className={`text-left p-3 rounded-[12px] border ${active ? 'border-[var(--accent)] bg-[var(--accent-tint)]' : 'border-[var(--separator)]'}`}
                        >
                          <p className="text-[14px] font-semibold text-[var(--ink)]">{v.label}</p>
                          <p className="text-[12px] text-[var(--ink-3)]">
                            {v.accent} · {v.provider === 'elevenlabs' ? 'ElevenLabs' : v.provider === 'cartesia' ? 'Cartesia' : 'OpenAI'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <TextField label="Or a custom voice ID" value={TTS_VOICES.some((v) => v.id === draft.voice.voiceId) ? '' : draft.voice.voiceId} onChange={(e) => set('voice', { ...draft.voice, voiceId: e.target.value })} placeholder="Paste a voice ID from ElevenLabs or Cartesia" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select
                    label="Caller language"
                    value={draft.voice.sttLanguage}
                    onChange={(e) => set('voice', { ...draft.voice, sttLanguage: e.target.value })}
                    options={[
                      { value: 'multi', label: 'Auto-detect (multilingual)' },
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' },
                      { value: 'hi', label: 'Hindi' },
                      { value: 'pt', label: 'Portuguese' },
                      { value: 'ja', label: 'Japanese' },
                    ]}
                  />
                  <TextField label="Transfer calls to (optional)" value={draft.voice.transferNumber} onChange={(e) => set('voice', { ...draft.voice, transferNumber: e.target.value })} placeholder="+15550102020" hint="Used when a caller asks for a person" />
                </div>
                <TextArea label="First thing the agent says (optional)" rows={2} value={draft.voice.firstMessage} onChange={(e) => set('voice', { ...draft.voice, firstMessage: e.target.value })} placeholder={draft.greeting} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextField label="Max call length (minutes)" type="number" min={1} max={60} value={draft.voice.maxCallMinutes} onChange={(e) => set('voice', { ...draft.voice, maxCallMinutes: Math.max(1, Math.min(60, Number(e.target.value) || 15)) })} />
                  <TextField label="Hang up after silence (seconds)" type="number" min={5} max={120} value={draft.voice.idleSeconds} onChange={(e) => set('voice', { ...draft.voice, idleSeconds: Math.max(5, Math.min(120, Number(e.target.value) || 20)) })} />
                </div>
                <TextField
                  label="Words to recognise (comma separated)"
                  value={draft.voice.keywords.join(', ')}
                  onChange={(e) => set('voice', { ...draft.voice, keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 50) })}
                  placeholder="Invisalign, Smile Dental, Dr. Lee"
                  hint="Brand names and terms the speech recogniser should expect"
                />
              </div>
            )}

            {tab === 'tools' && (
              <div className="space-y-3">
                <p className="text-[13px] text-[var(--ink-3)]">Actions this agent can take during a chat or call — booking, saving leads to a sheet, looking up orders. Create tools in <Link className="text-[var(--accent-ink)] font-semibold" to="/tools">Tools & Integrations</Link>.</p>
                <label className="flex items-center gap-2 text-[14px] text-[var(--ink-2)]">
                  <input type="radio" checked={!draft.toolIds.length} onChange={() => set('toolIds', [])} /> All enabled tools in this workspace
                </label>
                <label className="flex items-center gap-2 text-[14px] text-[var(--ink-2)]">
                  <input type="radio" checked={draft.toolIds.length > 0} disabled={!tools.data?.items.length} onChange={() => tools.data?.items[0] && set('toolIds', [tools.data.items[0].id])} /> Only selected tools
                </label>
                {draft.toolIds.length > 0 &&
                  tools.data?.items.map((t) => (
                    <label key={t.id} className="ml-6 flex items-center gap-2 text-[13px] text-[var(--ink)]">
                      <input type="checkbox" checked={draft.toolIds.includes(t.id)} onChange={(e) => set('toolIds', e.target.checked ? [...draft.toolIds, t.id] : draft.toolIds.filter((x) => x !== t.id))} />
                      <Wrench className="w-3.5 h-3.5 text-[var(--ink-3)]" /> {t.name} <span className="text-[var(--ink-3)]">· {t.kind.replace('_', ' ')}</span>
                    </label>
                  ))}
                {!tools.data?.items.length && <p className="text-[13px] text-[var(--ink-3)]">No tools yet.</p>}
              </div>
            )}

            {tab === 'versions' && (
              <div className="space-y-2">
                <p className="text-[13px] text-[var(--ink-3)]">Every publish saves a version. Restore one into the draft, test it, then publish again.</p>
                {!versions.data?.items.length ? (
                  <p className="text-[13px] text-[var(--ink-3)]">No published versions yet.</p>
                ) : (
                  <ul className="divide-y divide-[var(--separator)]">
                    {versions.data.items.map((v) => (
                      <li key={v.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-[var(--ink-3)]" />
                          <span className="text-[14px] font-medium text-[var(--ink)]">Version {v.version}</span>
                          <span className="text-[12px] text-[var(--ink-3)]">
                            {v.publishedByEmail} · {timeAgo(v.createdAt)}
                          </span>
                        </div>
                        {editable && (
                          <button type="button" className="text-[13px] font-semibold text-[var(--accent-ink)]" onClick={() => restore.mutate(v.version)}>
                            Restore
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'handoff' && (
              <div className="divide-y divide-[var(--separator)]">
                <Field label="Capture leads" hint="Ask interested visitors for their email or phone and save them to Leads">
                  <Switch checked={draft.leadCapture} onCheckedChange={(v) => set('leadCapture', v)} />
                </Field>
                <Field label="Human handoff" hint="When someone asks for a person, flag the chat in the Inbox">
                  <Switch checked={draft.handoffEnabled} onCheckedChange={(v) => set('handoffEnabled', v)} />
                </Field>
                <div className="pt-4 space-y-4">
                  <TextArea label="Handoff message" rows={2} value={draft.handoffMessage} onChange={(e) => set('handoffMessage', e.target.value)} disabled={!draft.handoffEnabled} />
                  <TextField
                    label="Booking link (optional)"
                    value={draft.bookingUrl}
                    onChange={(e) => set('bookingUrl', e.target.value)}
                    placeholder="https://calendly.com/your-business"
                    hint="The agent shares this when someone wants to book (Calendly, Cal.com, Google Calendar, etc.)"
                  />
                </div>
              </div>
            )}
          </fieldset>
        </Card>
        <div className="xl:sticky xl:top-20 h-[640px]">
          {tab === 'voice' ? (
            <VoiceTestPanel agentId={id} disabled={Boolean(dirty)} ready={Boolean(voiceStatus.data?.livekit)} />
          ) : (
            <ChatTester agentId={id} greeting={q.data?.greeting} disabled={Boolean(dirty)} />
          )}
          {dirty && <p className="text-[12px] text-[var(--ink-3)] mt-2 text-center">Save your changes to test them.</p>}
        </div>
      </div>
    </Page>
  );
};
