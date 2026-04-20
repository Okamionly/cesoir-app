"use client";

// ========================================
// useMatches — React hook for the CeSoir matching pipeline
// ========================================
//
// Returns scored, sorted match candidates for the current user.
// Auto-refreshes every 30 seconds so the feed stays alive.

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGeolocation } from "@/lib/useGeolocation";
import { findMatches, type MatchCandidate, type MatchOptions } from "@/lib/matching";
import { logger } from "@/lib/logger";

/** Auto-refresh interval in milliseconds. */
const REFRESH_INTERVAL_MS = 30_000;

interface UseMatchesResult {
  /** Scored match candidates, sorted best-first */
  matches: MatchCandidate[];
  /** True while the initial load or a refresh is in progress */
  loading: boolean;
  /** Error message if the last fetch failed */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => void;
}

export function useMatches(options: MatchOptions = {}): UseMatchesResult {
  const { user } = useAuth();
  const { latitude, longitude } = useGeolocation();

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep options in a ref so the interval callback always uses the latest
  // without re-triggering the effect on every render.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchMatches = useCallback(async () => {
    if (!user?.id || !latitude || !longitude) return;

    setLoading(true);
    setError(null);

    try {
      const results = await findMatches(
        user.id,
        latitude,
        longitude,
        optionsRef.current,
      );
      setMatches(results);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la recherche";
      setError(message);
      logger.error("use_matches_fetch_failed", { err: String(err) });
    } finally {
      setLoading(false);
    }
  }, [user?.id, latitude, longitude]);

  // Initial fetch + auto-refresh every 30s
  useEffect(() => {
    // Don't fetch until we have auth + position
    if (!user?.id || !latitude || !longitude) {
      setLoading(false);
      return;
    }

    fetchMatches();

    const interval = setInterval(fetchMatches, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMatches, user?.id, latitude, longitude]);

  return { matches, loading, error, refresh: fetchMatches };
}
