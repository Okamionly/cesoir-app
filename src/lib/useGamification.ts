"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { useRealtimeChannel } from "@/lib/hooks/useSupabaseQuery";
import {
  calculateLevel,
  checkLevelUp,
  getLevelRewards,
  type LevelInfo,
  type LevelReward,
  type XPAction,
  XP_REWARDS,
} from "@/lib/gamification";

// ─────────────────────────────────────────
// XP Popup state (multiple can stack)
// ─────────────────────────────────────────

export interface XPPopupData {
  id: string;
  amount: number;
  reason: string;
}

// ─────────────────────────────────────────
// Level-up modal state
// ─────────────────────────────────────────

export interface LevelUpData {
  oldLevel: number;
  newLevel: number;
  newTitle: string;
  rewards: LevelReward[];
}

// ─────────────────────────────────────────
// Hook return type
// ─────────────────────────────────────────

export interface UseGamificationReturn {
  levelInfo: LevelInfo;
  xp: number;
  level: number;
  title: string;
  nextLevelXP: number;
  progress: number;
  addXP: (action: XPAction, variableAmount?: number) => Promise<void>;
  showLevelUp: LevelUpData | null;
  dismissLevelUp: () => void;
  xpPopups: XPPopupData[];
  removePopup: (id: string) => void;
  loading: boolean;
}

let popupCounter = 0;

export function useGamification(): UseGamificationReturn {
  const { user } = useAuth();
  const userId = user?.id;

  // Initial XP load (with AbortSignal)
  const { data: initialXP, loading } = useAsyncResource<number>(
    async (signal) => {
      if (!userId) return 0;
      const { data, error } = await supabase
        .from("karma_transactions")
        .select("amount")
        .eq("user_id", userId)
        .abortSignal(signal);

      if (error || !data) return 0;
      return data.reduce(
        (sum: number, row: { amount: number }) => sum + row.amount,
        0,
      );
    },
    [userId],
  );

  // Local XP state (overrides initial after realtime / addXP updates)
  const [xpDelta, setXPDelta] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState<LevelUpData | null>(null);
  const [xpPopups, setXPPopups] = useState<XPPopupData[]>([]);

  // Reset delta when the base changes (user switch / refetch)
  useEffect(() => {
    setXPDelta(0);
  }, [initialXP]);

  const xp = (initialXP ?? 0) + xpDelta;
  const xpRef = useRef(xp);
  useEffect(() => {
    xpRef.current = xp;
  }, [xp]);

  // Realtime: listen for new karma_transactions
  useRealtimeChannel(
    (client) =>
      userId
        ? client.channel(`xp-${userId}`).on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "karma_transactions",
              filter: `user_id=eq.${userId}`,
            },
            (payload: { new: { amount: number; reason: string } }) => {
              const newAmount = payload.new.amount;
              const oldTotal = xpRef.current;

              setXPDelta((d) => d + newAmount);

              const levelUp = checkLevelUp(oldTotal, newAmount);
              if (levelUp) {
                setShowLevelUp({
                  oldLevel: levelUp.oldLevel,
                  newLevel: levelUp.newLevel,
                  newTitle: levelUp.newTitle,
                  rewards: getLevelRewards(levelUp.newLevel),
                });
              }
            },
          )
        : null,
    [userId],
  );

  const addXP = useCallback(
    async (action: XPAction, variableAmount?: number) => {
      if (!userId) return;

      const amount =
        action === "complete_challenge" && variableAmount !== undefined
          ? variableAmount
          : XP_REWARDS[action].amount;

      if (amount <= 0) return;

      const reason = XP_REWARDS[action].label;

      const popupId = `xp-${++popupCounter}`;
      setXPPopups((prev) => [...prev, { id: popupId, amount, reason }]);

      const oldTotal = xpRef.current;
      const levelUp = checkLevelUp(oldTotal, amount);

      setXPDelta((d) => d + amount);

      if (levelUp) {
        setTimeout(() => {
          setShowLevelUp({
            oldLevel: levelUp.oldLevel,
            newLevel: levelUp.newLevel,
            newTitle: levelUp.newTitle,
            rewards: getLevelRewards(levelUp.newLevel),
          });
        }, 600);
      }

      await supabase.from("karma_transactions").insert({
        user_id: userId,
        amount,
        reason,
      });
    },
    [userId],
  );

  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(null);
  }, []);

  const removePopup = useCallback((id: string) => {
    setXPPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const levelInfo = calculateLevel(xp);

  return {
    levelInfo,
    xp,
    level: levelInfo.level,
    title: levelInfo.title,
    nextLevelXP: levelInfo.nextLevelXP,
    progress: levelInfo.progress,
    addXP,
    showLevelUp,
    dismissLevelUp,
    xpPopups,
    removePopup,
    loading,
  };
}
