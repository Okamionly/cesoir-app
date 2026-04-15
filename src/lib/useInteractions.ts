"use client";

import { useCallback, useState } from "react";
import { supabase } from "./supabase";
import type { InteractionAction, ReportReason, FeedActivityType } from "./supabase-types";

// ---------- Types ----------

interface InteractionRecord {
  targetId: string;
  action: Extract<InteractionAction, "like" | "pass" | "superlike">;
  mode?: string;
}

interface InteractionResult {
  matched: boolean;
  conversationId: string | null;
}

interface UseInteractionsReturn {
  /** Send a "like" — checks for mutual match and creates conversation if mutual */
  like: (targetId: string, mode?: string) => Promise<InteractionResult>;
  /** Send a "superlike" — same as like but with higher signal */
  superlike: (targetId: string, mode?: string) => Promise<InteractionResult>;
  /** Send a "pass" — skip this profile */
  pass: (targetId: string) => Promise<void>;
  /** Block a user — prevents future interactions */
  block: (targetId: string) => Promise<void>;
  /** Report a user — inserts into reports table and blocks them */
  report: (targetId: string, reason: ReportReason, details?: string) => Promise<void>;
  /** Check if two users have mutually liked each other */
  checkMutualMatch: (targetId: string) => Promise<boolean>;
  /** Undo the last interaction */
  undo: () => Promise<InteractionRecord | null>;
  /** Recent interaction history (max 5) */
  history: InteractionRecord[];
  /** True while an interaction is being processed */
  loading: boolean;
  /** Error message from the last failed operation */
  error: string | null;
}

// ---------- Constants ----------

const MAX_HISTORY = 5;

// ---------- Hook ----------

