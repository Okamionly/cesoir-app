/**
 * Nightly vibe / mood picker — Wave 17 (mig 039, 2026-04-28).
 *
 * Each user can pick ONE vibe per day to advertise their mood:
 *   - drives a small social-score bonus when both peers share the vibe
 *   - shows as a chip on swipe cards
 *   - resets at UTC midnight (handled by get_vibe_today RPC, no cron)
 *
 * The set is intentionally short (5 entries) so the picker fits in a
 * single non-scrolling row on a 390px viewport (flex-1 distribution,
 * same pattern as the Soirées date carousel in EventFilters v3).
 */

/** Canonical id stored in profiles.vibe_today. */
export type VibeId = "chill" | "festif" | "calme" | "aventure" | "surprise";

export interface Vibe {
  id: VibeId;
  /** Display label (FR). */
  label: string;
  /** Single-emoji glyph used as the chip icon. */
  emoji: string;
  /** Accent colour used for the gradient ring + chip background. */
  color: string;
}

export const VIBES: Vibe[] = [
  { id: "chill",     label: "Chill",     emoji: "\u{1F60C}", color: "#06B6D4" }, // 😌
  { id: "festif",    label: "Festif",    emoji: "\u{1F389}", color: "#EC4899" }, // 🎉
  { id: "calme",     label: "Calme",     emoji: "\u{1F33F}", color: "#10B981" }, // 🌿
  { id: "aventure",  label: "Aventure",  emoji: "\u{1F31F}", color: "#F59E0B" }, // 🌟
  { id: "surprise",  label: "Surprise",  emoji: "\u{1F3AD}", color: "#8B5CF6" }, // 🎭
];

/** Lookup helper — returns null for unknown ids (defensive). */
export function getVibe(id: string | null | undefined): Vibe | null {
  if (!id) return null;
  return VIBES.find((v) => v.id === id) ?? null;
}
