"use client";

// ========================================
// useMatchCap — Session match limiter
// ========================================
//
// Tracks how many matches the user has made this evening.
// Resets at midnight. Max 8 matches per session to keep
// interactions meaningful and prevent mindless swiping.

import { useState, useEffect, useCallback } from "react";

/** Max matches allowed per evening session */
const MAX_MATCHES = 8;

/** localStorage key */
const STORAGE_KEY = "cesoir_match_cap";

/** Get today's date as YYYY-MM-DD */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Calculate milliseconds until next midnight */
function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

interface StoredCap {
  date: string;
  count: number;
}

interface UseMatchCapResult {
  /** Number of matches used this session */
  matchesUsed: number;
  /** Number of matches remaining (MAX_MATCHES - used) */
  matchesRemaining: number;
  /** True if the user has reached the cap */
  isAtCap: boolean;
  /** Time string for when the cap resets (e.g. "minuit") */
  resetTime: string;
  /** Increment the match counter (call after a successful match) */
  incrementMatch: () => void;
}

function loadCap(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const stored: StoredCap = JSON.parse(raw);
    if (stored.date !== todayKey()) return 0;
    return stored.count;
  } catch {
    return 0;
  }
}

function saveCap(count: number): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayKey(), count } satisfies StoredCap),
    );
  } catch {
    // noop
  }
}

export function useMatchCap(): UseMatchCapResult {
  const [matchesUsed, setMatchesUsed] = useState(0);

  // Load persisted count on mount
  useEffect(() => {
    setMatchesUsed(loadCap());
  }, []);

  // Auto-reset at midnight
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMatchesUsed(0);
      saveCap(0);
    }, msUntilMidnight());

    return () => clearTimeout(timeout);
  }, [matchesUsed]);

  const incrementMatch = useCallback(() => {
    setMatchesUsed((prev) => {
      const next = Math.min(prev + 1, MAX_MATCHES);
      saveCap(next);
      return next;
    });
  }, []);

  const matchesRemaining = Math.max(0, MAX_MATCHES - matchesUsed);
  const isAtCap = matchesUsed >= MAX_MATCHES;

  // Format reset time
  const now = new Date();
  const resetTime =
    now.getHours() >= 18
      ? "minuit"
      : now.getHours() < 6
        ? "06h00"
        : "minuit";

  return {
    matchesUsed,
    matchesRemaining,
    isAtCap,
    resetTime,
    incrementMatch,
  };
}
