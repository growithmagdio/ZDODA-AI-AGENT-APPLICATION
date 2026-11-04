import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, SegmentedControl, StatusPill, Badge, Avatar, EmptyState } from '@zdoda/ui';
import { Inbox, Search, Send, Bot, UserRound, CheckCircle2, RotateCcw, Download, Globe, FlaskConical, Mail, Phone, Link as LinkIcon } from 'lucide-react';
import type { ConversationDTO, MessageDTO } from '@zdoda/shared';
import { api } from '../../lib/api';
import { useApiMutation, useCan, wsKey, timeAgo } from '../../lib/hooks';
import { Page, LoadingBlock, ErrorBlock } from '../../components/common/Page';

type Filter = 'all' | 'handoff' | 'open' | 'resolved';
type ListResp = { items: (ConversationDTO & { firstMessage?: string })[]; counts: Record<Filter, number> };

export const InboxPage: React.FC = () => {
  const [tab, setTab] = useState<'conversations' | 'leads'>('conversations');
  return (
    <Page
      wide
      title="Inbox"
      subtitle="Every conversation across your channels. Jump in any time — the AI steps aside while you reply."
      action={<SegmentedControl value={tab} onChange={setTab} items={[{ value: 'conversations', label: 'Conversations' }, { value: 'leads', label: 'Leads' }]} />}
    >
      {tab === 'conversations' ? <Conversations /> : <Leads />}
    </Page>
  );
};

const channelIcon = (c: string) => (c === 'test' ? <FlaskConical className="w-3 h-3" /> : <Globe className="w-3 h-3" />);
const contactName = (c: ConversationDTO) => c.contact?.name || c.contact?.email || c.contact?.phone || `Visitor ${c.id.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase()}`;

