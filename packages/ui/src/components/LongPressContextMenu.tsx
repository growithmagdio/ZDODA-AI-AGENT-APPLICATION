import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidGlass } from './LiquidGlass';
import { haptics } from '../lib/haptics';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

export interface LongPressContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  className?: string;
  longPressMs?: number;
}

export function LongPressContextMenu({
  children,
  items,
  className,
  longPressMs = 500,
}: LongPressContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      haptics.snap();
      setIsOpen(true);
      setIsPressing(false);
    }, longPressMs);
  };

  const cancelPress = () => {
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Close context menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className={clsx('relative', className)}>
      {/* Target Item (Lifts with scale 1.03 and elevated shadow when open or pressing) */}
      <motion.div
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => {
          e.preventDefault();
          haptics.snap();
          setIsOpen(true);
        }}
        animate={{
          scale: isOpen || isPressing ? 1.03 : 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={clsx(
          'transition-shadow duration-200 cursor-pointer',
          (isOpen || isPressing) && 'z-30 shadow-2xl relative'
        )}
      >
        {children}
      </motion.div>

      {/* Backdrop blur & Glass Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blurred Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-md"
              aria-hidden="true"
            />

            {/* Floating Liquid Glass Menu */}
            <LiquidGlass
              variant="regular"
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="relative z-10 w-64 rounded-2xl overflow-hidden divide-y divide-border/20 shadow-float"
            >
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.destructive) {
                      haptics.warning();
                    } else {
                      haptics.tap();
                    }
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={clsx(
                    'w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between',
                    'transition-colors hover:bg-surface-2/40 active:bg-surface-2/60',
                    item.destructive ? 'text-destructive font-semibold' : 'text-label'
                  )}
                >
                  <span>{item.label}</span>
                  {item.icon && <span className="opacity-70">{item.icon}</span>}
                </button>
              ))}
            </LiquidGlass>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
