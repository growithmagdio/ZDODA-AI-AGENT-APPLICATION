import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, StatusPill, Sheet, TextField, EmptyState, Badge } from '@zdoda/ui';
import { Globe, Network, FileUp, FileText, MessagesSquare, BookOpen, RefreshCw, Trash2, Search, Loader2, Plus, X, Eye } from 'lucide-react';
import type { KnowledgeSourceDTO, KnowledgeSourceType } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, wsKey, timeAgo, fmt } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock, TextArea, SectionTitle } from '../../components/common/Page';
import { useToast } from '../../context/ToastContext';

type AddKind = 'url' | 'sitemap' | 'file' | 'text' | 'faq';

const KINDS: { kind: AddKind; title: string; desc: string; icon: React.ReactNode }[] = [
  { kind: 'sitemap', title: 'Whole website', desc: 'Reads your sitemap or crawls your pages', icon: <Network className="w-5 h-5" /> },
  { kind: 'url', title: 'Single page', desc: 'One web page, e.g. your pricing page', icon: <Globe className="w-5 h-5" /> },
  { kind: 'file', title: 'Upload a file', desc: 'PDF, Word, TXT, Markdown or CSV (20 MB)', icon: <FileUp className="w-5 h-5" /> },
  { kind: 'faq', title: 'FAQ', desc: 'Questions and answers you write', icon: <MessagesSquare className="w-5 h-5" /> },
  { kind: 'text', title: 'Text', desc: 'Paste policies, hours, anything', icon: <FileText className="w-5 h-5" /> },
];

const TYPE_ICON: Record<KnowledgeSourceType, React.ReactNode> = {
  url: <Globe className="w-4 h-4" />,
  sitemap: <Network className="w-4 h-4" />,
  file: <FileUp className="w-4 h-4" />,
  text: <FileText className="w-4 h-4" />,
  faq: <MessagesSquare className="w-4 h-4" />,
};

interface ListResponse {
  items: (KnowledgeSourceDTO & { faqCount?: number })[];
  embedding: { provider: string; model: string; live: boolean };
}

