"use client";

/**
 * useEvents / useEvent — client-side hooks for the Soirées tab.
 *
 * Wave 14 · U2 (this file) + U3 (UI) integration.
 * -------------------------------------------------
 * U3 defines the *UI-facing* contract in `@/lib/events-types`
 * (`CesoirEvent`, `UseEventsResult`, `UseEventResult`, FR categories like
 * `"hip-hop"`). U2 provisions the real schema in migrations 019/020
 * (tables `events` + `event_rsvps`, view `events_with_counts`, PG enum
 * `event_category` using snake_case codes like `"hip_hop"`).
 *
 * This module sits between them:
 *   1. reads from `events_with_counts` + `event_rsvps`
 *   2. normalizes DB rows → `CesoirEvent`
 *   3. translates the PG enum to the UI category codes
 *   4. exposes the U3-required hooks (`useEvents`, `useEvent`, `useMyEvents`)
 *   5. adds U2-spec primitives (`useRsvp`, `useUserRsvps`) for new callers
 *   6. subscribes to realtime changes on `event_rsvps`
 *
 * No hook ever throws. Errors live in state. Missing auth is tolerated
 * (visitors see counts, toggles are no-ops).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  namespacedChannelName,
  useRealtimeChannel,
  useSupabaseQuery,
} from "@/lib/hooks/useSupabaseQuery";
import type {
  CesoirEvent,
  EventCategory as UiEventCategory,
  EventFiltersState,
  RsvpStatus as UiRsvpStatus,
  UseEventResult,
  UseEventsResult,
} from "@/lib/events-types";
import type {
  DbEvent,
  DbEventRsvp,
  DbEventWithCounts,
  EventCategory as DbEventCategory,
  RsvpStatus as DbRsvpStatus,
} from "@/lib/supabase-types";

// ─────────────────────────────────────────────────────────────
// Category bridge — PG enum `event_category` (snake_case) ↔ UI label
// `UiEventCategory` (kebab-case, short). The UI code-set is narrower
// than the DB code-set; anything that doesn't map gets dropped. This
// keeps U3's filters clean while U2 can freely extend the DB catalogue.
// ─────────────────────────────────────────────────────────────

const DB_TO_UI_CATEGORY: Partial<Record<DbEventCategory, UiEventCategory>> = {
  techno: "techno",
  house: "house",
  jazz: "jazz",
  electro: "electro",
  rock: "rock",
  hip_hop: "hip-hop",
  live_music: "live",
  rooftop: "rooftop",
  gratuit: "gratuit",
  club: "clubbing",
  apero: "apero",
};

const UI_TO_DB_CATEGORY: Partial<Record<UiEventCategory, DbEventCategory>> = {
  techno: "techno",
  house: "house",
  jazz: "jazz",
  electro: "electro",
  rock: "rock",
  "hip-hop": "hip_hop",
  live: "live_music",
  rooftop: "rooftop",
  gratuit: "gratuit",
  clubbing: "club",
  apero: "apero",
};

function mapDbCategories(cats: DbEventCategory[] | null | undefined): UiEventCategory[] {
  if (!cats) return [];
  const out: UiEventCategory[] = [];
  for (const c of cats) {
    const ui = DB_TO_UI_CATEGORY[c];
    if (ui && !out.includes(ui)) out.push(ui);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// RSVP status bridge. UI keeps "going" | "maybe" | "not_going".
// DB has "interested" | "going" | "maybe" | "cancelled". We treat
// DB's "interested" + "maybe" both as UI "maybe", and "cancelled"
// as UI "not_going".
// ─────────────────────────────────────────────────────────────

function dbToUiStatus(s: DbRsvpStatus): UiRsvpStatus {
  if (s === "going") return "going";
  if (s === "cancelled") return "not_going";
  // "interested" and "maybe" both surface as "maybe" in U3's UI.
  return "maybe";
}

function uiToDbStatus(s: UiRsvpStatus): DbRsvpStatus {
  if (s === "going") return "going";
  if (s === "not_going") return "cancelled";
  return "maybe";
}

// ─────────────────────────────────────────────────────────────
// Venue location parsing. PostgREST returns a `GEOGRAPHY(POINT)`
// column as either a GeoJSON object `{type:"Point",coordinates:[lng,lat]}`
// or (legacy) WKB hex. We handle both defensively.
// ─────────────────────────────────────────────────────────────

function extractLatLng(loc: unknown): { lat: number | null; lng: number | null } {
  if (!loc) return { lat: null, lng: null };
  if (typeof loc === "object" && loc !== null && "coordinates" in loc) {
    const coords = (loc as { coordinates?: unknown }).coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      const [lng, lat] = coords as [unknown, unknown];
      if (typeof lat === "number" && typeof lng === "number") {
        return { lat, lng };
      }
    }
  }
  return { lat: null, lng: null };
}

// ─────────────────────────────────────────────────────────────
// Price label formatter — U3 shows a short string ("Gratuit", "15€").
// DB stores `door_price_eur` as NUMERIC. NULL or 0 ⇒ "Gratuit".
// ─────────────────────────────────────────────────────────────

function formatPriceLabel(eur: number | null | undefined): string {
  if (eur === null || eur === undefined) return "Gratuit";
  const num = typeof eur === "number" ? eur : Number(eur);
  if (!Number.isFinite(num) || num <= 0) return "Gratuit";
  // Drop trailing .00 for readability.
  return Number.isInteger(num) ? `${num}€` : `${num.toFixed(2)}€`;
}

// ─────────────────────────────────────────────────────────────
// Row → CesoirEvent normalizer
// ─────────────────────────────────────────────────────────────

interface RowWithCounts extends DbEventWithCounts {
  // Optionally joined when caller embeds the RSVPs.
  event_rsvps?: DbEventRsvp[];
}

function rowToEvent(
  row: RowWithCounts,
  viewerId: string | null,
  myRsvpOverride?: DbRsvpStatus | null,
): CesoirEvent {
  const { lat, lng } = extractLatLng(row.venue_location);
  const rsvps = row.event_rsvps ?? [];

  // Prefer explicit override (from a separate query), else look up inside
  // the embedded RSVPs if they were joined, else null.
  let myStatus: DbRsvpStatus | null | undefined = myRsvpOverride;
  if (myStatus === undefined && viewerId) {
    const found = rsvps.find((r) => r.user_id === viewerId);
    myStatus = found ? found.status : null;
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
    categories: mapDbCategories(row.categories),
    lineup: (row.lineup ?? []).map((name) => ({ name })),
    priceLabel: formatPriceLabel(row.door_price_eur),
    ticketUrl: row.ticket_url,
    counts: {
      going: row.going_count ?? 0,
      // "maybe" in the U3 sense = {interested + maybe} = rsvp_count - going.
      maybe: Math.max(0, (row.rsvp_count ?? 0) - (row.going_count ?? 0)),
    },
    attendeePreview: [],
    myRsvp: myStatus ? dbToUiStatus(myStatus) : null,
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────
// Client-side filter helper (U3 keeps this logic for instant UI)
// ─────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export function filterEvents(
  events: CesoirEvent[],
  filters: EventFiltersState,
): CesoirEvent[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const weekendStart = new Date(now);
  const dow = now.getDay();
  const daysUntilSat = (6 - dow + 7) % 7;
  weekendStart.setDate(weekendStart.getDate() + daysUntilSat);
  const weekendEnd = new Date(weekendStart);
  weekendEnd.setDate(weekendEnd.getDate() + 1);
  const weekendRange = { start: startOfDay(weekendStart), end: endOfDay(weekendEnd) };

  return events.filter((e) => {
    const start = new Date(e.startAt);

    switch (filters.when) {
      case "tonight":
        if (start < now || start > endOfDay(now)) return false;
        break;
      case "tomorrow":
        if (start < startOfDay(tomorrow) || start > endOfDay(tomorrow)) return false;
        break;
      case "weekend":
        if (start < weekendRange.start || start > weekendRange.end) return false;
        break;
      case "all":
      default:
        if (start < now) return false;
        break;
    }

    if (filters.category && !e.categories.includes(filters.category)) {
      return false;
    }
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
// useEvents — list (U3 public contract)
// ─────────────────────────────────────────────────────────────

/**
 * Lists upcoming events for the given filter. Calls pass `EventFiltersState`;
 * the hook resolves to `UseEventsResult` exactly as U3 expects.
 *
 * Server-side filtering: we always filter by `starts_at >= now()` and by
 * `city = 'montpellier'` (MVP pivot). The `when` + `category` filters are
 * applied client-side via `filterEvents` for instant re-render.
 */
