import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { X } from 'lucide-react';
import { LiquidGlass } from './LiquidGlass';
import { haptics } from '../lib/haptics';

export type SheetDetent = 'medium' | 'large' | 'full';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  detent?: SheetDetent;
  onDetentChange?: (detent: SheetDetent) => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
}

const DETENT_HEIGHTS: Record<SheetDetent, string> = {
  medium: '52vh',
  large: '92vh',
  full: '96vh',
};

export function BottomSheet({
  isOpen,
  onClose,
  title,
  detent = 'large',
  onDetentChange,
  children,
  showCloseButton = true,
  className,
}: BottomSheetProps) {
  const [currentDetent, setCurrentDetent] = useState<SheetDetent>(detent);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentDetent(detent);
  }, [detent]);

  // Handle iOS Stacked Card Effect on Page Background
  useEffect(() => {
    const rootEl = document.getElementById('root') || document.body;
    if (isOpen) {
      rootEl.classList.add('ios-card-stack-active');
      document.body.style.overflow = 'hidden';
    } else {
      rootEl.classList.remove('ios-card-stack-active');
      document.body.style.overflow = '';
    }

    return () => {
      rootEl.classList.remove('ios-card-stack-active');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;

    // Velocity or drag distance threshold for dismissal
    if (offset.y > 140 || velocity.y > 600) {
      haptics.snap();
      onClose();
      return;
    }

    // Toggle between medium and large detents if medium is active
    if (currentDetent === 'medium' && (offset.y < -80 || velocity.y < -400)) {
      haptics.snap();
      setCurrentDetent('large');
      onDetentChange?.('large');
    } else if (currentDetent === 'large' && (offset.y > 80 || velocity.y > 400)) {
      haptics.snap();
      setCurrentDetent('medium');
      onDetentChange?.('medium');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Dimmed Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Liquid Glass Bottom Sheet Container */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.15, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            style={{
              height: DETENT_HEIGHTS[currentDetent],
              maxHeight: '94vh',
            }}
            className={clsx(
              'relative z-10 w-full max-w-lg mx-auto flex flex-col',
              'rounded-t-[32px] overflow-hidden',
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            <LiquidGlass
              variant="regular"
              className="flex-1 flex flex-col h-full rounded-t-[32px] border-t border-border/50 shadow-float"
            >
              {/* Visible Grabber Handle */}
              <div className="pt-3 pb-2 flex flex-col items-center cursor-grab active:cursor-grabbing">
                <div className="w-9 h-1.5 rounded-full bg-separator-strong/60" />
              </div>

              {/* Header Bar */}
              {(title || showCloseButton) && (
                <div className="px-5 py-2 flex items-center justify-between border-b border-border/20">
                  <h2 className="text-base font-semibold text-label truncate">
                    {title}
                  </h2>
                  {showCloseButton && (
                    <LiquidGlass
                      variant="clear"
                      interactive
                      onClick={() => {
                        haptics.tap();
                        onClose();
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer"
                      aria-label="Close sheet"
                    >
                      <X size={16} strokeWidth={2} className="text-secondary" />
                    </LiquidGlass>
                  )}
                </div>
              )}

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
                {children}
              </div>
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
