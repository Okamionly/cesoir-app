"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate, useSpring, type MotionValue } from "motion/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PullIndicatorProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  threshold?: number;
}

// ---------------------------------------------------------------------------
// Moon SVG that fills based on pull progress (0 -> 1)
// ---------------------------------------------------------------------------

function MoonFill({ progress }: { progress: number }) {
  const clamped = Math.min(1, Math.max(0, progress));
  const rotation = clamped * 180;

  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 32 32"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Outline */}
      <path
        d="M16 4C9.4 4 4 9.4 4 16s5.4 12 12 12c4.9 0 9.1-2.9 11-7.1-1.3.5-2.6.7-4 .7C16.4 25.6 11 20.2 11 13.6c0-3.5 1.5-6.7 3.9-8.9C15.3 4.3 15.6 4 16 4z"
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="1.5"
      />
      {/* Gradient fill controlled by opacity */}
      <path
        d="M16 4C9.4 4 4 9.4 4 16s5.4 12 12 12c4.9 0 9.1-2.9 11-7.1-1.3.5-2.6.7-4 .7C16.4 25.6 11 20.2 11 13.6c0-3.5 1.5-6.7 3.9-8.9C15.3 4.3 15.6 4 16 4z"
        fill="url(#pullMoonGrad)"
        opacity={clamped}
      />
      <defs>
        <linearGradient id="pullMoonGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#00FF88" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Reads a MotionValue into state so it can drive rendering
// ---------------------------------------------------------------------------

function MoonProgressBridge({ progress }: { progress: MotionValue<number> }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const unsub = progress.on("change", (v) => setVal(v));
    return unsub;
  }, [progress]);
  return <MoonFill progress={val} />;
}

// ---------------------------------------------------------------------------
// PullIndicator component
// ---------------------------------------------------------------------------

export default function PullIndicator({
  onRefresh,
  children,
  threshold = 80,
}: PullIndicatorProps) {
  const [refreshing, setRefreshing] = useState(false);

  const rawY = useMotionValue(0);
  const pullY = useSpring(rawY, { stiffness: 400, damping: 40 });
  const progress = useTransform(rawY, [0, threshold], [0, 1]);
  const indicatorOpacity = useTransform(rawY, [0, 20], [0, 1]);

  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    },
    [refreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        rawY.set(Math.min(delta * 0.5, threshold * 1.3));
      }
    },
    [rawY, threshold, refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) return;
    pulling.current = false;

    if (rawY.get() >= threshold) {
      setRefreshing(true);
      animate(rawY, threshold * 0.5, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        animate(rawY, 0, { type: "spring", stiffness: 300, damping: 30 });
      }
    } else {
      animate(rawY, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
  }, [onRefresh, rawY, threshold, refreshing]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <motion.div
        style={{ opacity: indicatorOpacity, y: pullY }}
        className="absolute left-1/2 top-0 z-50 -translate-x-1/2 -translate-y-full flex items-center justify-center pb-2"
      >
        <motion.div
          animate={refreshing ? { rotate: 360 } : {}}
          transition={
            refreshing
              ? { repeat: Infinity, duration: 0.8, ease: "linear" }
              : {}
          }
        >
          <MoonProgressBridge progress={progress} />
        </motion.div>

        {refreshing && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-2 text-xs text-text-muted"
          >
            Mise a jour...
          </motion.span>
        )}
      </motion.div>

      {/* Content shifted down by pull */}
      <motion.div style={{ y: pullY }}>{children}</motion.div>
    </div>
  );
}
