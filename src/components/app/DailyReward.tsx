"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useGamification } from "@/lib/useGamification";

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const STORAGE_KEY_STREAK = "cesoir_daily_streak";
const STORAGE_KEY_LAST_CLAIM = "cesoir_last_claim_date";
const STORAGE_KEY_DISMISSED = "cesoir_daily_reward_dismissed";

const DAY_REWARDS = [5, 10, 15, 20, 25, 35, 50];
const CYCLE_LENGTH = 7;

interface StreakData {
  day: number; // 1-7
  lastClaimDate: string | null;
  streakBroken: boolean;
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function loadStreak(): StreakData {
  if (typeof window === "undefined") {
    return { day: 1, lastClaimDate: null, streakBroken: false };
  }

  try {
    const lastClaim = localStorage.getItem(STORAGE_KEY_LAST_CLAIM);
    const savedDay = parseInt(localStorage.getItem(STORAGE_KEY_STREAK) || "1", 10);
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    // Already claimed today
    if (lastClaim === today) {
      return { day: savedDay, lastClaimDate: lastClaim, streakBroken: false };
    }

    // Claimed yesterday — streak continues
    if (lastClaim === yesterday) {
      const nextDay = savedDay >= CYCLE_LENGTH ? 1 : savedDay + 1;
      return { day: nextDay, lastClaimDate: lastClaim, streakBroken: false };
    }

    // Missed a day or first time — reset to day 1
    return {
      day: 1,
      lastClaimDate: lastClaim,
      streakBroken: lastClaim !== null,
    };
  } catch {
    return { day: 1, lastClaimDate: null, streakBroken: false };
  }
}

function hasDismissedToday(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY_DISMISSED) === getTodayStr();
  } catch {
    return false;
  }
}

function hasClaimedToday(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_CLAIM) === getTodayStr();
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────
// Floating coin animation
// ─────────────────────────────────────────

function FloatingCoin({ index, onDone }: { index: number; onDone: () => void }) {
  const left = 30 + Math.random() * 40; // 30-70%
  const delay = index * 0.08;

  useEffect(() => {
    const timer = setTimeout(onDone, 1200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="absolute pointer-events-none text-[20px]"
      style={{ left: `${left}%`, bottom: "40%" }}
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -120, scale: 1.2 }}
      transition={{
        ...springs.rubber,
        delay,
        opacity: { duration: 0.8, delay: delay + 0.4 },
      }}
      aria-hidden="true"
    >
      {index % 2 === 0 ? "\u2B50" : "\u2728"}
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function DailyReward() {
  const [visible, setVisible] = useState(false);
  const [streakData, setStreakData] = useState<StreakData>({ day: 1, lastClaimDate: null, streakBroken: false });
  const [claimed, setClaimed] = useState(false);
  const [coins, setCoins] = useState<number[]>([]);
  const { addXP } = useGamification();

  // Check on mount whether to show
  useEffect(() => {
    if (hasClaimedToday() || hasDismissedToday()) return;
    const data = loadStreak();
    setStreakData(data);
    // Slight delay so the app feels loaded first
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleClaim = useCallback(async () => {
    if (claimed) return;
    setClaimed(true);

    const reward = DAY_REWARDS[(streakData.day - 1) % CYCLE_LENGTH];

    // Spawn coins
    setCoins(Array.from({ length: 8 }, (_, i) => i));

    // Save streak
    try {
      localStorage.setItem(STORAGE_KEY_LAST_CLAIM, getTodayStr());
      localStorage.setItem(STORAGE_KEY_STREAK, String(streakData.day));
    } catch {
      // silent
    }

    // Add XP via gamification
    await addXP("daily_login", reward);

    // Auto-dismiss after animation
    setTimeout(() => setVisible(false), 2000);
  }, [claimed, streakData.day, addXP]);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, getTodayStr());
    } catch {
      // silent
    }
    setVisible(false);
  }, []);

  const removeCoin = useCallback(() => {
    // No-op — coins animate out on their own
  }, []);

  const currentReward = DAY_REWARDS[(streakData.day - 1) % CYCLE_LENGTH];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[280] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-label="Recompense quotidienne"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(6px)" }}
            onClick={handleDismiss}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 w-[320px] rounded-3xl overflow-hidden"
            style={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={springs.elastic}
          >
            {/* Floating coins layer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {coins.map((i) => (
                <FloatingCoin key={i} index={i} onDone={removeCoin} />
              ))}
            </div>

            <div className="px-6 pt-8 pb-6 flex flex-col items-center">
              {/* Streak broken message */}
              {streakData.streakBroken && !claimed && (
                <motion.p
                  className="text-[11px] font-medium mb-3 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.snap}
                >
                  Serie perdue ! On recommence
                </motion.p>
              )}

              {/* Title */}
              <motion.p
                className="text-[11px] font-bold tracking-[0.25em] uppercase mb-2"
                style={{ color: "#00FF88" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.snap, delay: 0.1 }}
              >
                Recompense du jour
              </motion.p>

              {/* Day number */}
              <motion.p
                className="font-black text-[48px] leading-none mb-4"
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk')",
                  background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springs.elastic}
              >
                Jour {streakData.day}
              </motion.p>

              {/* 7-day circles */}
              <div className="flex items-center gap-2 mb-6">
                {DAY_REWARDS.map((reward, i) => {
                  const dayNum = i + 1;
                  const isPast = dayNum < streakData.day;
                  const isCurrent = dayNum === streakData.day;
                  const isFuture = dayNum > streakData.day;

                  return (
                    <motion.div
                      key={dayNum}
                      className="flex flex-col items-center gap-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        ...springs.elastic,
                        delay: 0.2 + i * 0.06,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: isPast
                            ? "#00FF88"
                            : isCurrent
                              ? "linear-gradient(135deg, #8B5CF6, #00FF88)"
                              : "rgba(255,255,255,0.06)",
                          color: isPast || isCurrent ? "#000" : "#555",
                          border: isCurrent
                            ? "2px solid #00FF88"
                            : "1px solid rgba(255,255,255,0.08)",
                          boxShadow: isCurrent
                            ? "0 0 12px rgba(0,255,136,0.3)"
                            : "none",
                        }}
                      >
                        {isPast ? "\u2713" : `+${reward}`}
                      </div>
                      <span
                        className="text-[8px] font-medium"
                        style={{
                          color: isCurrent ? "#00FF88" : isFuture ? "#444" : "#888",
                        }}
                      >
                        J{dayNum}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Reward amount */}
              <motion.div
                className="flex items-center gap-2 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-[24px]" aria-hidden="true">
                  {streakData.day === 7 ? "\u{1F31F}" : "\u2B50"}
                </span>
                <span
                  className="font-black text-[28px]"
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk')",
                    background: "linear-gradient(135deg, #00FF88, #8B5CF6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  +{currentReward} XP
                </span>
                {streakData.day === 7 && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
                  >
                    BONUS
                  </span>
                )}
              </motion.div>

              {/* Claim button */}
              {!claimed ? (
                <motion.button
                  onClick={handleClaim}
                  className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-black"
                  style={{
                    background: "linear-gradient(135deg, #00FF88, #8B5CF6)",
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springs.heavy, delay: 0.6 }}
                  whileTap={{ scale: 0.95, transition: springs.micro }}
                >
                  Reclamer
                </motion.button>
              ) : (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={springs.elastic}
                >
                  <span className="text-[20px]">{"\u2705"}</span>
                  <span className="font-bold text-[15px]" style={{ color: "#00FF88" }}>
                    Reclame !
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