const Conversations: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [includeTest, setIncludeTest] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const list = useQuery({
    queryKey: wsKey('conversations', filter, q, includeTest),
    queryFn: () => api.get<ListResp>(`/conversations?status=${filter}&q=${encodeURIComponent(q)}&includeTest=${includeTest}`),
    refetchInterval: 5000,
  });
  const items = list.data?.items || [];
  useEffect(() => {
    if (!selected && items[0]) setSelected(items[0].id);
  }, [items, selected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-4 min-h-[640px]">
      <Card className="p-0 overflow-hidden flex flex-col max-h-[calc(100vh-220px)] min-h-[560px]">
        <div className="p-3 space-y-2 border-b border-[var(--separator)]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages, names, emails" className="w-full h-9 pl-9 pr-3 rounded-[10px] bg-[var(--surface-2)] text-[13px] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30" aria-label="Search conversations" />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                ['all', 'All'],
                ['handoff', 'Needs human'],
                ['open', 'AI handling'],
                ['resolved', 'Resolved'],
              ] as [Filter, string][]
            ).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} className={`px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap ${filter === k ? 'bg-[var(--accent)] text-white' : 'text-[var(--ink-2)] hover:bg-[var(--surface-2)]'}`}>
                {label}
                {list.data && <span className="ml-1 opacity-70">{list.data.counts[k]}</span>}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[12px] text-[var(--ink-3)]">
            <input type="checkbox" checked={includeTest} onChange={(e) => setIncludeTest(e.target.checked)} /> Show test chats
          </label>
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.isLoading ? (
            <div className="p-3">
              <LoadingBlock rows={5} />
            </div>
          ) : list.error ? (
            <div className="p-3">
              <ErrorBlock error={list.error} />
            </div>
          ) : !items.length ? (
            <p className="p-6 text-center text-[13px] text-[var(--ink-3)]">No conversations here yet. Once your widget is live, chats appear instantly.</p>
          ) : (
            items.map((c) => (
              <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left px-4 py-3 border-b border-[var(--separator)] flex gap-3 ${selected === c.id ? 'bg-[var(--accent-tint)]' : 'hover:bg-[var(--surface-2)]'}`}>
                <Avatar name={contactName(c)} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[var(--ink)] truncate">{contactName(c)}</p>
                    <span className="ml-auto text-[11px] text-[var(--ink-3)] shrink-0">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <p className="text-[12px] text-[var(--ink-2)] truncate">{c.lastMessage}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-3)]">
                      {channelIcon(c.channel)} {c.channel === 'web' ? 'Website' : c.channel}
                    </span>
                    {c.status === 'handoff' && <Badge variant="accent">Needs human</Badge>}
                    {c.status === 'resolved' && <Badge variant="outline">Resolved</Badge>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>
      {selected ? <Thread id={selected} /> : <EmptyState icon={<Inbox className="w-8 h-8" />} title="Select a conversation" description="Pick a chat on the left to read it and reply." />}
    </div>
  );
};

const Thread: React.FC<{ id: string }> = ({ id }) => {
  const can = useCan();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const q = useQuery({ queryKey: wsKey('conversation', id), queryFn: () => api.get<{ conversation: ConversationDTO & { firstMessage?: string }; messages: (MessageDTO & { meta?: any })[] }>(`/conversations/${id}`), refetchInterval: 4000 });
  const inv = [['conversation', id], ['conversations']];
  const reply = useApiMutation((t: string) => api.post(`/conversations/${id}/messages`, { text: t }), { invalidate: inv, onSuccess: () => setText('') });
  const patch = useApiMutation((body: object) => api.patch(`/conversations/${id}`, body), { invalidate: inv });
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [q.data?.messages.length]);

  if (q.isLoading) return <Card><LoadingBlock rows={6} /></Card>;
  if (q.error || !q.data) return <ErrorBlock error={q.error} />;
  const c = q.data.conversation;
  const editable = can('update', 'Inbox');

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_280px] gap-4">
      <Card className="p-0 overflow-hidden flex flex-col max-h-[calc(100vh-220px)] min-h-[560px]">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-[var(--separator)]">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[var(--ink)] truncate">{contactName(c)}</p>
            <p className="text-[12px] text-[var(--ink-3)]">
              {c.agentName} · started {timeAgo(c.createdAt)}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            {c.takeover ? <StatusPill status="test_mode" label="You're replying" /> : <StatusPill status="live" label="AI replying" />}
            {editable &&
              (c.takeover ? (
                <Button size="sm" variant="outline" icon={<Bot className="w-3.5 h-3.5" />} onClick={() => patch.mutate({ takeover: false })}>
                  Hand back to AI
                </Button>
              ) : (
                <Button size="sm" variant="outline" icon={<UserRound className="w-3.5 h-3.5" />} onClick={() => patch.mutate({ takeover: true, status: 'handoff' })}>
                  Take over
                </Button>
              ))}
            {editable &&
              (c.status === 'resolved' ? (
                <Button size="sm" variant="ghost" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => patch.mutate({ status: 'open' })}>
                  Reopen
                </Button>
              ) : (
                <Button size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={() => patch.mutate({ status: 'resolved' })}>
                  Resolve
                </Button>
              ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[var(--surface-2)]/40">
          {q.data.messages.map((m) =>
            m.role === 'system' ? (
              <p key={m.id} className="text-center text-[11px] text-[var(--ink-3)]">
                {m.text}
              </p>
            ) : (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}>
                <span className="text-[11px] text-[var(--ink-3)] mb-0.5 px-1">
                  {m.role === 'user' ? contactName(c) : m.role === 'human' ? m.authorName || 'Team' : 'AI agent'} · {timeAgo(m.createdAt)}
                </span>
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[14px] whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-[var(--surface)] border border-[var(--separator)] text-[var(--ink)] rounded-bl-md' : m.role === 'human' ? 'bg-emerald-600 text-white rounded-br-md' : 'bg-[var(--accent)] text-white rounded-br-md'
                  }`}
                >
                  {m.text}
                </div>
                {m.citations && m.citations.length > 0 && <span className="text-[11px] text-[var(--ink-3)] mt-0.5 px-1">Sources: {m.citations.map((x) => x.title).join(', ')}</span>}
              </div>
            )
          )}
          <div ref={endRef} />
        </div>
        {editable && (
          <form
            className="flex items-end gap-2 p-3 border-t border-[var(--separator)]"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) reply.mutate(text.trim());
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (text.trim()) reply.mutate(text.trim());
                }
              }}
              rows={1}
              placeholder={c.takeover ? 'Reply to the customer…' : 'Type to reply — the AI pauses while you handle this chat'}
              className="flex-1 resize-none min-h-[40px] max-h-32 px-3 py-2.5 rounded-[10px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              aria-label="Reply"
            />
            <Button type="submit" loading={reply.isPending} disabled={!text.trim()} icon={<Send className="w-4 h-4" />}>
              Send
            </Button>
          </form>
        )}
      </Card>
      <Card className="space-y-4 h-fit">
        <p className="text-[14px] font-semibold text-[var(--ink)]">Contact</p>
        <InfoRow icon={<UserRound className="w-4 h-4" />} label="Name" value={c.contact?.name} />
        <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={c.contact?.email} />
        <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={c.contact?.phone} />
        <InfoRow icon={<LinkIcon className="w-4 h-4" />} label="Page" value={c.pageUrl} />
        <div className="pt-3 border-t border-[var(--separator)] text-[12px] text-[var(--ink-3)] space-y-1">
          <p>{c.messageCount} messages</p>
          <p>Channel: {c.channel === 'web' ? 'Website chat' : c.channel}</p>
        </div>
      </Card>
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | null }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <span className="text-[var(--ink-3)] mt-0.5">{icon}</span>
    <div className="min-w-0">
      <p className="text-[11px] text-[var(--ink-3)]">{label}</p>
      <p className="text-[13px] text-[var(--ink)] break-all">{value || '—'}</p>
    </div>
  </div>
);

const Leads: React.FC = () => {
  const q = useQuery({ queryKey: wsKey('leads'), queryFn: () => api.get<{ items: any[] }>('/leads') });
  const exportCsv = async () => {
    const csv = await api.get<string>('/leads?format=csv');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zdoda-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--separator)]">
        <div>
          <p className="text-[15px] font-semibold text-[var(--ink)]">Captured leads</p>
          <p className="text-[12px] text-[var(--ink-3)]">People who shared an email or phone number in chat</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={exportCsv} disabled={!q.data?.items.length}>
          Export CSV
        </Button>
      </div>
      {q.isLoading ? (
        <div className="p-5">
          <LoadingBlock />
        </div>
      ) : !q.data?.items.length ? (
        <p className="p-8 text-center text-[13px] text-[var(--ink-3)]">No leads yet. Turn on “Capture leads” in your agent's settings.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[12px] text-[var(--ink-3)] bg-[var(--surface-2)]">
              <tr>
                {['Name', 'Email', 'Phone', 'First message', 'Captured'].map((h) => (
                  <th key={h} className="px-5 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--separator)]">
              {q.data.items.map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-3 font-medium text-[var(--ink)]">{l.name || '—'}</td>
                  <td className="px-5 py-3 text-[var(--ink-2)]">{l.email || '—'}</td>
                  <td className="px-5 py-3 text-[var(--ink-2)]">{l.phone || '—'}</td>
                  <td className="px-5 py-3 text-[var(--ink-2)] max-w-[320px] truncate">{l.firstMessage}</td>
                  <td className="px-5 py-3 text-[var(--ink-3)] whitespace-nowrap">{timeAgo(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
