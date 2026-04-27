// ---------- Badge System — 30 Badges across 6 Categories ----------

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export type BadgeCategory =
  | "social"
  | "explorer"
  | "streak"
  | "safety"
  | "quality"
  | "special";

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: BadgeCategory;
  requirement: string;
  rarity: BadgeRarity;
  xp: number;
}

// ─────────────────────────────────────────
// RARITY CONFIG — colors and labels
// ─────────────────────────────────────────

export const RARITY_CONFIG: Record<
  BadgeRarity,
  { label: string; borderColor: string; glowColor: string }
> = {
  common: {
    label: "Commun",
    borderColor: "#6b7280", // gray
    glowColor: "rgba(107,114,128,0.3)",
  },
  rare: {
    label: "Rare",
    borderColor: "#3b82f6", // blue
    glowColor: "rgba(59,130,246,0.4)",
  },
  epic: {
    label: "Épique",
    borderColor: "#8B5CF6", // purple
    glowColor: "rgba(139,92,246,0.5)",
  },
  legendary: {
    label: "Légendaire",
    borderColor: "#f59e0b", // gold
    glowColor: "rgba(245,158,11,0.6)",
  },
};

// ─────────────────────────────────────────
// CATEGORY CONFIG
// ─────────────────────────────────────────

export const CATEGORY_CONFIG: Record<
  BadgeCategory,
  { label: string; icon: string }
> = {
  social: { label: "Social", icon: "💜" },
  explorer: { label: "Explorateur", icon: "🌍" },
  streak: { label: "Streak", icon: "🔥" },
  safety: { label: "Sécurité", icon: "🛡️" },
  quality: { label: "Qualité", icon: "⭐" },
  special: { label: "Spécial", icon: "✨" },
};

// ─────────────────────────────────────────
// ALL 30 BADGES
// ─────────────────────────────────────────

