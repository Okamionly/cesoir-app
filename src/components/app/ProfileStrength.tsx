"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ProfileData {
  hasPhoto: boolean;
  hasBio: boolean;
  bioLength: number;
  hasPromptAnswers: boolean;
  promptAnswerCount: number;
  isVerified: boolean;
  hasModeActive: boolean;
  hasAvailability: boolean;
}

interface Criterion {
  key: string;
  label: string;
  met: boolean;
  points: number;
}

function evaluateProfile(data: ProfileData): { score: number; criteria: Criterion[] } {
  const criteria: Criterion[] = [
    {
      key: "photo",
      label: "Photo de profil",
      met: data.hasPhoto,
      points: 20,
    },
    {
      key: "bio",
      label: "Bio remplie (20+ chars)",
      met: data.hasBio && data.bioLength >= 20,
      points: 20,
    },
    {
      key: "prompts",
      label: "2+ reponses aux prompts",
      met: data.hasPromptAnswers && data.promptAnswerCount >= 2,
      points: 20,
    },
    {
      key: "verified",
      label: "Profil verifie",
      met: data.isVerified,
      points: 15,
    },
    {
      key: "mode",
      label: "Un mode actif",
      met: data.hasModeActive,
      points: 15,
    },
    {
      key: "availability",
      label: "Disponibilite indiquee",
      met: data.hasAvailability,
      points: 10,
    },
  ];

  const score = criteria.reduce((sum, c) => sum + (c.met ? c.points : 0), 0);
  return { score, criteria };
}

function getColor(score: number): string {
  if (score >= 80) return "#00FF88"; // green
  if (score >= 50) return "#8B5CF6"; // violet
  return "#6b7280"; // grey
}

interface ProfileStrengthProps {
  data: ProfileData;
  /** Photo URL to show inside the arc */
  photoUrl?: string;
  /** Size in pixels (default 80) */
  size?: number;
}

export default function ProfileStrength({
  data,
  photoUrl,
  size = 80,
}: ProfileStrengthProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const { score, criteria } = useMemo(() => evaluateProfile(data), [data]);
  const color = getColor(score);

  // SVG arc calculations
  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setTooltipOpen(!tooltipOpen)}
        className="relative block"
        aria-label={`Force du profil: ${score}%`}
        aria-expanded={tooltipOpen}
      >
        <svg
          width={size}
          height={size}
          className="block"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>

        {/* Photo inside */}
        {photoUrl && (
          <img
            src={photoUrl}
            alt=""
            className="absolute rounded-full object-cover"
            style={{
              top: strokeWidth + 2,
              left: strokeWidth + 2,
              width: size - (strokeWidth + 2) * 2,
              height: size - (strokeWidth + 2) * 2,
            }}
          />
        )}

        {/* Score badge */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {score}%
        </div>
      </button>

      {/* Tooltip with criteria */}
      <AnimatePresence>
        {tooltipOpen && (
          <motion.div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 w-[220px] z-50 shadow-xl"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-2">
              Force du profil
            </p>
            <div className="space-y-1.5">
              {criteria.map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <span className={`text-[13px] ${c.met ? "opacity-100" : "opacity-30"}`}>
                    {c.met ? "\u2705" : "\u2B1C"}
                  </span>
                  <span
                    className={`text-[12px] ${
                      c.met ? "text-white/80" : "text-white/30"
                    }`}
                  >
                    {c.label}
                  </span>
                  <span className="ml-auto text-[10px] text-white/30">
                    +{c.points}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
