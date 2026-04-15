"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface MysteryProfile {
  name: string;
  age: number;
  distance: string;
  mode: string;
  modeColor: string;
  photo: string;
}

interface MysteryMatchProps {
  profile: MysteryProfile;
  onReveal?: (profile: MysteryProfile) => void;
  onDismiss?: () => void;
}

function ConfettiPiece({ delay, x }: { delay: number; x: number }) {
  const color = ["#8B5CF6", "#00FF88", "#F59E0B", "#ec4899", "#3b82f6"][
    Math.floor(Math.random() * 5)
  ];
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{ background: color, left: `${x}%`, top: "40%" }}
      initial={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -60, 120],
        x: [0, (Math.random() - 0.5) * 100],
        rotate: [0, 360 + Math.random() * 360],
        scale: [1, 1.2, 0.5],
      }}
      transition={{ duration: 1.8, delay, ease: "easeOut" }}
      aria-hidden="true"
    />
  );
}

export default function MysteryMatch({ profile, onReveal, onDismiss }: MysteryMatchProps) {
  const [phase, setPhase] = useState<"hidden" | "countdown" | "revealed">("hidden");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("revealed");
      onReveal?.(profile);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown, onReveal, profile]);

  const handleReveal = useCallback(() => {
    setPhase("countdown");
    setCountdown(3);
  }, []);

  const confettiPieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    x: Math.random() * 100,
  }));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label="Match Mystere"
    >
      <motion.div
        className="w-full max-w-sm rounded-2xl overflow-hidden relative"
        style={{ background: "#141414", border: "1px solid #222" }}
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Confetti on reveal */}
        {phase === "revealed" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {confettiPieces.map((piece) => (
              <ConfettiPiece key={piece.id} delay={piece.delay} x={piece.x} />
            ))}
          </div>
        )}

        {/* Header sparkle */}
        <div className="text-center pt-6 pb-2 relative z-10">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#8B5CF6" className="mx-auto mb-2">
              <path d="M12 2l2.09 6.26L20.18 9l-5 4.39L16.82 20 12 16.54 7.18 20l1.64-6.61L3.82 9l6.09-.74z" />
            </svg>
          </motion.div>
          <h2
            className="text-white font-bold text-[20px]"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
          >
            Match Mystere
          </h2>
          <p className="text-[12px] mt-1" style={{ color: "#666" }}>
            1 Match Mystere par jour
          </p>
        </div>

        {/* Profile area */}
        <div className="px-6 py-4">
          <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden mb-4">
            <AnimatePresence mode="wait">
              {phase === "revealed" ? (
                <motion.img
                  key="photo"
                  src={profile.photo}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  initial={{ filter: "blur(20px)", scale: 1.2 }}
                  animate={{ filter: "blur(0px)", scale: 1 }}
                  transition={{ duration: 0.8 }}
                />
              ) : (
                <motion.div
                  key="silhouette"
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #1a1a2e, #2d1b4e)",
                  }}
                >
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="rgba(139,92,246,0.3)" aria-hidden="true">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Countdown overlay */}
            {phase === "countdown" && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.6)" }}
              >
                <motion.span
                  key={countdown}
                  className="text-white font-bold text-[48px]"
                  style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {countdown}
                </motion.span>
              </motion.div>
            )}
          </div>

          {/* Teaser info */}
          <div className="text-center space-y-2">
            <AnimatePresence mode="wait">
              {phase === "revealed" ? (
                <motion.p
                  key="name"
                  className="text-white font-bold text-[22px]"
                  style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {profile.name}
                </motion.p>
              ) : (
                <motion.p
                  key="question"
                  className="text-[16px] font-semibold"
                  style={{ color: "#666" }}
                >
                  ???
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-3">
              <span className="text-[13px]" style={{ color: "#999" }}>
                {profile.age} ans
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: "#444" }} />
              <span className="text-[13px]" style={{ color: "#999" }}>
                {profile.distance}
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: "#444" }} />
              <span
                className="text-[13px] font-medium"
                style={{ color: profile.modeColor }}
              >
                {profile.mode}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6">
          {phase !== "revealed" ? (
            <motion.button
              onClick={handleReveal}
              className="w-full py-3.5 rounded-xl font-semibold text-[14px] text-white"
              style={{ background: "#8B5CF6" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={phase === "countdown"}
              aria-label="Reveler le match mystere"
            >
              {phase === "countdown" ? "Revelation..." : "Reveler"}
            </motion.button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="flex-1 py-3.5 rounded-xl font-semibold text-[14px]"
                style={{ background: "#222", color: "#999" }}
                aria-label="Passer ce match"
              >
                Passer
              </button>
              <motion.button
                onClick={onDismiss}
                className="flex-1 py-3.5 rounded-xl font-semibold text-[14px] text-white"
                style={{ background: "#00FF88", color: "#111" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Envoyer un message"
              >
                Dire bonjour
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
