"use client";

import { useCallback, useState } from "react";
import { supabase } from "./supabase";

// ---------- Undo history ----------

interface InteractionRecord {
  targetId: string;
  action: "like" | "pass" | "superlike";
  mode?: string;
}

const MAX_HISTORY = 5;

export function useInteractions(userId?: string) {
  const [history, setHistory] = useState<InteractionRecord[]>([]);

  /** Push an action into the undo history (max 5) */
  const pushHistory = useCallback((record: InteractionRecord) => {
    setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), record]);
  }, []);

  /** Undo the last interaction — deletes the row from Supabase */
  const undo = useCallback(async () => {
    if (!userId) return null;

    const last = history[history.length - 1];
    if (!last) return null;

    // Remove from DB
    await supabase
      .from("interactions")
      .delete()
      .eq("from_user", userId)
      .eq("to_user", last.targetId)
      .eq("action", last.action);

    // Pop from history
    setHistory((prev) => prev.slice(0, -1));

    return last;
  }, [userId, history]);

  const like = useCallback(async (targetId: string, mode?: string) => {
    if (!userId) return { matched: false };

    // Insert the like
    await supabase.from("interactions").upsert({
      from_user: userId,
      to_user: targetId,
      action: "like",
      mode,
    });
    pushHistory({ targetId, action: "like", mode });

    // Check if it's a mutual match
    const { data } = await supabase
      .from("interactions")
      .select("id")
      .eq("from_user", targetId)
      .eq("to_user", userId)
      .in("action", ["like", "superlike"])
      .single();

    const matched = !!data;

    // If matched, create a conversation
    let conversationId: string | null = null;
    if (matched) {
      const userA = userId < targetId ? userId : targetId;
      const userB = userId < targetId ? targetId : userId;

      const { data: conv } = await supabase.from("conversations").upsert({
        user_a: userA,
        user_b: userB,
        mode,
      }, { onConflict: "user_a,user_b" }).select("id").single();

      conversationId = conv?.id ?? null;
    }

    return { matched, conversationId };
  }, [userId, pushHistory]);

  const pass = useCallback(async (targetId: string) => {
    if (!userId) return;
    await supabase.from("interactions").upsert({
      from_user: userId,
      to_user: targetId,
      action: "pass",
    });
    pushHistory({ targetId, action: "pass" });
  }, [userId, pushHistory]);

  const superlike = useCallback(async (targetId: string, mode?: string) => {
    if (!userId) return { matched: false };

    await supabase.from("interactions").upsert({
      from_user: userId,
      to_user: targetId,
      action: "superlike",
      mode,
    });
    pushHistory({ targetId, action: "superlike", mode });

    const { data } = await supabase
      .from("interactions")
      .select("id")
      .eq("from_user", targetId)
      .eq("to_user", userId)
      .in("action", ["like", "superlike"])
      .single();

    const matched = !!data;

    if (matched) {
      const userA = userId < targetId ? userId : targetId;
      const userB = userId < targetId ? targetId : userId;
      await supabase.from("conversations").upsert({
        user_a: userA,
        user_b: userB,
        mode,
      }, { onConflict: "user_a,user_b" });
    }

    return { matched };
  }, [userId, pushHistory]);

  const report = useCallback(async (targetId: string, reason: string, details?: string) => {
    if (!userId) return;
    await supabase.from("reports").insert({
      reporter_id: userId,
      reported_id: targetId,
      reason,
      details: details || "",
    });
    // Also block
    await supabase.from("interactions").upsert({
      from_user: userId,
      to_user: targetId,
      action: "block",
    });
  }, [userId]);

  return { like, pass, superlike, report, undo, history };
}
