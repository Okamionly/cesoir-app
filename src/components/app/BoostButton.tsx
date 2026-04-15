"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface BoostButtonProps {
  isPremium?: boolean;
  onBoostStart?: () => void;
  onBoostEnd?: () => void;
}

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const BOOST_DURATION_MS = 30 * 60 * 1000; // 30 min
const STORAGE_KEY_BOOST = "cesoir_boost_end";
const STORAGE_KEY_USED = "cesoir_boost_used";

function formatTimeLeft(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function BoostButton({
  isPremium = false,
  onBoostStart,
  onBoostEnd,
}: BoostButtonProps) {
  const [boostActive, setBoostActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [alreadyUsed, setAlreadyUsed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore boost state on mount
  useEffect(() => {
    try {
      const endStr = localStorage.getItem(STORAGE_KEY_BOOST);
      if (endStr) {
        const endTime = parseInt(endStr, 10);
        const remaining = endTime - Date.now();
        if (remaining > 0) {
          setBoostActive(true);
          setTimeLeft(remaining);
        } else {
          localStorage.removeItem(STORAGE_KEY_BOOST);
        }
      }

      const usedStr = localStorage.getItem(STORAGE_KEY_USED);
      if (usedStr) {
        const usedDate = new Date(usedStr);
        const now = new Date();
        // Reset daily for premium, weekly for free
        if (isPremium) {
          if (usedDate.toDateString() === now.toDateString()) {
            setAlreadyUsed(true);
          }
        } else {
          const diffDays = (now.getTime() - usedDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays < 7) {
            setAlreadyUsed(true);
          }
        }
      }
    } catch {
      // noop
    }
  }, [isPremium]);

  // Countdown timer
  useEffect(() => {
    if (!boostActive) return;

    intervalRef.current = setInterval(() => {
      try {
        const endStr = localStorage.getItem(STORAGE_KEY_BOOST);
        if (!endStr) {
          setBoostActive(false);
          setTimeLeft(0);
          return;
        }
        const remaining = parseInt(endStr, 10) - Date.now();
        if (remaining <= 0) {
          setBoostActive(false);
          setTimeLeft(0);
          localStorage.removeItem(STORAGE_KEY_BOOST);
          onBoostEnd?.();
        } else {
          setTimeLeft(remaining);
        }
      } catch {
        // noop
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [boostActive, onBoostEnd]);

  const activateBoost = useCallback(() => {
    const endTime = Date.now() + BOOST_DURATION_MS;
    try {
      localStorage.setItem(STORAGE_KEY_BOOST, String(endTime));
      localStorage.setItem(STORAGE_KEY_USED, new Date().toISOString());
    } catch {
      // noop
    }
    setBoostActive(true);
    setTimeLeft(BOOST_DURATION_MS);
    setAlreadyUsed(true);
    onBoostStart?.();
  }, [onBoostStart]);

  // Active boost state
  if (boostActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springs.elastic}
        className="relative"
      >
        {/* Pulsing glow ring */}
        <motion.div
          className="absolute -inset-1 rounded-full"
          animate={{
            boxShadow: [
              "0 0 0px rgba(139,92,246,0)",
              "0 0 20px rgba(139,92,246,0.6)",
              "0 0 0px rgba(139,92,246,0)",
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-full border overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(168,85,247,0.1))",
            borderColor: "rgba(139,92,246,0.4)",
          }}
          animate={{
            borderColor: [
              "rgba(139,92,246,0.3)",
              "rgba(139,92,246,0.7)",
              "rgba(139,92,246,0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Animated lightning */}
          <motion.span
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -10, 10, 0],
              textShadow: [
                "0 0 0px rgba(139,92,246,0)",
                "0 0 12px rgba(139,92,246,0.8)",
                "0 0 0px rgba(139,92,246,0)",
              ],
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-base"
            aria-hidden="true"
          >
            {"\u26A1"}
          </motion.span>

          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-accent leading-tight">
              Boost actif
            </span>
            <motion.span
              key={formatTimeLeft(timeLeft)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold text-text tabular-nums"
            >
              {formatTimeLeft(timeLeft)}
            </motion.span>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border">
            <motion.div
              className="h-full gradient-bg"
              style={{
                width: `${(timeLeft / BOOST_DURATION_MS) * 100}%`,
              }}
              transition={{ duration: 1 }}
            />
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Inactive state
  return (
    <motion.button
      onClick={activateBoost}
      disabled={alreadyUsed}
      whileHover={!alreadyUsed ? { scale: 1.05, boxShadow: "0 0 20px rgba(139,92,246,0.4)" } : {}}
      whileTap={!alreadyUsed ? { scale: 0.92 } : {}}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
        alreadyUsed
          ? "border border-border text-text-muted/50 cursor-not-allowed"
          : "gradient-bg text-white shadow-glow"
      }`}
      aria-label={alreadyUsed ? "Boost deja utilise" : "Booster mon profil pendant 30 minutes"}
    >
      <span aria-hidden="true">{"\u26A1"}</span>
      {alreadyUsed ? (
        <span>
          Boost utilise
          <span className="text-[10px] ml-1 opacity-60">
            ({isPremium ? "1/jour" : "1/semaine"})
          </span>
        </span>
      ) : (
        "Booster mon profil"
      )}
    </motion.button>
  );
}
