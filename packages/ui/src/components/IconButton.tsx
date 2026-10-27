import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../lib/utils';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  icon: React.ReactNode;
  'aria-label': string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'secondary' | 'glass';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, 'aria-label': ariaLabel, size = 'md', variant = 'ghost', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-7 h-7 min-w-[28px] min-h-[28px] p-1.5 rounded-[8px]',
      md: 'w-9 h-9 min-w-[36px] min-h-[36px] p-2 rounded-[10px]',
      lg: 'w-11 h-11 min-w-[44px] min-h-[44px] p-2.5 rounded-[12px]',
    };

    const variantClasses = {
      ghost: 'bg-transparent text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]',
      secondary: 'bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--surface-inset)] border border-[var(--separator)]',
      glass: 'glass text-[var(--ink)] hover:bg-white/80 dark:hover:bg-black/40',
    };

    return (
      <motion.button
        ref={ref}
        aria-label={ariaLabel}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer select-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {icon}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
