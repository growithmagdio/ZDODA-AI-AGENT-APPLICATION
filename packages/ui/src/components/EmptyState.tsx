import React from 'react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { StatusPill } from './StatusPill';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  comingInPhase?: number;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  comingInPhase,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-12 bg-[var(--surface)] border border-[var(--separator)] rounded-[20px] shadow-[var(--shadow-card)] max-w-xl mx-auto',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-tint)] text-[var(--accent-ink)] flex items-center justify-center mb-5">
        {icon}
      </div>

      {comingInPhase && (
        <div className="mb-3">
          <StatusPill status="coming_soon" label={`Coming in Phase ${comingInPhase}`} />
        </div>
      )}

      <h3 className="text-[20px] font-bold text-[var(--ink)] tracking-tight">
        {title}
      </h3>
      <p className="text-[14px] text-[var(--ink-2)] max-w-md mt-2 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
