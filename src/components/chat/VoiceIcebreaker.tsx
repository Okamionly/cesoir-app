"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceIcebreakerProps {
  onSend?: (duration: number) => void;
  onDismiss?: () => void;
}

const PROMPTS = [
  "Raconte ta pire anecdote de date",
  "Ta chanson du moment en 10 secondes",
  "Decris ton weekend ideal",
  "Un talent cache que personne ne connait",
  "Le plat que tu cuisines le mieux",
  "Ton reve le plus fou",
];

const MAX_DURATION = 15;
const BAR_COUNT = 24;

export default function VoiceIcebreaker({ onSend, onDismiss }: VoiceIcebreakerProps) {
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: BAR_COUNT }, () => 0.2));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate waveform bars during recording
  useEffect(() => {
    if (!recording) return;
    const waveInterval = setInterval(() => {
      setBars(Array.from({ length: BAR_COUNT }, () => 0.15 + Math.random() * 0.85));
    }, 100);
    return () => clearInterval(waveInterval);
  }, [recording]);

  // Timer during recording
  useEffect(() => {
    if (!recording) return;
    intervalRef.current = setInterval(() => {
      setDuration((prev) => {
        if (prev >= MAX_DURATION) {
          setRecording(false);
          setRecorded(true);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [recording]);

  const handleStartRecording = useCallback(() => {
    setRecording(true);
    setRecorded(false);
    setDuration(0);
    setBars(Array.from({ length: BAR_COUNT }, () => 0.2));
  }, []);

  const handleStopRecording = useCallback(() => {
    setRecording(false);
    if (duration > 0) {
      setRecorded(true);
    }
  }, [duration]);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    // Mock playback
    setTimeout(() => setPlaying(false), duration * 1000);
  }, [duration]);

  const handleSend = useCallback(() => {
    onSend?.(duration);
  }, [onSend, duration]);

  const handleRetry = useCallback(() => {
    setRecorded(false);
    setDuration(0);
    setBars(Array.from({ length: BAR_COUNT }, () => 0.2));
  }, []);

  return (
    <motion.div
      className="rounded-2xl p-4 mx-2 my-3"
      style={{ background: "#141414", border: "1px solid #222" }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      role="region"
      aria-label="Brise-glace vocal"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.2)" }}
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#8B5CF6">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
            </svg>
          </div>
          <p className="text-white font-semibold text-[14px]">
            Brise la glace avec ta voix !
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#222" }}
            aria-label="Fermer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#888">
              <path d="M18 6L6 18M6 6l12 12" stroke="#888" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Prompt */}
      <div
        className="rounded-xl p-3 mb-4"
        style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}
      >
        <p className="text-[14px] font-medium" style={{ color: "#c4b5fd" }}>
          &quot;{prompt}&quot;
        </p>
      </div>

      {/* Waveform */}
      <div
        className="flex items-center justify-center gap-[3px] h-12 mb-3 px-2"
        role="img"
        aria-label={recording ? "Enregistrement en cours" : recorded ? "Enregistrement termine" : "En attente d'enregistrement"}
      >
        {bars.map((height, i) => (
          <motion.div
            key={i}
            className="w-[3px] rounded-full"
            style={{
              background: recording
                ? "#8B5CF6"
                : recorded
                  ? "#00FF88"
                  : "#333",
            }}
            animate={{
              height: recording
                ? `${height * 48}px`
                : recorded
                  ? `${(0.3 + Math.sin(i * 0.5) * 0.3) * 48}px`
                  : "8px",
            }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-center mb-4">
        <span className="text-[13px] font-mono" style={{ color: recording ? "#8B5CF6" : "#888" }}>
          {duration}s / {MAX_DURATION}s
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <AnimatePresence mode="wait">
          {!recorded ? (
            <motion.button
              key="record"
              onPointerDown={handleStartRecording}
              onPointerUp={handleStopRecording}
              onPointerLeave={handleStopRecording}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: recording ? "#EF4444" : "#8B5CF6",
                boxShadow: recording ? "0 0 20px rgba(239,68,68,0.4)" : "0 0 20px rgba(139,92,246,0.3)",
              }}
              animate={recording ? { scale: [1, 1.1, 1] } : {}}
              transition={recording ? { repeat: Infinity, duration: 1 } : {}}
              aria-label={recording ? "Relacher pour arreter l'enregistrement" : "Maintenir pour enregistrer"}
            >
              {recording ? (
                <div className="w-5 h-5 rounded-sm" style={{ background: "#FFF" }} />
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                </svg>
              )}
            </motion.button>
          ) : (
            <motion.div
              key="controls"
              className="flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <button
                onClick={handleRetry}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#333" }}
                aria-label="Recommencer l'enregistrement"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#999" aria-hidden="true">
                  <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
              </button>

              <motion.button
                onClick={handlePlay}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: playing ? "#00FF88" : "#222" }}
                whileTap={{ scale: 0.9 }}
                disabled={playing}
                aria-label={playing ? "Lecture en cours" : "Ecouter l'enregistrement"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={playing ? "#111" : "#FFF"} aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </motion.button>

              <motion.button
                onClick={handleSend}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#8B5CF6" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Envoyer le message vocal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint */}
      {!recorded && !recording && (
        <p className="text-center text-[11px] mt-3" style={{ color: "#666" }}>
          Maintenir pour enregistrer (max {MAX_DURATION}s)
        </p>
      )}
    </motion.div>
  );
}
