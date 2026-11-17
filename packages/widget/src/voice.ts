/**
 * Browser voice calls to a Zdoda agent over LiveKit (WebRTC).
 * Used by the dashboard test-call panel and the embedded widget (loaded on demand as zdoda-voice.js).
 */
import { Room, RoomEvent, Track, ParticipantKind, type RemoteTrack } from 'livekit-client';

export type VoiceState = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended' | 'error';

export interface TranscriptLine {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  final: boolean;
}

export interface VoiceCallOptions {
  serverUrl: string;
  token: string;
  onState?: (state: VoiceState, detail?: string) => void;
  onTranscript?: (lines: TranscriptLine[]) => void;
}

export interface VoiceCall {
  hangup: () => Promise<void>;
  setMuted: (muted: boolean) => Promise<void>;
  room: Room;
}

export async function startVoiceCall(opts: VoiceCallOptions): Promise<VoiceCall> {
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const lines = new Map<string, TranscriptLine>();
  const audioEls: HTMLMediaElement[] = [];
  let ended = false;
  const emit = () => opts.onTranscript?.([...lines.values()]);
  const setState = (s: VoiceState, d?: string) => !ended && opts.onState?.(s, d);

  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
    if (track.kind !== Track.Kind.Audio) return;
    const el = track.attach();
    el.style.display = 'none';
    document.body.appendChild(el);
    audioEls.push(el);
  });

  // Agent state is published as a participant attribute by LiveKit Agents.
  room.on(RoomEvent.ParticipantAttributesChanged, (_changed, participant) => {
    if (participant.kind !== ParticipantKind.AGENT) return;
    const s = participant.attributes['lk.agent.state'];
    if (s === 'speaking') setState('speaking');
    else if (s === 'thinking') setState('thinking');
    else if (s === 'listening') setState('listening');
  });

  // Live transcription of both sides (text streams on the lk.transcription topic).
  room.registerTextStreamHandler('lk.transcription', async (reader, participant) => {
    const segmentId = reader.info.attributes?.['lk.segment_id'] || reader.info.id;
    const role: TranscriptLine['role'] = participant.identity === room.localParticipant.identity ? 'user' : 'assistant';
    let text = '';
    for await (const chunk of reader) {
      text = reader.info.attributes?.['lk.transcription_final'] === 'true' ? chunk : text + chunk;
      lines.set(segmentId, { id: segmentId, role, text, final: false });
      emit();
    }
    lines.set(segmentId, { id: segmentId, role, text, final: true });
    emit();
  });

  room.on(RoomEvent.Disconnected, () => {
    setState('ended');
    ended = true;
    audioEls.forEach((el) => el.remove());
  });

  setState('connecting');
  try {
    await room.connect(opts.serverUrl, opts.token);
    await room.localParticipant.setMicrophoneEnabled(true);
  } catch (e: any) {
    setState('error', e?.name === 'NotAllowedError' ? 'Microphone permission was denied.' : e?.message || 'Could not start the call.');
    await room.disconnect();
    throw e;
  }
  setState('listening');

  return {
    room,
    hangup: async () => {
      await room.disconnect();
    },
    setMuted: async (muted) => {
      await room.localParticipant.setMicrophoneEnabled(!muted);
    },
  };
}
