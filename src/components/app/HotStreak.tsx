"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";

// ─── Constants ───────────────────────────────────
const STREAK_THRESHOLD = 3;
const STORAGE_KEY = "cesoir_hot_streak";

interface StreakData {
  count: number;
  date: string;
  lastMatchTime: number;
}

// ─── Variants ────────────────────────────────────
const flameVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springs.elastic,
  },
  pulse: {
    scale: [1, 1.15, 1],
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const badgeVariants = {
  hidden: { scale: 0, rotate: -90 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: springs.rubber,
  },
};

const notificationVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.elastic,
  },
  exit: {
    opacity: 0,
    y: 60,
    scale: 0.8,
    transition: { duration: 0.3 },
  },
};

const glowAnimation = {
  boxShadow: [
    "0 0 0px rgba(239,68,68,0)",
    "0 0 20px rgba(239,68,68,0.4)",
    "0 0 0px rgba(239,68,68,0)",
  ],
  transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const },
};

// ─── Storage helpers ─────────────────────────────
function loadStreak(): StreakData {
  if (typeof window === "undefined") return { count: 0, date: "", lastMatchTime: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, date: "", lastMatchTime: 0 };
    return JSON.parse(raw) as StreakData;
  } catch {
    return { count: 0, date: "", lastMatchTime: 0 };
  }
}

function saveStreak(data: StreakData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTonight(): string {
  return new Date().toDateString();
}

function isMidnightReset(streakDate: string): boolean {
  return streakDate !== getTonight();
}

// ─── Component ───────────────────────────────────

interface HotStreakProps {
  /** Avatar URL to wrap with flame border */
  avatarUrl?: string;
  /** Avatar size in pixels */
  size?: number;
  /** Whether to show as inline badge (no avatar) */
  badgeOnly?: boolean;
  /** Callback when streak changes */
  onStreakChange?: (count: number) => void;
}

export default function HotStreak({
  avatarUrl,
  size = 64,
  badgeOnly = false,
  onStreakChange,
}: HotStreakProps) {
  const [streak, setStreak] = useState<StreakData>({ count: 0, date: "", lastMatchTime: 0 });
  const [showNotification, setShowNotification] = useState(false);
  const [justTriggered, setJustTriggered] = useState(false);

  // Load streak on mount
  useEffect(() => {
    const data = loadStreak();
    // Auto-reset at midnight
    if (isMidnightReset(data.date)) {
      const reset = { count: 0, date: getTonight(), lastMatchTime: 0 };
      saveStreak(reset);
      setStreak(reset);
    } else {
      setStreak(data);
    }
  }, []);

  // Public method to register a match (called by parent)
  const registerMatch = useCallback(() => {
    setStreak((prev) => {
      const tonight = getTonight();
      const newCount = isMidnightReset(prev.date) ? 1 : prev.count + 1;
      const updated: StreakData = {
        count: newCount,
        date: tonight,
        lastMatchTime: Date.now(),
      };
      saveStreak(updated);

      // Show notification when threshold hit
      if (newCount >= STREAK_THRESHOLD && prev.count < STREAK_THRESHOLD) {
        setJustTriggered(true);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 4000);
      }

      onStreakChange?.(newCount);
      return updated;
    });
  }, [onStreakChange]);

  // Expose registerMatch globally for demo
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__hotStreakRegister = registerMatch;
    return () => {
      delete (window as unknown as Record<string, unknown>).__hotStreakRegister;
    };
  }, [registerMatch]);

  const isHot = streak.count >= STREAK_THRESHOLD;

  // Badge-only mode
  if (badgeOnly) {
    if (!isHot) return null;
    return (
      <motion.div
        className="inline-flex items-center gap-1.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-full px-2.5 py-1"
        variants={badgeVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.span className="text-[14px]" animate={flameVariants.pulse}>
          🔥
        </motion.span>
        <span className="text-[11px] font-black text-[#EF4444]">
          {streak.count} matchs
        </span>
      </motion.div>
    );
  }

  return (
    <>
      {/* Avatar with flame border */}
      <div className="relative inline-block" style={{ width: size, height: size }}>
        {/* Flame glow ring */}
        <AnimatePresence>
          {isHot && (
            <motion.div
              className="absolute inset-[-4px] rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #EF4444, #f59e0b, #EF4444, #f97316, #EF4444)",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                opacity: springs.elastic,
                scale: springs.elastic,
                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
              }}
            />
          )}
        </AnimatePresence>

        {/* Inner ring (bg color gap) */}
        <div
          className="absolute inset-0 rounded-full bg-bg"
          style={{ margin: isHot ? 2 : 0 }}
        />

        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="relative w-full h-full rounded-full object-cover"
            style={{ padding: isHot ? 4 : 0 }}
          />
        ) : (
          <div
            className="relative w-full h-full rounded-full bg-accent/10 flex items-center justify-center"
            style={{ padding: isHot ? 4 : 0 }}
          >
            <span className="text-accent text-[20px] font-bold">?</span>
          </div>
        )}

        {/* Counter badge */}
        <AnimatePresence>
          {isHot && (
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#EF4444] flex items-center justify-center shadow-lg"
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <span className="text-[9px] font-black text-white">{streak.count}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flame icon at bottom */}
        <AnimatePresence>
          {isHot && (
            <motion.div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2"
              variants={flameVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.span className="text-[16px]" animate={flameVariants.pulse}>
                🔥
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notification toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="fixed bottom-28 left-4 right-4 z-50"
            variants={notificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-bg-card border-2 border-[#EF4444]/30 rounded-2xl p-4 shadow-xl"
              animate={glowAnimation}
            >
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-[32px]"
                  animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  🔥
                </motion.span>
                <div>
                  <p className="text-[15px] font-black text-text">Hot Streak !</p>
                  <p className="text-[12px] text-text-muted">
                    Tu es en feu ! {streak.count} matchs d&apos;affilee ce soir
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
