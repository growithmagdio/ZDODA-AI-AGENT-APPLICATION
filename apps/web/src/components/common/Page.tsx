import React from 'react';
import { LargeTitleHeader, Skeleton, Card } from '@zdoda/ui';
import { AlertTriangle } from 'lucide-react';
import { ApiError } from '../../lib/api';

export const Page: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; wide?: boolean }> = ({ title, subtitle, action, children, wide }) => (
  <div className={`space-y-6 ${wide ? 'max-w-[1400px]' : 'max-w-7xl'} mx-auto py-4`}>
    <LargeTitleHeader title={title} subtitle={subtitle} action={action} />
    {children}
  </div>
);

export const LoadingBlock: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="space-y-3" aria-busy="true">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-16" />
    ))}
  </div>
);

export const ErrorBlock: React.FC<{ error: unknown; onRetry?: () => void }> = ({ error, onRetry }) => (
  <Card className="flex items-start gap-3 border-[var(--danger)]/30">
    <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
    <div className="space-y-1">
      <p className="text-[14px] font-semibold text-[var(--ink)]">We couldn't load this</p>
      <p className="text-[13px] text-[var(--ink-2)]">{error instanceof ApiError ? error.message : 'Please check your connection and try again.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-[13px] font-semibold text-[var(--accent-ink)] hover:underline">
          Try again
        </button>
      )}
    </div>
  </Card>
);

export const SectionTitle: React.FC<{ title: string; description?: string; right?: React.ReactNode }> = ({ title, description, right }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <h3 className="text-[17px] font-bold text-[var(--ink)] tracking-tight">{title}</h3>
      {description && <p className="text-[13px] text-[var(--ink-3)] mt-0.5">{description}</p>}
    </div>
    {right}
  </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }> = ({ label, hint, className, id, ...props }) => {
  const fieldId = id || (label ? `ta-${label.replace(/\W+/g, '-').toLowerCase()}` : undefined);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-[13px] font-medium text-[var(--ink-2)]">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        className={`w-full rounded-[10px] border border-[var(--separator-strong)] bg-[var(--surface)] px-3 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${className || ''}`}
        {...props}
      />
      {hint && <p className="text-[12px] text-[var(--ink-3)]">{hint}</p>}
    </div>
  );
};

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; right?: React.ReactNode }> = ({ label, hint, children, right }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="min-w-0">
      <p className="text-[14px] font-medium text-[var(--ink)]">{label}</p>
      {hint && <p className="text-[12px] text-[var(--ink-3)] mt-0.5">{hint}</p>}
    </div>
    <div className="shrink-0">{children ?? right}</div>
  </div>
);
