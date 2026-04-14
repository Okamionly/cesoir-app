export type ModeKey =
  | "solo-diner"
  | "plus-one"
  | "tourist"
  | "night-owl"
  | "breakup"
  | "new-in-town"
  | "langue"
  | "dog-date"
  | "seasonal"
  | "fit-date"
  | "foodie-quest"
  | "culture-club"
  | "sober-tonight"
  | "gamer-night";

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
    tags: ["Sushi", "Italien", "Libanais", "Francais", "Indien"],
  },
  "plus-one": {
    key: "plus-one",
    icon: "🎬",
    name: "Plus-One",
    color: "#ec4899",
    description: "Besoin d'un +1 pour un event ce soir ? Poste ton invitation.",
    badge: "Trending",
    badgeColor: "pink",
    tags: ["Soiree", "Concert", "Cinema", "Vernissage"],
  },
  tourist: {
    key: "tourist",
    icon: "✈️",
    name: "Tourist Tonight",
    color: "#06b6d4",
    description: "De passage ? Les locaux t'accueillent pour une soiree authentique.",
    tags: ["Local Guide", "Expat", "Business Trip"],
  },
  "night-owl": {
    key: "night-owl",
    icon: "🌙",
    name: "Night Owl",
    color: "#6366f1",
    description: "Pour les noctambules. Ce mode pulse apres 23h.",
    badge: "23h+",
    badgeColor: "indigo",
    tags: ["Kebab", "Balade 2h", "Bar late", "Insomnie"],
  },
  breakup: {
    key: "breakup",
    icon: "💜",
    name: "Breakup Recovery",
    color: "#22c55e",
    description: "Zero pression. Juste quelqu'un pour parler ce soir.",
    badge: "Safe Space",
    badgeColor: "green",
    tags: ["Ecoute", "Pas romantique", "Glace + film"],
  },
  "new-in-town": {
    key: "new-in-town",
    icon: "📦",
    name: "New in Town",
    color: "#f59e0b",
    description: "Tu connais personne ? Les ambassadeurs locaux te guident.",
    tags: ["Decouverte", "Bons plans", "Integration"],
  },
  langue: {
    key: "langue",
    icon: "🌐",
    name: "Langue Exchange",
    color: "#06b6d4",
    description: "Pratique une langue autour d'un verre ce soir.",
    tags: ["Anglais", "Espagnol", "Arabe", "Japonais"],
  },
  "dog-date": {
    key: "dog-date",
    icon: "🐶",
    name: "Dog Date",
    color: "#f59e0b",
    description: "Ton chien est le meilleur wingman. Balade ensemble.",
    badge: "Fan fav",
    badgeColor: "pink",
    tags: ["Golden", "Bouledogue", "Berger", "Caniche"],
  },
  seasonal: {
    key: "seasonal",
    icon: "🎄",
    name: "Seasonal Emergency",
    color: "#ef4444",
    description: "Noel seul ? Nouvel An seul ? Saint-Valentin seul ? Plus jamais.",
    badge: "Prochain event",
    badgeColor: "amber",
    tags: ["Noel", "Nouvel An", "Saint-Valentin"],
  },
  "fit-date": {
    key: "fit-date",
    icon: "💪",
    name: "Fit Date",
    color: "#f97316",
    description: "Trouve un partenaire de sport ce soir. Running, yoga, escalade...",
    badge: "Nouveau",
    badgeColor: "pink",
    tags: ["Running", "Yoga", "Escalade", "Crossfit", "Natation"],
  },
  "foodie-quest": {
    key: "foodie-quest",
    icon: "🔥",
    name: "Foodie Quest",
    color: "#dc2626",
    description: "Aventure culinaire a deux. Decouvre un restau que personne ne connait.",
    badge: "Trending",
    badgeColor: "pink",
    tags: ["Street Food", "Gastronomie", "Brunch", "Cuisine du monde"],
  },
  "culture-club": {
    key: "culture-club",
    icon: "🎭",
    name: "Culture Club",
    color: "#7c3aed",
    description: "Musee, expo, theatre, cinema d'auteur. Pour les esprits curieux.",
    tags: ["Expo", "Theatre", "Cinema", "Lecture", "Debat"],
  },
  "sober-tonight": {
    key: "sober-tonight",
    icon: "🍵",
    name: "Sober Tonight",
    color: "#059669",
    description: "Sorties 100% sans alcool. The, balade, jeux, patisserie.",
    badge: "Blue Ocean",
    badgeColor: "green",
    tags: ["Mocktails", "The", "Jeux", "Balade", "Patisserie"],
  },
  "gamer-night": {
    key: "gamer-night",
    icon: "🎮",
    name: "Gamer Night",
    color: "#2563eb",
    description: "Bar gaming, soiree JdR, LAN party, jeux de societe ce soir.",
    tags: ["JdR", "Bar Gaming", "Console", "Board Games", "E-sport"],
  },
};

export const MODE_KEYS = Object.keys(MODES) as ModeKey[];