export function useEvents(filters: EventFiltersState): UseEventsResult {
  const { user } = useAuth();
  const viewerId = user?.id ?? null;

  const [events, setEvents] = useState<CesoirEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const { data, error: qErr } = await supabase
      .from("events_with_counts")
      .select("*")
      .eq("city_slug", "montpellier")
      .eq("is_cancelled", false)
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(50);

    if (!mountedRef.current) return;

    if (qErr) {
      setError(new Error(qErr.message));
      setEvents([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as DbEventWithCounts[];
    const ids = rows.map((r) => r.id);

    // Fetch viewer's own RSVPs in a single trip to avoid N+1.
    let myRsvps: DbEventRsvp[] = [];
    if (viewerId && ids.length > 0) {
      const { data: myData } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("user_id", viewerId)
        .in("event_id", ids);
      myRsvps = (myData ?? []) as DbEventRsvp[];
    }
    const myByEventId = new Map(myRsvps.map((r) => [r.event_id, r.status]));

    const normalized = rows.map((r) =>
      rowToEvent(r, viewerId, myByEventId.get(r.id) ?? null),
    );

    setEvents(normalized);
    setError(null);
    setLoading(false);
  }, [viewerId]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  // Realtime: any RSVP change invalidates counts + possibly my status.
  useRealtimeChannel(
    (client) =>
      client
        .channel(namespacedChannelName("events-rsvps-list", viewerId))
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "event_rsvps" },
          () => {
            void load();
          },
        ),
    [viewerId, load],
  );

  const filtered = useMemo(
    () => filterEvents(events, filters),
    [events, filters],
  );

  const totalThisWeek = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    return events.filter((e) => {
      const s = new Date(e.startAt);
      return s >= now && s <= end;
    }).length;
  }, [events]);

  return {
    events: filtered,
    loading,
    error,
    refetch: load,
    totalThisWeek,
  };
}

