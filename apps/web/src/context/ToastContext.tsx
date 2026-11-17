import React, { createContext, useCallback, useContext, useState } from 'react';
import { ToastContainer, type ToastMessage } from '@zdoda/ui';

type Toast = (title: string, opts?: { description?: string; type?: ToastMessage['type'] }) => void;
const ToastContext = createContext<Toast>(() => {});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback<Toast>(
    (title, opts = {}) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, title, description: opts.description, type: opts.type || 'success' }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );
  return (
    <ToastContext.Provider value={push}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
