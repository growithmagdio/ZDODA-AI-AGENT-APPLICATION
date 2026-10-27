import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@zdoda/ui';

export const WorkspaceSwitcher: React.FC = () => {
  const { activeWorkspace, workspaces, switchWorkspace } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeWorkspace) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[var(--surface-2)] text-[13px] text-[var(--ink-2)]">
        <Building2 className="w-4 h-4" />
        <span>Smile Dental Clinic</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-[10px] glass hover:bg-white/90 dark:hover:bg-black/50 text-[13px] font-semibold text-[var(--ink)] cursor-pointer transition-colors border border-[var(--separator)] select-none"
      >
        <div className="w-5 h-5 rounded bg-[var(--accent)] text-white flex items-center justify-center text-[10px] font-bold">
          {activeWorkspace.name.charAt(0)}
        </div>
        <span className="truncate max-w-[140px]">{activeWorkspace.name}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--ink-3)] transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 z-50 w-64 p-1.5 rounded-[16px] glass border border-[var(--glass-edge)] shadow-[var(--shadow-float)]">
            <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase text-[var(--ink-3)]">
              Workspaces
            </div>

            <div className="space-y-0.5">
              {workspaces.map((ws) => {
                const isSelected = ws.id === activeWorkspace.id;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-left text-[13px] transition-colors cursor-pointer select-none',
                      isSelected
                        ? 'bg-[var(--accent-tint)] text-[var(--accent-ink)] font-semibold'
                        : 'text-[var(--ink)] hover:bg-[var(--surface-2)]'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 rounded bg-[var(--surface-inset)] flex items-center justify-center text-[10px] font-bold text-[var(--ink)] shrink-0">
                        {ws.name.charAt(0)}
                      </div>
                      <span className="truncate">{ws.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-1 pt-1 border-t border-[var(--separator)]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent('zdoda:open-onboarding'));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-left text-[13px] text-[var(--accent-ink)] hover:bg-[var(--accent-tint)] font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Workspace</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
