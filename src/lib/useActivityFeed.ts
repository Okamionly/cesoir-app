"use client";

/**
 * useActivityFeed — live signals for the ActivityFeed widget on /feed.
 *
 * Aggregates last 10 events (within the last hour) from three sources:
 *   1. New profiles      → `profiles.created_at >= now()-1h`        (someone joined)
 *   2. Mode activations  → `mode_activations.created_at >= now()-1h && is_active=true`
 *   3. New conversations → `conversations.created_at >= now()-1h`   (a match happened)
 *
 * PII safety: the hook only ever exposes `firstName` and `age` from `profiles`.
 * No `email`, `phone`, `last_seen`, `lat/lng`, or other identifiers leak into
 * the returned `ActivityItem`. The user_id is kept internally so the UI can
 * deep-link to /browse, but the rendered text never includes it.
 *
 * Realtime: subscribes to INSERT events on the three source tables. Updates
 * are debounced to coalesce bursts (e.g. 5 mode activations in 200ms emit a
 * single re-render).
 *
 * Cap: at most `MAX_ITEMS` (10) items are kept in memory and sorted DESC.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";
import {
  namespacedChannelName,
  useRealtimeChannel,
} from "@/lib/hooks/useSupabaseQuery";
import type { DbConversation, DbProfile } from "./supabase-types";

// ---------- Types ----------

export type ActivityKind = "join" | "mode" | "match" | "area";

export interface ActivityItem {
  /** Stable id `${kind}-${sourceId}` so realtime dedupe is reliable. */
  id: string;
  kind: ActivityKind;
  /** Anonymised display name (first name only). */
  firstName: string;
  age: number | null;
  /** Optional avatar URL — already PII-safe (public URL). */
  avatarUrl: string | null;
  /** Mode key (`solo-diner`, `night-owl`, …) when `kind === "mode"`. */
  mode: string | null;
  /** ISO timestamp used for sorting + time-ago display. */
  createdAt: string;
  /** Internal user id — used for deep-linking only, NEVER rendered. */
  userId: string | null;
  /** City label for "area" rollups ("Plus de N personnes actives à Montpellier"). */
  city: string | null;
  /** Aggregated count for "area" items. */
  count: number | null;
}

