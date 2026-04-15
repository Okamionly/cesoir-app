"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/lib/haptics";

type SuggestedMode =
  | "solo-diner"
  | "night-owl"
  | "plus-one"
  | "culture-club"
  | "foodie-quest"
  | "gamer-night";

interface OneTapConfig {
  mode: SuggestedMode;
  modeName: string;
  location: string;
  windowStart: string;
  windowEnd: string;
}

function detectBestMode(): OneTapConfig {
  const hour = new Date().getHours();
  if (hour < 17) {
    return {
      mode: "culture-club",
      modeName: "Culture Club",
      location: "Position actuelle",
      windowStart: "18:00",
      windowEnd: "00:00",
    };
  }
  if (hour < 20) {
    return {
      mode: "solo-diner",
      modeName: "Solo Diner",
      location: "Position actuelle",
      windowStart: "Maintenant",
      windowEnd: "00:00",
    };
  }
  if (hour < 23) {
    return {
      mode: "night-owl",
      modeName: "Night Owl",
      location: "Position actuelle",
      windowStart: "Maintenant",
      windowEnd: "02:00",
    };
  }
  return {
    mode: "night-owl",
    modeName: "Night Owl",
    location: "Position actuelle",
    windowStart: "Maintenant",
    windowEnd: "04:00",
  };
}

const MODE_ICONS: Record<SuggestedMode, string> = {
  "solo-diner": "🍽️",
  "night-owl": "🦉",
  "plus-one": "🎬",
  "culture-club": "🎨",
  "foodie-quest": "🍜",
  "gamer-night": "🎮",
};

export default function OneTapTonight() {
  const [expanded, setExpanded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [config, setConfig] = useState<OneTapConfig | null>(null);
  const [nearbyCount] = useState(() => Math.floor(Math.random() * 30) + 10);

  useEffect(() => {
    setConfig(detectBestMode());
  }, []);

  const handleTap = useCallback(() => {
    haptics.heavy();
    setExpanded(true);
  }, []);

  const handleConfirm = useCallback(() => {
    haptics.match();
    setConfirmed(true);
    // Save to localStorage
    if (typeof window !== "undefined" && config) {
      localStorage.setItem(
        "cesoir_tonight",
        JSON.stringify({ ...config, timestamp: Date.now() }),
      );
    }
  }, [config]);

  const handleClose = useCallback(() => {
    setExpanded(false);
    setConfirmed(false);
  }, []);

  // Confirmed state
  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full rounded-3xl p-6 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(0,255,136,0.1))",
          border: "1px solid rgba(139,92,246,0.15)",
        }}
        role="status"
        aria-label="Tu es dispo ce soir"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-3 text-4xl"
        >
          {config ? MODE_ICONS[config.mode] : "🌙"}
        </motion.div>
        <p className="mb-1 text-base font-semibold" style={{ color: "#111111" }}>
          C&apos;est parti !
        </p>
        <p className="mb-3 text-sm" style={{ color: "#8B5CF6" }}>
          Mode {config?.modeName} active
        </p>
        <p className="text-xs" style={{ color: "#666666" }}>
          {nearbyCount} personnes cherchent aussi ce soir pres de toi
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="mt-4 text-xs"
          style={{ color: "#999999" }}
        >
          Modifier
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!expanded ? (
          /* Collapsed: big gradient button */
          <motion.button
            key="collapsed"
            type="button"
            onClick={handleTap}
            className="relative w-full overflow-hidden rounded-3xl py-5 text-center font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
              fontSize: "1.1rem",
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            whileTap={{ scale: 0.97 }}
            aria-label="Dispo ce soir - appuie pour configurer"
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                filter: "blur(20px)",
                opacity: 0.4,
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              aria-hidden="true"
            />
            <span className="relative z-10">Dispo ce soir</span>
          </motion.button>
        ) : (
          /* Expanded: config panel */
          <motion.div
            key="expanded"
            initial={{ scale: 0.95, opacity: 0, height: 0 }}
            animate={{ scale: 1, opacity: 1, height: "auto" }}
            exit={{ scale: 0.95, opacity: 0, height: 0 }}
            className="w-full overflow-hidden rounded-3xl"
            style={{
              background: "linear-gradient(180deg, rgba(139,92,246,0.08), rgba(0,255,136,0.05))",
              border: "1px solid rgba(139,92,246,0.15)",
            }}
          >
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-base font-semibold" style={{ color: "#111111" }}>
                  Ce soir, on y va !
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs"
                  style={{ color: "#999999" }}
                  aria-label="Fermer"
                >
                  Annuler
                </button>
              </div>

              {config && (
                <div className="space-y-3">
                  {/* Auto-detected mode */}
                  <div
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {MODE_ICONS[config.mode]}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#111111" }}>
                        Mode recommande
                      </p>
                      <p className="text-xs" style={{ color: "#8B5CF6" }}>
                        {config.modeName}
                      </p>
                    </div>
                    <span
                      className="ml-auto rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}
                    >
                      Auto
                    </span>
                  </div>

                  {/* Location */}
                  <div
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#111111" }}>
                        Position
                      </p>
                      <p className="text-xs" style={{ color: "#666666" }}>
                        {config.location}
                      </p>
                    </div>
                    <span
                      className="ml-auto rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                    >
                      GPS
                    </span>
                  </div>

                  {/* Time window */}
                  <div
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#111111" }}>
                        Creneau
                      </p>
                      <p className="text-xs" style={{ color: "#666666" }}>
                        {config.windowStart} → {config.windowEnd}
                      </p>
                    </div>
                  </div>

                  {/* Nearby count */}
                  <p className="text-center text-xs" style={{ color: "#8B5CF6" }}>
                    {nearbyCount} personnes cherchent aussi ce soir pres de toi
                  </p>

                  {/* Confirm button */}
                  <motion.button
                    type="button"
                    onClick={handleConfirm}
                    className="w-full rounded-2xl py-4 text-base font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    C&apos;est parti !
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
