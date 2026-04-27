"use client";

/**
 * useGlobalSearch — global search hook combining profiles + events + venues.
 *
 * Powers <GlobalSearch />, the floating search button that lives in
 * AppChrome. The hook is intentionally framework-agnostic on the UI side:
 * it manages debouncing, min-char gating, in-flight cancellation, and
 * returns a single normalized shape `{ profiles, events, venues }`.
 *
 * Behaviour:
 *   - 250ms debounce on `setQuery` (the underlying `search()` is also
 *     exported in case a caller wants to bypass debounce, e.g. an
 *     "Enter to search" submit).
 *   - Fires only when the trimmed query is >= 2 chars.
 *   - Returns max 5 results per category.
 *   - Profiles: `nearby_profiles` RPC (huge radius, no mode filter) +
 *     client-side fuzzy-ish match on name and bio (case-insensitive
 *     substring). Falls back to empty array if no geolocation.
 *   - Events: `events_with_counts` view, server-side `ilike` on title
 *     plus client-side filter on venue_name / venue_address.
 *   - Venues: in-memory filter on `VENUES` from `@/lib/venues`.
 *
 * Why not RPC for the union? A dedicated full-text search RPC would
 * be ideal (and cheaper), but doesn't exist yet — this client-side
 * fan-out keeps the feature shippable today and is good enough for
 * the catalogue sizes we ship (40 venues, ~50 events, ~50 profiles
 * within radius). When usage grows, swap the body of `search()` for
 * a single `global_search` RPC and the UI doesn't change.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useGeolocation } from "@/lib/useGeolocation";
import { VENUES, type Venue } from "@/lib/venues";
import type { Profile } from "@/lib/mock-profiles";
import type { CesoirEvent } from "@/lib/events-types";
import type { ModeKey } from "@/lib/modes";
import { app } from "@/lib/design-tokens";
import { logger } from "@/lib/logger";
import type { DbEventWithCounts } from "@/lib/supabase-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResults {
  profiles: Profile[];
  events: CesoirEvent[];
  venues: Venue[];
}

export interface UseGlobalSearchReturn {
  /** Trimmed query as displayed in the input (kept in sync via setQuery). */
  query: string;
  /** Set the input value. Debounced search fires automatically. */
  setQuery: (next: string) => void;
  /** Latest results (empty when query < 2 chars or first load). */
  results: SearchResults;
  /** True while a search is in flight. */
  loading: boolean;
  /** Last error (transient — cleared on next successful run). */
  error: string | null;
  /** Force-fire a search bypassing the debounce (e.g. on submit). */
  search: (q: string) => Promise<SearchResults>;
  /** Reset state (used when modal closes). */
  reset: () => void;
}

const EMPTY: SearchResults = { profiles: [], events: [], venues: [] };
const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;
const MAX_PER_CATEGORY = 5;
// Wide radius so name search still works for users in MTP whose match
// pool happens to be sparse nearby. Real-world cap is enforced server-side.
const SEARCH_RADIUS_KM = 100;

// Fallback geolocation (Montpellier centre) when the user has not granted
// location permission — keeps profile search useful instead of empty.
const FALLBACK_LAT = 43.6109;
const FALLBACK_LNG = 3.8772;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim();
}

/** Case-insensitive substring match across an arbitrary set of fields. */
function matches(q: string, fields: Array<string | null | undefined>): boolean {
  const needle = norm(q);
  if (!needle) return false;
  for (const f of fields) {
    if (norm(f).includes(needle)) return true;
  }
  return false;
}

function searchVenues(q: string): Venue[] {
  const needle = norm(q);
  if (needle.length < MIN_CHARS) return [];
  return VENUES.filter((v) =>
    matches(q, [v.name, v.type, v.address, v.arrondissement]),
  ).slice(0, MAX_PER_CATEGORY);
}

// ---------------------------------------------------------------------------
// Profiles search — wraps `nearby_profiles` RPC with a wide radius
// ---------------------------------------------------------------------------

