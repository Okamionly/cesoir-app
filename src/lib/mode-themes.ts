import type { ModeKey } from "@/lib/modes";

export interface ModeTheme {
  color: string;
  bgTint: string;
  icon: string;
}

export const MODE_THEMES: Record<ModeKey, ModeTheme> = {
  "solo-diner": { color: "#F97316", bgTint: "rgba(249,115,22,0.08)", icon: "\u{1F37D}\u{FE0F}" },
  "plus-one": { color: "#EC4899", bgTint: "rgba(236,72,153,0.08)", icon: "\u{1F3AC}" },
  "tourist": { color: "#06B6D4", bgTint: "rgba(6,182,212,0.08)", icon: "\u{2708}\u{FE0F}" },
  "night-owl": { color: "#8B5CF6", bgTint: "rgba(139,92,246,0.08)", icon: "\u{1F319}" },
  "breakup": { color: "#A855F7", bgTint: "rgba(168,85,247,0.08)", icon: "\u{1F49C}" },
  "new-in-town": { color: "#F59E0B", bgTint: "rgba(245,158,11,0.08)", icon: "\u{1F4E6}" },
  "langue": { color: "#10B981", bgTint: "rgba(16,185,129,0.08)", icon: "\u{1F310}" },
  "dog-date": { color: "#D97706", bgTint: "rgba(217,119,6,0.08)", icon: "\u{1F436}" },
  "seasonal": { color: "#EF4444", bgTint: "rgba(239,68,68,0.08)", icon: "\u{1F384}" },
  "fit-date": { color: "#22C55E", bgTint: "rgba(34,197,94,0.08)", icon: "\u{1F4AA}" },
  "foodie-quest": { color: "#F97316", bgTint: "rgba(249,115,22,0.08)", icon: "\u{1F525}" },
  "culture-club": { color: "#8B5CF6", bgTint: "rgba(139,92,246,0.08)", icon: "\u{1F3AD}" },
  "sober-tonight": { color: "#14B8A6", bgTint: "rgba(20,184,166,0.08)", icon: "\u{1F375}" },
  "gamer-night": { color: "#6366F1", bgTint: "rgba(99,102,241,0.08)", icon: "\u{1F3AE}" },
};

export function getModeTheme(mode: ModeKey): ModeTheme {
  return MODE_THEMES[mode];
}