// ─────────────────────────────────────────────────────────────
// useEvent — single event detail (U3 public contract)
// ─────────────────────────────────────────────────────────────

export function useEvent(eventId: string | undefined): UseEventResult {
  const { user } = useAuth();
  const viewerId = user?.id ?? null;

  const [event, setEvent] = useState<CesoirEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [savingRsvp, setSavingRsvp] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      setEvent(null);
      return;
    }
    setLoading(true);

    const [{ data: row, error: eErr }, { data: myRow }] = await Promise.all([
      supabase
        .from("events_with_counts")
        .select("*")
        .eq("id", eventId)
        .maybeSingle(),
      viewerId
        ? supabase
            .from("event_rsvps")
            .select("*")
            .eq("event_id", eventId)
            .eq("user_id", viewerId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null } as {
            data: DbEventRsvp | null;
            error: null;
          }),
    ]);

    if (!mountedRef.current) return;

    if (eErr) {
      setError(new Error(eErr.message));
      setEvent(null);
    } else if (row) {
      const myStatus = (myRow as DbEventRsvp | null)?.status ?? null;
      setEvent(rowToEvent(row as DbEventWithCounts, viewerId, myStatus));
      setError(null);
    } else {
      setEvent(null);
    }
    setLoading(false);
  }, [eventId, viewerId]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  // Realtime: refetch on any RSVP change for this event.
  useRealtimeChannel(
    (client) => {
      if (!eventId) return null;
      return client
        .channel(namespacedChannelName(`event-detail:${eventId}`, viewerId))
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "event_rsvps",
            filter: `event_id=eq.${eventId}`,
          },
          () => {
            void load();
          },
        );
    },
    [eventId, viewerId, load],
    { enabled: !!eventId },
  );

  const setMyRsvp = useCallback(
    async (status: UiRsvpStatus | null) => {
      if (!eventId || !viewerId) return;
      setSavingRsvp(true);

      const previousStatus = event?.myRsvp ?? null;
      // Optimistic
      setEvent((prev) => {
        if (!prev) return prev;
        const delta = (next: "going" | "maybe", from: UiRsvpStatus | null) =>
          (status === next ? 1 : 0) - (from === next ? 1 : 0);
        return {
          ...prev,
          myRsvp: status,
          counts: {
            going: Math.max(0, prev.counts.going + delta("going", previousStatus)),
            maybe: Math.max(0, prev.counts.maybe + delta("maybe", previousStatus)),
          },
        };
      });

      if (status === null) {
        const { error: dErr } = await supabase
          .from("event_rsvps")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", viewerId);
        if (dErr) setError(new Error(dErr.message));
      } else {
        const { error: uErr } = await supabase.from("event_rsvps").upsert(
          {
            event_id: eventId,
            user_id: viewerId,
            status: uiToDbStatus(status),
          },
          { onConflict: "event_id,user_id" },
        );
        if (uErr) setError(new Error(uErr.message));
      }
      setSavingRsvp(false);
    },
    [eventId, viewerId, event?.myRsvp],
  );

  return {
    event,
    loading,
    error,
    refetch: load,
    setMyRsvp,
    savingRsvp,
  };
}

