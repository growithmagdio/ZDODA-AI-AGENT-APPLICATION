import React from 'react';
import { cn } from '../lib/utils';
import { CheckCircle2, FlaskConical, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { StatusPillState } from '@zdoda/shared';

export interface StatusPillProps {
  status: StatusPillState;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, className, size = 'sm' }) => {
  const configs: Record<
    StatusPillState,
    { defaultLabel: string; bg: string; text: string; icon: React.ReactNode }
  > = {
    live: {
      defaultLabel: 'Live',
      bg: 'bg-[var(--success)]/15 border-[var(--success)]/30',
      text: 'text-[var(--success)]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />,
    },
    test_mode: {
      defaultLabel: 'Test Mode',
      bg: 'bg-[var(--warning)]/15 border-[var(--warning)]/30',
      text: 'text-[var(--warning)]',
      icon: <FlaskConical className="w-3.5 h-3.5 stroke-[2.2]" />,
    },
    demo: {
      defaultLabel: 'Demo',
      bg: 'bg-[var(--accent)]/15 border-[var(--accent)]/30',
      text: 'text-[var(--accent)]',
      icon: <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />,
    },
    setup_required: {
      defaultLabel: 'Setup Required',
      bg: 'bg-amber-500/15 border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-400',
      icon: <AlertCircle className="w-3.5 h-3.5 stroke-[2.2]" />,
    },
    coming_soon: {
      defaultLabel: 'Coming Soon',
      bg: 'bg-neutral-500/15 border-neutral-500/30',
      text: 'text-[var(--ink-3)]',
      icon: <Clock className="w-3.5 h-3.5 stroke-[2.2]" />,
    },
  };

  const config = configs[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-[12px] gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border tracking-wide uppercase select-none',
        config.bg,
        config.text,
        sizeClasses,
        className
      )}
    >
      {config.icon}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};
