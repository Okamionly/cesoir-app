"use client";

// ========================================
// useMostCompatible — Daily best match pick
// ========================================
//
// Returns the single most compatible profile of the day.
// Uses the matching scoring pipeline + daily seeded randomization
// to keep things fresh. Persists in localStorage so the pick
// stays consistent throughout the day.

import { useState, useEffect, useCallback } from "react";
import { useMatches } from "@/lib/useMatches";
import type { MatchCandidate } from "@/lib/matching";

/** localStorage key prefix */
const STORAGE_KEY = "cesoir_daily_pick";
const SEEN_KEY = "cesoir_daily_pick_seen";

/** Get today's date as YYYY-MM-DD */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Deterministic daily hash so the same user gets a consistent "lucky" offset */
function dailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface StoredPick {
  date: string;
  candidateId: string;
}

interface UseMostCompatibleResult {
  /** The best match candidate for today (null while loading or if none found) */
  pick: MatchCandidate | null;
  /** True while matching pipeline is loading */
  loading: boolean;
  /** Whether the user has already viewed today's pick */
  hasSeen: boolean;
  /** Mark the pick as seen (hides the "new" indicator) */
  markSeen: () => void;
}

export function useMostCompatible(): UseMostCompatibleResult {
  const { matches, loading } = useMatches({ limit: 50 });
  const [pick, setPick] = useState<MatchCandidate | null>(null);
  const [hasSeen, setHasSeen] = useState(false);

  // Resolve today's pick from matches
  useEffect(() => {
    if (loading || matches.length === 0) return;

    const today = todayKey();

    // Check localStorage for a persisted pick
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: StoredPick = JSON.parse(raw);
        if (stored.date === today) {
          // Find this candidate in today's matches
          const found = matches.find((m) => m.id === stored.candidateId);
          if (found) {
            setPick(found);
            // Check seen status
            const seenRaw = localStorage.getItem(SEEN_KEY);
            if (seenRaw === today) setHasSeen(true);
            return;
          }
          // Candidate no longer available — fall through to pick a new one
        }
      }
    } catch {
      // localStorage unavailable — continue
    }

    // Pick the best candidate with daily randomization
    // Take the top 5 by score, then use daily seed to select one
    const topCandidates = matches
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const seed = dailySeed(today);
    const selected = topCandidates[seed % topCandidates.length];

    if (selected) {
      setPick(selected);
      // Persist the pick
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ date: today, candidateId: selected.id } satisfies StoredPick),
        );
      } catch {
        // Silently fail if localStorage is full
      }
    }
  }, [matches, loading]);

  // Check seen on mount
  useEffect(() => {
    try {
      const seenRaw = localStorage.getItem(SEEN_KEY);
      if (seenRaw === todayKey()) setHasSeen(true);
    } catch {
      // noop
    }
  }, []);

  const markSeen = useCallback(() => {
    setHasSeen(true);
    try {
      localStorage.setItem(SEEN_KEY, todayKey());
    } catch {
      // noop
    }
  }, []);

  return { pick, loading, hasSeen, markSeen };
}
