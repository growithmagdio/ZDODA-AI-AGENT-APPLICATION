import React from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidGlass } from './LiquidGlass';
import { haptics } from '../lib/haptics';

export interface ActionSheetOption {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  message,
  options,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pb-6 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Action Sheet Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-2.5"
            role="alertdialog"
          >
            {/* Options Glass Card */}
            <LiquidGlass
              variant="regular"
              className="w-full rounded-2xl overflow-hidden divide-y divide-border/20 shadow-float"
            >
              {(title || message) && (
                <div className="px-4 py-3.5 text-center">
                  {title && (
                    <div className="text-sm font-semibold text-label">
                      {title}
                    </div>
                  )}
                  {message && (
                    <div className="text-xs text-secondary mt-1">
                      {message}
                    </div>
                  )}
                </div>
              )}

              {options.map((opt, idx) => (
                <button
                  key={idx}
                  disabled={opt.disabled}
                  onClick={() => {
                    if (opt.destructive) {
                      haptics.warning();
                    } else {
                      haptics.tap();
                    }
                    opt.onClick();
                    onClose();
                  }}
                  className={clsx(
                    'w-full py-3.5 px-4 text-center font-medium transition-colors flex items-center justify-center gap-2',
                    'hover:bg-surface-2/40 active:bg-surface-2/60',
                    opt.destructive ? 'text-destructive font-semibold' : 'text-accent',
                    opt.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </LiquidGlass>

            {/* Separate Cancel Button Glass Capsule */}
            <LiquidGlass
              variant="regular"
              interactive
              onClick={() => {
                haptics.tap();
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl text-center font-semibold text-accent cursor-pointer shadow-float"
            >
              {cancelLabel}
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
