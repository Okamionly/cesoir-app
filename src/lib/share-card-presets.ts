/**
 * Profile Share Card gradient presets.
 *
 * 4 user-pickable gradient identities for exported profile cards.
 * Product-semantic brand values (not UI surface tokens).
 */

export interface ShareCardGradientPreset {
  id: string;
  name: string;
  from: string;
  to: string;
}

export const SHARE_CARD_GRADIENT_PRESETS: ShareCardGradientPreset[] = [
  { id: "violet-green", name: "CeSoir", from: "#8B5CF6", to: "#00FF88" },
  { id: "pink-orange", name: "Sunset", from: "#EC4899", to: "#F97316" },
  { id: "blue-cyan", name: "Ocean", from: "#3B82F6", to: "#06B6D4" },
  { id: "amber-rose", name: "Dusk", from: "#F59E0B", to: "#F43F5E" },
];

// Neon card background surface — out-of-palette atmospheric dark.
export const SHARE_CARD_NEON_BG = "#0A0A0A";
