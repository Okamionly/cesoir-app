/**
 * SwipeCard brand colors — domain meta.
 *
 * Swipe action hues (LIKE = brand vert, NOPE = danger red) + tag accents.
 * Hardcoded here (not in design-tokens) because they encode the
 * swipe-gesture signal language used exclusively on the SwipeCard.
 *
 * @see src/components/app/SwipeCard.tsx
 */

// ─── Swipe action indicators ──────────────────────────────
export const LIKE_COLOR = "#00FF88";
export const NOPE_COLOR = "#ff4466";

// ─── Live-status dot (Dispo maintenant) ───────────────────
export const LIVE_COLOR = "#00FF88";

// ─── Profile tag accent variants ──────────────────────────
export type SwipeTagVariant = "accent" | "green" | "neutral";

export interface SwipeTagColors {
  bg: string;
  text: string;
}

export const SWIPE_TAG_COLORS: Record<SwipeTagVariant, SwipeTagColors> = {
  // Event tag — violet accent
  accent: {
    bg: "bg-[#8B5CF6]/15",
    text: "text-[#8B5CF6]",
  },
  // Safe Space — vert accent
  green: {
    bg: "bg-[#00FF88]/15",
    text: "text-[#00FF88]",
  },
  // Default — white/8 / white/70
  neutral: {
    bg: "bg-white/8",
    text: "text-white/70",
  },
};

// ─── Language detail chips ────────────────────────────────
// Speaks = cyan, Learns = violet
export const LANGUAGE_SPEAKS_COLOR = "#06b6d4";
export const LANGUAGE_LEARNS_COLOR = "#8B5CF6";
