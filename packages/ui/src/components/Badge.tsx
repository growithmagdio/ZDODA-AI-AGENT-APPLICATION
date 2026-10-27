import React from 'react';
import { cn } from '../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'secondary' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--separator)]',
    accent: 'bg-[var(--accent-tint)] text-[var(--accent-ink)] border border-[var(--accent)]/30',
    secondary: 'bg-[var(--surface-inset)] text-[var(--ink)]',
    outline: 'bg-transparent text-[var(--ink-2)] border border-[var(--separator-strong)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
