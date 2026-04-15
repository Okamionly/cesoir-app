"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface ProfileData {
  avatar_url?: string | null;
  bio?: string | null;
  modes?: string[] | null;
  prompts?: string[] | null;
  audio_url?: string | null;
  is_verified?: boolean;
}

interface ProfileCompletionProps {
  profile: ProfileData;
  className?: string;
  /** Current XP (for badge display) */
  currentXP?: number;
}

interface CompletionStep {
  label: string;
  tip: string;
  weight: number;
  done: boolean;
  icon: string;
}

// ─────────────────────────────────────────
// Step builder with spec weights
// ─────────────────────────────────────────

function buildSteps(p: ProfileData): CompletionStep[] {
  return [
    {
      label: "Photo",
      tip: "Ajoute une photo de profil",
      weight: 20,
      done: !!p.avatar_url,
      icon: "\uD83D\uDCF7",
    },
    {
      label: "Bio",
      tip: "Ecris une bio pour te demarquer",
      weight: 15,
      done: !!p.bio && p.bio.length > 0,
      icon: "\u270D\uFE0F",
    },
    {
      label: "Prompts",
      tip: "Reponds a des prompts pour briser la glace",
      weight: 20,
      done: !!p.prompts && p.prompts.length >= 3,
      icon: "\uD83D\uDCAC",
    },
    {
      label: "Audio",
      tip: "Enregistre un audio pour montrer ta voix",
      weight: 15,
      done: !!p.audio_url,
      icon: "\uD83C\uDFA4",
    },
    {
      label: "Modes",
      tip: "Active au moins un mode pour apparaitre",
      weight: 10,
      done: !!p.modes && p.modes.length > 0,
      icon: "\uD83C\uDFAF",
    },
    {
      label: "Verification",
      tip: "Verifie ton profil pour inspirer confiance",
      weight: 20,
      done: !!p.is_verified,
      icon: "\u2705",
    },
  ];
}

// ─────────────────────────────────────────
// Circular progress SVG
// ─────────────────────────────────────────

function CircularProgress({ percent }: { percent: number }) {
  const radius = 40;
  const stroke = 5;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const color =
    percent >= 100
      ? "#00FF88"
      : percent >= 80
        ? "#8B5CF6"
        : percent >= 50
          ? "#F59E0B"
          : "#EF4444";

  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg width={80} height={80} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={40}
          cy={40}
          r={normalizedRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <motion.circle
          cx={40}
          cy={40}
          r={normalizedRadius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ type: "spring", stiffness: 60, damping: 20, mass: 1.5 }}
        />
      </svg>

      {/* Percent text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-[18px] font-black text-white tabular-nums"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.elastic}
        >
          {percent}%
        </motion.span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// XP reward display
// ─────────────────────────────────────────

function XPReward({ percent }: { percent: number }) {
  if (percent < 80) return null;

  const reward = percent >= 100 ? { xp: 100, label: "Profil parfait" } : { xp: 50, label: "Presque complet" };

  return (
    <motion.div
      className="flex items-center gap-2 mt-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.elastic}
    >
      <motion.div
        className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30"
        animate={{
          boxShadow: [
            "0 0 0px rgba(139,92,246,0)",
            "0 0 12px rgba(139,92,246,0.3)",
            "0 0 0px rgba(139,92,246,0)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[11px] text-[#8B5CF6] font-bold">+{reward.xp} XP</span>
      </motion.div>
      <span className="text-[10px] text-white/40 font-medium">{reward.label}</span>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export default function ProfileCompletion({
  profile,
  className = "",
}: ProfileCompletionProps) {
  const steps = useMemo(() => buildSteps(profile), [profile]);

  const percent = useMemo(
    () => steps.reduce((acc, s) => acc + (s.done ? s.weight : 0), 0),
    [steps],
  );

  const missingSteps = useMemo(() => steps.filter((s) => !s.done), [steps]);

  if (percent === 100) {
    // Show completed state briefly
    return (
      <motion.div
        className={`bg-black border border-[#00FF88]/20 rounded-2xl p-4 ${className}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.elastic}
      >
        <div className="flex items-center gap-4">
          <CircularProgress percent={100} />
          <div>
            <p className="text-white font-bold text-[15px]">Profil complet!</p>
            <p className="text-[#00FF88] text-[12px] font-medium mt-0.5">
              +100 XP obtenus
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`bg-black border border-white/10 rounded-2xl p-4 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.heavy}
    >
      {/* Top row: circle + info */}
      <div className="flex items-start gap-4">
        <CircularProgress percent={percent} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-[15px] font-bold">Profil {percent}%</p>
          <XPReward percent={percent} />

          {/* Nudge banner */}
          {percent < 80 && (
            <motion.p
              className="text-[11px] text-[#F59E0B] font-medium mt-2 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Complete ton profil pour 3x plus de matchs
            </motion.p>
          )}
        </div>
      </div>

      {/* Missing items checklist */}
      {missingSteps.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
          {missingSteps.map((step, i) => (
            <motion.div
              key={step.label}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.snap, delay: 0.2 + i * 0.06 }}
            >
              {/* Unchecked circle */}
              <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                <span className="text-[10px]">{step.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white/60 font-medium">{step.tip}</p>
              </div>
              <span className="text-[10px] text-white/20 font-semibold shrink-0">
                +{step.weight}%
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
