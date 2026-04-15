"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
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
  /** Current level info */
  levelInfo: LevelInfo;
  /** Total XP */
  xp: number;
  /** Current level number */
  level: number;
  /** Current title */
  title: string;
  /** XP needed for next level */
  nextLevelXP: number;
  /** Progress 0-1 toward next level */
  progress: number;
  /** Add XP for an action — inserts karma_transaction, checks level-up */
  addXP: (action: XPAction, variableAmount?: number) => Promise<void>;
  /** Whether level-up modal should be shown */
  showLevelUp: LevelUpData | null;
  /** Dismiss the level-up modal */
  dismissLevelUp: () => void;
  /** Active XP popups (for stacking) */
  xpPopups: XPPopupData[];
  /** Remove a popup by id */
  removePopup: (id: string) => void;
  /** Whether XP data is loading */
  loading: boolean;
}

let popupCounter = 0;

export function useGamification(): UseGamificationReturn {
  const { user } = useAuth();
  const [xp, setXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState<LevelUpData | null>(null);
  const [xpPopups, setXPPopups] = useState<XPPopupData[]>([]);
  const xpRef = useRef(xp);

  // Keep ref in sync
  useEffect(() => {
    xpRef.current = xp;
  }, [xp]);

  // ─── Fetch initial XP from karma_transactions ───
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function fetchXP() {
      const { data, error } = await supabase
        .from("karma_transactions")
        .select("amount")
        .eq("user_id", user!.id);

      if (!error && data) {
        const total = data.reduce(
          (sum: number, row: { amount: number }) => sum + row.amount,
          0,
        );
        setXP(total);
        xpRef.current = total;
      }
      setLoading(false);
    }

    fetchXP();
  }, [user?.id]);

  // ─── Real-time subscription to XP changes ───
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`xp-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "karma_transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: { new: { amount: number; reason: string } }) => {
          const newAmount = payload.new.amount;
          const oldTotal = xpRef.current;
          const newTotal = oldTotal + newAmount;

          setXP(newTotal);
          xpRef.current = newTotal;

          // Check for level-up
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ─── Add XP ───
  const addXP = useCallback(
    async (action: XPAction, variableAmount?: number) => {
      if (!user?.id) return;

      const amount =
        action === "complete_challenge" && variableAmount !== undefined
          ? variableAmount
          : XP_REWARDS[action].amount;

      if (amount <= 0) return;

      const reason = XP_REWARDS[action].label;

      // Optimistic: show popup immediately
      const popupId = `xp-${++popupCounter}`;
      setXPPopups((prev) => [...prev, { id: popupId, amount, reason }]);

      // Check level-up optimistically
      const oldTotal = xpRef.current;
      const newTotal = oldTotal + amount;
      const levelUp = checkLevelUp(oldTotal, amount);

      setXP(newTotal);
      xpRef.current = newTotal;

      if (levelUp) {
        // Short delay so XP popup shows first
        setTimeout(() => {
          setShowLevelUp({
            oldLevel: levelUp.oldLevel,
            newLevel: levelUp.newLevel,
            newTitle: levelUp.newTitle,
            rewards: getLevelRewards(levelUp.newLevel),
          });
        }, 600);
      }

      // Insert into DB
      await supabase.from("karma_transactions").insert({
        user_id: user.id,
        amount,
        reason,
      });
    },
    [user?.id],
  );

  // ─── Dismiss level-up ───
  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(null);
  }, []);

  // ─── Remove popup ───
  const removePopup = useCallback((id: string) => {
    setXPPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ─── Compute level info ───
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
