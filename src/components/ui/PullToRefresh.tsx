"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate, type MotionValue } from "motion/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  threshold?: number;
}

// ---------------------------------------------------------------------------
// Moon icon that fills based on progress (0-1)
// ---------------------------------------------------------------------------

function MoonIndicator({ progress }: { progress: number }) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const fillOpacity = clampedProgress;
  const rotation = clampedProgress * 180;

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Outline moon */}
      <path
        d="M16 4C9.4 4 4 9.4 4 16s5.4 12 12 12c4.9 0 9.1-2.9 11-7.1-1.3.5-2.6.7-4 .7C16.4 25.6 11 20.2 11 13.6c0-3.5 1.5-6.7 3.9-8.9C15.3 4.3 15.6 4 16 4z"
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="1.5"
      />
      {/* Fill moon with gradient */}
      <path
        d="M16 4C9.4 4 4 9.4 4 16s5.4 12 12 12c4.9 0 9.1-2.9 11-7.1-1.3.5-2.6.7-4 .7C16.4 25.6 11 20.2 11 13.6c0-3.5 1.5-6.7 3.9-8.9C15.3 4.3 15.6 4 16 4z"
        fill="url(#moonGradient)"
        opacity={fillOpacity}
      />
      <defs>
        <linearGradient id="moonGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#00FF88" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const progress = useTransform(pullY, [0, threshold], [0, 1]);
  const indicatorOpacity = useTransform(pullY, [0, 20], [0, 1]);

  const touchStartY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    },
    [refreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const delta = e.touches[0].clientY - touchStartY.current;
      if (delta > 0) {
        pullY.set(Math.min(delta * 0.5, threshold * 1.3));
      }
    },
    [pullY, threshold, refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) return;
    pulling.current = false;

    if (pullY.get() >= threshold) {
      setRefreshing(true);
      animate(pullY, threshold * 0.6, { type: "spring", stiffness: 300, damping: 30 });
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
      }
    } else {
      animate(pullY, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  }, [onRefresh, pullY, threshold, refreshing]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Indicator */}
      <motion.div
        style={{ opacity: indicatorOpacity, y: pullY }}
        className="absolute left-1/2 top-0 z-50 -translate-x-1/2 -translate-y-full flex items-center justify-center pb-2"
      >
        <motion.div
          animate={refreshing ? { rotate: 360 } : {}}
          transition={refreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
        >
          <MoonProgressWrapper progress={progress} />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y: pullY }}>
        {children}
      </motion.div>
    </div>
  );
}

// Wrapper to read MotionValue in render
function MoonProgressWrapper({ progress }: { progress: MotionValue<number> }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const unsubscribe = progress.on("change", (v) => setVal(v));
    return unsubscribe;
  }, [progress]);
  return <MoonIndicator progress={val} />;
}
