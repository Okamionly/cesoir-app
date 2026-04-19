"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";

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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    if (!user) {
      setChallenges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error: err } = await supabase
      .from("challenges")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startOfDay.toISOString())
      .order("date", { ascending: false });

    if (err) {
      console.error("[useChallenges] fetch failed:", err.message);
      setError(err.message);
      setLoading(false);
      return;
    }

    setChallenges(((data ?? []) as ChallengeRow[]).map(toChallenge));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchChallenges();
  }, [fetchChallenges]);

  const incrementProgress = useCallback(
    async (challengeId: string, amount = 1) => {
      const current = challenges.find((c) => c.id === challengeId);
      if (!current) return;

      const newProgress = Math.min(current.total, current.progress + amount);
      const nowComplete = newProgress >= current.total;

      // Optimistic
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId ? { ...c, progress: newProgress, completed: nowComplete } : c,
        ),
      );

      const { error: err } = await supabase
        .from("challenges")
        .update({ progress: newProgress, completed: nowComplete })
        .eq("id", challengeId);

      if (err) {
        console.error("[useChallenges] increment failed:", err.message);
        void fetchChallenges();
      }
    },
    [challenges, fetchChallenges],
  );

  const completeChallenge = useCallback(
    async (challengeId: string) => {
      const target = challenges.find((c) => c.id === challengeId);
      if (!target) return;

      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId ? { ...c, completed: true, progress: c.total } : c,
        ),
      );

      const { error: err } = await supabase
        .from("challenges")
        .update({ completed: true, progress: target.total })
        .eq("id", challengeId);
      if (err) {
        console.error("[useChallenges] complete failed:", err.message);
        void fetchChallenges();
      }
    },
    [challenges, fetchChallenges],
  );

  const totalXpToday = challenges
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.xpEarned, 0);

  return {
    challenges,
    loading,
    error,
    totalXpToday,
    refresh: fetchChallenges,
    incrementProgress,
    completeChallenge,
  };
}
