"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import type { DbFeedActivity, DbProfile, FeedActivityType } from "./supabase-types";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

// ---------- Hook ----------

export function useFeed(): UseFeedReturn {
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const offsetRef = useRef(0);

  // ---- Fetch first page ----
  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    offsetRef.current = 0;

    const { data: rows, error: fetchErr } = await supabase
      .from("feed_activities")
      .select("*")
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

    if (!rows || rows.length === 0) {
      setActivities([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    // Collect unique user IDs and fetch profiles
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
    setActivities(mapped);
    setHasMore(rows.length >= PAGE_SIZE);
    offsetRef.current = rows.length;
    setLoading(false);
  }, []);

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
      setHasMore(false);
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

    setActivities((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const unique = mapped.filter((a) => !existingIds.has(a.id));
      return [...prev, ...unique];
    });

    setHasMore(rows.length >= PAGE_SIZE);
    offsetRef.current = start + rows.length;
    setLoadingMore(false);
  }, [loadingMore, hasMore]);

  // ---- Initial fetch ----
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load is the intended use
    void fetchFeed();
  }, [fetchFeed]);

  // ---- Realtime subscription ----
  useEffect(() => {
    const channel = supabase
      .channel("feed-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feed_activities",
        },
        async (payload) => {
          const row = payload.new as DbFeedActivity;

          // Fetch the profile for this new activity
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, avatar_url, is_online")
            .eq("id", row.user_id)
            .limit(1);

          const profile = profiles?.[0] as
            | Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online">
            | undefined;
          const newActivity = mapRow(row, profile, true);

          setActivities((prev) => {
            // Avoid duplicates
            if (prev.some((a) => a.id === newActivity.id)) return prev;
            return [newActivity, ...prev];
          });

          // Clear the isNew flag after 3 seconds so the glow fades
          setTimeout(() => {
            setActivities((prev) =>
              prev.map((a) => (a.id === newActivity.id ? { ...a, isNew: false } : a)),
            );
          }, 3000);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, []);

  return { activities, loading, error, refresh: fetchFeed, loadMore, hasMore, loadingMore };
}
