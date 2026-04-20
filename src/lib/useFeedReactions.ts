"use client";

/**
 * useFeedReactions — reactions (❤️ 🔥 😂 🎉) on feed_activities.
 *
 * - Fetch reactions for a list of feed_activity_ids, grouped per activity and
 *   per emoji, including the current-user flag (hasCurrentUser).
 * - Toggle: insert if not present, delete if already present for that
 *   (activity, user, reaction) tuple.
 * - Realtime subscription on the `feed_reactions` table keeps counters live.
 *
 * The hook is resilient to missing auth (read-only visitors still see counts)
 * and never throws — errors are stored in state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";
import {
  namespacedChannelName,
  useRealtimeChannel,
} from "@/lib/hooks/useSupabaseQuery";
import type { DbFeedReaction, FeedReactionType } from "./supabase-types";

// ---------- Types ----------

export const REACTION_TYPES: readonly FeedReactionType[] = [
  "heart",
  "fire",
  "laugh",
  "celebrate",
] as const;

export const REACTION_EMOJI: Record<FeedReactionType, string> = {
  heart: "❤️",
  fire: "🔥",
  laugh: "😂",
  celebrate: "🎉",
};

export const REACTION_LABEL: Record<FeedReactionType, string> = {
  heart: "J'aime",
  fire: "Enflammé",
  laugh: "Drôle",
  celebrate: "Bravo",
};

export interface ReactionCounts {
  /** Count per emoji, 0 if none. */
  counts: Record<FeedReactionType, number>;
  /** Which reactions the current user has applied. */
  mine: Record<FeedReactionType, boolean>;
}

type ReactionsMap = Record<string, ReactionCounts>;

function emptyCounts(): ReactionCounts {
  return {
    counts: { heart: 0, fire: 0, laugh: 0, celebrate: 0 },
    mine: { heart: false, fire: false, laugh: false, celebrate: false },
  };
}

interface UseFeedReactionsReturn {
  /** Reactions keyed by feed_activity_id. Always returns counts (zeroed if unknown). */
  get: (feedActivityId: string) => ReactionCounts;
  /** Toggle a reaction for the current user on the given activity. Optimistic. */
  toggle: (feedActivityId: string, reaction: FeedReactionType) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// ---------- Hook ----------

export function useFeedReactions(feedActivityIds: readonly string[]): UseFeedReactionsReturn {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [map, setMap] = useState<ReactionsMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable key to re-fetch only when the set of IDs actually changes
  const idsKey = useMemo(() => [...feedActivityIds].sort().join("|"), [feedActivityIds]);
  const idsRef = useRef<string[]>([]);
  idsRef.current = [...feedActivityIds];

  // ---- Fetch grouped reactions ----
  useEffect(() => {
    if (feedActivityIds.length === 0) {
      setMap({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data, error: qErr } = await supabase
        .from("feed_reactions")
        .select("feed_activity_id, user_id, reaction")
        .in("feed_activity_id", feedActivityIds);

      if (cancelled) return;
      if (qErr) {
        setError(qErr.message);
        setLoading(false);
        return;
      }

      const next: ReactionsMap = {};
      for (const id of feedActivityIds) next[id] = emptyCounts();

      for (const row of (data ?? []) as Pick<DbFeedReaction, "feed_activity_id" | "user_id" | "reaction">[]) {
        const entry = next[row.feed_activity_id] ?? emptyCounts();
        entry.counts[row.reaction] += 1;
        if (userId && row.user_id === userId) entry.mine[row.reaction] = true;
        next[row.feed_activity_id] = entry;
      }

      setMap(next);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, userId]);

  // ---- Realtime: single subscription for all visible activity ids ----
  // Channel is namespaced per-user: a shared channel name across sessions
  // would collide on Supabase realtime, causing "reactions stuck" on
  // remount because the first subscriber wins the dedup.
  useRealtimeChannel(
    (client) =>
      client
        .channel(namespacedChannelName("feed-reactions-realtime", userId))
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "feed_reactions" },
          (payload) => {
            const row = payload.new as DbFeedReaction;
            if (!idsRef.current.includes(row.feed_activity_id)) return;
            setMap((prev) => {
              const entry = prev[row.feed_activity_id] ?? emptyCounts();
              const nextEntry: ReactionCounts = {
                counts: { ...entry.counts, [row.reaction]: entry.counts[row.reaction] + 1 },
                mine: userId && row.user_id === userId
                  ? { ...entry.mine, [row.reaction]: true }
                  : entry.mine,
              };
              return { ...prev, [row.feed_activity_id]: nextEntry };
            });
          },
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "feed_reactions" },
          (payload) => {
            const row = payload.old as Partial<DbFeedReaction>;
            const activityId = row.feed_activity_id;
            const reaction = row.reaction as FeedReactionType | undefined;
            const rowUserId = row.user_id;
            if (!activityId || !reaction) return;
            if (!idsRef.current.includes(activityId)) return;
            setMap((prev) => {
              const entry = prev[activityId];
              if (!entry) return prev;
              const current = entry.counts[reaction];
              const nextEntry: ReactionCounts = {
                counts: {
                  ...entry.counts,
                  [reaction]: Math.max(0, current - 1),
                },
                mine: userId && rowUserId === userId
                  ? { ...entry.mine, [reaction]: false }
                  : entry.mine,
              };
              return { ...prev, [activityId]: nextEntry };
            });
          },
        ),
    [userId],
  );

