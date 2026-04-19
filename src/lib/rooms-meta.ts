/**
 * Rooms mode metadata — domain meta (labels + colors + icons + category).
 *
 * Hex values encode per-mode product identity (same semantics as
 * lib/modes.ts / lib/mode-colors.ts). NOT UI surface tokens.
 *
 * @see lib/design-tokens.ts — canonical UI surface tokens
 * @see lib/mode-colors.ts — hex-only version for map pins
 */

export type RoomModeCategory = "discussion" | "debat" | "ambiance";

export interface RoomModeMeta {
  label: string;
  color: string;
  icon: string;
  category: RoomModeCategory;
}

export function modeMeta(mode: string | null): RoomModeMeta {
  switch (mode) {
    case "night-owl":
      return { label: "Night Owl", color: "#6366f1", icon: "\uD83C\uDF19", category: "discussion" };
    case "culture-club":
      return { label: "Culture Club", color: "#7c3aed", icon: "\uD83C\uDFAD", category: "debat" };
    case "sober-tonight":
      return { label: "Sober Tonight", color: "#059669", icon: "\uD83C\uDF75", category: "ambiance" };
    case "plus-one":
      return { label: "Plus-One", color: "#ec4899", icon: "\uD83C\uDFAC", category: "discussion" };
    case "solo-diner":
      return { label: "Solo Diner", color: "#a855f7", icon: "\uD83C\uDF7D\uFE0F", category: "debat" };
    case "foodie-quest":
      return { label: "Foodie Quest", color: "#dc2626", icon: "\uD83D\uDD25", category: "ambiance" };
    default:
      return { label: "CeSoir", color: "#8B5CF6", icon: "\uD83C\uDF99\uFE0F", category: "discussion" };
  }
}

/**
 * Mode color constants for use in mock data (rooms/[id]/page.tsx).
 * Centralised so changes don't drift across files.
 */
export const ROOM_MODE_COLORS = {
  "night-owl": "#6366f1",
  "culture-club": "#7c3aed",
  "sober-tonight": "#059669",
  "plus-one": "#ec4899",
  "solo-diner": "#a855f7",
  "foodie-quest": "#dc2626",
  "default": "#8B5CF6",
} as const;
