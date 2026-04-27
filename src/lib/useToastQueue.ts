"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type GamifToastType = "level-up" | "badge-unlock";

export interface QueuedToast {
  /** Stable unique id (auto-assigned). */
  id: string;
  /** Toast variant — drives styling + duration defaults. */
  type: GamifToastType;
  /** Headline (e.g. "Niveau 5 atteint !"). */
  title: string;
  /** Optional secondary line (perks list, badge XP). */
  body?: string;
  /** Optional emoji rendered in the icon slot. */
  icon?: string;
  /** Auto-dismiss in ms. Defaults to 4000 (level-up) / 3000 (badge). */
  duration?: number;
  /** Free-form metadata for renderers (e.g. perks array). */
  meta?: unknown;
}

export interface UseToastQueueReturn {
  /** Currently visible toast (FIFO head). */
  current: QueuedToast | null;
  /** Push a toast to the back of the queue. Returns its id. */
  enqueueToast: (toast: Omit<QueuedToast, "id">) => string;
  /** Manually dismiss the current toast and advance the queue. */
  dismiss: () => void;
  /** Total queued (including current). */
  size: number;
}

// ─────────────────────────────────────────
// Module-scoped counter — guarantees unique ids across renders.
// ─────────────────────────────────────────

let counter = 0;
function nextId(): string {
  counter += 1;
  return `gtoast-${counter}-${Date.now()}`;
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

/**
 * Simple FIFO queue for gamification toasts.
 *
 * Designed to be mounted ONCE (in the (app) layout) — multiple consumers
 * would each spin up an isolated queue and lose ordering guarantees.
 *
 * Behaviour:
 *   - `enqueueToast` appends; the head becomes `current`.
 *   - The current toast lives until `dismiss()` is called.
 *   - The renderer is responsible for triggering auto-dismiss via
 *     setTimeout(duration). The hook itself stays UI-agnostic.
 */
export function useToastQueue(): UseToastQueueReturn {
  const [queue, setQueue] = useState<QueuedToast[]>([]);
  // ref mirror — lets enqueueToast read latest length without re-creating
  // the callback on every state change (preserves referential stability).
  const queueRef = useRef<QueuedToast[]>([]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const enqueueToast = useCallback((toast: Omit<QueuedToast, "id">): string => {
    const id = nextId();
    setQueue((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismiss = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return {
    current: queue[0] ?? null,
    enqueueToast,
    dismiss,
    size: queue.length,
  };
}
