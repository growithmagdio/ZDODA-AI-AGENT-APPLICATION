import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Bot, Inbox, Sparkles, MoreHorizontal, Search } from 'lucide-react';
import { LiquidGlass } from './LiquidGlass';
import { haptics } from '../lib/haptics';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; size?: number }>;
  badge?: number | string;
}

export const DEFAULT_IPHONE_TABS: TabItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'inbox', label: 'Inbox', icon: Inbox, badge: 3 },
  { id: 'studio', label: 'Studio', icon: Sparkles },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export interface IPhoneTabBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onSearchClick?: () => void;
  tabs?: TabItem[];
  className?: string;
  previewMode?: boolean;
}

export function IPhoneTabBar({
  activeTab,
  onTabChange,
  onSearchClick,
  tabs = DEFAULT_IPHONE_TABS,
  className,
  previewMode = false,
}: IPhoneTabBarProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Scroll detection to minimize on scroll down, restore on scroll up
  useEffect(() => {
    if (previewMode) return;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 80 && currentScrollY > lastScrollY + 10) {
        setIsMinimized(true);
      } else if (currentScrollY < lastScrollY - 15 || currentScrollY <= 20) {
        setIsMinimized(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, previewMode]);

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);
  const activeItem = tabs[activeIndex] || tabs[0];
  const ActiveIcon = activeItem.icon;

  const handleTabClick = (tabId: string) => {
    haptics.tap();
    onTabChange(tabId);
    if (isMinimized) {
      setIsMinimized(false);
    }
  };

  return (
    <div
      className={clsx(
        previewMode
          ? 'relative z-20 flex items-center justify-center pointer-events-auto'
          : 'fixed inset-x-0 z-40 flex items-center justify-center pointer-events-none md:hidden',
        className
      )}
      style={
        previewMode
          ? undefined
          : {
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
            }
      }
    >
      <div className="flex items-center gap-2 px-3 pointer-events-auto">
        <AnimatePresence mode="wait">
          {isMinimized ? (
            /* Minimized single-icon glass capsule */
            <LiquidGlass
              key="minimized"
              variant="regular"
              interactive
              onClick={() => {
                haptics.tap();
                setIsMinimized(false);
              }}
              className="flex items-center justify-center h-12 px-5 rounded-full cursor-pointer shadow-float"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            >
              <div className="flex items-center gap-2">
                <ActiveIcon className="text-accent" size={20} strokeWidth={2} />
                <span className="text-xs font-semibold text-label">{activeItem.label}</span>
              </div>
            </LiquidGlass>
          ) : (
            /* Full 5-tab floating glass capsule */
            <LiquidGlass
              key="expanded"
              variant="regular"
              className="relative flex items-center h-14 p-1.5 rounded-full shadow-float"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            >
              {tabs.map((tab) => {
                const isSelected = tab.id === activeTab;
                const IconComponent = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={clsx(
                      'relative z-10 flex flex-col items-center justify-center w-14 h-11 rounded-full',
                      'transition-colors duration-150 text-secondary hover:text-label'
                    )}
                    aria-label={tab.label}
                    aria-selected={isSelected}
                  >
                    {/* Spring Sliding Lens Pill */}
                    {isSelected && (
                      <motion.div
                        layoutId="iphone-tab-lens"
                        className="absolute inset-0 rounded-full bg-accent/15 border border-accent/25 shadow-sm"
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 38,
                        }}
                      />
                    )}

                    <div className="relative">
                      <IconComponent
                        size={19}
                        strokeWidth={1.75}
                        className={clsx(
                          'transition-transform duration-150',
                          isSelected ? 'text-accent scale-105' : 'text-secondary'
                        )}
                      />
                      {tab.badge && (
                        <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold text-white bg-destructive rounded-full min-w-3.5 h-3.5 flex items-center justify-center">
                          {tab.badge}
                        </span>
                      )}
                    </div>

                    <span
                      className={clsx(
                        'text-[10px] font-medium leading-none mt-1 transition-colors',
                        isSelected ? 'text-accent font-semibold' : 'text-tertiary'
                      )}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </LiquidGlass>
          )}
        </AnimatePresence>

        {/* Separate round glass Search button beside the capsule */}
        {onSearchClick && (
          <LiquidGlass
            variant="regular"
            interactive
            onClick={() => {
              haptics.tap();
              onSearchClick();
            }}
            className="flex items-center justify-center w-14 h-14 rounded-full cursor-pointer shadow-float"
            aria-label="Search"
          >
            <Search size={20} strokeWidth={1.75} className="text-secondary" />
          </LiquidGlass>
        )}
      </div>
    </div>
  );
}
