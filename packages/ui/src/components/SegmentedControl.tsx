import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export interface SegmentedControlItem<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  items: SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 bg-[var(--surface-2)] rounded-[12px] border border-[var(--separator)] select-none',
        size === 'sm' ? 'h-8 text-[12px]' : 'h-10 text-[13px]',
        className
      )}
      role="tablist"
    >
      {items.map((item) => {
        const isSelected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative z-10 flex items-center justify-center px-3 py-1 font-medium transition-colors cursor-pointer rounded-[8px]',
              isSelected ? 'text-[var(--ink)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            )}
          >
            {item.icon && <span className="mr-1.5">{item.icon}</span>}
            <span>{item.label}</span>
            {isSelected && (
              <motion.div
                layoutId="segmented-capsule"
                transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }}
                className="absolute inset-0 bg-[var(--surface)] rounded-[8px] shadow-sm -z-10 border border-[var(--separator)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
