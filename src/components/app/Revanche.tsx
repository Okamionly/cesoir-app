"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { MOCK_PROFILES, type Profile } from "@/lib/mock-profiles";
import { MODES } from "@/lib/modes";
import type { ModeKey } from "@/lib/modes";

function getTodayKey(): string {
  const d = new Date();
  return `cesoir-revanche-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function Revanche() {
  const [dismissed, setDismissed] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const key = getTodayKey();
    const seen = localStorage.getItem(key);
    setDismissed(seen === "true");
  }, []);

  // Pick 3 random profiles from the end of the list (simulating "passed" profiles)
  const passedProfiles = useMemo<Profile[]>(() => {
    const pool = MOCK_PROFILES.slice(-15);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  if (dismissed) return null;

  const handleLike = (id: string) => {
    setLiked((prev) => new Set(prev).add(id));
  };

  const handleDismiss = () => {
    localStorage.setItem(getTodayKey(), "true");
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.35 }}
      className="shrink-0 px-4 pb-3"
      role="region"
      aria-label="Revanche - Deuxieme chance"
    >
      <div className="bg-bg-card border border-border rounded-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[14px] font-bold text-text">
              <span aria-hidden="true">🔄</span> Revanche — Deuxieme chance
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              3 profils que tu as passes, dispos ce soir
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[11px] text-text-muted tap-target"
            aria-label="Fermer la section revanche"
          >
            ✕
          </button>
        </div>

        {/* Profile cards */}
        <div className="flex gap-3">
          {passedProfiles.map((profile, i) => {
            const modeInfo = MODES[profile.mode as ModeKey];
            const isLiked = liked.has(profile.id);

            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="flex-1 min-w-0"
              >
                <div className="relative rounded-xl overflow-hidden bg-[#111]">
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                  />
                  {/* Mode badge */}
                  {modeInfo && (
                    <div className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <span className="text-[9px] text-white">{modeInfo.icon}</span>
                    </div>
                  )}
                </div>
                <div className="mt-1.5 px-0.5">
                  <p className="text-[12px] font-bold text-text truncate">
                    {profile.name}, {profile.age}
                  </p>
                  {isLiked ? (
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-[10px] text-accent font-semibold mt-1"
                    >
                      Like envoye !
                    </motion.p>
                  ) : (
                    <button
                      onClick={() => handleLike(profile.id)}
                      className="mt-1 w-full py-1.5 rounded-lg text-[10px] font-bold text-white tap-target active:scale-95 transition-transform"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                      aria-label={`Liker ${profile.name}`}
                    >
                      Liker
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
