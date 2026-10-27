import React from 'react';
import { cn } from '../lib/utils';

export interface LargeTitleHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const LargeTitleHeader: React.FC<LargeTitleHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div className={cn('pt-6 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4', className)}>
      <div>
        <h1 className="text-[34px] leading-[41px] font-bold tracking-[-0.022em] text-[var(--ink)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] leading-[22px] text-[var(--ink-2)] mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};
