"use client";

// ========================================
// Standouts — Top 5% profiles feed
// ========================================
//
// Shows the most compatible profiles (score > 85).
// Each card requires a "Rose" premium currency to like.
// Extra-large photo area + compatibility ring.
//
// Animation signature: Spotlight reveal
// Cards emerge from darkness with cinematic fade + scale,
// compatibility ring draws itself with spring physics,
// rose button pulses with ambient glow.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useMatches } from "@/lib/useMatches";
import type { MatchCandidate } from "@/lib/matching";
import { MODES } from "@/lib/modes";
import { IconHeart } from "@/components/ui/Icons";

// ─────────────────────────────────────────
// Springs — unique spotlight physics
// ─────────────────────────────────────────

const spotlightSprings = {
  /** Card reveal — slow cinematic emergence */
  reveal: { type: "spring" as const, stiffness: 90, damping: 22, mass: 2.2 },
  /** Ring draw — smooth arc completion */
  ringDraw: { type: "spring" as const, stiffness: 60, damping: 30, mass: 1.8 },
  /** Rose button — elastic pop */
  rosePop: { type: "spring" as const, stiffness: 350, damping: 14, mass: 0.8 },
  /** Tag fade — quick snap */
  tagSnap: { type: "spring" as const, stiffness: 450, damping: 28, mass: 0.5 },
};

// ─────────────────────────────────────────
// Mock rose balance
// ─────────────────────────────────────────

const INITIAL_ROSES = 5;

// ─────────────────────────────────────────
// Helper: Photo URL
// ─────────────────────────────────────────

