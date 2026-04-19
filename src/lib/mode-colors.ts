/**
 * Per-mode brand colors — domain meta array.
 *
 * These hex values encode product-specific mode identity (per CeSoir mode),
 * NOT UI surface tokens. They must not be mapped to the W&B palette.
 *
 * @see lib/design-tokens.ts — canonical UI surface tokens (bg, text, accent…)
 * @see lib/modes.ts — mode definitions with matching semantics
 */
export const MODE_COLORS: Record<string, string> = {
  "solo-diner": "#8B5CF6",
  "plus-one": "#EC4899",
  "tourist": "#06B6D4",
  "night-owl": "#6366F1",
  "breakup": "#22C55E",
  "new-in-town": "#F59E0B",
  "langue": "#06B6D4",
  "dog-date": "#F59E0B",
  "seasonal": "#EF4444",
  "fit-date": "#F97316",
  "foodie-quest": "#DC2626",
  "culture-club": "#7C3AED",
  "sober-tonight": "#059669",
  "gamer-night": "#2563EB",
};
