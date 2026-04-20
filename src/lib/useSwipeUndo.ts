"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import type { Profile } from "./mock-profiles";
import { MONETIZATION_ENABLED } from "./featureFlags";

// ─── Types ───────────────────────────────────────

interface SwipeUndoState {
  /** Last 3 swiped profiles (most recent first) */
  undoStack: Profile[];
  /** Whether undo is available right now */
  canUndo: boolean;
  /** Number of free undos remaining today (resets at midnight UTC) */
  freeUndosLeft: number;
  /** Whether the user has premium (unlimited undos) */
  isPremium: boolean;
}

interface SwipeUndoActions {
  /** Push a swiped profile onto the undo stack (in-memory only) */
  pushSwipe: (profile: Profile) => void;
  /** Undo the last swipe — returns the profile immediately (optimistic),
   *  fires server delete + undo record asynchronously. */
  undo: () => Profile | null;
}

type UseSwipeUndoReturn = SwipeUndoState & SwipeUndoActions;

// ─── Constants ───────────────────────────────────

const MAX_STACK = 3;
const FREE_UNDOS_PER_DAY = 1;

// ─── Server helpers ──────────────────────────────

async function fetchTodayUndoCount(): Promise<number> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return 0;

    const res = await fetch("/api/undos", {
      method: "GET",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as { count: number };
    return data.count;
  } catch {
    return 0;
  }
}

async function recordUndo(
  targetId: string,
  originalAction: "like" | "pass" | "superlike",
): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return false;

    const res = await fetch("/api/undos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ targetId, originalAction }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Hook ────────────────────────────────────────

/**
 * useSwipeUndo — undo stack for swipe gestures.
 *
 * Audit 2026-04-19: moved the daily-cap counter + undo trail from
 * localStorage to the `swipe_undos` table via /api/undos. Clearing
 * localStorage no longer grants unlimited undos.
 *
 * The `undo()` API stays synchronous (returns Profile immediately) to
 * keep the existing optimistic UI in browse/page.tsx. The DB roundtrip
 * (delete interaction + insert undo row) fires in the background.
 *
 * Free-first launch (Wave 13): the `isPremium` prop is still accepted for
 * forward-compat, but when `MONETIZATION_ENABLED` is false we coerce it to
 * true so every user gets unlimited undos. Flip the flag later to restore
 * daily caps.
 */
export function useSwipeUndo(isPremiumProp = false): UseSwipeUndoReturn {
  // Free-first: treat everyone as premium while monetization is off.
  const isPremium = !MONETIZATION_ENABLED || isPremiumProp;
  const [stack, setStack] = useState<
    Array<Profile & { __action?: "like" | "pass" | "superlike" }>
  >([]);
  const [usedCount, setUsedCount] = useState(0);
  const hydrated = useRef(false);

  // Hydrate today's count from server
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const count = await fetchTodayUndoCount();
      if (cancelled) return;
      setUsedCount(count);
      hydrated.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const freeUndosLeft = Math.max(0, FREE_UNDOS_PER_DAY - usedCount);
  const canUndo = stack.length > 0 && (isPremium || freeUndosLeft > 0);

  const pushSwipe = useCallback((profile: Profile) => {
    setStack((prev) => {
      const next = [profile, ...prev];
      return next.slice(0, MAX_STACK);
    });
  }, []);

  const undo = useCallback((): Profile | null => {
    if (stack.length === 0) return null;
    if (!isPremium && freeUndosLeft <= 0) return null;

    const [top, ...rest] = stack;
    setStack(rest);

    if (!isPremium) {
      setUsedCount((c) => c + 1);
    }

    // Fire-and-forget server sync. Default action to "like" since the
    // existing callers don't track it here — API still delete+records.
    // When callers pass action via pushSwipe it's picked up.
    const action = top.__action ?? "like";
    void recordUndo(top.id, action);

    return top;
  }, [stack, isPremium, freeUndosLeft]);

  // Strip the internal __action before exposing to consumers
  const undoStack: Profile[] = stack.map((p) => {
    const { __action, ...rest } = p;
    void __action;
    return rest;
  });

  return {
    undoStack,
    canUndo,
    freeUndosLeft,
    isPremium,
    pushSwipe,
    undo,
  };
}
