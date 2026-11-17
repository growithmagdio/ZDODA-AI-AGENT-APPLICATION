import React, { useEffect, useRef, useState } from 'react';
import { Button, Badge } from '@zdoda/ui';
import { RotateCcw, Send, BookOpen } from 'lucide-react';
import type { Citation } from '@zdoda/shared';
import { api, ApiError } from '../../lib/api';

interface Msg {
  role: 'user' | 'assistant' | 'system';
  text: string;
  citations?: Citation[];
  demo?: boolean;
}

/** Live test chat against the saved agent (POST /agents/:id/test). Test chats don't count toward usage. */
export const ChatTester: React.FC<{ agentId: string; greeting?: string; disabled?: boolean }> = ({ agentId, greeting, disabled }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (value: string) => {
    const msg = value.trim();
    if (!msg || busy) return;
    setText('');
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setBusy(true);
    try {
      const out = await api.post(`/agents/${agentId}/test`, { message: msg, conversationId });
      setConversationId(out.conversationId);
      if (out.reply) setMessages((m) => [...m, { role: 'assistant', text: out.reply.text, citations: out.reply.citations, demo: out.demo }]);
      if (out.status === 'handoff') setMessages((m) => [...m, { role: 'system', text: 'Handoff triggered — this chat would appear in the Inbox as “Needs human”.' }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'system', text: err instanceof ApiError ? err.message : 'Could not reach the agent' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[480px] rounded-[16px] border border-[var(--separator)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
        <div>
          <p className="text-[14px] font-semibold text-[var(--ink)]">Test your agent</p>
          <p className="text-[12px] text-[var(--ink-3)]">Uses the saved settings · not counted in usage</p>
        </div>
        <button
          onClick={() => {
            setMessages([]);
            setConversationId(null);
          }}
          className="p-2 rounded-lg text-[var(--ink-3)] hover:bg-[var(--surface-2)]"
          aria-label="Reset test chat"
          title="Start over"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--surface-2)]/50">
        {greeting && <Bubble role="assistant" text={greeting} />}
        {messages.map((m, i) => (
          <Bubble key={i} {...m} />
        ))}
        {busy && (
          <div className="flex gap-1 px-3 py-3 rounded-2xl bg-[var(--surface-inset)] w-14" aria-label="Agent is typing">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--ink-3)] animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        )}
      </div>
      <form
        className="flex items-center gap-2 p-3 border-t border-[var(--separator)]"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? 'Save the agent first' : 'Ask something a customer would ask…'}
          disabled={disabled}
          className="flex-1 h-10 px-3 rounded-[10px] border border-[var(--separator-strong)] bg-[var(--surface)] text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
          aria-label="Test message"
        />
        <Button type="submit" size="md" disabled={!text.trim() || busy || disabled} icon={<Send className="w-4 h-4" />}>
          Send
        </Button>
      </form>
    </div>
  );
};

const Bubble: React.FC<Msg> = ({ role, text, citations, demo }) => {
  if (role === 'system') return <p className="text-center text-[12px] text-[var(--ink-3)] px-4">{text}</p>;
  const mine = role === 'user';
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap ${
          mine ? 'bg-[var(--accent)] text-white rounded-br-md' : 'bg-[var(--surface)] border border-[var(--separator)] text-[var(--ink)] rounded-bl-md'
        }`}
      >
        {text}
      </div>
      {!mine && (citations?.length || demo) ? (
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 max-w-[85%]">
          {demo && <Badge variant="outline">Demo model</Badge>}
          {citations?.map((c, i) => (
            <span key={i} title={c.snippet} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--accent-tint)] text-[var(--accent-ink)] max-w-[200px] truncate">
              <BookOpen className="w-3 h-3 shrink-0" />
              {c.url ? (
                <a href={c.url} target="_blank" rel="noreferrer" className="truncate hover:underline">
                  {c.title}
                </a>
              ) : (
                <span className="truncate">{c.title}</span>
              )}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};