export const ALL_BADGES: Badge[] = [
  // ── Social (6) ──
  {
    id: "premier-match",
    name: "Premier Match",
    emoji: "💜",
    description: "Ton tout premier match",
    category: "social",
    requirement: "Obtenir son premier match",
    rarity: "common",
    xp: 50,
  },
  {
    id: "papillon-social",
    name: "Papillon Social",
    emoji: "🦋",
    description: "10 matchs en une semaine",
    category: "social",
    requirement: "10 matchs dans la même semaine",
    rarity: "rare",
    xp: 150,
  },
  {
    id: "ambassadeur",
    name: "Ambassadeur",
    emoji: "📢",
    description: "Invite 5 amis qui rejoignent",
    category: "social",
    requirement: "5 parrainages confirmés",
    rarity: "epic",
    xp: 300,
  },
  {
    id: "populaire",
    name: "Populaire",
    emoji: "⭐",
    description: "Reçois 10 likes en un jour",
    category: "social",
    requirement: "10 likes reçus en 24h",
    rarity: "rare",
    xp: 200,
  },
  {
    id: "connecteur",
    name: "Connecteur",
    emoji: "🤝",
    description: "Match dans 5 modes différents",
    category: "social",
    requirement: "Matcher dans 5 modes distincts",
    rarity: "epic",
    xp: 250,
  },
  {
    id: "cent-matchs",
    name: "Cent Matchs",
    emoji: "💯",
    description: "Atteins 100 matchs au total",
    category: "social",
    requirement: "Accumuler 100 matchs",
    rarity: "legendary",
    xp: 500,
  },

  // ── Explorer (6) ──
  {
    id: "globe-trotter",
    name: "Globe-Trotter",
    emoji: "🌍",
    description: "Essaie les 4 modes",
    category: "explorer",
    requirement: "Activer chacun des 4 modes au moins une fois",
    rarity: "epic",
    xp: 300,
  },
  {
    id: "noctambule",
    name: "Noctambule",
    emoji: "🌙",
    description: "Actif après minuit 10 fois",
    category: "explorer",
    requirement: "10 sessions après 0h",
    rarity: "rare",
    xp: 150,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    emoji: "🌅",
    description: "Premier à activer un mode à 18h",
    category: "explorer",
    requirement: "Activer un mode dans la première minute après 18h",
    rarity: "rare",
    xp: 100,
  },
  {
    id: "routard",
    name: "Routard",
    emoji: "🗺️",
    description: "Visite 10 quartiers différents",
    category: "explorer",
    requirement: "Check-in dans 10 quartiers",
    rarity: "epic",
    xp: 250,
  },
  {
    id: "foodie-certifie",
    name: "Foodie Certifié",
    emoji: "🍽️",
    description: "10 soirées en mode Foodie Quest",
    category: "explorer",
    requirement: "Compléter 10 soirées Foodie Quest",
    rarity: "rare",
    xp: 200,
  },
  {
    id: "culture-vulture",
    name: "Culture Vulture",
    emoji: "🎭",
    description: "5 soirées en mode Culture Club",
    category: "explorer",
    requirement: "Compléter 5 soirées Culture Club",
    rarity: "rare",
    xp: 150,
  },

  // ── Streak (6) ──
  {
    id: "trois-jours",
    name: "3 Jours",
    emoji: "🔥",
    description: "Streak de 3 jours",
    category: "streak",
    requirement: "Maintenir un streak de 3 jours consécutifs",
    rarity: "common",
    xp: 50,
  },
  {
    id: "semaine-parfaite",
    name: "Semaine Parfaite",
    emoji: "💪",
    description: "Streak de 7 jours",
    category: "streak",
    requirement: "Maintenir un streak de 7 jours consécutifs",
    rarity: "rare",
    xp: 150,
  },
  {
    id: "deux-semaines",
    name: "Deux Semaines",
    emoji: "🏆",
    description: "Streak de 14 jours",
    category: "streak",
    requirement: "Maintenir un streak de 14 jours consécutifs",
    rarity: "epic",
    xp: 300,
  },
  {
    id: "mois-legendaire",
    name: "Mois Légendaire",
    emoji: "👑",
    description: "Streak de 30 jours",
    category: "streak",
    requirement: "Maintenir un streak de 30 jours consécutifs",
    rarity: "legendary",
    xp: 500,
  },
  {
    id: "sans-relache",
    name: "Sans Relâche",
    emoji: "⚡",
    description: "Ne jamais casser son streak pendant 2 mois",
    category: "streak",
    requirement: "60 jours de streak sans interruption",
    rarity: "legendary",
    xp: 750,
  },
  {
    id: "habitue",
    name: "Habitué",
    emoji: "🎯",
    description: "Se connecter 100 jours au total",
    category: "streak",
    requirement: "Accumuler 100 jours de connexion",
    rarity: "epic",
    xp: 400,
  },

  // ── Safety (4) ──
  {
    id: "verifie",
    name: "Vérifié",
    emoji: "✅",
    description: "Profil vérifié par selfie",
    category: "safety",
    requirement: "Compléter la vérification de profil",
    rarity: "common",
    xp: 50,
  },
  {
    id: "ange-gardien",
    name: "Ange Gardien",
    emoji: "😇",
    description: "Configurer les contacts de confiance",
    category: "safety",
    requirement: "Ajouter au moins un contact de confiance",
    rarity: "common",
    xp: 50,
  },
  {
    id: "bon-citoyen",
    name: "Bon Citoyen",
    emoji: "🛡️",
    description: "Signaler 3 faux profils",
    category: "safety",
    requirement: "3 signalements confirmés de faux profils",
    rarity: "rare",
    xp: 150,
  },
  {
    id: "check-in-pro",
    name: "Check-In Pro",
    emoji: "📍",
    description: "Utiliser le check-in 20 fois",
    category: "safety",
    requirement: "20 check-ins effectués",
    rarity: "rare",
    xp: 200,
  },

  // ── Quality (4) ──
  {
    id: "top-rated",
    name: "Top Rated",
    emoji: "⭐",
    description: "Note moyenne de 4.5+",
    category: "quality",
    requirement: "Maintenir une note moyenne supérieure à 4.5",
    rarity: "epic",
    xp: 300,
  },
  {
    id: "gentleman-lady",
    name: "Gentleman/Lady",
    emoji: "🎩",
    description: "5 avis avec le tag respectueux",
    category: "quality",
    requirement: "Recevoir 5 reviews mentionnant 'respectueux'",
    rarity: "rare",
    xp: 200,
  },
  {
    id: "ponctuel",
    name: "Ponctuel",
    emoji: "⏰",
    description: "10 avis avec le tag ponctuel",
    category: "quality",
    requirement: "Recevoir 10 reviews mentionnant 'ponctuel'",
    rarity: "rare",
    xp: 200,
  },
  {
    id: "bavard-pro",
    name: "Bavard Pro",
    emoji: "💬",
    description: "Envoyer 500 messages",
    category: "quality",
    requirement: "Accumuler 500 messages envoyés",
    rarity: "epic",
    xp: 250,
  },

  // ── Special (4) ──
  {
    id: "fondateur",
    name: "Fondateur",
    emoji: "🏛️",
    description: "Inscrit pendant la bêta",
    category: "special",
    requirement: "Avoir rejoint CeSoir pendant la phase bêta",
    rarity: "legendary",
    xp: 500,
  },
  {
    id: "saisonnier",
    name: "Saisonnier",
    emoji: "🎄",
    description: "Actif pendant les fêtes",
    category: "special",
    requirement: "Se connecter pendant la période des fêtes (20-31 déc)",
    rarity: "common",
    xp: 75,
  },
  {
    id: "midnight-king",
    name: "Midnight King",
    emoji: "👑",
    description: "En ligne exactement à minuit",
    category: "special",
    requirement: "Être connecté à 00:00 pile",
    rarity: "rare",
    xp: 100,
  },
  {
    id: "lucky-match",
    name: "Lucky Match",
    emoji: "🍀",
    description: "Match dans les 5 minutes après activation",
    category: "special",
    requirement: "Matcher moins de 5 minutes après avoir activé un mode",
    rarity: "epic",
    xp: 200,
  },
  // 2026-04-26 — Hybrid invite reward badge (mig 025).
  // Granted server-side by claim_invite_code RPC when a user signs up
  // via /signup-quick?invite=XXX. The id MUST match the achievement_key
  // string inserted in mig 025 ('founder') — useBadges resolves earned
  // status by matching badge.id against achievements.achievement_key.
  {
    id: "founder",
    name: "Founder",
    emoji: "☾",
    description: "Tu fais partie des premiers, arrivé via une invitation",
    category: "special",
    requirement: "S'inscrire avec un code d'invitation valide",
    rarity: "legendary",
    xp: 100,
  },
  // 2026-04-27 — "Vu ce soir" IRL meet badge (mig 032 + /api/match/confirm-irl).
  // Granted server-side when BOTH participants of a conversation
  // confirm via /api/match/confirm-irl within 48h after plan_time + 2h.
  // The id MUST match the achievement_key string inserted by the API
  // route ('first-date') — useBadges resolves earned status by matching
  // badge.id against achievements.achievement_key.
  {
    id: "first-date",
    name: "Premier RDV IRL",
    emoji: "🎉",
    description: "T'as vu quelqu'un en vrai (et lui aussi a confirmé)",
    category: "social",
    requirement: "Les deux personnes confirment s'être vues IRL après un plan",
    rarity: "rare",
    xp: 200,
  },
];

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

/** Lookup a badge by id */
export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

/** Get all badges for a given category */
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return ALL_BADGES.filter((b) => b.category === category);
}

/** Get all badges grouped by category */
export function getBadgesGrouped(): Record<BadgeCategory, Badge[]> {
  const grouped: Record<BadgeCategory, Badge[]> = {
    social: [],
    explorer: [],
    streak: [],
    safety: [],
    quality: [],
    special: [],
  };
  for (const badge of ALL_BADGES) {
    grouped[badge.category].push(badge);
  }
  return grouped;
}

/** Get total XP from a list of badge ids */
export function getTotalBadgeXP(earnedIds: string[]): number {
  return earnedIds.reduce((sum, id) => {
    const badge = getBadgeById(id);
    return sum + (badge?.xp ?? 0);
  }, 0);
}
