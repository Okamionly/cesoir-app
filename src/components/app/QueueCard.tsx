"use client";

// ========================================
// QueueCard — Large format profile preview card
// ========================================
//
// Detailed card for the Smart Queue. Not a swipe card —
// this shows comprehensive profile info with action buttons.

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { MODES, type ModeKey } from "@/lib/modes";
import type { MatchCandidate } from "@/lib/matching";
import { IconHeart, IconX, IconMap } from "@/components/ui/Icons";

// ─── Types ───

interface QueueCardProps {
  candidate: MatchCandidate;
  index: number;
  onAccept: (id: string) => void;
  onPass: (id: string) => void;
}

// ─── Compatibility Ring ───

function CompatibilityRing({ score, delay }: { score: number; delay: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  // Color based on score
  const color =
    score >= 80 ? "#00FF88" : score >= 60 ? "#8B5CF6" : "#F59E0B";

  return (
    <motion.div
      className="relative w-12 h-12 flex items-center justify-center"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ ...springs.elastic, delay }}
    >
      <svg width={48} height={48} viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        {/* Background ring */}
        <circle
          cx={24}
          cy={24}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={3}
        />
        {/* Progress ring */}
        <motion.circle
          cx={24}
          cy={24}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
        />
      </svg>
      <span className="text-[11px] font-bold text-white z-10">{score}%</span>
    </motion.div>
  );
}

// ─── Online Status ───

function OnlineStatus({ availableTime }: { availableTime: string | null }) {
  if (!availableTime) {
    return (
      <span className="text-[10px] text-text-muted">Hors ligne</span>
    );
  }

  const now = Date.now();
  const available = new Date(availableTime).getTime();
  const diffMs = now - available;
  const diffMin = Math.abs(Math.floor(diffMs / 60_000));

  // If available time is within 5 minutes of now, consider "online"
  if (diffMin <= 5) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-accent-2 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-2 animate-pulse" />
        En ligne
      </span>
    );
  }

  if (diffMin < 60) {
    return (
      <span className="text-[10px] text-text-muted">
        Vu il y a {diffMin} min
      </span>
    );
  }

  const diffH = Math.floor(diffMin / 60);
  return (
    <span className="text-[10px] text-text-muted">
      Vu il y a {diffH}h
    </span>
  );
}

// ─── Mode Pill ───

function ModePill({ mode }: { mode: ModeKey }) {
  const def = MODES[mode];
  if (!def) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{
        backgroundColor: `${def.color}20`,
        color: def.color,
        border: `1px solid ${def.color}30`,
      }}
    >
      <span className="text-[9px]">{def.icon}</span>
      {def.name}
    </span>
  );
}

// ─── Main Card ───

export default function QueueCard({ candidate, index, onAccept, onPass }: QueueCardProps) {
  const [expanded, setExpanded] = useState(false);

  const photoUrl =
    candidate.avatar_url ??
    `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 10)}.jpg`;

  // Shared interests: pick 2-3 tags from shared modes
  const sharedInterests = candidate.sharedModes
    .slice(0, 3)
    .flatMap((mode) => {
      const def = MODES[mode];
      return def ? def.tags.slice(0, 1) : [];
    })
    .slice(0, 3);

  return (
    <motion.div
      layout
      className="relative bg-bg-card border border-border rounded-[24px] overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: -300,
        rotateZ: -5,
        transition: { ...springs.rubber },
      }}
      transition={{
        ...springs.heavy,
        delay: index * 0.1,
      }}
    >
      {/* Photo area with gradient overlay */}
      <div className="relative h-[280px] overflow-hidden">
        {/* Gradient placeholder background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-accent-2/30" />

        {/* Profile photo */}
        <img
          src={photoUrl}
          alt={`${candidate.name}, ${candidate.age} ans`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Compatibility badge — top right */}
        <div className="absolute top-3 right-3">
          <CompatibilityRing score={candidate.score} delay={0.3 + index * 0.1} />
        </div>

        {/* Online status — top left */}
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
          <OnlineStatus availableTime={candidate.availableTime} />
        </div>

        {/* Name + age + distance — bottom */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-[22px] font-black text-white leading-tight">
                {candidate.name}, {candidate.age}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <IconMap size={12} className="text-white/60" />
                <span className="text-[12px] text-white/70">
                  {candidate.distance_km < 1
                    ? `${Math.round(candidate.distance_km * 1000)}m`
                    : `${candidate.distance_km} km`}
                </span>
              </div>
            </div>
            {candidate.is_verified && (
              <span className="bg-accent-2/20 text-accent-2 text-[9px] font-bold px-2 py-0.5 rounded-full border border-accent-2/30">
                Verifie
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="px-4 py-3 space-y-3">
        {/* Shared modes */}
        <div className="flex flex-wrap gap-1.5">
          {candidate.sharedModes.slice(0, 3).map((mode) => (
            <ModePill key={mode} mode={mode} />
          ))}
          {candidate.sharedModes.length === 0 &&
            candidate.activeModes.slice(0, 2).map((mode) => (
              <ModePill key={mode} mode={mode} />
            ))}
        </div>

        {/* Shared interests */}
        {sharedInterests.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-text-muted">Interets communs :</span>
            {sharedInterests.map((interest) => (
              <span
                key={interest}
                className="text-[10px] text-text-soft bg-border/50 px-2 py-0.5 rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* Bio — expandable */}
        <div>
          <AnimatePresence initial={false}>
            <motion.p
              className="text-[13px] text-text-soft leading-relaxed cursor-pointer"
              onClick={() => setExpanded(!expanded)}
              animate={{ height: expanded ? "auto" : 40 }}
              style={{ overflow: "hidden" }}
            >
              {candidate.bio || "Pas encore de bio"}
            </motion.p>
          </AnimatePresence>
          {candidate.bio && candidate.bio.length > 80 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-accent font-medium mt-0.5"
            >
              {expanded ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-1 pb-1">
          {/* Passer */}
          <motion.button
            onClick={() => onPass(candidate.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-border text-text-muted text-[14px] font-semibold transition-colors hover:border-text-muted"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95, transition: springs.micro }}
          >
            <IconX size={16} />
            Passer
          </motion.button>

          {/* Dire oui */}
          <motion.button
            onClick={() => onAccept(candidate.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl gradient-bg text-white text-[14px] font-bold shadow-glow"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 40px rgba(139,92,246,0.4)",
              transition: springs.snap,
            }}
            whileTap={{ scale: 0.92, transition: springs.micro }}
          >
            <IconHeart size={16} />
            Dire oui
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
