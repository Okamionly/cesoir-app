"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Achievement } from "@/lib/achievements";

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-6 left-4 right-4 z-[100] pointer-events-auto"
        >
          <button
            onClick={onDismiss}
            className="w-full flex items-center gap-4 bg-bg-card border border-accent/20 rounded-2xl px-5 py-4 shadow-glow"
            aria-label="Fermer la notification"
          >
            {/* Gold badge circle */}
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.15 }}
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                boxShadow: "0 0 20px rgba(245,158,11,0.4)",
              }}
            >
              <span className="text-[24px]" aria-hidden="true">{achievement.icon}</span>
            </motion.div>

            {/* Text */}
            <div className="flex-1 text-left">
              <p className="text-[10px] text-accent uppercase tracking-[0.15em] font-bold">
                Achievement debloque !
              </p>
              <p className="text-[15px] font-black text-text mt-0.5">{achievement.label}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{achievement.description}</p>
            </div>

            {/* Close hint */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-text-muted shrink-0"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
