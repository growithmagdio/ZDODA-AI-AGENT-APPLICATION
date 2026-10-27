import React, { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, error, hint, icon, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-medium text-[var(--ink-2)]">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 text-[var(--ink-3)] pointer-events-none">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-11 px-3.5 rounded-[12px] bg-[var(--surface-2)] text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-3)] border border-[var(--separator)] transition-all',
              'focus:bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon && 'pl-10',
              error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20',
              className
            )}
            {...props}
          />
        </div>

        {error ? (
          <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>
        ) : hint ? (
          <p className="text-[12px] text-[var(--ink-3)]">{hint}</p>
        ) : null}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
