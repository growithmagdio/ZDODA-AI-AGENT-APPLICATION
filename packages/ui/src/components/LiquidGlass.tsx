import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { motion, HTMLMotionProps } from 'motion/react';

export interface LiquidGlassProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'regular' | 'clear';
  dimmed?: boolean;
  interactive?: boolean;
  adaptive?: boolean;
  refract?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Global SVG Refraction Lens Filter.
 * Mount once in the root app shell.
 */
export function SvgLensFilter() {
  return (
    <svg
      id="zd-lens-filter-root"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="zd-lens" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * LiquidGlass component providing the authentic iOS Liquid Glass material.
 * Strictly for floating controls: tab bars, navigation bars, bottom sheets,
 * menus, toasts, Dynamic Island, and widget launchers.
 */
export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (
    {
      variant = 'regular',
      dimmed = false,
      interactive = false,
      adaptive = false,
      refract = true,
      className,
      children,
      onPointerDown,
      onPointerUp,
      ...motionProps
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const [isLowPower, setIsLowPower] = useState(false);
    const [supportsRefraction, setSupportsRefraction] = useState(false);
    const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => {
      // 1. Detect low-concurrency devices (<= 4 cores)
      if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
        setIsLowPower(true);
      }

      // 2. Feature detect CSS backdrop-filter SVG url support (Chromium)
      if (typeof CSS !== 'undefined' && CSS.supports) {
        const hasUrlFilterSupport = CSS.supports('backdrop-filter', 'url(#zd-lens)') ||
                                   CSS.supports('-webkit-backdrop-filter', 'url(#zd-lens)');
        setSupportsRefraction(hasUrlFilterSupport && !isLowPower);
      }
    }, [isLowPower]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (interactive) {
        setIsPressed(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setTouchPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      onPointerDown?.(e);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (interactive) {
        setIsPressed(false);
        setTouchPos(null);
      }
      onPointerUp?.(e);
    };

    return (
      <motion.div
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={clsx(
          'liquid-glass',
          variant === 'regular' ? 'liquid-glass-regular' : 'liquid-glass-clear',
          dimmed && 'liquid-glass-dimmed',
          interactive && 'liquid-glass-interactive',
          refract && supportsRefraction && 'liquid-glass-refract',
          isLowPower && 'glass-fallback-blur',
          className
        )}
        data-pressed={isPressed}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setIsPressed(false);
          setTouchPos(null);
        }}
        {...motionProps}
      >
        {touchPos && interactive && (
          <span
            className="liquid-glass-touch-highlight"
            style={{
              left: `${touchPos.x}px`,
              top: `${touchPos.y}px`,
            }}
          />
        )}
        {children}
      </motion.div>
    );
  }
);

LiquidGlass.displayName = 'LiquidGlass';
