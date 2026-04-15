"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getCurrentSeason, isHoliday } from "@/lib/seasons";
import { springs } from "@/lib/motion-design";

export default function SeasonalBanner() {
  const [dismissed, setDismissed] = useState(true); // start hidden, reveal in useEffect
  const season = useMemo(() => getCurrentSeason(), []);
  const holiday = useMemo(() => isHoliday(), []);

  useEffect(() => {
    if (!holiday) return;
    const key = `cesoir-seasonal-banner-${season.name}`;
    const wasDismissed = localStorage.getItem(key) === "dismissed";
    setDismissed(wasDismissed);
  }, [holiday, season.name]);

  function handleDismiss() {
    const key = `cesoir-seasonal-banner-${season.name}`;
    localStorage.setItem(key, "dismissed");
    setDismissed(true);
  }

  if (!holiday) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={springs.heavy}
          className="relative overflow-hidden rounded-xl mx-4 mt-3 mb-1"
          style={{
            background: `linear-gradient(135deg, ${season.gradient[0]}, ${season.gradient[1]})`,
          }}
        >
          <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3">
            {/* Content */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">{season.emoji}</span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {season.greeting}
                </p>
                <p className="text-white/80 text-xs truncate">
                  Mode special {season.name} active
                </p>
              </div>
            </div>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors tap-target"
              aria-label="Fermer la banniere saisonniere"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            </button>
          </div>

          {/* Decorative background emojis */}
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-end pr-16 opacity-10 text-5xl pointer-events-none select-none"
          >
            {season.emojis.slice(0, 3).map((e, i) => (
              <span key={i} className="mx-1">{e}</span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
