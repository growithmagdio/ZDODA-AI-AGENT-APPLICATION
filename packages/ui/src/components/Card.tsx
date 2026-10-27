import React, { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'inset' | 'subtle';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--surface)] border border-[var(--separator)] shadow-[var(--shadow-card)]',
      inset: 'bg-[var(--surface-2)] border border-[var(--separator)]',
      subtle: 'bg-transparent border border-[var(--separator)]',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-[16px] p-5 text-[var(--ink)]', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
