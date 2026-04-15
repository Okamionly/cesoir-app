"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface VibeCheckProps {
  peerName: string;
  peerInitial: string;
  userInitial: string;
  onClose: () => void;
}

export default function VibeCheck({ peerName, peerInitial, userInitial, onClose }: VibeCheckProps) {
  const [phase, setPhase] = useState<"call" | "decision" | "match" | "dismissed">("call");
  const [timeLeft, setTimeLeft] = useState(60);
  const [muted, setMuted] = useState(false);
  const [flipped, setFlipped] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (phase !== "call") return;
    if (timeLeft <= 0) {
      setPhase("decision");
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase]);

  const progress = (60 - timeLeft) / 60;
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference * (1 - progress);

  const handleYes = useCallback(() => {
    setPhase("match");
    setTimeout(() => {
      onClose();
    }, 3000);
  }, [onClose]);

  const handleNo = useCallback(() => {
    setPhase("dismissed");
    setTimeout(() => {
      onClose();
    }, 600);
  }, [onClose]);

  const handleEndCall = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {phase !== "dismissed" && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-label="Vibe Check - Appel video"
          aria-modal="true"
        >
          {/* Background gradient simulating camera feed */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
          />
          <div className="absolute inset-0 bg-black/40" />

          {phase === "call" && (
            <div className="relative flex-1 flex flex-col items-center justify-between py-12 px-6">
              {/* Timer ring */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="url(#vibeGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                    <defs>
                      <linearGradient id="vibeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#00FF88" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-[28px] font-black text-white tabular-nums">{timeLeft}s</span>
                </div>
                <p className="text-[13px] text-white/70 font-medium">Vibe Check en cours</p>
              </div>

              {/* Mock camera views */}
              <div className="flex items-center gap-8">
                {/* User camera (large) */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-28 h-40 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
                >
                  <span className="text-[40px] font-black text-white/80">{userInitial}</span>
                </motion.div>

                {/* Peer camera (large) */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="w-28 h-40 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
                >
                  <span className="text-[40px] font-black text-white/80">{peerInitial}</span>
                </motion.div>
              </div>

              {/* Bottom bar — mock controls */}
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setMuted(!muted)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors tap-target ${
                    muted ? "bg-white/30" : "bg-white/10 border border-white/20"
                  }`}
                  aria-label={muted ? "Reactiver le micro" : "Couper le micro"}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {muted ? (
                      <>
                        <line x1="1" y1="1" x2="23" y2="23" />
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
                        <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                      </>
                    )}
                  </svg>
                </button>

                <button
                  onClick={handleEndCall}
                  className="w-16 h-16 rounded-full bg-[#EF4444] flex items-center justify-center shadow-lg tap-target"
                  aria-label="Raccrocher"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                  </svg>
                </button>

                <button
                  onClick={() => setFlipped(!flipped)}
                  className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center tap-target"
                  aria-label="Retourner la camera"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 16V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z" />
                    <polyline points="14 2 14 6 10 6 10 2" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {phase === "decision" && (
            <motion.div
              className="relative flex-1 flex flex-col items-center justify-center px-6 gap-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              <div className="text-center">
                <p className="text-[24px] font-black text-white mb-2">Temps ecoule !</p>
                <p className="text-[16px] text-white/80">
                  Tu veux voir {peerName} ce soir ?
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-[280px]">
                <motion.button
                  onClick={handleYes}
                  className="w-full py-4 rounded-2xl font-bold text-[16px] text-white tap-target"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Oui, je veux le voir ce soir"
                >
                  Oui !
                </motion.button>
                <motion.button
                  onClick={handleNo}
                  className="w-full py-4 rounded-2xl border-2 border-white/30 text-white/80 font-bold text-[16px] tap-target"
                  whileTap={{ scale: 0.95 }}
                  aria-label="Pas cette fois"
                >
                  Pas cette fois
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === "match" && (
            <motion.div
              className="relative flex-1 flex flex-col items-center justify-center px-6"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            >
              <motion.div
                className="text-[64px] mb-4"
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                aria-hidden="true"
              >
                🎉
              </motion.div>
              <p className="text-[28px] font-black text-white mb-2">C&apos;est un match !</p>
              <p className="text-[15px] text-white/70">
                Vous vous voyez ce soir
              </p>
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 2, ease: "easeOut" }}
              >
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      background: i % 2 === 0 ? "#8B5CF6" : "#00FF88",
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [1, 0.8, 0],
                      y: [0, -40 - Math.random() * 60],
                      x: [(Math.random() - 0.5) * 80],
                    }}
                    transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Small trigger button for the chat header */
export function VibeCheckButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="shrink-0 w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center tap-target"
      whileTap={{ scale: 0.9 }}
      aria-label="Lancer un Vibe Check"
      title="Vibe Check"
    >
      <span className="text-[14px]" aria-hidden="true">📹</span>
    </motion.button>
  );
}
