"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/** Action queued while offline */
export interface QueuedAction {
  id: string;
  type: "like" | "pass" | "message" | "report";
  payload: Record<string, unknown>;
  timestamp: number;
}

const STORAGE_KEY = "cesoir_offline_queue";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadQueue(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedAction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable
  }
}

async function processAction(action: QueuedAction): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  console.log(`[OfflineQueue] Synced action: ${action.type}`, action.payload);
  return true;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    setQueue(loadQueue());
    setIsOnline(navigator.onLine);
  }, []);

  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return;
    const currentQueue = loadQueue();
    if (currentQueue.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    const remaining: QueuedAction[] = [];
    for (const action of currentQueue) {
      try {
        const ok = await processAction(action);
        if (!ok) remaining.push(action);
      } catch {
        remaining.push(action);
      }
    }

    saveQueue(remaining);
    setQueue(remaining);
    syncingRef.current = false;
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) syncQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncQueue]);

  const enqueue = useCallback(
    (type: QueuedAction["type"], payload: Record<string, unknown>) => {
      const action: QueuedAction = {
        id: generateId(),
        type,
        payload,
        timestamp: Date.now(),
      };
      const updated = [...loadQueue(), action];
      saveQueue(updated);
      setQueue(updated);
      if (navigator.onLine) syncQueue();
    },
    [syncQueue],
  );

  const clearQueue = useCallback(() => {
    saveQueue([]);
    setQueue([]);
  }, []);

  return {
    enqueue,
    pending: queue.length,
    queue,
    isOnline,
    isSyncing,
    syncQueue,
    clearQueue,
  };
}