  // ---- Toggle ----
  const toggle = useCallback(
    async (feedActivityId: string, reaction: FeedReactionType) => {
      if (!userId) return;

      const current = map[feedActivityId] ?? emptyCounts();
      const alreadyMine = current.mine[reaction];

      // Optimistic update
      setMap((prev) => {
        const entry = prev[feedActivityId] ?? emptyCounts();
        const delta = alreadyMine ? -1 : 1;
        const nextEntry: ReactionCounts = {
          counts: {
            ...entry.counts,
            [reaction]: Math.max(0, entry.counts[reaction] + delta),
          },
          mine: { ...entry.mine, [reaction]: !alreadyMine },
        };
        return { ...prev, [feedActivityId]: nextEntry };
      });

      if (alreadyMine) {
        const { error: delErr } = await supabase
          .from("feed_reactions")
          .delete()
          .eq("feed_activity_id", feedActivityId)
          .eq("user_id", userId)
          .eq("reaction", reaction);
        if (delErr) {
          // revert
          setMap((prev) => {
            const entry = prev[feedActivityId] ?? emptyCounts();
            const nextEntry: ReactionCounts = {
              counts: { ...entry.counts, [reaction]: entry.counts[reaction] + 1 },
              mine: { ...entry.mine, [reaction]: true },
            };
            return { ...prev, [feedActivityId]: nextEntry };
          });
          setError(delErr.message);
        }
      } else {
        const { error: insErr } = await supabase.from("feed_reactions").insert({
          feed_activity_id: feedActivityId,
          user_id: userId,
          reaction,
        });
        if (insErr) {
          // revert on conflict/error
          setMap((prev) => {
            const entry = prev[feedActivityId] ?? emptyCounts();
            const nextEntry: ReactionCounts = {
              counts: {
                ...entry.counts,
                [reaction]: Math.max(0, entry.counts[reaction] - 1),
              },
              mine: { ...entry.mine, [reaction]: false },
            };
            return { ...prev, [feedActivityId]: nextEntry };
          });
          setError(insErr.message);
        }
      }
    },
    [map, userId],
  );

  const get = useCallback(
    (feedActivityId: string): ReactionCounts => map[feedActivityId] ?? emptyCounts(),
    [map],
  );

  return { get, toggle, loading, error };
}
