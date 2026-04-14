"use client";

import { useCallback } from "react";
import { supabase } from "./supabase";

export function useInteractions(userId?: string) {
  const like = useCallback(async (targetId: string, mode?: string) => {
    if (!userId) return { matched: false };

    // Insert the like
    await supabase.from("interactions").upsert({
      from_user: userId,
      to_user: targetId,
      action: "like",
      mode,
    });

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
  }, [userId]);

  const pass = useCallback(async (targetId: string) => {
    if (!userId) return;
    await supabase.from("interactions").upsert({
      from_user: userId,
      to_user: targetId,
      action: "pass",
    });
  }, [userId]);

  const superlike = useCallback(async (targetId: string, mode?: string) => {
    if (!userId) return { matched: false };

    await supabase.from("interactions").upsert({
      from_user: userId,
      to_user: targetId,
      action: "superlike",
      mode,
    });

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
  }, [userId]);

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

  return { like, pass, superlike, report };
}
