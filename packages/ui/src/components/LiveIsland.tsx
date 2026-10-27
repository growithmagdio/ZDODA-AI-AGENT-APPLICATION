import React, { useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, MicOff, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { haptics } from '../lib/haptics';

export type IslandType = 'call' | 'ingestion' | 'publish' | 'handoff';

export interface LiveIslandEvent {
  id: string;
  type: IslandType;
  title: string;
  subtitle?: string;
  progressPercent?: number;
  durationSeconds?: number;
  isMuted?: boolean;
  onAction?: (actionId: string) => void;
}

export interface LiveIslandProps {
  currentEvent: LiveIslandEvent | null;
  className?: string;
}

export function LiveIsland({ currentEvent, className }: LiveIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentEvent) {
    return null;
  }

  const formatCallTime = (secs: number = 0) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const toggleExpand = () => {
    haptics.snap();
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Hidden ARIA Live region for screen readers */}
      <div
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {currentEvent.title} {currentEvent.subtitle || ''}
      </div>

      {/* Dynamic Island Pinned Top-Center of Workspace Area */}
      <div
        className={clsx(
          'fixed z-[100] flex items-center justify-center pointer-events-none transition-all duration-300',
          'top-2.5 left-1/2 -translate-x-1/2 md:top-3 md:left-[calc(50%+60px)]',
          className
        )}
      >
        <motion.div
          layout
          onClick={toggleExpand}
          className={clsx(
            'pointer-events-auto cursor-pointer select-none',
            'bg-black text-white shadow-2xl border border-white/10',
            'transition-colors duration-200'
          )}
          style={{
            borderRadius: isExpanded ? '28px' : '999px',
          }}
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 35,
          }}
        >
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              /* Compact Pill State */
              <motion.div
                key="compact"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 px-3.5 py-1.5 h-8 min-w-[150px] max-w-[240px] justify-between"
              >
                {/* Leading Icon with pulsing effect */}
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  {currentEvent.type === 'call' && (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <Phone size={13} strokeWidth={2.5} />
                    </span>
                  )}
                  {currentEvent.type === 'ingestion' && (
                    <RefreshCw size={13} className="text-amber-400 animate-spin" />
                  )}
                  {currentEvent.type === 'publish' && (
                    <Sparkles size={13} className="text-accent" />
                  )}
                  {currentEvent.type === 'handoff' && (
                    <AlertCircle size={13} className="text-destructive" />
                  )}

                  <span className="truncate text-[12px] font-semibold text-white">
                    {currentEvent.title}
                  </span>
                </div>

                {/* Trailing Meta (Time or Progress) */}
                <div className="text-[11px] font-mono font-medium text-white/70">
                  {currentEvent.type === 'call' && formatCallTime(currentEvent.durationSeconds)}
                  {currentEvent.type === 'ingestion' && `${currentEvent.progressPercent || 0}%`}
                  {currentEvent.type === 'publish' && 'Live'}
                  {currentEvent.type === 'handoff' && 'Agent'}
                </div>
              </motion.div>
            ) : (
              /* Expanded Card State */
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-4 w-[330px] md:w-[360px] flex flex-col gap-3"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      {currentEvent.type === 'call' && <Phone size={16} className="text-emerald-400" />}
                      {currentEvent.type === 'ingestion' && <RefreshCw size={16} className="text-amber-400 animate-spin" />}
                      {currentEvent.type === 'publish' && <Sparkles size={16} className="text-accent" />}
                      {currentEvent.type === 'handoff' && <AlertCircle size={16} className="text-destructive" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white leading-tight">
                        {currentEvent.title}
                      </h4>
                      {currentEvent.subtitle && (
                        <p className="text-xs text-white/60">{currentEvent.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {currentEvent.type === 'call' && (
                    <div className="text-xs font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20">
                      {formatCallTime(currentEvent.durationSeconds)}
                    </div>
                  )}
                </div>

                {/* Progress bar for ingestion */}
                {currentEvent.type === 'ingestion' && typeof currentEvent.progressPercent === 'number' && (
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-1.5 transition-all duration-300"
                      style={{ width: `${currentEvent.progressPercent}%` }}
                    />
                  </div>
                )}

                {/* Actions row */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
                  {currentEvent.type === 'call' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          haptics.tap();
                          currentEvent.onAction?.('toggleMute');
                        }}
                        className={clsx(
                          'p-2 rounded-full transition-colors',
                          currentEvent.isMuted ? 'bg-amber-500 text-white' : 'bg-white/15 text-white hover:bg-white/25'
                        )}
                        aria-label={currentEvent.isMuted ? 'Unmute' : 'Mute'}
                      >
                        {currentEvent.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          haptics.warning();
                          currentEvent.onAction?.('endCall');
                        }}
                        className="px-3 py-1.5 rounded-full bg-destructive text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-destructive/90"
                      >
                        <PhoneOff size={14} />
                        <span>End Call</span>
                      </button>
                    </>
                  )}

                  {currentEvent.type === 'ingestion' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.tap();
                        currentEvent.onAction?.('viewKnowledge');
                      }}
                      className="px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25"
                    >
                      View Sources
                    </button>
                  )}

                  {currentEvent.type === 'publish' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.tap();
                        currentEvent.onAction?.('openWidget');
                      }}
                      className="px-3 py-1.5 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent/90"
                    >
                      Test Widget
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
