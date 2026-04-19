/**
 * Story Creator gradient presets.
 *
 * 6 user-pickable gradient backgrounds for "Creer une story" flow.
 * These are product-semantic brand values (not UI surface tokens) —
 * each represents a distinct visual identity users can pick for their
 * story post.
 */

export interface StoryGradientPreset {
  name: string;
  value: string;
  from: string;
  to: string;
}

export const STORY_GRADIENT_PRESETS: StoryGradientPreset[] = [
  { name: "Violet", value: "linear-gradient(135deg, #8B5CF6, #6D28D9)", from: "#8B5CF6", to: "#6D28D9" },
  { name: "Vert", value: "linear-gradient(135deg, #00FF88, #059669)", from: "#00FF88", to: "#059669" },
  { name: "Bleu", value: "linear-gradient(135deg, #3B82F6, #1D4ED8)", from: "#3B82F6", to: "#1D4ED8" },
  { name: "Rose", value: "linear-gradient(135deg, #EC4899, #DB2777)", from: "#EC4899", to: "#DB2777" },
  { name: "Ambre", value: "linear-gradient(135deg, #F59E0B, #D97706)", from: "#F59E0B", to: "#D97706" },
  { name: "Teal", value: "linear-gradient(135deg, #06B6D4, #0891B2)", from: "#06B6D4", to: "#0891B2" },
];
