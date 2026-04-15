"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface TimeUntilReset {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export interface UseMidnightResetReturn {
  /** Time remaining until midnight */
  timeUntilReset: TimeUntilReset;
  /** True during the reset window (first few seconds after midnight) */
  isResetting: boolean;
  /** True if the reset has already happened today */
  hasResetToday: boolean;
  /** Force a manual reset (for testing or pull-to-refresh) */
  forceReset: () => void;
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

const STORAGE_KEY = "cesoir_last_reset_date";

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getTimeUntilMidnight(): TimeUntilReset {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds, totalMs: diff };
}

function getLastResetDate(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setLastResetDate(date: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, date);
  } catch {
    // localStorage unavailable — silent fail
  }
}

// ─────────────────────────────────────────
// Cache keys to clear on reset
// ─────────────────────────────────────────

const INTERACTION_CACHE_KEYS = [
  "cesoir_today_interactions",
  "cesoir_today_swipes",
  "cesoir_daily_challenges",
  "cesoir_daily_matches",
];

function clearTodayCache(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of INTERACTION_CACHE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // silent fail
  }
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useMidnightReset(): UseMidnightResetReturn {
  const [timeUntilReset, setTimeUntilReset] = useState<TimeUntilReset>(
    getTimeUntilMidnight,
  );
  const [isResetting, setIsResetting] = useState(false);
  const [hasResetToday, setHasResetToday] = useState(() => {
    return getLastResetDate() === getTodayStr();
  });

  const resetInProgressRef = useRef(false);

  // ─── Perform the actual reset ───
  const performReset = useCallback(() => {
    if (resetInProgressRef.current) return;
    resetInProgressRef.current = true;

    setIsResetting(true);

    // Clear today's caches
    clearTodayCache();

    // Mark today as reset
    const today = getTodayStr();
    setLastResetDate(today);
    setHasResetToday(true);

    // Hold the "resetting" state for 3 seconds for the celebration overlay
    setTimeout(() => {
      setIsResetting(false);
      resetInProgressRef.current = false;
    }, 3000);
  }, []);

  // ─── Force reset (manual trigger) ───
  const forceReset = useCallback(() => {
    resetInProgressRef.current = false;
    performReset();
  }, [performReset]);

  // ─── Check if app was opened after midnight without a reset ───
  useEffect(() => {
    const lastReset = getLastResetDate();
    const today = getTodayStr();

    if (lastReset !== today) {
      // App opened after midnight — trigger reset
      performReset();
    }
  }, [performReset]);

  // ─── Countdown ticker ───
  useEffect(() => {
    // When < 60s to midnight, tick every second for dramatic countdown
    // Otherwise tick every second too (we need seconds for the countdown display)
    const interval = setInterval(() => {
      const t = getTimeUntilMidnight();
      setTimeUntilReset(t);

      // Midnight crossed
      if (t.totalMs <= 0) {
        const today = getTodayStr();
        const lastReset = getLastResetDate();
        if (lastReset !== today) {
          performReset();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [performReset]);

  return {
    timeUntilReset,
    isResetting,
    hasResetToday,
    forceReset,
  };
}
