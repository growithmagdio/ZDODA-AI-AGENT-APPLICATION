import React, { useState } from 'react';
import { clsx } from 'clsx';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { Archive, Trash2, CheckCircle2, Pin } from 'lucide-react';
import { haptics } from '../lib/haptics';

export interface SwipeRowProps {
  children: React.ReactNode;
  onArchive?: () => void;
  onDelete?: () => void;
  onMarkRead?: () => void;
  onPin?: () => void;
  className?: string;
}

export function SwipeRow({
  children,
  onArchive,
  onDelete,
  onMarkRead,
  onPin,
  className,
}: SwipeRowProps) {
  const x = useMotionValue(0);
  const [swipingLeft, setSwipingLeft] = useState(false);
  const [swipingRight, setSwipingRight] = useState(false);

  // Background color interpolation based on swipe offset
  const deleteOpacity = useTransform(x, [-160, -90], [1, 0.4]);
  const archiveOpacity = useTransform(x, [-90, -40], [1, 0.4]);
  const rightOpacity = useTransform(x, [40, 100], [0.4, 1]);

  const handleDrag = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -15) {
      setSwipingLeft(true);
      setSwipingRight(false);
    } else if (info.offset.x > 15) {
      setSwipingRight(true);
      setSwipingLeft(false);
    }
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Full swipe to delete threshold (e.g. < -180px or high negative velocity)
    if ((offset < -180 || velocity < -700) && onDelete) {
      haptics.warning();
      onDelete();
    } else if (offset < -70 && onArchive) {
      haptics.tap();
      onArchive();
    } else if (offset > 120 && onPin) {
      haptics.tap();
      onPin();
    } else if (offset > 60 && onMarkRead) {
      haptics.tap();
      onMarkRead();
    }

    setSwipingLeft(false);
    setSwipingRight(false);
  };

  return (
    <div className={clsx('relative overflow-hidden select-none rounded-xl', className)}>
      {/* Left Swipe Actions Revealed Underneath (Archive & Delete) */}
      <div
        className={clsx(
          'absolute inset-y-0 right-0 flex items-center justify-end px-3 gap-2',
          'bg-destructive/15 text-white transition-opacity',
          swipingLeft ? 'opacity-100' : 'opacity-0'
        )}
      >
        {onArchive && (
          <motion.button
            style={{ opacity: archiveOpacity }}
            onClick={onArchive}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-500 text-white text-[11px] font-semibold"
          >
            <Archive size={18} />
            <span>Archive</span>
          </motion.button>
        )}
        {onDelete && (
          <motion.button
            style={{ opacity: deleteOpacity }}
            onClick={onDelete}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-destructive text-white text-[11px] font-semibold"
          >
            <Trash2 size={18} />
            <span>Delete</span>
          </motion.button>
        )}
      </div>

      {/* Right Swipe Actions Revealed Underneath (Mark Read & Pin) */}
      <div
        className={clsx(
          'absolute inset-y-0 left-0 flex items-center justify-start px-3 gap-2',
          'bg-accent/15 text-white transition-opacity',
          swipingRight ? 'opacity-100' : 'opacity-0'
        )}
      >
        {onMarkRead && (
          <motion.button
            style={{ opacity: rightOpacity }}
            onClick={onMarkRead}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-accent text-white text-[11px] font-semibold"
          >
            <CheckCircle2 size={18} />
            <span>Read</span>
          </motion.button>
        )}
        {onPin && (
          <motion.button
            style={{ opacity: rightOpacity }}
            onClick={onPin}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-amber-500 text-white text-[11px] font-semibold"
          >
            <Pin size={18} />
            <span>Pin</span>
          </motion.button>
        )}
      </div>

      {/* Draggable Foreground Row */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -160, right: 140 }}
        dragElastic={{ left: 0.15, right: 0.15 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
        className="relative z-10 bg-surface"
      >
        {children}
      </motion.div>
    </div>
  );
}