async function searchProfiles(
  q: string,
  lat: number,
  lng: number,
): Promise<Profile[]> {
  try {
    const { data, error } = await supabase.rpc("nearby_profiles", {
      user_lat: lat,
      user_lng: lng,
      radius_km: SEARCH_RADIUS_KM,
      mode_filter: null,
      gender_filter: null,
      age_min: undefined,
      age_max: undefined,
      limit_count: 100,
    });

    if (error) {
      logger.warn("global_search_profiles_rpc_failed", { err: error.message });
      return [];
    }

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const seen = new Set<string>();
    const filtered: Profile[] = [];
    for (const p of rows) {
      const id = p.id as string;
      if (!id || seen.has(id)) continue;
      const name = (p.name as string) ?? "";
      const bio = (p.bio as string) ?? "";
      if (!matches(q, [name, bio])) continue;
      seen.add(id);
      filtered.push({
        id,
        name,
        age: (p.age as number) ?? 0,
        mode: ((p.mode as string) || "solo-diner") as ModeKey,
        bio,
        distance: Math.round(((p.distance_km as number) ?? 0) * 10) / 10,
        time: (p.available_time as string) || "Dispo maintenant",
        color: app.violet,
        photo:
          (p.avatar_url as string) ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "?")}&background=8B5CF6&color=fff&bold=true&size=256&format=png`,
      });
      if (filtered.length >= MAX_PER_CATEGORY) break;
    }
    return filtered;
  } catch (err) {
    logger.error("global_search_profiles_threw", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Events search — `events_with_counts` view + ilike on title
// ---------------------------------------------------------------------------

async function searchEvents(q: string): Promise<CesoirEvent[]> {
  try {
    const needle = q.replace(/[%_]/g, " ").trim();
    const nowIso = new Date().toISOString();

    // Use OR to widen the title match to the venue name too.
    const { data, error } = await supabase
      .from("events_with_counts")
      .select("*")
      .gte("starts_at", nowIso)
      .or(
        `title.ilike.%${needle}%,venue_name.ilike.%${needle}%,venue_address.ilike.%${needle}%`,
      )
      .order("starts_at", { ascending: true })
      .limit(MAX_PER_CATEGORY * 2); // pull a few extra in case some are stale

    if (error) {
      logger.warn("global_search_events_failed", { err: error.message });
      return [];
    }

    const rows = (data ?? []) as DbEventWithCounts[];

    return rows.slice(0, MAX_PER_CATEGORY).map((row) => {
      // Minimal CesoirEvent — we don't need full RSVP wiring for a
      // search result row, so we synthesize the empty bits.
      const loc = row.venue_location as
        | { coordinates?: [number, number] }
        | null
        | undefined;
      let lat: number | null = null;
      let lng: number | null = null;
      if (loc && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        const [lo, la] = loc.coordinates;
        if (typeof la === "number" && typeof lo === "number") {
          lat = la;
          lng = lo;
        }
      }
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        flyerUrl: row.flyer_url,
        startAt: row.starts_at,
        endAt: row.ends_at,
        venue: {
          name: row.venue_name,
          neighborhood: null,
          address: row.venue_address,
          lat,
          lng,
        },
        city:
          row.city_slug === "montpellier"
            ? "Montpellier"
            : row.city_slug.charAt(0).toUpperCase() + row.city_slug.slice(1),
        categories: [],
        lineup: (row.lineup ?? []).map((name) => ({ name })),
        priceLabel: null,
        ticketUrl: row.ticket_url,
        counts: {
          going: row.going_count ?? 0,
          maybe: Math.max(
            0,
            (row.rsvp_count ?? 0) - (row.going_count ?? 0),
          ),
        },
        attendeePreview: [],
        myRsvp: null,
        createdAt: row.created_at,
      } satisfies CesoirEvent;
    });
  } catch (err) {
    logger.error("global_search_events_threw", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

export function useGlobalSearch(): UseGlobalSearchReturn {
  const { user } = useAuth();
  const { latitude, longitude } = useGeolocation();

  const [query, setQueryRaw] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  // Stable refs for lat/lng so the search closure isn't recreated on every
  // render (also lets us fall back if geolocation isn't available yet).
  const lat = latitude ?? FALLBACK_LAT;
  const lng = longitude ?? FALLBACK_LNG;

  const search = useCallback(
    async (q: string): Promise<SearchResults> => {
      const trimmed = q.trim();
      if (trimmed.length < MIN_CHARS) {
        setResults(EMPTY);
        setLoading(false);
        return EMPTY;
      }
      const runId = ++runIdRef.current;
      setLoading(true);
      setError(null);
      try {
        // Profiles: only attempt when authed (RPC needs the session).
        const profilesPromise = user
          ? searchProfiles(trimmed, lat, lng)
          : Promise.resolve<Profile[]>([]);
        const eventsPromise = searchEvents(trimmed);
        const venuesSync = searchVenues(trimmed);

        const [profiles, events] = await Promise.all([
          profilesPromise,
          eventsPromise,
        ]);

        // Drop stale runs (the user typed more chars while we awaited).
        if (runId !== runIdRef.current) {
          return { profiles: [], events: [], venues: [] };
        }

        const next: SearchResults = {
          profiles,
          events,
          venues: venuesSync,
        };
        setResults(next);
        setLoading(false);
        return next;
      } catch (err) {
        if (runId !== runIdRef.current) return EMPTY;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setLoading(false);
        return EMPTY;
      }
    },
    [user, lat, lng],
  );

  const setQuery = useCallback(
    (next: string) => {
      setQueryRaw(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const trimmed = next.trim();
      if (trimmed.length < MIN_CHARS) {
        setResults(EMPTY);
        setLoading(false);
        return;
      }

      // Show the loading spinner immediately so the UI doesn't appear
      // frozen during the 250ms debounce window.
      setLoading(true);
      debounceRef.current = setTimeout(() => {
        void search(trimmed);
      }, DEBOUNCE_MS);
    },
    [search],
  );

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runIdRef.current++;
    setQueryRaw("");
    setResults(EMPTY);
    setError(null);
    setLoading(false);
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      runIdRef.current++;
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    search,
    reset,
  };
}
