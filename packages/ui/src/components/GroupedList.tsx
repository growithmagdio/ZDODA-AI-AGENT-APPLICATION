import React from 'react';
import { cn } from '../lib/utils';
import { ChevronRight } from 'lucide-react';

export interface GroupedListItem {
  id: string;
  label: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}

export interface GroupedListProps {
  items: GroupedListItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const GroupedList: React.FC<GroupedListProps> = ({ items, header, footer, className }) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      {header && (
        <div className="px-3 text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
          {header}
        </div>
      )}

      <div className="bg-[var(--surface)] border border-[var(--separator)] rounded-[16px] overflow-hidden divide-y divide-[var(--separator)] shadow-[var(--shadow-card)]">
        {items.map((item) => {
          const isClickable = Boolean(item.onClick);
          const Component = isClickable ? 'button' : 'div';

          return (
            <Component
              key={item.id}
              onClick={item.onClick}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors',
                isClickable && 'hover:bg-[var(--surface-2)] active:bg-[var(--surface-inset)] cursor-pointer select-none',
                item.destructive && 'text-[var(--danger)]'
              )}
            >
              <div className="flex items-center gap-3 min-w-0 pr-3">
                {item.icon && (
                  <span className={cn('shrink-0', item.destructive ? 'text-[var(--danger)]' : 'text-[var(--ink-2)]')}>
                    {item.icon}
                  </span>
                )}
                <div className="min-w-0">
                  <div className={cn('text-[14px] font-medium truncate', item.destructive && 'text-[var(--danger)]')}>
                    {item.label}
                  </div>
                  {item.subtitle && (
                    <div className="text-[12px] text-[var(--ink-3)] truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.trailing}
                {isClickable && !item.trailing && (
                  <ChevronRight className="w-4 h-4 text-[var(--ink-3)]" />
                )}
              </div>
            </Component>
          );
        })}
      </div>

      {footer && (
        <div className="px-3 text-[12px] text-[var(--ink-3)] leading-relaxed">
          {footer}
        </div>
      )}
    </div>
  );
};