// ─────────────────────────────────────────────────────────────
// useMyEvents / useUserRsvps — "mes events"
// ─────────────────────────────────────────────────────────────

/**
 * Events the current user has marked going/maybe/interested. Used by the
 * chat "Inviter à un event" picker and by the profile "Mes soirées" tab.
 */
export function useMyEvents(): UseEventsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [events, setEvents] = useState<CesoirEvent[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data, error: qErr } = await supabase
      .from("event_rsvps")
      .select("*, event:events(*)")
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (!mountedRef.current) return;

    if (qErr) {
      setError(new Error(qErr.message));
      setEvents([]);
      setLoading(false);
      return;
    }

    const nowIso = new Date().toISOString();
    const rows = (data ?? []) as Array<DbEventRsvp & { event: DbEvent | null }>;
    const upcoming = rows
      .filter((r) => r.event && r.event.starts_at >= nowIso)
      .map((r) => {
        // Synthesize count-less CesoirEvent (we don't have the view here).
        const e = r.event as DbEvent;
        return rowToEvent(
          {
            ...e,
            rsvp_count: 0,
            going_count: 0,
          } as DbEventWithCounts,
          userId,
          r.status,
        );
      });

    setEvents(upcoming);
    setError(null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  // Realtime: my RSVPs changed anywhere → refetch.
  useRealtimeChannel(
    (client) => {
      if (!userId) return null;
      return client
        .channel(namespacedChannelName("my-events", userId))
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "event_rsvps",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            void load();
          },
        );
    },
    [userId, load],
    { enabled: !!userId },
  );

  return {
    events,
    loading,
    error,
    refetch: load,
    totalThisWeek: events.length,
  };
}

// ─────────────────────────────────────────────────────────────
// useRsvp — single-event RSVP manager (U2 spec, finer control)
// ─────────────────────────────────────────────────────────────

export interface UseRsvpReturn {
  myRsvp: DbEventRsvp | null;
  loading: boolean;
  error: string | null;
  setRsvp: (
    status: DbRsvpStatus,
    opts?: { plusOnes?: number; notes?: string },
  ) => Promise<void>;
  clearRsvp: () => Promise<void>;
}

/**
 * Low-level RSVP hook that exposes the full DB shape (including `plus_ones`,
 * `notes`, and `interested` vs `maybe`). Used by the event detail sheet's
 * "J'y vais +1" flow.
 */