function getPhoto(candidate: MatchCandidate): string {
  return (
    candidate.avatar_url ??
    `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 10)}.jpg`
  );
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function StandoutsPage() {
  const { matches, loading } = useMatches({ limit: 50 });
  const [roses, setRoses] = useState(INITIAL_ROSES);
  const [sentRoses, setSentRoses] = useState<Set<string>>(new Set());
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  // Filter to top 5% — score > 85
  const standouts = matches
    .filter((m) => m.score > 85)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // Mock standouts if none qualify
  const displayStandouts: MatchCandidate[] =
    standouts.length > 0
      ? standouts
      : matches
          .sort((a, b) => b.score - a.score)
          .slice(0, 4);

  const handleSendRose = (candidateId: string) => {
    if (roses <= 0 || sentRoses.has(candidateId)) return;
    setRoses((r) => r - 1);
    setSentRoses((prev) => new Set(prev).add(candidateId));
    setCelebrateId(candidateId);
    setTimeout(() => setCelebrateId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border/50 px-5 pt-4 pb-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-[20px] font-black text-text">Standouts</h1>
            <p className="text-[12px] text-text-muted">
              Les profils les plus compatibles
            </p>
          </div>
          <motion.div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20"
            animate={
              roses <= 1
                ? {
                    scale: [1, 1.05, 1],
                    transition: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    },
                  }
                : {}
            }
          >
            <span className="text-[14px]">{"\uD83C\uDF39"}</span>
            <span className="text-[13px] font-bold text-accent">{roses}</span>
          </motion.div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-5 max-w-lg mx-auto">
        {/* Loading state */}
        {loading && (
          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-full aspect-[3/4] rounded-3xl bg-border/30"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && displayStandouts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-[48px] mb-4">{"\u2728"}</div>
            <h2 className="text-[17px] font-bold text-text mb-2">
              Pas de standouts ce soir
            </h2>
            <p className="text-[13px] text-text-muted mb-6">
              Revenez plus tard pour decouvrir les meilleurs profils
            </p>
            <Link
              href="/browse"
              className="gradient-bg text-white px-6 py-3 rounded-full text-[14px] font-semibold"
            >
              Retour au browse
            </Link>
          </div>
        )}

        {/* Standout cards */}
        {!loading && displayStandouts.length > 0 && (
          <div className="space-y-6">
            {displayStandouts.map((candidate, i) => (
              <StandoutCard
                key={candidate.id}
                candidate={candidate}
                index={i}
                roseSent={sentRoses.has(candidate.id)}
                canSendRose={roses > 0}
                onSendRose={() => handleSendRose(candidate.id)}
                isCelebrating={celebrateId === candidate.id}
              />
            ))}
          </div>
        )}

        {/* Rose upsell */}
        {roses === 0 && (
          <motion.div
            className="mt-8 p-5 rounded-2xl border border-accent/20 bg-accent/5 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spotlightSprings.reveal}
          >
            <p className="text-[14px] font-bold text-text mb-1">
              Plus de roses
            </p>
            <p className="text-[12px] text-text-muted mb-4">
              Obtenez plus de roses pour contacter les standouts
            </p>
            <Link
              href="/premium"
              className="gradient-bg text-white px-6 py-2.5 rounded-full text-[13px] font-semibold"
            >
              Obtenir des roses
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// StandoutCard — Individual standout profile
// ─────────────────────────────────────────

function StandoutCard({
  candidate,
  index,
  roseSent,
  canSendRose,
  onSendRose,
  isCelebrating,
}: {
  candidate: MatchCandidate;
  index: number;
  roseSent: boolean;
  canSendRose: boolean;
  onSendRose: () => void;
  isCelebrating: boolean;
}) {
  const score = candidate.score;
  const modeName =
    candidate.sharedModes[0]
      ? MODES[candidate.sharedModes[0]]?.name ?? "Compatible"
      : "Compatible";

  // SVG compatibility ring
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <motion.div
      className="relative w-full rounded-3xl overflow-hidden bg-[#111] shadow-xl"
      initial={{ opacity: 0, scale: 0.88, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        ...spotlightSprings.reveal,
        delay: index * 0.15,
      }}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 200, damping: 20 } }}
    >
      {/* Photo — extra-large area (aspect 3:4) */}
      <div className="relative w-full aspect-[3/4]">
        <img
          src={getPhoto(candidate)}
          alt={candidate.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Compatibility ring — top right */}
        <motion.div
          className="absolute top-4 right-4 w-[56px] h-[56px]"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spotlightSprings.rosePop, delay: 0.3 + index * 0.15 }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 100 100"
            className="transform -rotate-90"
          >
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="6"
            />
            {/* Score arc */}
            <motion.circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={spotlightSprings.ringDraw}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[14px] font-black text-white">
              {Math.round(score)}
            </span>
          </div>
        </motion.div>

        {/* Standout badge — top left */}
        <motion.div
          className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-accent/20 backdrop-blur-md border border-accent/30"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spotlightSprings.tagSnap, delay: 0.2 + index * 0.15 }}
        >
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
            {"\u2728"} Standout
          </span>
        </motion.div>

        {/* Profile info — bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-[22px] font-black text-white mb-0.5">
            {candidate.name}, {candidate.age}
          </h3>
          <p className="text-[13px] text-white/70 mb-1">
            {candidate.distance_km.toFixed(1)} km &middot; {modeName}
          </p>
          {candidate.bio && (
            <p className="text-[12px] text-white/60 line-clamp-2">
              {candidate.bio}
            </p>
          )}
        </div>

        {/* Rose celebration overlay */}
        <AnimatePresence>
          {isCelebrating && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-[64px]"
                initial={{ scale: 0, rotate: -30 }}
                animate={{
                  scale: [0, 1.4, 0.9, 1.1, 1],
                  rotate: [-30, 10, -5, 3, 0],
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.7, times: [0, 0.3, 0.5, 0.7, 1] }}
              >
                {"\uD83C\uDF39"}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rose CTA */}
      <div className="p-4 bg-[#111]">
        <motion.button
          onClick={onSendRose}
          disabled={roseSent || !canSendRose}
          className={`w-full py-3 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all ${
            roseSent
              ? "bg-accent/10 text-accent border border-accent/20"
              : canSendRose
                ? "gradient-bg text-white shadow-glow"
                : "bg-border/50 text-text-muted cursor-not-allowed"
          }`}
          whileTap={!roseSent && canSendRose ? { scale: 0.96 } : {}}
          animate={
            !roseSent && canSendRose
              ? {
                  boxShadow: [
                    "0 0 0px rgba(139,92,246,0)",
                    "0 0 20px rgba(139,92,246,0.3)",
                    "0 0 0px rgba(139,92,246,0)",
                  ],
                }
              : {}
          }
          transition={
            !roseSent && canSendRose
              ? { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
              : {}
          }
        >
          {roseSent ? (
            <>
              <span>{"\u2705"}</span>
              Rose envoyee
            </>
          ) : (
            <>
              <span>{"\uD83C\uDF39"}</span>
              Envoyer une Rose
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