export const KnowledgePage: React.FC = () => {
  const can = useCan();
  const toast = useToast();
  const [adding, setAdding] = useState<AddKind | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const q = useQuery({
    queryKey: wsKey('knowledge'),
    queryFn: () => api.get<ListResponse>('/knowledge/sources'),
    refetchInterval: (query) => (query.state.data?.items.some((s) => s.status === 'queued' || s.status === 'processing') ? 2500 : false),
  });
  const reprocess = useApiMutation((id: string) => api.post(`/knowledge/sources/${id}/reprocess`), { success: 'Re-indexing started', invalidate: [['knowledge']] });
  const remove = useApiMutation((id: string) => api.del(`/knowledge/sources/${id}`), { success: 'Source removed', invalidate: [['knowledge']] });

  const items = q.data?.items || [];
  const totalChunks = items.reduce((s, i) => s + (i.chunkCount || 0), 0);
  const stale = q.data ? items.filter((s) => s.status === 'ready' && s.embeddingModel && s.embeddingModel !== q.data!.embedding.model) : [];

  return (
    <Page
      title="Knowledge Base"
      subtitle="Everything your agents know. Answers are grounded in these sources and cite them."
      action={can('create', 'Knowledge') && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setAdding('sitemap')}>Add knowledge</Button>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-4">
          {can('create', 'Knowledge') && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {KINDS.map((k) => (
                <button key={k.kind} onClick={() => setAdding(k.kind)} className="text-left p-3.5 rounded-[14px] border border-[var(--separator)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-card)] transition-all">
                  <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-tint)] text-[var(--accent-ink)] flex items-center justify-center mb-2">{k.icon}</div>
                  <p className="text-[13px] font-semibold text-[var(--ink)]">{k.title}</p>
                  <p className="text-[11px] text-[var(--ink-3)] leading-snug mt-0.5">{k.desc}</p>
                </button>
              ))}
            </div>
          )}

          {stale.length > 0 && (
            <Card variant="inset" className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-[var(--ink-2)]">
                {stale.length} source{stale.length > 1 ? 's were' : ' was'} indexed with a different embedding model. Re-index for best results.
              </p>
              <Button size="sm" variant="outline" onClick={() => stale.forEach((s) => reprocess.mutate(s.id))}>
                Re-index all
              </Button>
            </Card>
          )}

          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--separator)]">
              <div>
                <p className="text-[15px] font-semibold text-[var(--ink)]">Sources</p>
                <p className="text-[12px] text-[var(--ink-3)]">
                  {items.length} sources · {fmt(totalChunks)} searchable chunks
                </p>
              </div>
              {q.data && <StatusPill status={q.data.embedding.live ? 'live' : 'demo'} label={q.data.embedding.live ? 'Semantic search' : 'Keyword search (demo)'} />}
            </div>
            {q.isLoading ? (
              <div className="p-5">
                <LoadingBlock />
              </div>
            ) : q.error ? (
              <div className="p-5">
                <ErrorBlock error={q.error} onRetry={() => q.refetch()} />
              </div>
            ) : !items.length ? (
              <EmptyState className="border-0" icon={<BookOpen className="w-8 h-8" />} title="No knowledge yet" description="Add your website or upload a document — your agent will answer from it within a minute." actionLabel={can('create', 'Knowledge') ? 'Add your website' : undefined} onAction={() => setAdding('sitemap')} />
            ) : (
              <ul className="divide-y divide-[var(--separator)]">
                {items.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] text-[var(--ink-2)] flex items-center justify-center shrink-0">{TYPE_ICON[s.type]}</div>
                    <button className="min-w-0 flex-1 text-left" onClick={() => setViewing(s.id)}>
                      <p className="text-[14px] font-medium text-[var(--ink)] truncate">{s.name}</p>
                      <p className="text-[12px] text-[var(--ink-3)] truncate">
                        {s.status === 'failed' ? (
                          <span className="text-[var(--danger)]">{s.error}</span>
                        ) : (
                          <>
                            {s.url || s.fileName || (s.type === 'faq' ? `${s.faqCount ?? ''} questions` : 'Text')}
                            {s.status === 'ready' && ` · ${fmt(s.chunkCount)} chunks${s.type === 'sitemap' ? ` · ${s.pageCount} pages` : ''}`}
                            {' · '}
                            {timeAgo(s.updatedAt)}
                          </>
                        )}
                      </p>
                    </button>
                    <SourceStatus s={s} />
                    <div className="flex items-center">
                      <IconBtn label="View" onClick={() => setViewing(s.id)}>
                        <Eye className="w-4 h-4" />
                      </IconBtn>
                      {can('update', 'Knowledge') && (
                        <IconBtn label="Re-index" onClick={() => reprocess.mutate(s.id)} disabled={s.status === 'processing' || s.status === 'queued'}>
                          <RefreshCw className="w-4 h-4" />
                        </IconBtn>
                      )}
                      {can('delete', 'Knowledge') && (
                        <IconBtn label="Delete" onClick={() => window.confirm(`Remove “${s.name}” from the knowledge base?`) && remove.mutate(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </IconBtn>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <RetrievalTester />
      </div>

      <AddSourceSheet kind={adding} onClose={() => setAdding(null)} onAdded={() => toast('Added — indexing now', { description: 'Your agent can use it as soon as it shows Ready.' })} />
      <SourceSheet id={viewing} onClose={() => setViewing(null)} />
    </Page>
  );
};

const IconBtn: React.FC<{ label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ label, onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className="p-2 rounded-lg text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] disabled:opacity-40">
    {children}
  </button>
);

const SourceStatus: React.FC<{ s: KnowledgeSourceDTO }> = ({ s }) => {
  if (s.status === 'ready') return <StatusPill status="live" label="Ready" />;
  if (s.status === 'failed') return <StatusPill status="setup_required" label="Failed" />;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent-ink)] px-2 py-1 rounded-full bg-[var(--accent-tint)]">
      <Loader2 className="w-3 h-3 animate-spin" />
      {s.status === 'queued' ? 'Queued' : s.type === 'sitemap' && s.pageCount ? `Reading · ${s.pageCount} pages` : 'Indexing'}
    </span>
  );
};

const AddSourceSheet: React.FC<{ kind: AddKind | null; onClose: () => void; onAdded: () => void }> = ({ kind, onClose, onAdded }) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [maxPages, setMaxPages] = useState(30);
  const [faq, setFaq] = useState([{ q: '', a: '' }]);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setUrl('');
    setName('');
    setText('');
    setFaq([{ q: '', a: '' }]);
    setFile(null);
  };
  const add = useApiMutation(
    async () => {
      if (kind === 'file') return api.upload('/knowledge/upload', file!, name ? { name } : {});
      if (kind === 'url') return api.post('/knowledge/sources', { type: 'url', url: normalizeUrl(url), name: name || undefined });
      if (kind === 'sitemap') return api.post('/knowledge/sources', { type: 'sitemap', url: normalizeUrl(url), name: name || undefined, maxPages });
      if (kind === 'text') return api.post('/knowledge/sources', { type: 'text', name, text });
      return api.post('/knowledge/sources', { type: 'faq', name: name || 'FAQ', items: faq.filter((f) => f.q.trim() && f.a.trim()) });
    },
    {
      invalidate: [['knowledge']],
      onSuccess: () => {
        reset();
        onClose();
        onAdded();
      },
    }
  );

  const valid =
    kind === 'file' ? Boolean(file) : kind === 'url' || kind === 'sitemap' ? url.trim().length > 3 : kind === 'text' ? name.trim() && text.trim().length > 10 : faq.some((f) => f.q.trim() && f.a.trim());
  const meta = KINDS.find((k) => k.kind === kind);

  return (
    <Sheet
      open={Boolean(kind)}
      onOpenChange={(o) => !o && onClose()}
      title={meta ? `Add: ${meta.title}` : ''}
      description={meta?.desc}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={add.isPending} disabled={!valid} onClick={() => add.mutate()}>
            Add & index
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {(kind === 'url' || kind === 'sitemap') && (
          <>
            <TextField label={kind === 'sitemap' ? 'Website or sitemap URL' : 'Page URL'} value={url} onChange={(e) => setUrl(e.target.value)} placeholder={kind === 'sitemap' ? 'https://yourbusiness.com' : 'https://yourbusiness.com/pricing'} autoFocus />
            {kind === 'sitemap' && (
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[var(--ink-2)]">Pages to read: up to {maxPages}</label>
                <input type="range" min={5} max={50} step={5} value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
                <p className="text-[12px] text-[var(--ink-3)]">We use /sitemap.xml when it exists; otherwise we follow links on your site.</p>
              </div>
            )}
          </>
        )}
        {kind === 'file' && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
            }}
            className="w-full p-8 rounded-[14px] border-2 border-dashed border-[var(--separator-strong)] text-center hover:border-[var(--accent)] transition-colors"
          >
            <FileUp className="w-7 h-7 mx-auto text-[var(--accent)] mb-2" />
            <p className="text-[14px] font-semibold text-[var(--ink)]">{file ? file.name : 'Choose a file or drop it here'}</p>
            <p className="text-[12px] text-[var(--ink-3)]">{file ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF, DOCX, TXT, MD, CSV, HTML · max 20 MB'}</p>
            <input ref={fileRef} type="file" hidden accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json,.html,.htm,.tsv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </button>
        )}
        {kind !== 'faq' && <TextField label={kind === 'text' ? 'Title' : 'Display name (optional)'} value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'text' ? 'e.g. Cancellation policy' : ''} />}
        {kind === 'text' && <TextArea label="Content" rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste anything your agent should know…" />}
        {kind === 'faq' && (
          <div className="space-y-3">
            <TextField label="FAQ name" value={name} onChange={(e) => setName(e.target.value)} placeholder="FAQ" />
            {faq.map((f, i) => (
              <div key={i} className="p-3 rounded-[12px] bg-[var(--surface-2)] border border-[var(--separator)] space-y-2 relative">
                {faq.length > 1 && (
                  <button className="absolute top-2 right-2 p-1 text-[var(--ink-3)]" aria-label="Remove question" onClick={() => setFaq(faq.filter((_, j) => j !== i))}>
                    <X className="w-4 h-4" />
                  </button>
                )}
                <TextField placeholder="Question" value={f.q} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                <TextArea rows={2} placeholder="Answer" value={f.a} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              </div>
            ))}
            <Button variant="ghost" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setFaq([...faq, { q: '', a: '' }])}>
              Add question
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
};

const normalizeUrl = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`);

const SourceSheet: React.FC<{ id: string | null; onClose: () => void }> = ({ id, onClose }) => {
  const q = useQuery({ queryKey: wsKey('knowledge', id), queryFn: () => api.get(`/knowledge/sources/${id}`), enabled: Boolean(id) });
  const s = q.data?.source;
  return (
    <Sheet open={Boolean(id)} onOpenChange={(o) => !o && onClose()} title={s?.name || 'Source'} description={s ? `${s.chunkCount} chunks · ${fmt(s.charCount)} characters` : undefined} className="md:max-w-2xl">
      {q.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-3">
          {s?.status === 'failed' && <p className="text-[13px] text-[var(--danger)]">{s.error}</p>}
          {q.data?.chunks?.map((c: any) => (
            <div key={c.id} className="p-3 rounded-[12px] bg-[var(--surface-2)] border border-[var(--separator)]">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">#{c.ordinal + 1}</Badge>
                {c.url && (
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-[12px] text-[var(--accent-ink)] truncate hover:underline">
                    {c.url}
                  </a>
                )}
              </div>
              <p className="text-[13px] text-[var(--ink-2)] whitespace-pre-wrap line-clamp-6">{c.text}</p>
            </div>
          ))}
          {q.data?.chunks?.length === 25 && <p className="text-[12px] text-center text-[var(--ink-3)]">Showing the first 25 chunks</p>}
        </div>
      )}
    </Sheet>
  );
};

const RetrievalTester: React.FC = () => {
  const [query, setQuery] = useState('');
  const search = useApiMutation((qs: string) => api.post<{ results: { id: string; title: string; url: string | null; text: string; score: number }[] }>('/knowledge/search', { query: qs }));
  return (
    <Card className="space-y-4 lg:sticky lg:top-20">
      <SectionTitle title="Test retrieval" description="See which passages your agent would read for a question." />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length > 1) search.mutate(query.trim());
        }}
      >
        <TextField value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Do you take insurance?" icon={<Search className="w-4 h-4" />} />
        <Button type="submit" loading={search.isPending} disabled={query.trim().length < 2}>
          Search
        </Button>
      </form>
      {search.data && (
        <div className="space-y-2 max-h-[520px] overflow-y-auto">
          {!search.data.results.length && <p className="text-[13px] text-[var(--ink-3)]">No matching passages. Add a source that covers this topic.</p>}
          {search.data.results.map((r) => (
            <div key={r.id} className="p-3 rounded-[12px] border border-[var(--separator)]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[13px] font-semibold text-[var(--ink)] truncate">{r.title}</p>
                <Badge variant={r.score > 0.5 ? 'accent' : 'outline'}>{Math.round(r.score * 100)}%</Badge>
              </div>
              <p className="text-[12px] text-[var(--ink-2)] line-clamp-4">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