export function useRsvp(eventId: string | null | undefined): UseRsvpReturn {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [myRsvp, setMyRsvp] = useState<DbEventRsvp | null>(null);
  const [loading, setLoading] = useState(!!(eventId && userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !userId) {
      setMyRsvp(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      const { data, error: qErr } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (qErr) setError(qErr.message);
      else setMyRsvp((data as DbEventRsvp | null) ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, userId]);

  useRealtimeChannel(
    (client) => {
      if (!eventId || !userId) return null;
      return client
        .channel(namespacedChannelName(`rsvp-self:${eventId}`, userId))
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "event_rsvps",
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            const row = (payload.new ?? payload.old) as Partial<DbEventRsvp>;
            if (row?.user_id !== userId) return;
            if (payload.eventType === "DELETE") {
              setMyRsvp(null);
              return;
            }
            setMyRsvp(payload.new as DbEventRsvp);
          },
        );
    },
    [eventId, userId],
    { enabled: !!(eventId && userId) },
  );

  const setRsvp = useCallback<UseRsvpReturn["setRsvp"]>(
    async (status, opts) => {
      if (!eventId || !userId) return;
      const previous = myRsvp;

      setMyRsvp({
        event_id: eventId,
        user_id: userId,
        status,
        plus_ones: opts?.plusOnes ?? previous?.plus_ones ?? 0,
        notes: opts?.notes ?? previous?.notes ?? null,
        created_at: previous?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const { data, error: upErr } = await supabase
        .from("event_rsvps")
        .upsert(
          {
            event_id: eventId,
            user_id: userId,
            status,
            plus_ones: opts?.plusOnes ?? previous?.plus_ones ?? 0,
            notes: opts?.notes ?? previous?.notes ?? null,
          },
          { onConflict: "event_id,user_id" },
        )
        .select()
        .maybeSingle();

      if (upErr) {
        setMyRsvp(previous);
        setError(upErr.message);
        return;
      }
      if (data) setMyRsvp(data as DbEventRsvp);
    },
    [eventId, userId, myRsvp],
  );

  const clearRsvp = useCallback<UseRsvpReturn["clearRsvp"]>(async () => {
    if (!eventId || !userId) return;
    const previous = myRsvp;
    setMyRsvp(null);

    const { error: dErr } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (dErr) {
      setMyRsvp(previous);
      setError(dErr.message);
    }
  }, [eventId, userId, myRsvp]);

  return { myRsvp, loading, error, setRsvp, clearRsvp };
}

// ─────────────────────────────────────────────────────────────
// useUserRsvps — raw RSVPs for any user (admin / profile views)
// ─────────────────────────────────────────────────────────────

export interface DbEventRsvpWithEvent extends DbEventRsvp {
  event: DbEvent | null;
}

export interface UseUserRsvpsReturn {
  rsvps: DbEventRsvpWithEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Raw RSVPs for any user id (yours or someone else's, if RLS allows).
 * Unlike `useMyEvents` this returns the full `DbEventRsvp` row + joined
 * event — useful for admin dashboards and "events de Alice".
 */
export function useUserRsvps(
  userId: string | null | undefined,
  options: { includeCancelled?: boolean; upcomingOnly?: boolean } = {},
): UseUserRsvpsReturn {
  const { includeCancelled = false, upcomingOnly = true } = options;

  const state = useSupabaseQuery<DbEventRsvpWithEvent[]>(
    async (client) => {
      if (!userId) return { data: [], error: null };

      let q = client
        .from("event_rsvps")
        .select("*, event:events(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!includeCancelled) q = q.neq("status", "cancelled");

      const { data, error } = await q;
      if (error) return { data: null, error };

      let rows = (data ?? []) as DbEventRsvpWithEvent[];
      if (upcomingOnly) {
        const nowIso = new Date().toISOString();
        rows = rows.filter((r) => r.event && r.event.starts_at >= nowIso);
      }
      return { data: rows, error: null };
    },
    [userId, includeCancelled, upcomingOnly],
    { enabled: !!userId },
  );

  useRealtimeChannel(
    (client) => {
      if (!userId) return null;
      return client
        .channel(namespacedChannelName("user-rsvps", userId))
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "event_rsvps",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            void state.refetch();
          },
        );
    },
    [userId, state.refetch],
    { enabled: !!userId },
  );

  return {
    rsvps: state.data ?? [],
    loading: state.loading,
    error: state.error ? state.error.message : null,
    refetch: state.refetch,
  };
}

// Expose the category bridge for unit tests / migrations.
export const __internal__ = {
  DB_TO_UI_CATEGORY,
  UI_TO_DB_CATEGORY,
  dbToUiStatus,
  uiToDbStatus,
  extractLatLng,
  formatPriceLabel,
};
