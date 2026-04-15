"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOfflineQueue } from "@/lib/offline-queue";
import { springs } from "@/lib/motion-design";

function useTimeSinceOffline(isOnline: boolean): string | null {
  const [offlineSince, setOfflineSince] = useState<number | null>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!isOnline && offlineSince === null) {
      setOfflineSince(Date.now());
    }
    if (isOnline) {
      setOfflineSince(null);
      setLabel(null);
    }
  }, [isOnline, offlineSince]);

  useEffect(() => {
    if (offlineSince === null) return;

    function update() {
      const diffSec = Math.floor((Date.now() - offlineSince!) / 1000);
      if (diffSec < 60) {
        setLabel(`${diffSec}s`);
      } else {
        setLabel(`${Math.floor(diffSec / 60)} min`);
      }
    }

    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [offlineSince]);

  return label;
}

export default function OfflineBanner() {
  const { isOnline, pending } = useOfflineQueue();
  const elapsed = useTimeSinceOffline(isOnline);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0, transition: springs.snap }}
          transition={springs.heavy}
          className="fixed top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
          style={{ backgroundColor: "#fbbf24", color: "#111111" }}
          role="alert"
          aria-live="polite"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>

          <span>
            Pas de connexion
            {pending > 0
              ? ` — ${pending} action${pending > 1 ? "s" : ""} en attente`
              : " — tes actions seront synchronisees"}
          </span>

          {elapsed && (
            <span className="opacity-70 text-xs ml-1">
              (Derniere sync: il y a {elapsed})
            </span>
          )}

          <button
            onClick={() => window.location.reload()}
            className="ml-3 px-3 py-1 rounded-full text-xs font-semibold bg-[#111111] text-[#fbbf24] hover:opacity-80 transition-opacity"
          >
            Reessayer
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