export function useInteractions(userId?: string): UseInteractionsReturn {
  const [history, setHistory] = useState<InteractionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Push an action into the undo history (max 5) */
  const pushHistory = useCallback((record: InteractionRecord) => {
    setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), record]);
  }, []);

  /**
   * Check if the target user has also liked/superliked the current user.
   * Returns true if mutual interest exists.
   */
  const checkMutualMatch = useCallback(
    async (targetId: string): Promise<boolean> => {
      if (!userId) return false;

      const { data } = await supabase
        .from("interactions")
        .select("id")
        .eq("from_user", targetId)
        .eq("to_user", userId)
        .in("action", ["like", "superlike"] satisfies InteractionAction[])
        .limit(1)
        .maybeSingle();

      return !!data;
    },
    [userId],
  );

  /**
   * When a match is confirmed: create a conversation and insert a feed activity.
   * Uses deterministic ordering (lexicographic) for user_a/user_b to prevent duplicates.
   */
  const handleMatch = useCallback(
    async (targetId: string, mode?: string): Promise<string | null> => {
      if (!userId) return null;

      const userA = userId < targetId ? userId : targetId;
      const userB = userId < targetId ? targetId : userId;

      // Upsert conversation — idempotent on (user_a, user_b)
      const { data: conv } = await supabase
        .from("conversations")
        .upsert(
          {
            user_a: userA,
            user_b: userB,
            mode: mode ?? null,
            last_message_at: new Date().toISOString(),
          },
          { onConflict: "user_a,user_b" },
        )
        .select("id")
        .single();

      const conversationId = conv?.id ?? null;

      // Insert feed activity for both users so the match shows in their feeds
      const matchActivity: { user_id: string; type: FeedActivityType; content: string; mode: string | null }[] = [
        {
          user_id: userId,
          type: "availability" as FeedActivityType, // closest available type for "match"
          content: `match:${targetId}`,
          mode: mode ?? null,
        },
        {
          user_id: targetId,
          type: "availability" as FeedActivityType,
          content: `match:${userId}`,
          mode: mode ?? null,
        },
      ];

      await supabase.from("feed_activities").insert(matchActivity);

      return conversationId;
    },
    [userId],
  );

  /** Like a profile. Returns whether it's a mutual match and the conversation ID. */
  const like = useCallback(
    async (targetId: string, mode?: string): Promise<InteractionResult> => {
      if (!userId) return { matched: false, conversationId: null };

      setLoading(true);
      setError(null);

      try {
        // Insert the like interaction
        const { error: insertError } = await supabase.from("interactions").upsert({
          from_user: userId,
          to_user: targetId,
          action: "like" satisfies InteractionAction,
          mode: mode ?? null,
        });

        if (insertError) throw new Error(insertError.message);

        pushHistory({ targetId, action: "like", mode });

        // Check for mutual match
        const matched = await checkMutualMatch(targetId);

        let conversationId: string | null = null;
        if (matched) {
          conversationId = await handleMatch(targetId, mode);
        }

        return { matched, conversationId };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du like";
        setError(message);
        return { matched: false, conversationId: null };
      } finally {
        setLoading(false);
      }
    },
    [userId, pushHistory, checkMutualMatch, handleMatch],
  );

  /** Superlike a profile. Same flow as like but recorded as "superlike". */
  const superlike = useCallback(
    async (targetId: string, mode?: string): Promise<InteractionResult> => {
      if (!userId) return { matched: false, conversationId: null };

      setLoading(true);
      setError(null);

      try {
        const { error: insertError } = await supabase.from("interactions").upsert({
          from_user: userId,
          to_user: targetId,
          action: "superlike" satisfies InteractionAction,
          mode: mode ?? null,
        });

        if (insertError) throw new Error(insertError.message);

        pushHistory({ targetId, action: "superlike", mode });

        // Check for mutual match
        const matched = await checkMutualMatch(targetId);

        let conversationId: string | null = null;
        if (matched) {
          conversationId = await handleMatch(targetId, mode);
        }

        return { matched, conversationId };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du superlike";
        setError(message);
        return { matched: false, conversationId: null };
      } finally {
        setLoading(false);
      }
    },
    [userId, pushHistory, checkMutualMatch, handleMatch],
  );

  /** Pass on a profile. */
  const pass = useCallback(
    async (targetId: string): Promise<void> => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const { error: insertError } = await supabase.from("interactions").upsert({
          from_user: userId,
          to_user: targetId,
          action: "pass" satisfies InteractionAction,
        });

        if (insertError) throw new Error(insertError.message);

        pushHistory({ targetId, action: "pass" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du pass";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [userId, pushHistory],
  );

  /** Block a user. Prevents them from appearing in matches. */
  const block = useCallback(
    async (targetId: string): Promise<void> => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const { error: insertError } = await supabase.from("interactions").upsert({
          from_user: userId,
          to_user: targetId,
          action: "block" satisfies InteractionAction,
        });

        if (insertError) throw new Error(insertError.message);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du blocage";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  /** Report a user. Inserts a report row and also blocks them. */
  const report = useCallback(
    async (targetId: string, reason: ReportReason, details?: string): Promise<void> => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        // Insert report
        const { error: reportError } = await supabase.from("reports").insert({
          reporter_id: userId,
          reported_id: targetId,
          reason,
          details: details ?? "",
        });

        if (reportError) throw new Error(reportError.message);

        // Also block the user
        await supabase.from("interactions").upsert({
          from_user: userId,
          to_user: targetId,
          action: "block" satisfies InteractionAction,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du signalement";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  /** Undo the last interaction. Deletes the row from Supabase and pops history. */
  const undo = useCallback(async (): Promise<InteractionRecord | null> => {
    if (!userId) return null;

    const last = history[history.length - 1];
    if (!last) return null;

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("interactions")
        .delete()
        .eq("from_user", userId)
        .eq("to_user", last.targetId)
        .eq("action", last.action);

      if (deleteError) throw new Error(deleteError.message);

      setHistory((prev) => prev.slice(0, -1));
      return last;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'annulation";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, history]);

  return {
    like,
    superlike,
    pass,
    block,
    report,
    checkMutualMatch,
    undo,
    history,
    loading,
    error,
  };
}
