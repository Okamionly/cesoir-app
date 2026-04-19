"use client";

// ========================================
// useMatchCap — Server-side match limiter
// ========================================
//
// Tracks how many matches the user has made this evening.
// Resets at midnight. Max 8 matches per session.
//
// Audit 2026-04-19: moved from localStorage to `match_caps` table.
// Clearing localStorage no longer bypasses the cap. The table is
// self-owned (RLS), so this hook talks directly via supabase client
// rather than a dedicated API route (no rate-limit value add here —
// the counter is bounded by MAX_MATCHES per day anyway).

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";

/** Max matches allowed per evening session */
const MAX_MATCHES = 8;

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

/** Calculate milliseconds until next midnight (local) */
function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/** Next midnight as ISO (server TZ agnostic — used as resets_at default) */
function nextMidnightISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useMatchCap(): UseMatchCapResult {
  const { user } = useAuth();
  const [matchesUsed, setMatchesUsed] = useState(0);

  // Load from server on mount / user change
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setMatchesUsed(0);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("match_caps")
        .select("likes_today, resets_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setMatchesUsed(0);
        return;
      }

      // If reset time has passed, treat as 0 (server resets on next write)
      const expired =
        data.resets_at && new Date(data.resets_at as string).getTime() <= Date.now();
      setMatchesUsed(expired ? 0 : (data.likes_today as number));
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Auto-reset at midnight locally (UI feedback). Server catches up on next write.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMatchesUsed(0);
    }, msUntilMidnight());

    return () => clearTimeout(timeout);
  }, [matchesUsed]);

  const incrementMatch = useCallback(() => {
    if (!user?.id) return;

    // Optimistic bump
    setMatchesUsed((prev) => {
      const next = Math.min(prev + 1, MAX_MATCHES);
      return next;
    });

    // Fire-and-forget upsert. RLS allows self-write.
    void (async () => {
      const { data: existing } = await supabase
        .from("match_caps")
        .select("likes_today, resets_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const expired =
        !existing ||
        (existing.resets_at &&
          new Date(existing.resets_at as string).getTime() <= Date.now());

      const nextCount = expired
        ? 1
        : Math.min(((existing?.likes_today as number) ?? 0) + 1, MAX_MATCHES);

      await supabase.from("match_caps").upsert(
        {
          user_id: user.id,
          likes_today: nextCount,
          resets_at: expired ? nextMidnightISO() : existing?.resets_at,
        },
        { onConflict: "user_id" },
      );
    })();
  }, [user?.id]);

  const matchesRemaining = Math.max(0, MAX_MATCHES - matchesUsed);
  const isAtCap = matchesUsed >= MAX_MATCHES;

  // Format reset time (display only)
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
