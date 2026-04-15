"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Neighborhood } from "@/lib/neighborhoods";

interface NeighborhoodVibeCardProps {
  neighborhood: Neighborhood | null;
  /** Number of active users in this neighborhood */
  activeUsers?: number;
  onClose?: () => void;
  onExplore?: (neighborhood: Neighborhood) => void;
}

function SafetyStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Securite ${score} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`text-sm ${i < score ? "opacity-100" : "opacity-20"}`}
          aria-hidden="true"
        >
          {"\u2B50"}
        </span>
      ))}
    </div>
  );
}

function VibeCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        {/* Progress circle */}
        <motion.circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke="url(#vibeGradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="vibeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#00FF88" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black text-white">{score}</span>
      </div>
    </div>
  );
}

export default function NeighborhoodVibeCard({
  neighborhood,
  activeUsers = 0,
  onClose,
  onExplore,
}: NeighborhoodVibeCardProps) {
  if (!neighborhood) return null;

  return (
    <AnimatePresence>
      {neighborhood && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
          />

          {/* Card */}
          <motion.div
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6"
            role="dialog"
            aria-label={`Quartier ${neighborhood.name}`}
          >
            <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
              <div className="p-5">
                {/* Header: name + vibe score */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white">
                      {neighborhood.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-[#8B5CF6]">
                      {neighborhood.vibe}
                    </p>
                  </div>
                  <VibeCircle score={neighborhood.vibeScore} />
                </div>

                {/* Description */}
                <p className="mb-4 text-sm text-white/60">
                  {neighborhood.description}
                </p>

                {/* Top modes */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/30">
                    Modes populaires
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {neighborhood.topModes.map((mode) => (
                      <span
                        key={mode}
                        className="rounded-full bg-[#8B5CF6]/15 px-3 py-1.5 text-xs font-semibold text-[#8B5CF6]"
                      >
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info row */}
                <div className="mb-4 flex items-center gap-4">
                  {/* Best time */}
                  <div className="flex-1 rounded-xl bg-white/5 px-3 py-2.5">
                    <p className="text-[10px] text-white/30">Meilleur moment</p>
                    <p className="text-sm font-bold text-white">
                      {neighborhood.bestTime}
                    </p>
                  </div>

                  {/* Safety */}
                  <div className="flex-1 rounded-xl bg-white/5 px-3 py-2.5">
                    <p className="text-[10px] text-white/30">Securite</p>
                    <SafetyStars score={neighborhood.safetyScore} />
                  </div>
                </div>

                {/* Active users */}
                {activeUsers > 0 && (
                  <div className="mb-5 flex items-center gap-2">
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.6, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="h-2.5 w-2.5 rounded-full bg-[#00FF88]"
                    />
                    <span className="text-sm text-white/60">
                      {activeUsers} personnes actives
                    </span>
                  </div>
                )}

                {/* Explore button */}
                <button
                  onClick={() => onExplore?.(neighborhood)}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  }}
                  aria-label={`Explorer ${neighborhood.name}`}
                >
                  Explorer ce quartier
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
