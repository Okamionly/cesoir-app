"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "./supabase";

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
  /** Spend roses — optimistic, returns true if balance allows */
  useRose: (amount: number, reason: string) => boolean;
  /** Check if user can afford a cost */
  canAfford: (cost: number) => boolean;
  /** Next free rose refill date (legacy — kept for shop UI, not DB-backed yet) */
  nextFreeRose: Date | null;
  /** Add roses (purchase, reward) */
  addRoses: (amount: number, reason: string) => void;
  /** Whether the user has premium */
  isPremium: boolean;
  /** Toggle premium (for demo) */
  togglePremium: () => void;
  /** Transaction history (session-local, not persisted in DB yet) */
  history: RoseTransaction[];
}

// ─────────────────────────────────────────
// Constants (audit 2026-04-19: moved balance/premium to DB)
// ─────────────────────────────────────────

const HISTORY_KEY = "cesoir_roses_history"; // session log only
const REFILL_KEY = "cesoir_roses_refill";   // UI countdown, DB-side refill is TODO

const FREE_WEEKLY = 1;
const PREMIUM_WEEKLY = 5;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────
// Server helpers
// ─────────────────────────────────────────

async function fetchBalance(): Promise<number | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const res = await fetch("/api/wallet/roses", {
      method: "GET",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { balance: number };
    return data.balance;
  } catch {
    return null;
  }
}

async function mutateBalance(
  action: "spend" | "earn",
  amount: number,
): Promise<{ ok: true; balance: number } | { ok: false; error: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { ok: false, error: "no_session" };

    const res = await fetch("/api/wallet/roses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, amount }),
    });
    if (res.ok) {
      const data = (await res.json()) as { balance: number };
      return { ok: true, balance: data.balance };
    }
    const err = (await res.json().catch(() => ({ error: "unknown" }))) as {
      error: string;
    };
    return { ok: false, error: err.error };
  } catch {
    return { ok: false, error: "network" };
  }
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useRoses(): UseRosesReturn {
  const [roses, setRoses] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [history, setHistory] = useState<RoseTransaction[]>([]);
  const [nextFreeRose, setNextFreeRose] = useState<Date | null>(null);
  const hydrated = useRef(false);

  // Hydrate from server on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const serverBalance = await fetchBalance();
      if (cancelled) return;
      if (serverBalance !== null) {
        setRoses(serverBalance);
      }
      hydrated.current = true;

      // Restore session-local bits
      try {
        const histStored = localStorage.getItem(HISTORY_KEY);
        if (histStored) setHistory(JSON.parse(histStored));

        // Weekly refill UI timer (not yet server-side — left as display hint)
        const refillStored = localStorage.getItem(REFILL_KEY);
        if (!refillStored) {
          const next = new Date(Date.now() + MS_PER_WEEK);
          localStorage.setItem(REFILL_KEY, next.toISOString());
          setNextFreeRose(next);
        } else {
          setNextFreeRose(new Date(refillStored));
        }
      } catch {
        // noop
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canAfford = useCallback(
    (cost: number) => roses >= cost,
    [roses],
  );

  const useRose = useCallback(
    (amount: number, reason: string): boolean => {
      if (roses < amount) return false;

      // Optimistic update (UI stays snappy); rollback on server error.
      const previous = roses;
      setRoses((p) => p - amount);

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

      void (async () => {
        const result = await mutateBalance("spend", amount);
        if (!result.ok) {
          // Rollback on server failure
          setRoses(previous);
        } else {
          // Sync to server-confirmed balance (defends against drift)
          setRoses(result.balance);
        }
      })();

      return true;
    },
    [roses],
  );

  const addRoses = useCallback((amount: number, reason: string) => {
    setRoses((p) => p + amount); // optimistic
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

    void (async () => {
      const result = await mutateBalance("earn", amount);
      if (result.ok) setRoses(result.balance);
    })();
  }, []);

  /**
   * togglePremium is kept for demo/UI compat (shop toggle). Real premium
   * state is owned by the `subscriptions` table (see useSubscription).
   * This local toggle does NOT hit DB — intentional: source of truth is
   * Stripe webhook, not client.
   */
  const togglePremium = useCallback(() => {
    setIsPremium((prev) => !prev);
  }, []);

  return useMemo(
    () => ({ roses, useRose, canAfford, nextFreeRose, addRoses, isPremium, togglePremium, history }),
    [roses, useRose, canAfford, nextFreeRose, addRoses, isPremium, togglePremium, history],
  );
}

// Keep constants referenced to silence unused warnings (future server-side refill).
void FREE_WEEKLY;
void PREMIUM_WEEKLY;
