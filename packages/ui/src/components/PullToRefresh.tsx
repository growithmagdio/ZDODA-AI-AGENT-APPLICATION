import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { haptics } from '../lib/haptics';

export interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  pullThreshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  pullThreshold = 70,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  // Spinner rotation and scale based on pull distance
  const spinnerRotation = useTransform(y, [0, pullThreshold], [0, 360]);
  const spinnerScale = useTransform(y, [0, pullThreshold], [0.4, 1]);
  const spinnerOpacity = useTransform(y, [0, 20, pullThreshold], [0, 0.4, 1]);

  const handleDrag = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Only allow pulling down if container is at top
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      y.set(0);
      return;
    }

    if (info.offset.y >= pullThreshold && !canRefresh) {
      haptics.snap();
      setCanRefresh(true);
    } else if (info.offset.y < pullThreshold && canRefresh) {
      setCanRefresh(false);
    }
  };

  const handleDragEnd = async (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      haptics.tap();
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setCanRefresh(false);
      }
    } else {
      setCanRefresh(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx('relative overflow-y-auto overscroll-contain', className)}
    >
      {/* Pull-down Spinner Indicator */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-center pointer-events-none h-14">
        <motion.div
          style={{
            rotate: isRefreshing ? undefined : spinnerRotation,
            scale: spinnerScale,
            opacity: isRefreshing ? 1 : spinnerOpacity,
          }}
          className={clsx(
            'w-9 h-9 rounded-full flex items-center justify-center bg-surface border border-border shadow-md',
            isRefreshing && 'animate-spin'
          )}
        >
          <RefreshCw
            size={18}
            className={clsx(
              'transition-colors',
              canRefresh || isRefreshing ? 'text-accent' : 'text-tertiary'
            )}
          />
        </motion.div>
      </div>

      {/* Pullable Content Layer */}
      <motion.div
        style={{ y: isRefreshing ? pullThreshold * 0.7 : y }}
        drag={isRefreshing ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.35, bottom: 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
