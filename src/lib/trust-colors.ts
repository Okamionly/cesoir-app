/**
 * Trust score color semantics.
 *
 * Tier-based colors for TrustBadge, TrustGauge, TrustedCircle.
 * These encode product semantics (reputation tier → color) and are
 * NOT UI surface tokens.
 */

// Base hex palette for trust tiers
export const TRUST_COLORS = {
  // Tier colors
  safe: "#00FF88",   // >= 70 score
  warn: "#F59E0B",   // 40-69 score
  danger: "#EF4444", // < 40 score
  // TrustedCircle specific
  trusted: "#22c55e",
  // TrustGauge breakdown categories
  category: {
    verification: "#3B82F6",
    reviews: "#8B5CF6",
    activity: "#00FF88",
    profile: "#F59E0B",
    community: "#EC4899",
  },
  // Gradient stops for score arc
  gradient: {
    safe: ["#00FF88", "#10B981"] as [string, string],
    warn: ["#F59E0B", "#F97316"] as [string, string],
    danger: ["#EF4444", "#DC2626"] as [string, string],
  },
} as const;

export interface TrustBreakdownItem {
  label: string;
  points: number;
  maxPoints: number;
  color: string;
  tip: string;
}

export const DEFAULT_TRUST_BREAKDOWN: TrustBreakdownItem[] = [
  {
    label: "Vérification",
    points: 0,
    maxPoints: 25,
    color: TRUST_COLORS.category.verification,
    tip: "Vérifie ton profil par selfie, téléphone et vidéo",
  },
  {
    label: "Avis",
    points: 0,
    maxPoints: 25,
    color: TRUST_COLORS.category.reviews,
    tip: "Reçois des avis positifs après tes rencontres",
  },
  {
    label: "Activité",
    points: 0,
    maxPoints: 20,
    color: TRUST_COLORS.category.activity,
    tip: "Sois actif régulièrement sur l'app",
  },
  {
    label: "Profil",
    points: 0,
    maxPoints: 15,
    color: TRUST_COLORS.category.profile,
    tip: "Complète toutes les sections de ton profil",
  },
  {
    label: "Communauté",
    points: 0,
    maxPoints: 15,
    color: TRUST_COLORS.category.community,
    tip: "Participe aux événements et invite des garants",
  },
];

export function getTrustScoreColor(score: number): string {
  if (score >= 70) return TRUST_COLORS.safe;
  if (score >= 40) return TRUST_COLORS.warn;
  return TRUST_COLORS.danger;
}

export function getTrustScoreGradient(score: number): [string, string] {
  if (score >= 70) return TRUST_COLORS.gradient.safe;
  if (score >= 40) return TRUST_COLORS.gradient.warn;
  return TRUST_COLORS.gradient.danger;
}

export interface TrustTierStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
}

export function getTrustTierStyle(score: number): TrustTierStyle {
  if (score >= 80) {
    return {
      label: "Fiable",
      bg: "rgba(0,255,136,0.12)",
      text: TRUST_COLORS.safe,
      border: "rgba(0,255,136,0.3)",
    };
  }
  if (score >= 60) {
    return {
      label: "Moyen",
      bg: "rgba(245,158,11,0.12)",
      text: TRUST_COLORS.warn,
      border: "rgba(245,158,11,0.3)",
    };
  }
  return {
    label: "Nouveau",
    bg: "rgba(239,68,68,0.12)",
    text: TRUST_COLORS.danger,
    border: "rgba(239,68,68,0.3)",
  };
}
