"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { useRealtimeChannel } from "@/lib/hooks/useSupabaseQuery";
import type { DbFeedActivity, DbProfile, FeedActivityType } from "./supabase-types";

// ---------- Types ----------

export interface FeedActivity {
  id: string;
  type: FeedActivityType;
  content: string;
  mode: string | null;
  userId: string;
  userName: string;
  userAvatar: string | null;
  isOnline: boolean;
  createdAt: string;
  /** Marks items that arrived via realtime (for "new" animation) */
  isNew?: boolean;
}

interface UseFeedReturn {
  activities: FeedActivity[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
  /** Count of realtime-inserted items that should trigger a "new items" banner.
   * Clear it with `acknowledgeNew()`. */
  newCount: number;
  /** Called when the user clicks the "new items" banner or scrolls to top. */
  acknowledgeNew: () => void;
}

// ---------- Constants ----------

const PAGE_SIZE = 20;

// ---------- Helpers ----------

function mapRow(
  row: DbFeedActivity,
  profile: Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online"> | undefined,
  isNew = false,
): FeedActivity {
  return {
    id: row.id,
    type: row.type,
    content: row.content ?? "",
    mode: row.mode,
    userId: row.user_id,
    userName: profile?.name ?? "CeSoir",
    userAvatar: profile?.avatar_url ?? null,
    isOnline: profile?.is_online ?? false,
    createdAt: row.created_at,
    isNew,
  };
}

interface FeedPayload {
  activities: FeedActivity[];
  nextOffset: number;
  hasMore: boolean;
}

// ---------- Hook ----------

export function useFeed(): UseFeedReturn {
  // Augmented/mutated state (extra items from pagination or realtime inserts)
  const [extra, setExtra] = useState<FeedActivity[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreOverride, setHasMoreOverride] = useState<boolean | null>(null);
  const [newCount, setNewCount] = useState(0);
  const offsetRef = useRef(0);

  // Initial page fetch (unified shape + AbortSignal)
  const { data, loading, error, refetch } = useAsyncResource<FeedPayload>(
    async (signal) => {
      const { data: rows, error: fetchErr } = await supabase
        .from("feed_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1)
        .abortSignal(signal);

      if (fetchErr) throw new Error(fetchErr.message);

      if (!rows || rows.length === 0) {
        return { activities: [], nextOffset: 0, hasMore: false };
      }

      const userIds = [...new Set(rows.map((r: DbFeedActivity) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, is_online")
        .in("id", userIds)
        .abortSignal(signal);

      const profileMap = new Map(
        (profiles ?? []).map(
          (p: Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online">) => [p.id, p],
        ),
      );

      const mapped = rows.map((r: DbFeedActivity) => mapRow(r, profileMap.get(r.user_id)));
      return {
        activities: mapped,
        nextOffset: rows.length,
        hasMore: rows.length >= PAGE_SIZE,
      };
    },
    [],
  );

  // Sync offset + reset extras when fresh base data arrives
  useEffect(() => {
    if (data) {
      offsetRef.current = data.nextOffset;
      setExtra([]);
      setHasMoreOverride(null);
    }
  }, [data]);

  const baseActivities = data?.activities ?? [];
  // Prepend realtime extras at top (they have newest timestamps), dedupe by id
  const merged = [
    ...extra.filter((a) => a.isNew || !baseActivities.some((b) => b.id === a.id)),
    ...baseActivities,
  ];
  const seen = new Set<string>();
  const finalActivities = merged.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  const hasMore = hasMoreOverride ?? data?.hasMore ?? true;

  // ---- Load more (pagination) ----
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const start = offsetRef.current;
    const end = start + PAGE_SIZE - 1;

    const { data: rows, error: fetchErr } = await supabase
      .from("feed_activities")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, end);

    if (fetchErr || !rows) {
      setLoadingMore(false);
      return;
    }

    if (rows.length === 0) {
      setHasMoreOverride(false);
      setLoadingMore(false);
      return;
    }

    const userIds = [...new Set(rows.map((r: DbFeedActivity) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, is_online")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles ?? []).map(
        (p: Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online">) => [p.id, p],
      ),
    );

    const mapped = rows.map((r: DbFeedActivity) => mapRow(r, profileMap.get(r.user_id)));

    setExtra((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const baseIds = new Set(baseActivities.map((a) => a.id));
      const unique = mapped.filter((a) => !existingIds.has(a.id) && !baseIds.has(a.id));
      return [...prev, ...unique];
    });

    setHasMoreOverride(rows.length >= PAGE_SIZE);
    offsetRef.current = start + rows.length;
    setLoadingMore(false);
  }, [loadingMore, hasMore, baseActivities]);

  // ---- Realtime subscription ----
  useRealtimeChannel(
    (client) =>
      client.channel("feed-realtime").on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feed_activities",
        },
        async (payload) => {
          const row = payload.new as DbFeedActivity;

          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, avatar_url, is_online")
            .eq("id", row.user_id)
            .limit(1);

          const profile = profiles?.[0] as
            | Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online">
            | undefined;
          const newActivity = mapRow(row, profile, true);

          setExtra((prev) => {
            if (prev.some((a) => a.id === newActivity.id)) return prev;
            return [newActivity, ...prev];
          });
          setNewCount((n) => n + 1);

          // Clear the isNew flag after 3 seconds so the glow fades
          setTimeout(() => {
            setExtra((prev) =>
              prev.map((a) => (a.id === newActivity.id ? { ...a, isNew: false } : a)),
            );
          }, 3000);
        },
      ),
    [],
  );

  const acknowledgeNew = useCallback(() => setNewCount(0), []);

  return {
    activities: finalActivities,
    loading,
    error: error?.message ?? null,
    refresh: async () => {
      offsetRef.current = 0;
      setNewCount(0);
      await refetch();
    },
    loadMore,
    hasMore,
    loadingMore,
    newCount,
    acknowledgeNew,
  };
}
