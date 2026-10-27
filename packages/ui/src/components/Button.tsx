import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary:
        'bg-[var(--accent)] text-white hover:bg-[var(--accent-ink)] shadow-sm active:bg-[var(--accent-ink)]',
      secondary:
        'bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--surface-inset)] border border-[var(--separator)]',
      outline:
        'bg-transparent text-[var(--ink)] hover:bg-[var(--surface-2)] border border-[var(--separator-strong)]',
      ghost:
        'bg-transparent text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]',
      destructive:
        'bg-transparent text-[var(--danger)] hover:bg-[var(--danger)]/10 border border-[var(--danger)]/30',
    };

    const sizes = {
      sm: 'h-8 px-3 text-[13px] rounded-[8px] gap-1.5',
      md: 'h-10 px-4 text-[14px] rounded-[10px] gap-2',
      lg: 'h-12 px-5 text-[15px] rounded-[12px] gap-2.5',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
