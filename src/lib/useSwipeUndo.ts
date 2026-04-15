"use client";

import { useState, useCallback, useEffect } from "react";
import type { Profile } from "./mock-profiles";

// ─── Types ───────────────────────────────────────

interface SwipeUndoState {
  /** Last 3 swiped profiles (most recent first) */
  undoStack: Profile[];
  /** Whether undo is available right now */
  canUndo: boolean;
  /** Number of free undos remaining today (resets at midnight) */
  freeUndosLeft: number;
  /** Whether the user has premium (unlimited undos) */
  isPremium: boolean;
}

interface SwipeUndoActions {
  /** Push a swiped profile onto the undo stack */
  pushSwipe: (profile: Profile) => void;
  /** Undo the last swipe, returning the profile */
  undo: () => Profile | null;
}

type UseSwipeUndoReturn = SwipeUndoState & SwipeUndoActions;

// ─── Constants ───────────────────────────────────

const MAX_STACK = 3;
const FREE_UNDOS_PER_DAY = 1;
const STORAGE_KEY = "cesoir-swipe-undos";

// ─── Helpers ─────────────────────────────────────

interface StoredUndoData {
  date: string;
  usedCount: number;
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function loadUsedCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data: StoredUndoData = JSON.parse(raw);
    if (data.date !== getTodayKey()) return 0; // New day, reset
    return data.usedCount;
  } catch {
    return 0;
  }
}

function saveUsedCount(count: number): void {
  if (typeof window === "undefined") return;
  const data: StoredUndoData = { date: getTodayKey(), usedCount: count };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Hook ────────────────────────────────────────

export function useSwipeUndo(isPremium = false): UseSwipeUndoReturn {
  const [stack, setStack] = useState<Profile[]>([]);
  const [usedCount, setUsedCount] = useState(0);

  // Load persisted undo count on mount
  useEffect(() => {
    setUsedCount(loadUsedCount());
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
      const newCount = usedCount + 1;
      setUsedCount(newCount);
      saveUsedCount(newCount);
    }

    return top;
  }, [stack, isPremium, freeUndosLeft, usedCount]);

  return {
    undoStack: stack,
    canUndo,
    freeUndosLeft,
    isPremium,
    pushSwipe,
    undo,
  };
}
