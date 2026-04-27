// ==============================================================
// WAVE 15 — PMF FOCUS: 4 core modes only.
// User research Montpellier: 4 modes is the sweet spot for
// discovery + decision. 10 other modes killed (Wave 16+ revisit).
//
// KILLED (TODO WAVE-16):
//   - tourist          -> merge into "Plus-One" (event focus)
//   - breakup          -> feature complexity / liability
//   - new-in-town      -> merge into onboarding flow
//   - langue           -> blue ocean but <5% demand in MTP
//   - dog-date         -> niche, <3% demand
//   - seasonal         -> time-boxed, not core loop
//   - fit-date         -> niche, rebuild as activity filter
//   - sober-tonight    -> filter, not mode
//   - gamer-night      -> niche, rebuild as venue tag
//   - culture-club     -> merge into "Foodie Quest" umbrella
// ==============================================================

export type ModeKey =
  | "solo-diner"
  | "plus-one"
  | "night-owl"
  | "foodie-quest";

// TODO WAVE-16: killed modes (kept as type comments for reference)
// | "tourist" | "breakup" | "new-in-town" | "langue" | "dog-date"
// | "seasonal" | "fit-date" | "culture-club" | "sober-tonight"
// | "gamer-night";

export interface ModeDefinition {
  key: ModeKey;
  icon: string;
  name: string;
  color: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  tags: string[];
}

export const MODES: Record<ModeKey, ModeDefinition> = {
  "solo-diner": {
    key: "solo-diner",
    icon: "🍽️",
    name: "Solo Diner",
    color: "#a855f7",
    description: "Manger seul, c'est fini. Trouve quelqu'un pour partager un repas ce soir.",
    badge: "Populaire",
    tags: ["Sushi", "Italien", "Libanais", "Français", "Indien"],
  },
  "plus-one": {
    key: "plus-one",
    icon: "🎬",
    name: "Plus-One",
    color: "#ec4899",
    description: "Besoin d'un +1 pour un event ce soir ? Poste ton invitation.",
    badge: "Trending",
    badgeColor: "pink",
    tags: ["Soirée", "Concert", "Cinéma", "Vernissage"],
  },
  "night-owl": {
    key: "night-owl",
    icon: "🌙",
    name: "Night Owl",
    color: "#6366f1",
    description: "Pour les noctambules. Ce mode pulse après 23h.",
    badge: "23h+",
    badgeColor: "indigo",
    tags: ["Kebab", "Balade 2h", "Bar late", "Insomnie"],
  },
  "foodie-quest": {
    key: "foodie-quest",
    icon: "🔥",
    name: "Foodie Quest",
    color: "#dc2626",
    description: "Aventure culinaire à deux. Découvre un restau que personne ne connaît.",
    badge: "Trending",
    badgeColor: "pink",
    tags: ["Street Food", "Gastronomie", "Brunch", "Cuisine du monde"],
  },
};

export const MODE_KEYS = Object.keys(MODES) as ModeKey[];

// ==============================================================
// Legacy mode lookup — returns null for killed modes.
// Use to gracefully guard pages/URLs referencing old slugs.
// ==============================================================
export const LEGACY_MODE_KEYS = new Set<string>([
  "tourist",
  "breakup",
  "new-in-town",
  "langue",
  "dog-date",
  "seasonal",
  "fit-date",
  "culture-club",
  "sober-tonight",
  "gamer-night",
]);

export function isKilledMode(slug: string): boolean {
  return LEGACY_MODE_KEYS.has(slug);
}

export function isActiveMode(slug: string): slug is ModeKey {
  return slug in MODES;
}
