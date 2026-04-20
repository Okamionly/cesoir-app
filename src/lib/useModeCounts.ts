"use client";

/**
 * useModeCounts — returns a deterministic `{ [mode]: activeUsersCount }`
 * snapshot across every mode key, driven by `mode_activations`.
 *
 * Why this exists:
 *   The modes grid previously derived counts by filtering the `profiles`
 *   array returned from `nearby_profiles`. That array is radius-limited,
 *   mode-filtered, age-filtered, limit-capped (default 50) and comes from
 *   a single `profiles.mode` column that only reflects the *primary* mode.
 *   As a result, the same account could see 22/26/19/3/19 on desktop and
 *   10/26/19/3/19 on mobile — different viewports fired with different
 *   filter stacks / race ordering, and users active in several modes were
 *   silently missed.
 *
 * What this returns:
 *   - One row per (user_id, mode) active activation in the last 24h.
 *   - Deduplicated per mode: one user counted once per mode even if they
 *     insert several `is_active=true` rows in a day.
 *   - Covers every `ModeKey` declared in `@/lib/modes`, even when 0.
 *
 * Resilience:
 *   - 60s polling safety net.
 *   - Realtime subscription on `mode_activations` for instant refresh.
 *   - Silent fallback to an empty map on error (UI simply shows 0).
 */

import { useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { useRealtimeChannel } from "@/lib/hooks/useSupabaseQuery";
import { MODE_KEYS, type ModeKey } from "@/lib/modes";

type ModeCounts = Record<ModeKey, number>;

interface ActivationRow {
  mode: string | null;
  user_id: string | null;
}

function twentyFourHoursAgo(): string {
  return new Date(Date.now() - 24 * 60 * 60_000).toISOString();
}

function emptyCounts(): ModeCounts {
  const out = {} as ModeCounts;
  for (const key of MODE_KEYS) out[key] = 0;
  return out;
}

export function useModeCounts(): {
  counts: ModeCounts;
  loading: boolean;
} {
  const { data, loading, refetch } = useAsyncResource<ModeCounts>(
    async (signal) => {
      try {
        const { data: rows, error } = await supabase
          .from("mode_activations")
          .select("mode, user_id")
          .eq("is_active", true)
          .gte("created_at", twentyFourHoursAgo())
          .abortSignal(signal);

        if (error || !rows) {
          return emptyCounts();
        }

        // Deduplicate on (mode, user_id) so a single user is counted
        // at most once per mode no matter how many activations they have.
        const seen = new Map<ModeKey, Set<string>>();
        for (const row of rows as ActivationRow[]) {
          if (!row.mode || !row.user_id) continue;
          if (!MODE_KEYS.includes(row.mode as ModeKey)) continue;
          const key = row.mode as ModeKey;
          let bucket = seen.get(key);
          if (!bucket) {
            bucket = new Set<string>();
            seen.set(key, bucket);
          }
          bucket.add(row.user_id);
        }

        const out = emptyCounts();
        for (const [key, set] of seen.entries()) {
          out[key] = set.size;
        }
        return out;
      } catch {
        return emptyCounts();
      }
    },
    [],
    { pollIntervalMs: 60_000 },
  );

  // Realtime: refresh instantly when any activation changes.
  useRealtimeChannel(
    (client) =>
      client
        .channel("mode-counts")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "mode_activations" },
          () => {
            void refetch();
          },
        ),
    [refetch],
  );

  // Stable identity — memoised so consumers don't re-render on tick.
  const counts = useMemo(() => data ?? emptyCounts(), [data]);

  return { counts, loading };
}
