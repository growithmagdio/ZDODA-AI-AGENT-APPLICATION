import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { IconButton } from './IconButton';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed z-50 bg-[var(--surface)] shadow-[var(--shadow-float)] border border-[var(--separator)]',
            // Mobile: bottom sheet
            'bottom-0 inset-x-0 rounded-t-[24px] max-h-[90vh] overflow-y-auto p-6 md:inset-auto',
            // Desktop: centered modal
            'md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:rounded-[24px] md:max-h-[85vh]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <Dialog.Title className="text-[20px] font-bold text-[var(--ink)] tracking-tight">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-[14px] text-[var(--ink-2)] mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton icon={<X className="w-4 h-4" />} aria-label="Close" size="sm" />
            </Dialog.Close>
          </div>

          <div className="py-2 text-[var(--ink)]">{children}</div>

          {footer && (
            <div className="mt-6 pt-4 border-t border-[var(--separator)] flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
