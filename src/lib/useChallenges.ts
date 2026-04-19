"use client";

import { useCallback, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";

// ---------- Types ----------

export interface Challenge {
  id: string;
  userId: string;
  challengeType: string;
  progress: number;
  total: number;
  completed: boolean;
  xpEarned: number;
  date: string;
}

interface ChallengeRow {
  id: string;
  user_id: string;
  challenge_type: string;
  progress: number | null;
  total: number;
  completed: boolean | null;
  xp_earned: number | null;
  date: string | null;
}

function toChallenge(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    userId: row.user_id,
    challengeType: row.challenge_type,
    progress: row.progress ?? 0,
    total: row.total,
    completed: row.completed ?? false,
    xpEarned: row.xp_earned ?? 0,
    date: row.date ?? new Date().toISOString(),
  };
}

// ---------- Hook ----------

interface UseChallengesReturn {
  challenges: Challenge[];
  loading: boolean;
  error: string | null;
  totalXpToday: number;
  refresh: () => Promise<void>;
  incrementProgress: (challengeId: string, amount?: number) => Promise<void>;
  completeChallenge: (challengeId: string) => Promise<void>;
}

export function useChallenges(): UseChallengesReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [optimistic, setOptimistic] = useState<Challenge[] | null>(null);

  const { data, loading, error, refetch } = useAsyncResource<Challenge[]>(
    async (signal) => {
      if (!userId) return [];

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: rows, error: err } = await supabase
        .from("challenges")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startOfDay.toISOString())
        .order("date", { ascending: false })
        .abortSignal(signal);

      if (err) {
        console.error("[useChallenges] fetch failed:", err.message);
        throw new Error(err.message);
      }

      return ((rows ?? []) as ChallengeRow[]).map(toChallenge);
    },
    [userId],
  );

  // Reset optimistic override whenever fresh data lands
  const challenges = optimistic ?? data ?? [];

  const refresh = useCallback(async () => {
    setOptimistic(null);
    await refetch();
  }, [refetch]);

  const incrementProgress = useCallback(
    async (challengeId: string, amount = 1) => {
      const current = challenges.find((c) => c.id === challengeId);
      if (!current) return;

      const newProgress = Math.min(current.total, current.progress + amount);
      const nowComplete = newProgress >= current.total;

      setOptimistic(
        challenges.map((c) =>
          c.id === challengeId
            ? { ...c, progress: newProgress, completed: nowComplete }
            : c,
        ),
      );

      const { error: err } = await supabase
        .from("challenges")
        .update({ progress: newProgress, completed: nowComplete })
        .eq("id", challengeId);

      if (err) {
        console.error("[useChallenges] increment failed:", err.message);
      }
      setOptimistic(null);
      void refetch();
    },
    [challenges, refetch],
  );

  const completeChallenge = useCallback(
    async (challengeId: string) => {
      const target = challenges.find((c) => c.id === challengeId);
      if (!target) return;

      setOptimistic(
        challenges.map((c) =>
          c.id === challengeId ? { ...c, completed: true, progress: c.total } : c,
        ),
      );

      const { error: err } = await supabase
        .from("challenges")
        .update({ completed: true, progress: target.total })
        .eq("id", challengeId);
      if (err) {
        console.error("[useChallenges] complete failed:", err.message);
      }
      setOptimistic(null);
      void refetch();
    },
    [challenges, refetch],
  );

  const totalXpToday = challenges
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.xpEarned, 0);

  return {
    challenges,
    loading,
    error: error?.message ?? null,
    totalXpToday,
    refresh,
    incrementProgress,
    completeChallenge,
  };
}
