"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

interface PhotoBlurRevealProps {
  src: string;
  messagesExchanged: number;
  totalRequired?: number;
  alt?: string;
}

const BLUR_LEVELS = [20, 15, 10, 5, 0];

export default function PhotoBlurReveal({
  src,
  messagesExchanged,
  totalRequired = 5,
  alt = "Photo",
}: PhotoBlurRevealProps) {
  const { blurValue, progress, remaining, revealed } = useMemo(() => {
    const clamped = Math.min(messagesExchanged, totalRequired);
    const levelIndex = Math.min(
      Math.floor((clamped / totalRequired) * BLUR_LEVELS.length),
      BLUR_LEVELS.length - 1
    );
    const blur = BLUR_LEVELS[levelIndex];
    return {
      blurValue: blur,
      progress: clamped / totalRequired,
      remaining: Math.max(0, totalRequired - clamped),
      revealed: blur === 0,
    };
  }, [messagesExchanged, totalRequired]);

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden"
      style={{ border: "1px solid #222" }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      role="img"
      aria-label={revealed ? alt : `Photo flouee, ${remaining} messages restants pour la reveler`}
    >
      {/* Image with blur */}
      <motion.div
        className="w-full aspect-square"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: `blur(${blurValue}px)`,
        }}
        animate={{ filter: `blur(${blurValue}px)` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Gradient overlay when blurred */}
      {!revealed && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%)`,
          }}
        >
          {/* Lock icon */}
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: "rgba(139,92,246,0.3)", backdropFilter: "blur(8px)" }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B5CF6">
              <path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM8.9 6a3.1 3.1 0 016.2 0v2H8.9V6z" />
            </svg>
          </motion.div>

          {/* Message count */}
          <p className="text-white font-semibold text-[14px] mb-2">
            {remaining} message{remaining !== 1 ? "s" : ""} pour voir la photo
          </p>

          {/* Progress bar */}
          <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #8B5CF6, #00FF88)" }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Reveal celebration */}
      {revealed && (
        <motion.div
          className="absolute bottom-3 left-3 right-3 flex items-center gap-2 p-2 rounded-xl"
          style={{ background: "rgba(0,255,136,0.15)", backdropFilter: "blur(8px)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#00FF88" aria-hidden="true">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          <span className="text-[12px] font-medium" style={{ color: "#00FF88" }}>
            Photo revelee !
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
