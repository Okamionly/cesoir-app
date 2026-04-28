/**
 * useMasteryTiers — Wave 17 (mig 046).
 *
 * Returns the mastery state for the current user across the 4 active
 * modes (solo-diner, plus-one, night-owl, foodie-quest). For each mode
 * we surface:
 *   - the current tier (apprenti / initie / maitre / null)
 *   - the raw mutual-IRL count
 *   - the threshold for the NEXT tier (used for the progress bar)
 *
 * Data source: a single Supabase query that joins `irl_confirmations`
 * to `conversations` server-side via the SQL helper functions defined
 * in mig 046. We do all 4 modes in parallel then assemble the shape
 * the UI needs.
 *
 * Why not call `compute_mastery_tier` 4×? We could, but doing one
 * COUNT per mode keeps the round-trip small and lets us derive both
 * the tier AND the progress label client-side — the SQL functions
 * stay authoritative for the trigger-side awarding logic.
 */
"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseQuery } from "@/lib/hooks/useSupabaseQuery";
import { MODE_KEYS, type ModeKey } from "@/lib/modes";

// ─────────────────────────────────────────
// Types & thresholds
// ─────────────────────────────────────────

export type MasteryTier = "apprenti" | "initie" | "maitre";

/** Threshold (count of mutual IRL meets) required for each tier.
 *  Mirrors the SQL `compute_mastery_tier` function — keep in sync. */
export const MASTERY_THRESHOLDS: Record<MasteryTier, number> = {
  apprenti: 3,
  initie: 10,
  maitre: 25,
};

export const MASTERY_LABELS: Record<MasteryTier, string> = {
  apprenti: "Apprenti",
  initie: "Initié",
  maitre: "Maître",
};

export interface MasteryProgress {
  /** Mode key — "solo-diner", "plus-one", "night-owl", "foodie-quest". */
  mode: ModeKey;
  /** Highest tier the user has reached, or `null` when below apprenti. */
  tier: MasteryTier | null;
  /** Raw count of mutual IRL meets in this mode. */
  count: number;
  /** Threshold for the NEXT tier (e.g. 10 when at apprenti).
   *  `null` when already at the top tier. */
  nextThreshold: number | null;
  /** Convenience progress label for the UI ("7/10" or "25" when maxed). */
  progressLabel: string;
  /** 0..1 fraction toward the next tier. `1` when at the top tier. */
  progressFraction: number;
}

export interface UseMasteryTiersReturn {
  /** Per-mode mastery state — always 4 entries in MODE_KEYS order. */
  byMode: MasteryProgress[];
  /** The highest-ranked mastery the user has, or `null`. Used by the
   *  swipe card to surface the user's "best" mode. Maître > Initié >
   *  Apprenti; ties broken by raw count. */
  topMastery: MasteryProgress | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ─────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────

interface JoinedRow {
  mutual_at: string | null;
  conversations: { mode: string | null } | null;
}

function tierFromCount(count: number): MasteryTier | null {
  if (count >= MASTERY_THRESHOLDS.maitre) return "maitre";
  if (count >= MASTERY_THRESHOLDS.initie) return "initie";
  if (count >= MASTERY_THRESHOLDS.apprenti) return "apprenti";
  return null;
}

function nextThreshold(tier: MasteryTier | null): number | null {
  if (tier === null) return MASTERY_THRESHOLDS.apprenti;
  if (tier === "apprenti") return MASTERY_THRESHOLDS.initie;
  if (tier === "initie") return MASTERY_THRESHOLDS.maitre;
  return null;
}

const TIER_RANK: Record<MasteryTier, number> = {
  apprenti: 1,
  initie: 2,
  maitre: 3,
};

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useMasteryTiers(): UseMasteryTiersReturn {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, loading, error, refetch } = useSupabaseQuery<JoinedRow[]>(
    async (client) => {
      if (!userId) return { data: [], error: null };
      // One round-trip: fetch all the user's mutual IRL confirmations
      // joined to `conversations.mode`. Counting per-mode happens
      // client-side from the result set.
      const result = await client
        .from("irl_confirmations")
        .select("mutual_at, conversations(mode)")
        .eq("user_id", userId)
        .not("mutual_at", "is", null);
      // Cast: Supabase typings for join shapes are weak — this query
      // produces the JoinedRow shape declared above.
      return {
        data: (result.data ?? []) as unknown as JoinedRow[],
        error: result.error,
      };
    },
    [userId],
    { enabled: Boolean(userId) },
  );

  const byMode = useMemo<MasteryProgress[]>(() => {
    const counts = new Map<ModeKey, number>();
    for (const key of MODE_KEYS) counts.set(key, 0);

    for (const row of data ?? []) {
      const m = row.conversations?.mode;
      if (m && (MODE_KEYS as readonly string[]).includes(m)) {
        const k = m as ModeKey;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    }

    return MODE_KEYS.map((mode) => {
      const count = counts.get(mode) ?? 0;
      const tier = tierFromCount(count);
      const next = nextThreshold(tier);
      const progressLabel =
        next === null
          ? `${count}`
          : `${Math.min(count, next)}/${next}`;
      const progressFraction =
        next === null ? 1 : Math.max(0, Math.min(1, count / next));
      return {
        mode,
        tier,
        count,
        nextThreshold: next,
        progressLabel,
        progressFraction,
      };
    });
  }, [data]);

  const topMastery = useMemo<MasteryProgress | null>(() => {
    let best: MasteryProgress | null = null;
    for (const m of byMode) {
      if (m.tier === null) continue;
      if (
        best === null ||
        TIER_RANK[m.tier] > TIER_RANK[best.tier!] ||
        (TIER_RANK[m.tier] === TIER_RANK[best.tier!] && m.count > best.count)
      ) {
        best = m;
      }
    }
    return best;
  }, [byMode]);

  return {
    byMode,
    topMastery,
    loading,
    error: (error as Error | null) ?? null,
    refetch,
  };
}
