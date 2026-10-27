import React from 'react';
import { Card } from './Card';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  isDemo?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  delta,
  deltaType = 'positive',
  isDemo = true,
  icon,
  className,
}) => {
  return (
    <Card className={cn('flex flex-col justify-between gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--ink-2)]">{title}</span>
        <div className="flex items-center gap-1.5">
          {isDemo && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-[var(--surface-2)] text-[var(--ink-3)] border border-[var(--separator)] select-none">
              Demo data
            </span>
          )}
          {icon && <span className="text-[var(--ink-3)]">{icon}</span>}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[28px] font-bold tracking-tight text-[var(--ink)] tabular-nums">
          {value}
        </span>

        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums',
              deltaType === 'positive' && 'text-[var(--success)]',
              deltaType === 'negative' && 'text-[var(--danger)]',
              deltaType === 'neutral' && 'text-[var(--ink-3)]'
            )}
          >
            {deltaType === 'positive' && <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />}
            {deltaType === 'negative' && <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />}
            {delta}
          </span>
        )}
      </div>
    </Card>
  );
};
