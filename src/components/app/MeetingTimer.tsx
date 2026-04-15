"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/lib/haptics";

type TimerColor = "#22c55e" | "#fbbf24" | "#ef4444";

function getTimerColor(elapsedMs: number): TimerColor {
  const hours = elapsedMs / (60 * 60 * 1000);
  if (hours < 1) return "#22c55e";
  if (hours < 2) return "#fbbf24";
  return "#ef4444";
}

function formatElapsed(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export default function MeetingTimer() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    haptics.medium();
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    setRunning(true);
    setHidden(false);
  }, []);

  const stop = useCallback(() => {
    haptics.light();
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const color = getTimerColor(elapsedMs);

  if (hidden) {
    return (
      <motion.button
        type="button"
        onClick={() => {
          haptics.light();
          setHidden(false);
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-24 left-4 z-30 h-3 w-3 rounded-full"
        style={{ backgroundColor: running ? color : "#999999" }}
        aria-label="Afficher le chrono"
      />
    );
  }

  // Not started yet
  if (!running && elapsedMs === 0) {
    return (
      <motion.button
        type="button"
        onClick={start}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 left-4 z-30 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-md"
        style={{ backgroundColor: "#FFFFFF", color: "#111111", border: "1px solid rgba(0,0,0,0.08)" }}
        aria-label="Demarrer le chrono de rendez-vous"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Chrono
      </motion.button>
    );
  }

  return (
    <>
      {/* Compact timer */}
      <motion.button
        type="button"
        onClick={() => {
          haptics.light();
          setExpanded(!expanded);
        }}
        className="fixed bottom-24 left-4 z-30 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-md"
        style={{ backgroundColor: "#FFFFFF", color, border: `1.5px solid ${color}` }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Duree du rendez-vous : ${formatElapsed(elapsedMs)}`}
        aria-expanded={expanded}
      >
        <motion.span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={running ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity }}
          aria-hidden="true"
        />
        {formatElapsed(elapsedMs)}
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-36 left-4 z-30 w-56 rounded-2xl p-3 shadow-xl"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <p className="mb-2 text-xs font-medium" style={{ color: "#111111" }}>
              Duree : {formatElapsed(elapsedMs)}
            </p>

            <div className="space-y-2">
              {running ? (
                <button
                  type="button"
                  onClick={stop}
                  className="w-full rounded-xl py-2 text-xs font-medium"
                  style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                >
                  Arreter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  className="w-full rounded-xl py-2 text-xs font-medium text-white"
                  style={{ backgroundColor: "#22c55e" }}
                >
                  Redemarrer
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  setHidden(true);
                  setExpanded(false);
                }}
                className="w-full rounded-xl py-2 text-xs font-medium"
                style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#666666" }}
              >
                Masquer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
