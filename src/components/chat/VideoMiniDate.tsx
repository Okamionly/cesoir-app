"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface VideoMiniDateProps {
  onEnd?: () => void;
  onContinue?: () => void;
  selfName?: string;
  otherName?: string;
}

const TOTAL_SECONDS = 90;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function VideoMiniDate({
  onEnd,
  onContinue,
  selfName = "Toi",
  otherName = "Match",
}: VideoMiniDateProps) {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!active || showPrompt) return;
    if (seconds <= 0) {
      setShowPrompt(true);
      return;
    }
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [active, seconds, showPrompt]);

  const handleStart = useCallback(() => {
    setActive(true);
    setSeconds(TOTAL_SECONDS);
    setShowPrompt(false);
    setMuted(false);
    setCameraOff(false);
  }, []);

  const handleEnd = useCallback(() => {
    setActive(false);
    setShowPrompt(false);
    onEnd?.();
  }, [onEnd]);

  const handleContinue = useCallback(() => {
    setShowPrompt(false);
    setSeconds(TOTAL_SECONDS);
    onContinue?.();
  }, [onContinue]);

  const progress = seconds / TOTAL_SECONDS;

  if (!active) {
    return (
      <motion.button
        onClick={handleStart}
        className="flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-white text-[14px]"
        style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Lancer un appel video de 90 secondes"
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
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        Appel Video 90s
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "#0A0A0A" }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        role="dialog"
        aria-label="Appel video en cours"
        aria-live="polite"
      >
        {/* Timer bar */}
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-white font-bold text-[20px]"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
              aria-live="assertive"
              aria-label={`Temps restant: ${formatTime(seconds)}`}
            >
              {formatTime(seconds)}
            </span>
            <span className="text-[13px]" style={{ color: "#8B5CF6" }}>
              Mini-Date
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "#222" }}
            role="progressbar"
            aria-valuenow={seconds}
            aria-valuemin={0}
            aria-valuemax={TOTAL_SECONDS}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  progress > 0.3
                    ? "linear-gradient(90deg, #8B5CF6, #00FF88)"
                    : progress > 0.1
                      ? "linear-gradient(90deg, #F59E0B, #EF4444)"
                      : "#EF4444",
              }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Video area */}
        <div className="flex-1 flex items-center justify-center gap-4 px-4">
          {/* Other person */}
          <motion.div
            className="relative flex-1 max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)" }}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: "#8B5CF6" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <span className="text-white text-[14px] font-medium">{otherName}</span>
            </div>
          </motion.div>

          {/* Self (smaller, overlay style) */}
          <motion.div
            className="w-[100px] aspect-[3/4] rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              background: cameraOff
                ? "#333"
                : "linear-gradient(135deg, #2d1b4e, #1a3a2a)",
            }}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {cameraOff ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#666" aria-hidden="true">
                <path d="M3.27 2L2 3.27l2.18 2.18C2.83 6.44 2 7.63 2 9v6c0 1.66 1.34 3 3 3h10l4.73 4.73L21 21.73 3.27 2zM5 16V9a1 1 0 011-1h.73L14.73 16H5z" />
              </svg>
            ) : (
              <span className="text-white/60 text-[11px]">{selfName}</span>
            )}
          </motion.div>
        </div>

        {/* Time expired prompt */}
        <AnimatePresence>
          {showPrompt && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: "rgba(0,0,0,0.8)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="rounded-2xl p-6 text-center max-w-[300px] w-full"
                style={{ background: "#141414", border: "1px solid #222" }}
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <p
                  className="text-white font-bold text-[18px] mb-4"
                  style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
                >
                  Temps ecoule !
                </p>
                <p className="text-[14px] mb-6" style={{ color: "#999" }}>
                  Voulez-vous continuer ?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleEnd}
                    className="flex-1 py-3 rounded-xl font-semibold text-[14px] text-white"
                    style={{ background: "#333" }}
                    aria-label="Non, terminer l'appel"
                  >
                    Non
                  </button>
                  <motion.button
                    onClick={handleContinue}
                    className="flex-1 py-3 rounded-xl font-semibold text-[14px] text-white"
                    style={{ background: "#8B5CF6" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Oui, continuer l'appel"
                  >
                    Oui
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 pb-8 pt-4">
          <motion.button
            onClick={() => setMuted(!muted)}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: muted ? "#8B5CF6" : "#333" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={muted ? "Reactiver le micro" : "Couper le micro"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              {muted ? (
                <path d="M1.5 1.5l21 21M9 9.34V4a3 3 0 015.94-.6M12 16.5a4 4 0 004-4v-1m-8 1a4 4 0 01-.34-1.6M17 16.5V18m-5 3.75c-3.35 0-6-2.5-6-5.5V14M5 14v2.5c0 3 2.65 5.5 6 5.5" />
              ) : (
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
              )}
            </svg>
          </motion.button>

          <motion.button
            onClick={handleEnd}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "#EF4444" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Terminer l'appel"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 01-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28a11.27 11.27 0 00-2.67-1.85.996.996 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
            </svg>
          </motion.button>

          <motion.button
            onClick={() => setCameraOff(!cameraOff)}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: cameraOff ? "#8B5CF6" : "#333" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={cameraOff ? "Allumer la camera" : "Eteindre la camera"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              {cameraOff ? (
                <path d="M1 1l22 22M21 6.5l-4 3V7a2 2 0 00-2-2H5.5M2 8v8a2 2 0 002 2h12a2 2 0 002-2v-2.5l4 3V6.5" />
              ) : (
                <>
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </>
              )}
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
