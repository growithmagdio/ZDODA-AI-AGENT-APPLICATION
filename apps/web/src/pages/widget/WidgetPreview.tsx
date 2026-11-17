import React, { useEffect, useRef } from 'react';
import { mountWidget, type WidgetInstance } from '@zdoda/widget';
import type { WidgetConfigV1 } from '@zdoda/shared';
import { api } from '../../lib/api';

/** Mounts the real widget runtime (same code as the embed) inside the Studio preview. */
export const WidgetPreview: React.FC<{ config: WidgetConfigV1; agentId?: string; device: 'desktop' | 'mobile'; siteName: string }> = ({ config, agentId, device, siteName }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const inst = useRef<WidgetInstance | null>(null);
  const conv = useRef<string | null>(null);
  const agentRef = useRef(agentId);
  agentRef.current = agentId;

  useEffect(() => {
    if (!hostRef.current) return;
    inst.current = mountWidget(hostRef.current, config, {
      mode: 'preview',
      startOpen: true,
      onSend: async (text) => {
        if (!agentRef.current) return { reply: { text: 'Pick an agent for this widget to test real answers.' } };
        const out = await api.post(`/agents/${agentRef.current}/test`, { message: text, conversationId: conv.current });
        conv.current = out.conversationId;
        return out;
      },
    });
    return () => inst.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device]);

  useEffect(() => {
    inst.current?.update(config);
  }, [config]);

  const site = (
    <div className="absolute inset-0 bg-white overflow-hidden" aria-hidden>
      <div className="h-12 border-b border-black/5 flex items-center px-5 gap-6">
        <div className="w-24 h-3 rounded-full bg-black/80" />
        <div className="ml-auto hidden sm:flex gap-4">
          {[40, 52, 36].map((w, i) => (
            <div key={i} className="h-2 rounded-full bg-black/15" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="p-6 space-y-3">
        <p className="text-[22px] font-bold text-black/80 tracking-tight">{siteName}</p>
        <div className="h-2.5 w-3/4 rounded-full bg-black/10" />
        <div className="h-2.5 w-2/3 rounded-full bg-black/10" />
        <div className="grid grid-cols-3 gap-3 pt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-black/[0.04]" />
          ))}
        </div>
      </div>
    </div>
  );

  if (device === 'mobile') {
    return (
      <div className="mx-auto w-[340px] h-[700px] rounded-[48px] p-3 bg-[#1c1c1e] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
        <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-white">
          {site}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black z-[2]" />
          <div ref={hostRef} className="absolute inset-0 z-[1]" style={{ contain: 'layout' }} />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-[720px] rounded-[16px] overflow-hidden border border-[var(--separator)] shadow-[var(--shadow-card)] bg-white flex flex-col">
      <div className="h-9 bg-[#f2f2f4] border-b border-black/5 flex items-center gap-1.5 px-3 shrink-0">
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
        ))}
        <div className="mx-auto h-5 w-1/2 rounded-md bg-white text-[11px] text-black/40 flex items-center justify-center">yourwebsite.com</div>
      </div>
      <div className="relative flex-1">
        {site}
        <div ref={hostRef} className="absolute inset-0" />
      </div>
    </div>
  );
};
