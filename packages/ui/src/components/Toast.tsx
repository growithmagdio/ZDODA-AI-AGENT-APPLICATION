import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-[var(--danger)] shrink-0" />,
            info: <Info className="w-4 h-4 text-[var(--accent)] shrink-0" />,
          };

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-[16px] glass border border-[var(--glass-edge)] shadow-[var(--shadow-float)]'
              )}
            >
              {icons[toast.type || 'info']}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--ink)] leading-snug">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="text-[12px] text-[var(--ink-2)] mt-0.5 leading-snug">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-[var(--ink-3)] hover:text-[var(--ink)] p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
