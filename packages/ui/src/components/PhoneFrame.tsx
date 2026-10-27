import React, { useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export interface PhoneFrameProps {
  children: React.ReactNode;
  enableTilt?: boolean;
  className?: string;
  showGlare?: boolean;
}

/**
 * CSS-only Modern Titanium Smartphone Device Simulator.
 * Features 390x844 responsive viewport, 55px outer radius, 6px bezel,
 * dynamic island cutout, titanium-grey edge gradient, and cursor 3D tilt.
 */
export function PhoneFrame({
  children,
  enableTilt = true,
  className,
  showGlare = true,
}: PhoneFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Mouse tilt motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for 3D cursor tilt
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 300,
    damping: 30,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(motionQuery.matches);
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || prefersReducedMotion || isTouchDevice || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className={clsx('flex items-center justify-center p-4', className)}
    >
      <motion.div
        ref={frameRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: enableTilt && !prefersReducedMotion && !isTouchDevice ? rotateX : 0,
          rotateY: enableTilt && !prefersReducedMotion && !isTouchDevice ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        className={clsx(
          'relative w-[390px] h-[844px] max-w-full rounded-[55px] p-[6px] select-none',
          'bg-gradient-to-b from-[#4A4A4F] via-[#2C2C30] to-[#1C1C1F]',
          'shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.4)]'
        )}
      >
        {/* Left Side Buttons (Volume Up/Down) */}
        <div className="absolute -left-[9px] top-[140px] w-[3px] h-[34px] bg-[#3A3A3E] rounded-l-sm" />
        <div className="absolute -left-[9px] top-[190px] w-[3px] h-[55px] bg-[#3A3A3E] rounded-l-sm" />
        <div className="absolute -left-[9px] top-[260px] w-[3px] h-[55px] bg-[#3A3A3E] rounded-l-sm" />

        {/* Right Side Button (Power / Action) */}
        <div className="absolute -right-[9px] top-[200px] w-[3px] h-[75px] bg-[#3A3A3E] rounded-r-sm" />

        {/* Inner Screen Bezel */}
        <div className="relative w-full h-full rounded-[49px] overflow-hidden bg-surface flex flex-col border border-black/40">
          {/* Top Status Bar & Camera Island Cutout */}
          <div className="absolute top-0 inset-x-0 z-30 h-11 px-7 flex items-center justify-between pointer-events-none">
            {/* Clock Time */}
            <span className="text-[14px] font-semibold tracking-tight text-label">
              9:41
            </span>

            {/* Dynamic Island Camera Cutout */}
            <div className="w-[115px] h-[30px] bg-black rounded-full flex items-center justify-end px-2.5 shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-[#181820] border border-[#282835]" />
            </div>

            {/* Network / Battery Icons */}
            <div className="flex items-center gap-1.5 text-label">
              <span className="text-[11px] font-bold">5G</span>
              <div className="w-5 h-2.5 rounded-sm border border-current p-0.5 flex items-center">
                <div className="w-full h-full bg-current rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Screen Glare Reflection Layer */}
          {showGlare && (
            <div
              className="absolute inset-0 pointer-events-none z-20 opacity-30"
              style={{
                background:
                  'linear-gradient(130deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 35%, transparent 60%)',
              }}
            />
          )}

          {/* Active Screen Content Container */}
          <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain flex flex-col pt-11 pb-6">
            {children}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="absolute bottom-2 inset-x-0 z-30 flex justify-center pointer-events-none">
            <div className="w-32 h-1 rounded-full bg-label/40" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
