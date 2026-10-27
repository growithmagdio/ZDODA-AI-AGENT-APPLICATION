import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Bot, MessageSquare, Settings, CreditCard, Sparkles, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Agents' | 'Navigation' | 'Settings' | 'Actions';
  icon: React.ReactNode;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items?: CommandItem[];
}

const DEFAULT_COMMANDS: CommandItem[] = [
  { id: '1', title: 'Dental Assistant (Smile Dental)', category: 'Agents', icon: <Bot className="w-4 h-4" />, onSelect: () => {} },
  { id: '2', title: 'Go to Inbox', category: 'Navigation', icon: <MessageSquare className="w-4 h-4" />, onSelect: () => {} },
  { id: '3', title: 'Open Widget Studio', category: 'Navigation', icon: <Sparkles className="w-4 h-4" />, onSelect: () => {} },
  { id: '4', title: 'Billing & Subscriptions', category: 'Settings', icon: <CreditCard className="w-4 h-4" />, onSelect: () => {} },
  { id: '5', title: 'Workspace Settings', category: 'Settings', icon: <Settings className="w-4 h-4" />, onSelect: () => {} },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  items = DEFAULT_COMMANDS,
}) => {
  const [query, setQuery] = useState('');

  // Handle Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl glass rounded-[20px] p-0 shadow-[var(--shadow-float)] border border-[var(--glass-edge)] focus:outline-none overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-[var(--separator)]">
            <Search className="w-5 h-5 text-[var(--ink-3)] mr-3 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="w-full bg-transparent text-[16px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-[var(--ink-3)] hover:text-[var(--ink)]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto p-2 divide-y divide-transparent">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-[14px] text-[var(--ink-3)]">
                No matching results found
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-left text-[14px] text-[var(--ink)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-ink)] transition-colors cursor-pointer select-none"
                >
                  <span className="text-[var(--ink-2)]">{item.icon}</span>
                  <span className="flex-1 font-medium">{item.title}</span>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--ink-3)]">
                    {item.category}
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-[var(--separator)] bg-[var(--surface-2)]/50 flex items-center justify-between text-[11px] text-[var(--ink-3)]">
            <span>Tip: Use ↑ ↓ arrows to navigate</span>
            <span>ESC to close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