export interface UseActivityFeedReturn {
  items: ActivityItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ---------- Constants ----------

const MAX_ITEMS = 10;
const ONE_HOUR_MS = 60 * 60_000;
const REALTIME_DEBOUNCE_MS = 350;

// ---------- Helpers ----------

/** Strip everything after the first space — we only ever expose first names. */
function firstName(full: string | null | undefined): string {
  if (!full) return "Quelqu'un";
  const trimmed = full.trim().split(/\s+/)[0];
  return trimmed.length > 0 ? trimmed : "Quelqu'un";
}

function oneHourAgoIso(): string {
  return new Date(Date.now() - ONE_HOUR_MS).toISOString();
}

type LiteProfile = Pick<DbProfile, "id" | "name" | "age" | "avatar_url" | "city" | "created_at">;

async function fetchProfilesByIds(
  ids: readonly string[],
  signal?: AbortSignal,
): Promise<Map<string, LiteProfile>> {
  if (ids.length === 0) return new Map();
  let query = supabase
    .from("profiles")
    .select("id, name, age, avatar_url, city, created_at")
    .in("id", [...new Set(ids)]);
  if (signal) query = query.abortSignal(signal);
  const { data } = await query;
  const map = new Map<string, LiteProfile>();
  for (const p of (data ?? []) as LiteProfile[]) {
    map.set(p.id, p);
  }
  return map;
}

function buildJoinItem(profile: LiteProfile): ActivityItem {
  return {
    id: `join-${profile.id}`,
    kind: "join",
    firstName: firstName(profile.name),
    age: profile.age ?? null,
    avatarUrl: profile.avatar_url ?? null,
    mode: null,
    createdAt: profile.created_at,
    userId: profile.id,
    city: profile.city ?? null,
    count: null,
  };
}

interface ModeActivationLite {
  id: string;
  user_id: string;
  mode: string;
  created_at: string;
}

function buildModeItem(
  activation: ModeActivationLite,
  profile: LiteProfile | undefined,
): ActivityItem {
  return {
    id: `mode-${activation.id}`,
    kind: "mode",
    firstName: firstName(profile?.name),
    age: profile?.age ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    mode: activation.mode,
    createdAt: activation.created_at,
    userId: activation.user_id,
    city: profile?.city ?? null,
    count: null,
  };
}

function buildMatchItem(
  conversation: Pick<DbConversation, "id" | "user_a" | "user_b" | "mode" | "created_at">,
  profile: LiteProfile | undefined,
): ActivityItem {
  return {
    id: `match-${conversation.id}`,
    kind: "match",
    firstName: firstName(profile?.name),
    age: profile?.age ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    mode: conversation.mode,
    createdAt: conversation.created_at,
    userId: profile?.id ?? null,
    city: profile?.city ?? null,
    count: null,
  };
}

/**
 * Best-effort area rollup: count distinct users active in the last hour
 * grouped by city. Returns at most one item per city to keep noise low.
 */
function buildAreaItems(profiles: LiteProfile[]): ActivityItem[] {
  const byCity = new Map<string, number>();
  for (const p of profiles) {
    if (!p.city) continue;
    byCity.set(p.city, (byCity.get(p.city) ?? 0) + 1);
  }
  const out: ActivityItem[] = [];
  for (const [city, count] of byCity.entries()) {
    if (count < 5) continue; // only surface cities with meaningful activity
    out.push({
      id: `area-${city}`,
      kind: "area",
      firstName: "",
      age: null,
      avatarUrl: null,
      mode: null,
      createdAt: new Date().toISOString(),
      userId: null,
      city,
      count,
    });
  }
  return out;
}

function sortAndCap(items: readonly ActivityItem[]): ActivityItem[] {
  const seen = new Set<string>();
  const dedup: ActivityItem[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    dedup.push(it);
  }
  dedup.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return dedup.slice(0, MAX_ITEMS);
}

// ---------- Hook ----------

export function useActivityFeed(): UseActivityFeedReturn {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for debounce + abort
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const loadAll = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setError(null);

    try {
      const since = oneHourAgoIso();

      // 1) New profiles (joins)
      const newProfilesQuery = supabase
        .from("profiles")
        .select("id, name, age, avatar_url, city, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(MAX_ITEMS)
        .abortSignal(signal);

      // 2) Recent active mode activations
      const modeQuery = supabase
        .from("mode_activations")
        .select("id, user_id, mode, created_at")
        .gte("created_at", since)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(MAX_ITEMS)
        .abortSignal(signal);

      // 3) New conversations (matches)
      const convQuery = supabase
        .from("conversations")
        .select("id, user_a, user_b, mode, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(MAX_ITEMS)
        .abortSignal(signal);

      const [newProfilesRes, modesRes, convRes] = await Promise.all([
        newProfilesQuery,
        modeQuery,
        convQuery,
      ]);

      if (signal.aborted || !mountedRef.current) return;

      if (newProfilesRes.error) throw new Error(newProfilesRes.error.message);
      if (modesRes.error) throw new Error(modesRes.error.message);
      if (convRes.error) throw new Error(convRes.error.message);

      const newProfiles = (newProfilesRes.data ?? []) as LiteProfile[];

      // Resolve profile metadata for mode + match items in one round-trip.
      const userIds = [
        ...modesRes.data?.map((m: { user_id: string }) => m.user_id) ?? [],
        ...convRes.data?.flatMap(
          (c: { user_a: string; user_b: string }) => [c.user_a, c.user_b],
        ) ?? [],
      ].filter((id) => id !== userId); // never surface the viewer's own actions

      const profileMap = await fetchProfilesByIds(userIds, signal);
      if (signal.aborted || !mountedRef.current) return;

      const joinItems = newProfiles
        .filter((p) => p.id !== userId)
        .map(buildJoinItem);

      const modeItems = (modesRes.data ?? [])
        .filter((m: { user_id: string }) => m.user_id !== userId)
        .map((m: { id: string; user_id: string; mode: string; created_at: string }) =>
          buildModeItem(m, profileMap.get(m.user_id)),
        );

      const matchItems = (convRes.data ?? [])
        .filter(
          (c: { user_a: string; user_b: string }) =>
            // Surface a match for everyone, but only show one side's name.
            c.user_a !== userId || c.user_b !== userId,
        )
        .map(
          (c: {
            id: string;
            user_a: string;
            user_b: string;
            mode: string | null;
            created_at: string;
          }) => {
            const otherId = c.user_a === userId ? c.user_b : c.user_a;
            return buildMatchItem(c, profileMap.get(otherId));
          },
        );

      const areaItems = buildAreaItems([
        ...newProfiles,
        ...Array.from(profileMap.values()),
      ]);

      const merged = sortAndCap([
        ...joinItems,
        ...modeItems,
        ...matchItems,
        ...areaItems,
      ]);

      setItems(merged);
      setLoading(false);
    } catch (err) {
      if (signal.aborted) return;
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadAll();
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [loadAll]);

  // Debounced realtime refresh — coalesce bursts of inserts.
  const scheduleRefresh = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void loadAll();
    }, REALTIME_DEBOUNCE_MS);
  }, [loadAll]);

  useRealtimeChannel(
    (client) =>
      userId
        ? client
            .channel(namespacedChannelName("activity-feed", userId))
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "profiles" },
              () => scheduleRefresh(),
            )
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "mode_activations" },
              () => scheduleRefresh(),
            )
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "conversations" },
              () => scheduleRefresh(),
            )
        : null,
    [userId, scheduleRefresh],
  );

  return useMemo(
    () => ({
      items,
      loading,
      error,
      refresh: loadAll,
    }),
    [items, loading, error, loadAll],
  );
}
