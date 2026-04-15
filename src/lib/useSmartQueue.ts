"use client";

// ========================================
// useSmartQueue — Curated match queue with hourly refresh
// ========================================
//
// Instead of endless swiping, users get 5-10 top matches
// refreshed every hour. Quality over quantity.

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGeolocation } from "@/lib/useGeolocation";
import { findMatches, type MatchCandidate, type MatchOptions } from "@/lib/matching";

// ─── Constants ───

/** Refresh cooldown: 1 hour in milliseconds */
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

/** Minimum score threshold for queue inclusion */
const MIN_SCORE = 60;

/** Target queue size */
const QUEUE_SIZE = 8;

/** LocalStorage keys */
const LS_SEEN_KEY = "cesoir_queue_seen";
const LS_REFRESH_KEY = "cesoir_queue_refresh_at";
const LS_QUEUE_KEY = "cesoir_queue_cache";

// ─── Types ───

interface UseSmartQueueReturn {
  /** Curated queue of top matches */
  queue: MatchCandidate[];
  /** True while fetching matches */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Timestamp for next allowed refresh (ISO string) */
  refreshAt: string | null;
  /** Whether the user can manually refresh right now */
  canRefresh: boolean;
  /** Manually trigger a queue refresh (respects cooldown) */
  refresh: () => Promise<void>;
  /** Mark a profile as seen/reviewed (removes from queue) */
  markSeen: (profileId: string) => void;
  /** Number of profiles remaining in this batch */
  remaining: number;
}

// ─── Helpers ───

function getSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function persistSeenIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  // Keep only the last 200 to avoid unbounded growth
  const arr = Array.from(ids).slice(-200);
  localStorage.setItem(LS_SEEN_KEY, JSON.stringify(arr));
}

function getStoredRefreshAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_REFRESH_KEY);
}

function setStoredRefreshAt(iso: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_REFRESH_KEY, iso);
}

function getCachedQueue(): MatchCandidate[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_QUEUE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MatchCandidate[];
  } catch {
    return null;
  }
}

function setCachedQueue(queue: MatchCandidate[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(queue));
}

// ─── Hook ───

export function useSmartQueue(options: Omit<MatchOptions, "limit"> = {}): UseSmartQueueReturn {
  const { user } = useAuth();
  const { latitude, longitude } = useGeolocation();

  const [queue, setQueue] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshAt, setRefreshAt] = useState<string | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize seen IDs and refresh timestamp from localStorage
  useEffect(() => {
    setSeenIds(getSeenIds());
    setRefreshAt(getStoredRefreshAt());
  }, []);

  // Check if refresh is allowed
  const canRefresh = (() => {
    if (!refreshAt) return true;
    return new Date().getTime() >= new Date(refreshAt).getTime();
  })();

  // Fetch curated queue
  const fetchQueue = useCallback(async (force = false) => {
    if (!user?.id || !latitude || !longitude) return;

    // Respect cooldown unless forced
    if (!force && !canRefresh) return;

    setLoading(true);
    setError(null);

    try {
      // Over-fetch to filter by score threshold
      const results = await findMatches(user.id, latitude, longitude, {
        ...optionsRef.current,
        limit: QUEUE_SIZE * 3,
      });

      // Filter: score >= threshold, not already seen in this session
      const currentSeen = getSeenIds();
      const filtered = results
        .filter((m) => m.score >= MIN_SCORE)
        .filter((m) => !currentSeen.has(m.id))
        .slice(0, QUEUE_SIZE);

      setQueue(filtered);
      setCachedQueue(filtered);

      // Set next refresh time
      const nextRefresh = new Date(Date.now() + REFRESH_INTERVAL_MS).toISOString();
      setRefreshAt(nextRefresh);
      setStoredRefreshAt(nextRefresh);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      console.error("[useSmartQueue] fetch failed:", err);

      // Fall back to cached queue if available
      const cached = getCachedQueue();
      if (cached && cached.length > 0) {
        const currentSeen = getSeenIds();
        setQueue(cached.filter((m) => !currentSeen.has(m.id)));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, latitude, longitude, canRefresh]);

  // Initial fetch
  useEffect(() => {
    if (!user?.id || !latitude || !longitude) {
      setLoading(false);
      return;
    }

    // If we have a cached queue and refresh isn't due, use cache
    const cached = getCachedQueue();
    const currentSeen = getSeenIds();

    if (cached && cached.length > 0 && !canRefresh) {
      const filteredCache = cached.filter((m) => !currentSeen.has(m.id));
      setQueue(filteredCache);
      setLoading(false);
      return;
    }

    fetchQueue(true);
  }, [user?.id, latitude, longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark a profile as seen
  const markSeen = useCallback((profileId: string) => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      next.add(profileId);
      persistSeenIds(next);
      return next;
    });

    setQueue((prev) => prev.filter((m) => m.id !== profileId));
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchQueue(true);
  }, [fetchQueue]);

  return {
    queue,
    loading,
    error,
    refreshAt,
    canRefresh,
    refresh,
    markSeen,
    remaining: queue.length,
  };
}
