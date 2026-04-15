"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";

// ─── Types ───────────────────────────────────────

type SnoozeDuration = "24h" | "3d" | "1w" | "forever";

interface SnoozeState {
  active: boolean;
  duration: SnoozeDuration;
  startedAt: number;
  endsAt: number | null; // null = "jusqu'a nouvel ordre"
}

// ─── Durations ───────────────────────────────────

const DURATIONS: { key: SnoozeDuration; label: string; emoji: string; ms: number | null }[] = [
  { key: "24h", label: "24 heures", emoji: "\u23F0", ms: 24 * 60 * 60 * 1000 },
  { key: "3d", label: "3 jours", emoji: "\uD83D\uDCC5", ms: 3 * 24 * 60 * 60 * 1000 },
  { key: "1w", label: "1 semaine", emoji: "\uD83D\uDDD3\uFE0F", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "forever", label: "Jusqu'a nouvel ordre", emoji: "\uD83D\uDCA4", ms: null },
];

const STORAGE_KEY = "cesoir-snooze";

// ─── Helpers ─────────────────────────────────────

function loadSnooze(): SnoozeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as SnoozeState;
    // Check if expired
    if (state.endsAt && Date.now() > state.endsAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function saveSnooze(state: SnoozeState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Termine !";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}j ${hours % 24}h`;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// ─── Breathing ring keyframes ────────────────────

const breatheKeyframes = `
@keyframes snooze-breathe {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.08); opacity: 0.6; }
}
`;

// ─── Component ───────────────────────────────────

export default function SnoozeMode() {
  const [snooze, setSnooze] = useState<SnoozeState | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<SnoozeDuration | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load on mount
  useEffect(() => {
    setSnooze(loadSnooze());
  }, []);

  // Countdown ticker
  useEffect(() => {
    if (!snooze?.active || !snooze.endsAt) return;
    const tick = () => {
      const left = snooze.endsAt! - Date.now();
      if (left <= 0) {
        localStorage.removeItem(STORAGE_KEY);
        setSnooze(null);
        return;
      }
      setRemaining(left);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [snooze]);

  const activate = useCallback(() => {
    if (!selectedDuration) return;
    const dur = DURATIONS.find((d) => d.key === selectedDuration)!;
    const now = Date.now();
    const state: SnoozeState = {
      active: true,
      duration: selectedDuration,
      startedAt: now,
      endsAt: dur.ms ? now + dur.ms : null,
    };
    saveSnooze(state);
    setSnooze(state);
    setShowConfirm(false);
    setSelectedDuration(null);
  }, [selectedDuration]);

  const deactivate = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSnooze(null);
  }, []);

  // Compute progress for ring
  const progress = snooze?.active && snooze.endsAt
    ? 1 - remaining / (snooze.endsAt - snooze.startedAt)
    : 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: breatheKeyframes }} />

      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.heavy}
          className="text-center"
        >
          <motion.div
            animate={snooze?.active ? { y: [0, -5, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-4xl mb-2"
          >
            {snooze?.active ? "\uD83C\uDF19" : "\u23F8\uFE0F"}
          </motion.div>
          <h2 className="text-lg font-bold text-text">
            {snooze?.active ? "Profil en pause" : "Mettre en pause"}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {snooze?.active
              ? "Ton profil est invisible mais tes matchs et chats sont preserves"
              : "Fais une pause, tes matchs t'attendront"}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {snooze?.active ? (
            /* ─── Active snooze view ─── */
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springs.elastic}
              className="space-y-5"
            >
              {/* Countdown ring */}
              <div className="flex items-center justify-center">
                <div className="relative w-44 h-44">
                  {/* Background breathing ring */}
                  <div
                    className="absolute inset-0 rounded-full border-4 border-accent/20"
                    style={{ animation: "snooze-breathe 4s ease-in-out infinite" }}
                  />

                  {/* Progress ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      stroke="var(--color-border)"
                      strokeWidth="3"
                      fill="none"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="44"
                      stroke="#8B5CF6"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 44}
                      initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - progress) }}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>

                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {snooze.endsAt ? (
                      <>
                        <motion.p
                          key={remaining}
                          className="text-2xl font-mono font-bold text-text"
                        >
                          {formatCountdown(remaining)}
                        </motion.p>
                        <p className="text-xs text-text-muted mt-1">avant reactivation</p>
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="text-2xl"
                        >
                          {"\uD83D\uDCA4"}
                        </motion.div>
                        <p className="text-xs text-text-muted mt-2">Pause indefinie</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status chips */}
              <div className="flex justify-center gap-3">
                {[
                  { icon: "\u2705", label: "Matchs preserves" },
                  { icon: "\u2705", label: "Chats actifs" },
                  { icon: "\uD83D\uDEAB", label: "Profil invisible" },
                ].map((chip, i) => (
                  <motion.div
                    key={chip.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.snap, delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-card border border-border"
                  >
                    <span className="text-xs">{chip.icon}</span>
                    <span className="text-[10px] font-medium text-text-muted">{chip.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Deactivate button */}
              <motion.button
                onClick={deactivate}
                whileTap={micro.tapScale}
                className="w-full py-3.5 rounded-xl bg-[#00FF88] text-black font-bold text-sm"
              >
                Pret a ressortir ?
              </motion.button>
            </motion.div>
          ) : (
            /* ─── Duration selector ─── */
            <motion.div
              key="selector"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springs.heavy}
              className="space-y-4"
            >
              <div className="space-y-2">
                {DURATIONS.map((dur, i) => {
                  const isSelected = selectedDuration === dur.key;
                  return (
                    <motion.button
                      key={dur.key}
                      onClick={() => setSelectedDuration(dur.key)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springs.heavy, delay: i * 0.06 }}
                      whileTap={micro.tapScale}
                      className={`
                        w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left
                        ${isSelected
                          ? "border-accent bg-accent/5"
                          : "border-border bg-bg-card"
                        }
                      `}
                    >
                      <span className="text-xl">{dur.emoji}</span>
                      <span className="text-sm font-medium text-text flex-1">{dur.label}</span>
                      <div
                        className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                          ${isSelected ? "border-accent bg-accent" : "border-border"}
                        `}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={springs.elastic}
                            className="w-2 h-2 rounded-full bg-white"
                          />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                onClick={() => selectedDuration && setShowConfirm(true)}
                whileTap={micro.tapScale}
                className={`
                  w-full py-3.5 rounded-xl font-semibold text-sm transition-all
                  ${selectedDuration
                    ? "bg-accent text-white"
                    : "bg-border text-text-muted cursor-not-allowed"
                  }
                `}
              >
                Mettre en pause
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation modal */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
            >
              <motion.div
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 30 }}
                transition={springs.elastic}
                className="w-full max-w-sm p-6 rounded-3xl bg-bg border border-border space-y-4"
              >
                <div className="text-center">
                  <span className="text-3xl">{"\u23F8\uFE0F"}</span>
                  <h3 className="text-base font-bold text-text mt-2">
                    Confirmer la pause ?
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    Ton profil sera invisible pendant{" "}
                    {DURATIONS.find((d) => d.key === selectedDuration)?.label.toLowerCase()}.
                    Tes matchs et conversations seront preserves.
                  </p>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowConfirm(false)}
                    whileTap={micro.tapScale}
                    className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-text-muted"
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    onClick={activate}
                    whileTap={micro.tapScale}
                    className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-bold"
                  >
                    Confirmer
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
