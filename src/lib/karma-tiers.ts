/**
 * Karma tier medals — domain meta.
 *
 * Tier colors encode achievement semantics (gold/silver) — not UI surface
 * tokens. The threshold scale maps a karma score (1-5) to a medal color
 * that renders identically across KarmaBadge and anywhere else a profile
 * karma tier needs to be shown.
 *
 * @see src/components/app/KarmaBadge.tsx
 * @see src/lib/badges.ts — broader badges catalog
 */

export type KarmaTierKey = "gold" | "silver" | "none";

export interface KarmaTier {
  key: KarmaTierKey;
  /** Minimum score (exclusive, >) to qualify for the tier */
  minScore: number;
  /** Medal ring color */
  color: string;
  /** Hex color with alpha suffix for 08 = 3% tinted background fill */
  tint: string;
}

// Warm amber gold and neutral silver — brand-metier palette for the
// karma system. Must not be mapped to the W&B theme.
const GOLD = "#F59E0B";
const SILVER = "#C0C0C0";

export const KARMA_TIERS: Record<KarmaTierKey, KarmaTier> = {
  gold: {
    key: "gold",
    minScore: 4.5,
    color: GOLD,
    tint: `${GOLD}08`,
  },
  silver: {
    key: "silver",
    minScore: 4.0,
    color: SILVER,
    tint: `${SILVER}08`,
  },
  none: {
    key: "none",
    minScore: 0,
    color: "transparent",
    tint: "transparent",
  },
};

/** Star glyph color — always gold, regardless of tier. */
export const KARMA_STAR_COLOR = GOLD;

/**
 * Return the karma tier for a given score.
 *  - score > 4.5  → gold
 *  - score > 4.0  → silver
 *  - otherwise    → none
 */
export function getKarmaTier(score: number): KarmaTier {
  if (score > KARMA_TIERS.gold.minScore) return KARMA_TIERS.gold;
  if (score > KARMA_TIERS.silver.minScore) return KARMA_TIERS.silver;
  return KARMA_TIERS.none;
}
