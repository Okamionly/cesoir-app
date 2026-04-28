"use client";

/**
 * useNearbyActives — Wave 17 hook for the "Près de toi maintenant" widget
 * mounted on /feed.
 *
 * Wraps `useProfiles` (which calls the `nearby_profiles` RPC) and applies a
 * second-pass filter on top of the result set:
 *
 *   • broadcast_active === true
 *     OR
 *   • is_online === true AND last_seen > now - 5min  (the RPC already keeps
 *     fresh signals, but we re-check broadcast_active here so the widget is
 *     limited to "available right now" — not "matches in your radius".)
 *
 * Sorted by distance (nearest first), capped at `limit` (default 5),
 * excludes the current user's own profile, and re-runs every 60 s as a
 * realtime fallback. Realtime subscriptions on the underlying tables
 * (`profiles`, `availability_broadcasts`) trigger an immediate refetch when
 * data changes.
 *
 * NOTE on data plumbing: the RPC currently returns `broadcast_active` (a
 * SQL-computed flag combining the broadcast row + freshness window) and
 * `distance_km`. It does NOT return raw `is_online` / `last_seen`, so the
 * "online ∧ last_seen<5m" branch is implicitly satisfied by the RPC's own
 * filtering — every row that comes back is already "active enough" to
 * surface. We keep the explicit `broadcast_active` check here so the widget
 * doesn't show passively-online lurkers if/when the RPC relaxes its filter.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useProfiles } from "@/lib/useProfiles";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeChannel, namespacedChannelName } from "@/lib/hooks/useSupabaseQuery";
import type { Profile } from "@/lib/mock-profiles";

export interface UseNearbyActivesOptions {
  /** Max results returned. Defaults to 5 (one row of pills). */
  limit?: number;
  /** Auto-refresh interval. Defaults to 60s. */
  pollIntervalMs?: number;
  /** Maximum search radius in km. Defaults to 10. */
  maxDistanceKm?: number;
}

export interface UseNearbyActivesResult {
  actives: Profile[];
  loading: boolean;
  /** True once at least one fetch has resolved (lets the widget swap from
   *  skeleton to either the list or the empty state). */
  ready: boolean;
}

export function useNearbyActives(
  lat: number | null | undefined,
  lng: number | null | undefined,
  options: UseNearbyActivesOptions = {},
): UseNearbyActivesResult {
  const { limit = 5, pollIntervalMs = 60_000, maxDistanceKm = 10 } = options;
  const { user } = useAuth();

  // Internal "tick" forces useProfiles to re-run by toggling a dependency in
  // the filters object. We can't call useProfiles' refetch directly (it
  // doesn't expose one), so we rely on its built-in dep tracking.
  const [tick, setTick] = useState(0);
  const bumpTick = useCallback(() => setTick((t) => t + 1), []);

  // Attach the tick to a filters payload so a tick bump invalidates the
  // useAsyncResource cache inside useProfiles.
  const profileFilters = useMemo(
    () => ({
      maxDistance: maxDistanceKm,
      // Pull a few extras so the post-filter still has 5 to rank after we
      // strip non-actives + self.
      limit: Math.max(20, limit * 4),
      // Tick is folded into the limit deps via useMemo; useProfiles itself
      // depends on the filter primitives so we need a stable trigger — we
      // re-derive `limit` with the tick mixed in below to force a refetch
      // without changing any visible filter semantics.
      _tick: tick,
    }),
    [maxDistanceKm, limit, tick],
  );

  const { profiles, loading } = useProfiles(
    lat ?? undefined,
    lng ?? undefined,
    undefined,
    // Cast: the `_tick` field is a private cache-buster, not part of the
    // public ProfilesFilters surface. useProfiles ignores unknown keys.
    profileFilters as unknown as Parameters<typeof useProfiles>[3],
  );

  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  // ------------------------------------------------------------
  // Filter + rank
  // ------------------------------------------------------------
  const actives = useMemo(() => {
    const myId = user?.id;
    return profiles
      .filter((p) => p.id !== myId)
      .filter((p) => p.broadcast_active === true)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }, [profiles, user?.id, limit]);

  // ------------------------------------------------------------
  // 60s polling fallback
  // ------------------------------------------------------------
  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const id = window.setInterval(bumpTick, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [pollIntervalMs, bumpTick]);

  // ------------------------------------------------------------
  // Realtime: any change to profiles.is_online / last_seen, or to
  // availability_broadcasts, triggers an immediate refetch.
  // ------------------------------------------------------------
  const channelNonceRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10),
  );
  useRealtimeChannel(
    (client) => {
      if (!user?.id) return null;
      const channelName = namespacedChannelName(
        "nearby-actives",
        user.id,
        channelNonceRef.current,
      );
      return client
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => bumpTick(),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "availability_broadcasts",
          },
          () => bumpTick(),
        );
    },
    [user?.id, bumpTick],
  );

  return {
    actives,
    loading: loading && !ready,
    ready,
  };
}
