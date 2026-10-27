import React, { forwardRef } from 'react';
import { cn } from '../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-[13px] font-medium text-[var(--ink-2)]">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full h-11 pl-3.5 pr-10 rounded-[12px] bg-[var(--surface-2)] text-[14px] text-[var(--ink)] border border-[var(--separator)] appearance-none transition-all cursor-pointer',
              'focus:bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20',
              error && 'border-[var(--danger)]',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 w-4 h-4 text-[var(--ink-3)] pointer-events-none" />
        </div>

        {error && <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
