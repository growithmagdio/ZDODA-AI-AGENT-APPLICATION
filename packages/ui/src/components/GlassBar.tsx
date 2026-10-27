import React from 'react';
import { cn } from '../lib/utils';

export interface GlassBarProps extends React.HTMLAttributes<HTMLDivElement> {
  clear?: boolean;
}

export const GlassBar: React.FC<GlassBarProps> = ({ clear, className, children, ...props }) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all',
        clear ? 'glass--clear' : 'glass',
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
};
