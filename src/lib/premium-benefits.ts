/**
 * Premium-benefits domain-meta array.
 *
 * Most icon colors route through CSS design tokens (var(--color-accent),
 * --color-accent-2, --color-warn). Two hex values remain raw because they
 * encode per-benefit semantics OUTSIDE the W&B palette:
 *   - Blue  #3B82F6 : "Retour en arriere" action (generic utility blue)
 *   - Gray  #9CA3AF : "Mode Invisible" stealth semantic
 *
 * @see lib/design-tokens.ts — canonical UI surface tokens
 */

export interface PremiumBenefit {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}

export const BENEFITS: readonly PremiumBenefit[] = [
  {
    icon: "👁️",
    iconColor: "var(--color-accent)",
    title: "Voir qui t'a liké",
    description: "Découvre qui s'intéresse à toi avant même de swiper.",
  },
  {
    icon: "💚",
    iconColor: "var(--color-accent-2)",
    title: "Likes illimités",
    description: "Plus aucune limite. Like autant que tu veux, chaque soir.",
  },
  {
    icon: "↩️",
    iconColor: "#3B82F6",
    title: "Retour en arrière",
    description: "Tu as passé quelqu'un trop vite ? Reviens en arrière.",
  },
  {
    icon: "🚀",
    iconColor: "var(--color-warn)",
    title: "Boost profil 1x/semaine",
    description: "Ton profil en tête pendant 30 minutes, chaque semaine.",
  },
  {
    icon: "👻",
    iconColor: "#9CA3AF",
    title: "Mode Invisible",
    description: "Navigue sans être vu. Toi seul décides qui te voit.",
  },
  {
    icon: "👑",
    iconColor: "var(--color-warn)",
    title: "Badge Premium exclusif",
    description: "Un badge doré qui te distingue sur tous les profils.",
  },
] as const;
