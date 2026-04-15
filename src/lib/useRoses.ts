"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface RoseTransaction {
  id: string;
  type: "earn" | "spend" | "refill";
  amount: number;
  reason: string;
  timestamp: string;
}

export interface UseRosesReturn {
  /** Current balance */
  roses: number;
  /** Spend roses — returns true if successful */
  useRose: (amount: number, reason: string) => boolean;
  /** Check if user can afford a cost */
  canAfford: (cost: number) => boolean;
  /** Next free rose refill date */
  nextFreeRose: Date | null;
  /** Add roses (purchase, reward) */
  addRoses: (amount: number, reason: string) => void;
  /** Whether the user has premium */
  isPremium: boolean;
  /** Toggle premium (for demo) */
  togglePremium: () => void;
  /** Transaction history */
  history: RoseTransaction[];
}

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const STORAGE_KEY = "cesoir_roses";
const HISTORY_KEY = "cesoir_roses_history";
const PREMIUM_KEY = "cesoir_premium";
const REFILL_KEY = "cesoir_roses_refill";

const FREE_WEEKLY = 1;
const PREMIUM_WEEKLY = 5;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useRoses(): UseRosesReturn {
  const [roses, setRoses] = useState(3); // start with 3 for demo
  const [isPremium, setIsPremium] = useState(false);
  const [history, setHistory] = useState<RoseTransaction[]>([]);
  const [nextFreeRose, setNextFreeRose] = useState<Date | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setRoses(parseInt(stored, 10));

      const premStored = localStorage.getItem(PREMIUM_KEY);
      if (premStored !== null) setIsPremium(premStored === "true");

      const histStored = localStorage.getItem(HISTORY_KEY);
      if (histStored) setHistory(JSON.parse(histStored));

      // Check refill
      const refillStored = localStorage.getItem(REFILL_KEY);
      const now = Date.now();

      if (!refillStored) {
        // First time — set next refill to 1 week from now
        const next = new Date(now + MS_PER_WEEK);
        localStorage.setItem(REFILL_KEY, next.toISOString());
        setNextFreeRose(next);
      } else {
        const refillDate = new Date(refillStored);
        if (now >= refillDate.getTime()) {
          // Refill due
          const refillAmount = isPremium ? PREMIUM_WEEKLY : FREE_WEEKLY;
          setRoses((prev) => {
            const next = prev + refillAmount;
            localStorage.setItem(STORAGE_KEY, String(next));
            return next;
          });
          const nextRefill = new Date(now + MS_PER_WEEK);
          localStorage.setItem(REFILL_KEY, nextRefill.toISOString());
          setNextFreeRose(nextRefill);

          // Record refill transaction
          const tx: RoseTransaction = {
            id: crypto.randomUUID(),
            type: "refill",
            amount: refillAmount,
            reason: isPremium ? "Recharge hebdomadaire Premium" : "Rose gratuite hebdomadaire",
            timestamp: new Date().toISOString(),
          };
          setHistory((prev) => {
            const updated = [tx, ...prev].slice(0, 50);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
            return updated;
          });
        } else {
          setNextFreeRose(refillDate);
        }
      }
    } catch {
      // localStorage unavailable
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist roses changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(roses));
    } catch {
      // noop
    }
  }, [roses]);

  const canAfford = useCallback(
    (cost: number) => roses >= cost,
    [roses],
  );

  const useRose = useCallback(
    (amount: number, reason: string): boolean => {
      if (roses < amount) return false;
      setRoses((prev) => prev - amount);
      const tx: RoseTransaction = {
        id: crypto.randomUUID(),
        type: "spend",
        amount,
        reason,
        timestamp: new Date().toISOString(),
      };
      setHistory((prev) => {
        const updated = [tx, ...prev].slice(0, 50);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        } catch {
          // noop
        }
        return updated;
      });
      return true;
    },
    [roses],
  );

  const addRoses = useCallback((amount: number, reason: string) => {
    setRoses((prev) => prev + amount);
    const tx: RoseTransaction = {
      id: crypto.randomUUID(),
      type: "earn",
      amount,
      reason,
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => {
      const updated = [tx, ...prev].slice(0, 50);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // noop
      }
      return updated;
    });
  }, []);

  const togglePremium = useCallback(() => {
    setIsPremium((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PREMIUM_KEY, String(next));
      } catch {
        // noop
      }
      return next;
    });
  }, []);

  return useMemo(
    () => ({ roses, useRose, canAfford, nextFreeRose, addRoses, isPremium, togglePremium, history }),
    [roses, useRose, canAfford, nextFreeRose, addRoses, isPremium, togglePremium, history],
  );
}
