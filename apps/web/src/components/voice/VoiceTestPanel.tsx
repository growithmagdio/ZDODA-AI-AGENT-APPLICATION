import React, { useEffect, useRef, useState } from 'react';
import { Button, StatusPill } from '@zdoda/ui';
import { Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react';
import type { TranscriptLine, VoiceCall, VoiceState } from '@zdoda/widget/voice';
import { api, ApiError } from '../../lib/api';

const LABEL: Record<VoiceState, string> = {
  connecting: 'Connecting…',
  listening: 'Listening — go ahead and talk',
  thinking: 'Thinking…',
  speaking: 'Speaking',
  ended: 'Call ended',
  error: 'Call failed',
};

/** Talk to an agent in the browser (POST /voice/test-call → LiveKit). Test calls don't use plan minutes. */
export const VoiceTestPanel: React.FC<{ agentId: string; disabled?: boolean; ready: boolean }> = ({ agentId, disabled, ready }) => {
  const [state, setState] = useState<VoiceState | null>(null);
  const [detail, setDetail] = useState('');
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [muted, setMuted] = useState(false);
  const callRef = useRef<VoiceCall | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => void callRef.current?.hangup(), []);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lines]);

  const start = async () => {
    setLines([]);
    setDetail('');
    setState('connecting');
    try {
      const [{ startVoiceCall }, tok] = await Promise.all([import('@zdoda/widget/voice'), api.post<{ serverUrl: string; token: string }>('/voice/test-call', { agentId })]);
      callRef.current = await startVoiceCall({
        serverUrl: tok.serverUrl,
        token: tok.token,
        onState: (s, d) => {
          setState(s);
          setDetail(d || '');
          if (s === 'ended') callRef.current = null;
        },
        onTranscript: setLines,
      });
    } catch (e) {
      setState('error');
      setDetail(e instanceof ApiError ? e.message : (e as Error)?.message || 'Could not start the call');
    }
  };

  const live = state && !['ended', 'error'].includes(state);
  return (
    <div className="flex flex-col h-full min-h-[420px] rounded-[16px] border border-[var(--separator)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
        <div>
          <p className="text-[14px] font-semibold text-[var(--ink)]">Test by voice</p>
          <p className="text-[12px] text-[var(--ink-3)]">Talk to the saved agent in your browser · not counted in usage</p>
        </div>
        {!ready && <StatusPill status="setup_required" label="Voice not set up" />}
      </div>
      <div className="flex-1 flex flex-col items-center px-4 py-6 gap-4">
        <div
          className={`w-28 h-28 rounded-full bg-[var(--accent)] transition-transform ${state === 'speaking' ? 'animate-pulse scale-105' : state === 'listening' ? 'scale-100' : 'scale-95 opacity-80'}`}
          aria-hidden
        />
        <p className="text-[14px] font-semibold text-[var(--ink)]" aria-live="polite">
          {state ? detail || LABEL[state] : ready ? 'Press call and speak like a customer would' : 'Add the LiveKit, Deepgram and voice keys to enable calls'}
        </p>
        <div ref={listRef} className="w-full flex-1 max-h-[220px] overflow-y-auto space-y-1.5 text-[13px]">
          {lines.map((l) => (
            <p key={l.id} className={l.role === 'user' ? 'text-[var(--ink-2)]' : 'text-[var(--ink)]'}>
              <b>{l.role === 'user' ? 'You' : 'Agent'}:</b> {l.text}
            </p>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-3 p-4 border-t border-[var(--separator)]">
        {live ? (
          <>
            <Button
              variant="outline"
              icon={muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              onClick={async () => {
                await callRef.current?.setMuted(!muted);
                setMuted(!muted);
              }}
            >
              {muted ? 'Unmute' : 'Mute'}
            </Button>
            <Button variant="destructive" icon={<PhoneOff className="w-4 h-4" />} onClick={() => callRef.current?.hangup()}>
              End call
            </Button>
          </>
        ) : (
          <Button icon={<PhoneCall className="w-4 h-4" />} disabled={disabled || !ready} onClick={start}>
            Start test call
          </Button>
        )}
      </div>
    </div>
  );
};
