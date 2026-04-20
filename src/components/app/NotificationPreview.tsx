"use client";

/**
 * NotificationPreview — floating top banner on /browse that rotates through
 * *real* live stats pulled from Supabase (online users, open flash plans,
 * trending mode of the last hour).
 *
 * If none of the signals have real data yet, the component renders nothing:
 * we never fabricate counts, distances, or names.
 */

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "motion/react";
import { app } from "@/lib/design-tokens";
import { useLiveNotifications } from "@/lib/useLiveNotifications";

export default function NotificationPreview() {
  const { notifications } = useLiveNotifications();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        if (notifications.length === 0) return 0;
        return (prev + 1) % notifications.length;
      });
      setVisible(true);
    }, 400);
  }, [notifications.length]);

  useEffect(() => {
    if (dismissed || notifications.length <= 1) return;
    const interval = setInterval(advance, 5000);
    return () => clearInterval(interval);
  }, [advance, dismissed, notifications.length]);

  if (dismissed) return null;
  if (notifications.length === 0) return null;

  // Clamp at render time so we never point past the current array.
  const safeIndex = currentIndex % notifications.length;
  const current = notifications[safeIndex];
  if (!current) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="wait">
        {visible && (
          <m.div
            key={current.id}
            className="pointer-events-auto bg-bg border border-border rounded-xl shadow-lg overflow-hidden"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex items-center gap-3 pr-3">
              {/* Gradient left border */}
              <div
                className="w-1 self-stretch shrink-0"
                style={{ background: `linear-gradient(180deg, ${app.violet}, ${app.vert})` }}
              />
              <div className="flex-1 py-3">
                <p className="text-[12px] text-text font-medium">
                  <span className="mr-1.5" aria-hidden="true">{current.icon}</span>
                  {current.message}
                </p>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="shrink-0 w-7 h-7 flex items-center justify-center text-text-muted tap-target"
                aria-label="Fermer les notifications"
              >
                <span className="text-[14px]">&times;</span>
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
