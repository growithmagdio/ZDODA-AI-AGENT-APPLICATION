import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatusPill, SegmentedControl, Switch, TextField, Select, Badge } from '@zdoda/ui';
import { ArrowLeft, Save, Rocket, AlertCircle } from 'lucide-react';
import { MODEL_CATALOG, type AgentDTO, type KnowledgeSourceDTO, type LlmProvider } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, useSystemStatus, wsKey } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, TextArea, Field } from '../../components/common/Page';
import { ChatTester } from '../../components/common/ChatTester';

type Tab = 'behavior' | 'knowledge' | 'model' | 'handoff';

const LANGS = ['auto', 'English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Hindi', 'Indonesian', 'Japanese', 'Chinese'];

export const AgentBuilderPage: React.FC = () => {
  const { id = '' } = useParams();
  const can = useCan();
  const editable = can('update', 'Agent');
  const q = useQuery({ queryKey: wsKey('agent', id), queryFn: () => api.get<AgentDTO>(`/agents/${id}`) });
  const sources = useQuery({ queryKey: wsKey('knowledge'), queryFn: () => api.get<{ items: KnowledgeSourceDTO[] }>('/knowledge/sources') });
  const sys = useSystemStatus();
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
    invalidate: [['agent', id], ['agents']],
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
          <SegmentedControl<Tab>
            value={tab}
            onChange={setTab}
            items={[
              { value: 'behavior', label: 'Behavior' },
              { value: 'knowledge', label: 'Knowledge' },
              { value: 'model', label: 'Model' },
              { value: 'handoff', label: 'Leads & handoff' },
            ]}
          />
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
          <ChatTester agentId={id} greeting={q.data?.greeting} disabled={Boolean(dirty)} />
          {dirty && <p className="text-[12px] text-[var(--ink-3)] mt-2 text-center">Save your changes to test them.</p>}
        </div>
      </div>
    </Page>
  );
};
