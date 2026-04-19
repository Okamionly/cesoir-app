"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { app } from "@/lib/design-tokens";

const NOTIFICATIONS = [
  "47 personnes sont dispos pres de toi ce soir",
  "Night Owl explose ce soir (+200%)",
  "Sarah est a 3 min de toi",
  "Rappel : confirme ta dispo pour ce soir",
  "Tu as un nouveau match !",
];

const ICONS = ["🔔", "🔥", "📍", "⏰", "🎉"];

export default function NotificationPreview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % NOTIFICATIONS.length);
      setVisible(true);
    }, 400);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(advance, 5000);
    return () => clearInterval(interval);
  }, [advance, dismissed]);

  if (dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={currentIndex}
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
                  <span className="mr-1.5" aria-hidden="true">{ICONS[currentIndex]}</span>
                  {NOTIFICATIONS[currentIndex]}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
