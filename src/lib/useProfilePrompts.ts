"use client";

/**
 * useProfilePrompts — read + write the user's 0–3 profile prompts.
 *
 * Backs migration 036 (`public.profile_prompts`). Each prompt is a row keyed
 * by (user_id, order_idx) where order_idx ∈ [0, 2]. The hook always returns
 * exactly the rows that exist for the user, sorted by order_idx ascending —
 * no padding, no nulls. Consumers that need a 3-slot UI render the empty
 * slots themselves (PromptEditor) so the underlying state stays a
 * canonical row list.
 *
 * Two consumer surfaces:
 *   - The owner's /profile page → reads via the userId passed in
 *     (typically `useAuth().user?.id`) and gets the mutation API.
 *   - Other profiles' SwipeCard → passes a `targetUserId` param and only
 *     reads (mutations are RLS-blocked anyway, but we don't expose them).
 *
 * This hook is intentionally thin — no realtime subscription, no optimistic
 * cache. Prompts change rarely (user opens editor → saves) and are read on
 * mount when a card renders. If we ever need cross-tab sync, swap `refetch()`
 * for a realtime channel on `profile_prompts:user_id=eq.<uid>`.
 */

import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery } from "@/lib/hooks/useSupabaseQuery";
import { logger } from "@/lib/logger";
import {
  PROMPT_ANSWER_MAX_LENGTH,
  PROMPT_SLOT_COUNT,
  getPromptQuestionById,
  type PromptQuestion,
} from "@/lib/prompts";

// ── Row shape (mirrors migration 036) ───────────────────────────────────────

export interface ProfilePromptRow {
  user_id: string;
  order_idx: number;
  prompt_id: string;
  answer: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Resolved shape consumed by SwipeCard / PromptEditor — pairs the row with
 * its catalogue question (or `null` if the prompt_id has been retired in
 * code since the user saved it). Renderers should `.filter(Boolean)` the
 * `question` field before drawing.
 */
export interface ResolvedProfilePrompt {
  orderIdx: number;
  promptId: string;
  answer: string;
  question: PromptQuestion | null;
}

// ── Hook return type ────────────────────────────────────────────────────────

export interface UseProfilePromptsReturn {
  /** All rows for the user, sorted by order_idx, length ≤ 3. */
  prompts: ResolvedProfilePrompt[];
  /** True while the initial fetch is in flight. */
  loading: boolean;
  /** Last error, if any. */
  error: Error | null;
  /** Manual refetch — used by PromptEditor after save. */
  refetch: () => Promise<void>;
  /**
   * Replace the user's full prompt set. Pass an array of length 0–3 — order
   * is inferred from array index. Wipes any pre-existing rows in a single
   * round-trip (delete + insert) so the post-state matches the input
   * exactly. No-op for non-owners (RLS will reject anyway).
   */
  saveAll: (
    newPrompts: Array<{ promptId: string; answer: string }>,
  ) => Promise<void>;
  /** Clear all prompts. Convenience over `saveAll([])`. */
  clearAll: () => Promise<void>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveRow(row: ProfilePromptRow): ResolvedProfilePrompt {
  return {
    orderIdx: row.order_idx,
    promptId: row.prompt_id,
    answer: row.answer,
    question: getPromptQuestionById(row.prompt_id) ?? null,
  };
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * @param targetUserId  Defaults to the currently authenticated user. Pass an
 *                      explicit id when reading another user's prompts on a
 *                      SwipeCard.
 */
export function useProfilePrompts(
  targetUserId?: string | null,
): UseProfilePromptsReturn {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;
  const userId = targetUserId ?? ownerId;
  const isOwner = !!ownerId && ownerId === userId;

  const { data, loading, error, refetch } = useSupabaseQuery<ProfilePromptRow[]>(
    async (client) => {
      if (!userId) return { data: [], error: null };
      const result = await client
        .from("profile_prompts")
        .select("user_id, order_idx, prompt_id, answer, created_at, updated_at")
        .eq("user_id", userId)
        .order("order_idx", { ascending: true });
      return result as { data: ProfilePromptRow[] | null; error: typeof result.error };
    },
    [userId],
    { enabled: !!userId },
  );

  const prompts: ResolvedProfilePrompt[] = useMemo(() => {
    if (!data) return [];
    return data
      .slice(0, PROMPT_SLOT_COUNT)
      .sort((a, b) => a.order_idx - b.order_idx)
      .map(resolveRow);
  }, [data]);

  const saveAll = useCallback(
    async (newPrompts: Array<{ promptId: string; answer: string }>) => {
      if (!isOwner || !ownerId) {
        // Defensive: matches RLS — but spare the round-trip.
        throw new Error("Only the owner can save prompts");
      }
      // Validate client-side; the DB CHECK + a TS layer mirror this so we
      // can fail fast with a friendlier error than a 23514 violation.
      const cleaned = newPrompts.slice(0, PROMPT_SLOT_COUNT).map((p, idx) => {
        const trimmed = p.answer.trim();
        if (!p.promptId) {
          throw new Error(`Prompt ${idx + 1} : question manquante`);
        }
        if (!trimmed) {
          throw new Error(`Prompt ${idx + 1} : réponse vide`);
        }
        if (trimmed.length > PROMPT_ANSWER_MAX_LENGTH) {
          throw new Error(
            `Prompt ${idx + 1} : réponse trop longue (max ${PROMPT_ANSWER_MAX_LENGTH} caractères)`,
          );
        }
        return {
          user_id: ownerId,
          order_idx: idx,
          prompt_id: p.promptId,
          answer: trimmed,
        };
      });

      // delete-then-insert is atomic enough for our purposes: PromptEditor
      // is the only writer, only one tab can save at a time in practice,
      // and a half-applied state means at worst the user sees their old
      // prompts and re-saves. We avoid an upsert to keep slot uniqueness
      // simple — without a delete first, removing a prompt would leave
      // an orphaned row at order_idx=2.
      const { error: deleteErr } = await supabase
        .from("profile_prompts")
        .delete()
        .eq("user_id", ownerId);
      if (deleteErr) {
        logger.error("profile_prompts_delete_failed", { err: deleteErr.message });
        throw new Error(deleteErr.message);
      }

      if (cleaned.length > 0) {
        const { error: insertErr } = await supabase
          .from("profile_prompts")
          .insert(cleaned);
        if (insertErr) {
          logger.error("profile_prompts_insert_failed", { err: insertErr.message });
          throw new Error(insertErr.message);
        }
      }

      await refetch();
    },
    [isOwner, ownerId, refetch],
  );

  const clearAll = useCallback(async () => {
    await saveAll([]);
  }, [saveAll]);

  return {
    prompts,
    loading,
    error: error as Error | null,
    refetch,
    saveAll,
    clearAll,
  };
}
