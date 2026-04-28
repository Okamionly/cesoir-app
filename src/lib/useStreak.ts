"use client";

/**
 * useStreak — Wave 17 visible daily streak chain.
 *
 * On mount (and when the user changes), this hook:
 *   1. Reads the user's row from `user_streaks`.
 *   2. Computes `today` (UTC calendar date).
 *   3. If `last_active_date` is missing or strictly before today:
 *        - last_active_date == yesterday → continue: current_streak + 1
 *        - else (gap of 2+ days, or first ever) → reset: current_streak = 1
 *      Then UPSERTs the new row with today's date.
 *   4. If `last_active_date` is already today, do nothing (no double
 *      increment when the user opens the app multiple times).
 *
 * Returns { currentStreak, longestStreak, isOnFire } where isOnFire is
 * true when currentStreak >= 3.
 *
 * Why UTC midnight: the user can be in any timezone and we need a
 * single consistent rollover instant for everyone. Trade-off: a user
 * in UTC-7 who opens the app at 23:00 local time on Tuesday is doing
 * it at 06:00 UTC Wednesday — which is fine, both Tuesday-evening and
 * Wednesday-morning visits count as the same UTC day. The reverse
 * (UTC+7 user opens at 01:00 local Tuesday = 18:00 UTC Monday) means
 * their streak day flips earlier in their evening; acceptable for a
 * visible chain feature.
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface UseStreakReturn {
  currentStreak: number;
  longestStreak: number;
  isOnFire: boolean;
  loading: boolean;
}

interface StreakRow {
  current_streak: number;
  longest_streak: number;
  last_active_date: string; // ISO date "YYYY-MM-DD"
}

// ─────────────────────────────────────────
// Date helpers (UTC)
// ─────────────────────────────────────────

/** Today's date in UTC, formatted "YYYY-MM-DD". */
function todayUTC(): string {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
}

/**
 * Given an ISO date "YYYY-MM-DD", returns the date one calendar day
 * before in UTC, also as "YYYY-MM-DD". Used to detect "did the user
 * open the app yesterday?".
 */
function previousUTCDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const ts = Date.UTC(y, (m ?? 1) - 1, d ?? 1) - 24 * 60 * 60 * 1000;
  return new Date(ts).toISOString().slice(0, 10);
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useStreak(): UseStreakReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Guard against double-running for the same user in the same render
  // pass (StrictMode runs effects twice in dev). Without this we'd
  // double-UPSERT today, which is idempotent but wasteful.
  const handledForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setCurrentStreak(0);
      setLongestStreak(0);
      setLoading(false);
      handledForUserRef.current = null;
      return;
    }

    if (handledForUserRef.current === userId) {
      // Already handled this user in this mount cycle.
      return;
    }
    handledForUserRef.current = userId;

    let cancelled = false;

    (async () => {
      setLoading(true);
      const today = todayUTC();

      // 1. Read existing row.
      const { data, error } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, last_active_date")
        .eq("user_id", userId)
        .maybeSingle<StreakRow>();

      if (cancelled) return;

      if (error) {
        // RLS misconfig or transient — fail gracefully, show 0.
        setCurrentStreak(0);
        setLongestStreak(0);
        setLoading(false);
        return;
      }

      // 2. Decide next state.
      let nextCurrent: number;
      let nextLongest: number;
      let needsWrite: boolean;

      if (!data) {
        // First ever: streak starts at 1.
        nextCurrent = 1;
        nextLongest = 1;
        needsWrite = true;
      } else if (data.last_active_date === today) {
        // Already counted today — no double increment.
        nextCurrent = data.current_streak;
        nextLongest = data.longest_streak;
        needsWrite = false;
      } else if (data.last_active_date === previousUTCDate(today)) {
        // Continued the chain.
        nextCurrent = data.current_streak + 1;
        nextLongest = Math.max(data.longest_streak, nextCurrent);
        needsWrite = true;
      } else {
        // Gap of 2+ days: reset to 1.
        nextCurrent = 1;
        nextLongest = Math.max(data.longest_streak, 1);
        needsWrite = true;
      }

      setCurrentStreak(nextCurrent);
      setLongestStreak(nextLongest);
      setLoading(false);

      // 3. Persist if changed.
      if (needsWrite) {
        const { error: upsertError } = await supabase
          .from("user_streaks")
          .upsert(
            {
              user_id: userId,
              current_streak: nextCurrent,
              longest_streak: nextLongest,
              last_active_date: today,
            },
            { onConflict: "user_id" },
          );

        if (upsertError && !cancelled) {
          // Best-effort; UI already shows the optimistic value.
          // Reset the guard so a future remount can retry the write.
          handledForUserRef.current = null;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    currentStreak,
    longestStreak,
    isOnFire: currentStreak >= 3,
    loading,
  };
}

export default useStreak;
