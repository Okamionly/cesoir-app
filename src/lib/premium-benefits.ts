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
    title: "Voir qui t'a like",
    description: "Decouvre qui s'interesse a toi avant meme de swiper.",
  },
  {
    icon: "💚",
    iconColor: "var(--color-accent-2)",
    title: "Likes illimites",
    description: "Plus aucune limite. Like autant que tu veux, chaque soir.",
  },
  {
    icon: "↩️",
    iconColor: "#3B82F6",
    title: "Retour en arriere",
    description: "Tu as passe quelqu'un trop vite ? Reviens en arriere.",
  },
  {
    icon: "🚀",
    iconColor: "var(--color-warn)",
    title: "Boost profil 1x/semaine",
    description: "Ton profil en tete pendant 30 minutes, chaque semaine.",
  },
  {
    icon: "👻",
    iconColor: "#9CA3AF",
    title: "Mode Invisible",
    description: "Navigue sans etre vu. Toi seul decides qui te voit.",
  },
  {
    icon: "👑",
    iconColor: "var(--color-warn)",
    title: "Badge Premium exclusif",
    description: "Un badge dore qui te distingue sur tous les profils.",
  },
] as const;
