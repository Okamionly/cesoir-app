"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";
import { MODES, type ModeKey } from "./modes";
import { MOCK_EVENTS, type PopUpEvent, type EventAttendee, type EventMessage } from "./popup-events";

// ---------- DB row shapes ----------

interface PopupEventRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  mode: string | null;
  lat: number | null;
  lng: number | null;
  venue: string | null;
  event_time: string;
  max_attendees: number | null;
  tags: string[] | null;
  created_at: string;
}

interface EventAttendeeRow {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
}

interface ProfileRow {
  id: string;
  name: string;
  avatar_url: string | null;
}

// ---------- Mapping ----------

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
}

function inferArrondissement(lat: number | null, lng: number | null, venue: string | null): string {
  // Fallback: extract arrondissement hint from venue text, else default to 1er.
  if (venue) {
    const match = venue.match(/(\d{1,2})(?:e|er|eme|\u00e8me)/i);
    if (match) return `${match[1]}e`;
  }
  if (lat !== null && lng !== null) {
    // Very rough Paris centroid classifier — good enough for labelling.
    return "Paris";
  }
  return "Paris";
}

function toPopUpEvent(
  row: PopupEventRow,
  creator: ProfileRow | undefined,
  attendees: { profile: ProfileRow; rowId: string }[],
): PopUpEvent {
  const mode = (row.mode as ModeKey) ?? "night-owl";
  const resolvedMode = MODES[mode] ? mode : ("night-owl" as ModeKey);

  const attendeeList: EventAttendee[] = attendees.map(({ profile, rowId }) => ({
    id: rowId,
    name: profile.name,
    avatar: profile.avatar_url ?? "https://randomuser.me/api/portraits/lego/1.jpg",
  }));

  return {
    id: row.id,
    title: row.title,
    creator: creator?.name ?? "Anonyme",
    creatorAvatar: creator?.avatar_url ?? "https://randomuser.me/api/portraits/lego/0.jpg",
    mode: resolvedMode,
    lat: row.lat ?? 48.8566,
    lng: row.lng ?? 2.3522,
    venue: row.venue ?? "",
    arrondissement: inferArrondissement(row.lat, row.lng, row.venue),
    time: formatTime(row.event_time),
    datetime: row.event_time,
    maxAttendees: row.max_attendees ?? 0,
    currentAttendees: attendeeList.length,
    description: row.description ?? "",
    tags: row.tags ?? [],
    attendees: attendeeList,
    messages: [] as EventMessage[],
  };
}

// ---------- Filter options ----------

export interface EventFilters {
  mode?: ModeKey;
  /** Future: geospatial filter (lat/lng/radius). Ignored server-side for now. */
  nearLat?: number;
  nearLng?: number;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  mode: ModeKey;
  lat?: number;
  lng?: number;
  venue?: string;
  event_time: string; // ISO
  max_attendees?: number;
  tags?: string[];
}

// ---------- Hook (list) ----------

interface UseEventsReturn {
  events: PopUpEvent[];
  loading: boolean;
  error: string | null;
  joinedIds: Set<string>;
  refresh: () => Promise<void>;
  toggleRsvp: (eventId: string) => Promise<void>;
  createEvent: (payload: CreateEventPayload) => Promise<string | null>;
}

