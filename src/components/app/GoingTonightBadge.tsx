"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface GoingTonightBadgeProps {
  eventName: string;
  eventTime?: string;
  eventVenue?: string;
  eventDescription?: string;
  /** Adds +15 score bonus visually */
  matchBonus?: boolean;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function GoingTonightBadge({
  eventName,
  eventTime,
  eventVenue,
  eventDescription,
  matchBonus = false,
}: GoingTonightBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      {/* Badge */}
      <motion.button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDetails(true);
        }}
        initial={{ opacity: 0, scale: 0.8, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springs.elastic}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 backdrop-blur-sm"
        aria-label={`Va a ${eventName} ce soir — appuyer pour les details`}
      >
        {/* Calendar icon */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>

        <span className="text-[10px] font-semibold text-amber-400 leading-tight truncate max-w-[140px]">
          Va a {eventName} ce soir
        </span>

        {matchBonus && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...springs.elastic, delay: 0.3 }}
            className="text-[9px] font-bold text-[#00FF88] ml-0.5"
          >
            +15
          </motion.span>
        )}
      </motion.button>

      {/* Event details overlay */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Sheet */}
            <motion.div
              className="relative w-full max-w-md bg-card border-t border-border rounded-t-3xl p-6 pb-10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={springs.heavy}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

              {/* Event icon */}
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <circle cx="12" cy="16" r="2" fill="#F59E0B" />
                </svg>
              </div>

              <h3 className="text-lg font-display font-bold text-text text-center">
                {eventName}
              </h3>

              {eventTime && (
                <p className="text-sm text-amber-400 font-medium text-center mt-1">
                  {eventTime}
                </p>
              )}

              {eventVenue && (
                <p className="text-xs text-text-muted text-center mt-1">
                  {eventVenue}
                </p>
              )}

              {eventDescription && (
                <p className="text-sm text-text-muted text-center mt-3 leading-relaxed">
                  {eventDescription}
                </p>
              )}

              {matchBonus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 px-4 py-2.5 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 text-center"
                >
                  <span className="text-xs font-semibold text-[#00FF88]">
                    +15 bonus de compatibilite
                  </span>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Vous allez au meme event ce soir !
                  </p>
                </motion.div>
              )}

              <motion.button
                onClick={() => setShowDetails(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full mt-5 py-3 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold"
              >
                Fermer
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
