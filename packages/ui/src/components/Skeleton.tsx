import React from 'react';
import { cn } from '../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ shape = 'rect', className, ...props }) => {
  const shapes = {
    text: 'h-4 w-full rounded-[6px]',
    rect: 'rounded-[12px]',
    circle: 'rounded-full',
  };

  return (
    <div
      className={cn('animate-pulse bg-[var(--surface-2)] border border-[var(--separator)]/30', shapes[shape], className)}
      {...props}
    />
  );
};