export function useEvents(filters: EventFilters = {}): UseEventsReturn {
  const { user } = useAuth();
  const [events, setEvents] = useState<PopUpEvent[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("popup_events")
      .select("*")
      .order("event_time", { ascending: true });

    if (filtersRef.current.mode) {
      query = query.eq("mode", filtersRef.current.mode);
    }

    const { data: rows, error: fetchErr } = await query;

    if (fetchErr) {
      console.error("[useEvents] fetch failed:", fetchErr.message);
      setError(fetchErr.message);
      // Fallback mock keeps UI populated.
      setEvents(MOCK_EVENTS);
      setLoading(false);
      return;
    }

    const eventRows = (rows ?? []) as PopupEventRow[];

    if (eventRows.length === 0) {
      setEvents(MOCK_EVENTS);
      setLoading(false);
      return;
    }

    // Collect user IDs (creators + attendees).
    const creatorIds = Array.from(new Set(eventRows.map((e) => e.creator_id)));
    const eventIds = eventRows.map((e) => e.id);

    const [{ data: attendeeRows }, { data: creatorProfiles }] = await Promise.all([
      supabase
        .from("event_attendees")
        .select("*")
        .in("event_id", eventIds),
      supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", creatorIds),
    ]);

    const attendees = (attendeeRows ?? []) as EventAttendeeRow[];
    const creators = (creatorProfiles ?? []) as ProfileRow[];
    const creatorMap = new Map(creators.map((c) => [c.id, c]));

    // Resolve attendee profiles in a second batch.
    const attendeeUserIds = Array.from(new Set(attendees.map((a) => a.user_id)));
    let attendeeProfileMap = new Map<string, ProfileRow>();
    if (attendeeUserIds.length > 0) {
      const { data: aProfiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", attendeeUserIds);
      attendeeProfileMap = new Map((aProfiles ?? []).map((p: ProfileRow) => [p.id, p]));
    }

    const byEvent = new Map<string, { profile: ProfileRow; rowId: string }[]>();
    for (const att of attendees) {
      const profile = attendeeProfileMap.get(att.user_id);
      if (!profile) continue;
      if (!byEvent.has(att.event_id)) byEvent.set(att.event_id, []);
      byEvent.get(att.event_id)!.push({ profile, rowId: att.id });
    }

    const mapped = eventRows.map((row) =>
      toPopUpEvent(row, creatorMap.get(row.creator_id), byEvent.get(row.id) ?? []),
    );

    setEvents(mapped);

    if (user) {
      const mine = new Set(
        attendees.filter((a) => a.user_id === user.id).map((a) => a.event_id),
      );
      setJoinedIds(mine);
    } else {
      setJoinedIds(new Set());
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const toggleRsvp = useCallback(
    async (eventId: string) => {
      if (!user) throw new Error("Non authentifie");

      const isJoined = joinedIds.has(eventId);

      // Optimistic update
      setJoinedIds((prev) => {
        const next = new Set(prev);
        if (isJoined) next.delete(eventId);
        else next.add(eventId);
        return next;
      });
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, currentAttendees: Math.max(0, e.currentAttendees + (isJoined ? -1 : 1)) }
            : e,
        ),
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId, action: isJoined ? "leave" : "join" }),
      });

      if (!res.ok) {
        // Rollback
        setJoinedIds((prev) => {
          const next = new Set(prev);
          if (isJoined) next.add(eventId);
          else next.delete(eventId);
          return next;
        });
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, currentAttendees: Math.max(0, e.currentAttendees + (isJoined ? 1 : -1)) }
              : e,
          ),
        );
      }
    },
    [joinedIds, user],
  );

  const createEvent = useCallback(
    async (payload: CreateEventPayload): Promise<string | null> => {
      if (!user) return null;

      const { data, error: insertErr } = await supabase
        .from("popup_events")
        .insert({
          creator_id: user.id,
          title: payload.title,
          description: payload.description ?? "",
          mode: payload.mode,
          lat: payload.lat ?? null,
          lng: payload.lng ?? null,
          venue: payload.venue ?? "",
          event_time: payload.event_time,
          max_attendees: payload.max_attendees ?? 0,
          tags: payload.tags ?? [],
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("[useEvents] createEvent failed:", insertErr.message);
        return null;
      }

      // Auto-RSVP creator
      if (data?.id) {
        await supabase.from("event_attendees").insert({
          event_id: data.id,
          user_id: user.id,
        });
        void fetchEvents();
        return data.id;
      }

      return null;
    },
    [user, fetchEvents],
  );

  return {
    events,
    loading,
    error,
    joinedIds,
    refresh: fetchEvents,
    toggleRsvp,
    createEvent,
  };
}

// ---------- Hook (single event) ----------

interface UseEventReturn {
  event: PopUpEvent | null;
  loading: boolean;
  error: string | null;
  isJoined: boolean;
  refresh: () => Promise<void>;
  toggleRsvp: () => Promise<void>;
}

export function useEvent(eventId: string | undefined): UseEventReturn {
  const { user } = useAuth();
  const [event, setEvent] = useState<PopUpEvent | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOne = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data: row, error: fetchErr } = await supabase
      .from("popup_events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (fetchErr || !row) {
      // Mock fallback
      const mock = MOCK_EVENTS.find((e) => e.id === eventId) ?? null;
      setEvent(mock);
      setError(fetchErr?.message ?? null);
      setLoading(false);
      return;
    }

    const eventRow = row as PopupEventRow;

    const [{ data: attendeesRaw }, { data: creator }] = await Promise.all([
      supabase.from("event_attendees").select("*").eq("event_id", eventId),
      supabase.from("profiles").select("id, name, avatar_url").eq("id", eventRow.creator_id).maybeSingle(),
    ]);

    const attendeeRows = (attendeesRaw ?? []) as EventAttendeeRow[];
    const attendeeIds = attendeeRows.map((a) => a.user_id);
    let profiles: ProfileRow[] = [];
    if (attendeeIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", attendeeIds);
      profiles = (data ?? []) as ProfileRow[];
    }
    const profMap = new Map(profiles.map((p) => [p.id, p]));

    const attendees = attendeeRows
      .map((a) => {
        const p = profMap.get(a.user_id);
        return p ? { profile: p, rowId: a.id } : null;
      })
      .filter((x): x is { profile: ProfileRow; rowId: string } => x !== null);

    setEvent(toPopUpEvent(eventRow, creator as ProfileRow | undefined, attendees));
    setIsJoined(user ? attendeeRows.some((a) => a.user_id === user.id) : false);
    setLoading(false);
  }, [eventId, user]);

  useEffect(() => {
    void fetchOne();
  }, [fetchOne]);

  const toggleRsvp = useCallback(async () => {
    if (!eventId || !user) return;

    const wasJoined = isJoined;
    setIsJoined(!wasJoined);
    setEvent((prev) =>
      prev ? { ...prev, currentAttendees: Math.max(0, prev.currentAttendees + (wasJoined ? -1 : 1)) } : prev,
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    const res = await fetch("/api/events/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ event_id: eventId, action: wasJoined ? "leave" : "join" }),
    });

    if (!res.ok) {
      // rollback
      setIsJoined(wasJoined);
      setEvent((prev) =>
        prev
          ? { ...prev, currentAttendees: Math.max(0, prev.currentAttendees + (wasJoined ? 1 : -1)) }
          : prev,
      );
    } else {
      void fetchOne();
    }
  }, [eventId, isJoined, user, fetchOne]);

  return { event, loading, error, isJoined, refresh: fetchOne, toggleRsvp };
}
