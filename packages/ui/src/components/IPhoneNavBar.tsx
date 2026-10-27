import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { LiquidGlass } from './LiquidGlass';
import { haptics } from '../lib/haptics';

export interface IPhoneNavBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
  largeTitle?: boolean;
}

export function IPhoneNavBar({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions,
  className,
  largeTitle = true,
}: IPhoneNavBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 35);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={clsx('sticky top-0 z-30 w-full', className)}>
      {/* Top Floating Glass Bar with Collapsed Inline Title */}
      <LiquidGlass
        variant="regular"
        className={clsx(
          'w-full px-4 h-14 flex items-center justify-between transition-all duration-200',
          scrolled ? 'shadow-sm border-b border-border/40' : 'border-transparent bg-transparent shadow-none'
        )}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Leading Item: Round Glass Chevron Back Button */}
        <div className="flex items-center w-24">
          {showBack && (
            <LiquidGlass
              variant="clear"
              interactive
              onClick={() => {
                haptics.tap();
                onBack?.();
              }}
              className="flex items-center justify-center w-9 h-9 rounded-full cursor-pointer"
              aria-label="Back"
            >
              <ChevronLeft size={20} strokeWidth={2} className="text-label" />
            </LiquidGlass>
          )}
        </div>

        {/* Center Item: Centered Inline Title (Visible when scrolled or when largeTitle is false) */}
        <div className="flex-1 text-center truncate px-2">
          <AnimatePresence>
            {(scrolled || !largeTitle) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="flex flex-col items-center"
              >
                <span className="text-sm font-semibold text-label truncate max-w-[200px]">
                  {title}
                </span>
                {subtitle && (
                  <span className="text-[11px] text-tertiary truncate max-w-[200px]">
                    {subtitle}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trailing Item: Actions Grouped in Glass Capsule */}
        <div className="flex items-center justify-end w-24 gap-2">
          {actions && (
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-2/40 border border-border/30">
              {actions}
            </div>
          )}
        </div>
      </LiquidGlass>

      {/* Large Title Header (Collapses on Scroll) */}
      {largeTitle && (
        <div
          className={clsx(
            'px-5 pt-2 pb-3 transition-opacity duration-200',
            scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          <h1 className="text-[34px] font-bold tracking-tight text-label leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
