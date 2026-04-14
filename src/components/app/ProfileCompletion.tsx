"use client";

import { useMemo } from "react";

interface ProfileData {
  avatar_url?: string | null;
  bio?: string | null;
  modes?: string[] | null;       // active mode slugs
  prompts?: string[] | null;     // answered prompts
  is_verified?: boolean;
}

interface ProfileCompletionProps {
  profile: ProfileData;
  className?: string;
}

interface CompletionStep {
  label: string;
  tip: string;
  weight: 20;
  done: boolean;
}

function buildSteps(p: ProfileData): CompletionStep[] {
  return [
    {
      label: "Photo",
      tip: "Ajoute une photo pour 3x plus de matchs",
      weight: 20,
      done: !!p.avatar_url,
    },
    {
      label: "Bio",
      tip: "Ecris une bio pour te demarquer",
      weight: 20,
      done: !!p.bio && p.bio.length > 0,
    },
    {
      label: "Modes",
      tip: "Active au moins un mode pour apparaitre",
      weight: 20,
      done: !!p.modes && p.modes.length > 0,
    },
    {
      label: "Prompts",
      tip: "Reponds a des prompts pour briser la glace",
      weight: 20,
      done: !!p.prompts && p.prompts.length > 0,
    },
    {
      label: "Verification",
      tip: "Verifie ton profil pour inspirer confiance",
      weight: 20,
      done: !!p.is_verified,
    },
  ];
}

export default function ProfileCompletion({ profile, className = "" }: ProfileCompletionProps) {
  const steps = useMemo(() => buildSteps(profile), [profile]);

  const percent = useMemo(
    () => steps.reduce((acc, s) => acc + (s.done ? s.weight : 0), 0),
    [steps],
  );

  const nextTip = useMemo(
    () => steps.find((s) => !s.done)?.tip ?? null,
    [steps],
  );

  if (percent === 100) return null;

  return (
    <div className={`bg-black border border-white/10 rounded-2xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-semibold">Profil completo</span>
        <span className="text-white/60 text-xs font-medium">{percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg, #8B5CF6 0%, #00FF88 100%)",
          }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-1.5 mb-2">
        {steps.map((s) => (
          <div
            key={s.label}
            className={`w-2 h-2 rounded-full transition-colors ${
              s.done ? "bg-[#00FF88]" : "bg-white/20"
            }`}
            title={s.label}
          />
        ))}
      </div>

      {/* Tip */}
      {nextTip && (
        <p className="text-white/50 text-xs">
          {nextTip}
        </p>
      )}
    </div>
  );
}
