import type { ModeKey } from "./modes";
import { isActiveMode } from "./modes";

// Wave 15 PMF focus: DATE_IDEAS below were authored when 14 modes existed.
// Legacy mode slugs (tourist, breakup, etc.) are still present in the `modes`
// arrays for historical reference, but filtered out at read time so only
// active 4 modes are exposed to filters. TODO WAVE-16: prune legacy slugs.

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type DateCategory =
  | "diner"
  | "verre"
  | "culture"
  | "aventure"
  | "balade"
  | "chill"
  | "sport";

export type PriceRange = "gratuit" | "€" | "€€" | "€€€";

export type BestTime = "apres-midi" | "aperitif" | "soiree" | "nuit" | "any";

export interface DateIdea {
  id: string;
  title: string;
  category: DateCategory;
  emoji: string;
  /** Authored with legacy 14-mode vocabulary; filtered at read time. */
  modes: string[];
  duration: string;
  priceRange: PriceRange;
  bestTime: BestTime;
  description: string;
}

/** Returns only the active ModeKey entries from a legacy modes array. */
function activeModes(modes: string[]): ModeKey[] {
  return modes.filter(isActiveMode);
}

// ─────────────────────────────────────────
// Category metadata
// ─────────────────────────────────────────

export const CATEGORY_META: Record<
  DateCategory,
  { label: string; emoji: string; color: string }
> = {
  diner: { label: "Diner", emoji: "🍽️", color: "#f59e0b" },
  verre: { label: "Verre", emoji: "🍸", color: "#ec4899" },
  culture: { label: "Culture", emoji: "🎭", color: "#8B5CF6" },
  aventure: { label: "Aventure", emoji: "🎯", color: "#ef4444" },
  balade: { label: "Balade", emoji: "🚶", color: "#06b6d4" },
  chill: { label: "Chill", emoji: "☕", color: "#22c55e" },
  sport: { label: "Sport", emoji: "💪", color: "#f97316" },
};

export const ALL_CATEGORIES: DateCategory[] = [
  "diner",
  "verre",
  "culture",
  "aventure",
  "balade",
  "chill",
  "sport",
];

// ─────────────────────────────────────────
// 50 Date Ideas
// ─────────────────────────────────────────

export const DATE_IDEAS: DateIdea[] = [
  // ── Diner (8) ──────────────────────────
  {
    id: "d-01",
    title: "Restaurant japonais",
    category: "diner",
    emoji: "🍣",
    modes: ["solo-diner", "plus-one", "foodie-quest", "tourist"],
    duration: "1h30",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "Sushi, ramen ou izakaya — laisse-toi porter par les saveurs du Japon. Parfait pour une premiere rencontre detendue.",
  },
  {
    id: "d-02",
    title: "Pizzeria artisanale",
    category: "diner",
    emoji: "🍕",
    modes: ["solo-diner", "plus-one", "new-in-town", "gamer-night"],
    duration: "1h",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Four a bois, pate maison, mozza qui file. La pizza artisanale, c'est toujours une bonne idee.",
  },
  {
    id: "d-03",
    title: "Food court",
    category: "diner",
    emoji: "🌮",
    modes: ["solo-diner", "new-in-town", "tourist", "foodie-quest"],
    duration: "1h",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Chacun choisit son plat, on partage la table. Ideal pour decouvrir plusieurs cuisines en une soiree.",
  },
  {
    id: "d-04",
    title: "Brunch tardif",
    category: "diner",
    emoji: "🥞",
    modes: ["solo-diner", "breakup", "sober-tonight", "dog-date"],
    duration: "1h30",
    priceRange: "€€",
    bestTime: "apres-midi",
    description:
      "Pancakes, avocado toast et cafe de specialite. Le brunch sans pression un dimanche apres-midi.",
  },
  {
    id: "d-05",
    title: "Cuisine du monde",
    category: "diner",
    emoji: "🌍",
    modes: ["solo-diner", "tourist", "langue", "foodie-quest"],
    duration: "1h30",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "Ethiopien, peruvien, coreen... Choisis une cuisine que tu n'as jamais testee. Aventure garantie.",
  },
  {
    id: "d-06",
    title: "Bistrot francais",
    category: "diner",
    emoji: "🥘",
    modes: ["solo-diner", "plus-one", "tourist", "new-in-town"],
    duration: "2h",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "Plat du jour, vin naturel, ambiance méridionale. Le classique indémodable pour bien manger.",
  },
  {
    id: "d-07",
    title: "Street food tour",
    category: "diner",
    emoji: "🥙",
    modes: ["foodie-quest", "tourist", "new-in-town", "night-owl"],
    duration: "2h",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Balade de stand en stand. Kebab, crepes, bao, tacos — mange en marchant, decouvre le quartier.",
  },
  {
    id: "d-08",
    title: "Diner mystere",
    category: "diner",
    emoji: "🎭",
    modes: ["plus-one", "foodie-quest", "solo-diner"],
    duration: "2h",
    priceRange: "€€€",
    bestTime: "soiree",
    description:
      "L'adresse est revelee 30min avant. Menu surprise, lieu secret. Pour les aventuriers culinaires.",
  },

  // ── Verre (8) ──────────────────────────
  {
    id: "v-01",
    title: "Bar a cocktails",
    category: "verre",
    emoji: "🍹",
    modes: ["plus-one", "night-owl", "tourist", "new-in-town"],
    duration: "2h",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "Mixologues, ambiance feutree, cocktails signatures. L'endroit parfait pour une soiree raffinee.",
  },
  {
    id: "v-02",
    title: "Rooftop",
    category: "verre",
    emoji: "🌆",
    modes: ["plus-one", "tourist", "seasonal", "night-owl"],
    duration: "2h",
    priceRange: "€€€",
    bestTime: "aperitif",
    description:
      "Vue sur les toits, sunset, musique chill. Le rooftop montpelliérain pour une soiree en hauteur.",
  },
  {
    id: "v-03",
    title: "Cave a vin",
    category: "verre",
    emoji: "🍷",
    modes: ["solo-diner", "plus-one", "culture-club", "foodie-quest"],
    duration: "1h30",
    priceRange: "€€",
    bestTime: "aperitif",
    description:
      "Degustation guidee, planches de fromages, vins naturels. Apprends en sirotant.",
  },
  {
    id: "v-04",
    title: "Bar a biere artisanale",
    category: "verre",
    emoji: "🍺",
    modes: ["gamer-night", "new-in-town", "plus-one", "night-owl"],
    duration: "2h",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "IPA, stout, sour — decouvre les brasseries locales dans une ambiance decontractee.",
  },
  {
    id: "v-05",
    title: "Bar speakeasy",
    category: "verre",
    emoji: "🕵️",
    modes: ["night-owl", "plus-one", "tourist"],
    duration: "2h",
    priceRange: "€€€",
    bestTime: "nuit",
    description:
      "Porte cachee, mot de passe, atmosphere prohibition. Le secret le mieux garde du quartier.",
  },
  {
    id: "v-06",
    title: "Bar musical",
    category: "verre",
    emoji: "🎵",
    modes: ["night-owl", "plus-one", "culture-club", "new-in-town"],
    duration: "2h30",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "Jazz live, DJ set ou open mic. La musique cree la connexion sans forcer la conversation.",
  },
  {
    id: "v-07",
    title: "Karaoke",
    category: "verre",
    emoji: "🎤",
    modes: ["gamer-night", "plus-one", "breakup", "night-owl"],
    duration: "2h",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "Cabine privee, playlist illimitee, zero jugement. Chante faux, ris fort.",
  },
  {
    id: "v-08",
    title: "Pub quiz",
    category: "verre",
    emoji: "🧠",
    modes: ["gamer-night", "langue", "new-in-town", "plus-one"],
    duration: "2h",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Forme ton equipe, reponds aux questions, gagne une tournee. Le quiz du mardi soir.",
  },

  // ── Culture (8) ────────────────────────
  {
    id: "c-01",
    title: "Expo temporaire",
    category: "culture",
    emoji: "🖼️",
    modes: ["culture-club", "tourist", "sober-tonight", "plus-one"],
    duration: "1h30",
    priceRange: "€€",
    bestTime: "apres-midi",
    description:
      "Nocturne au musee ou expo photo. L'art ouvre les conversations comme rien d'autre.",
  },
  {
    id: "c-02",
    title: "Cinema indie",
    category: "culture",
    emoji: "🎬",
    modes: ["culture-club", "plus-one", "sober-tonight", "breakup"],
    duration: "2h30",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Film d'auteur dans une salle intimiste. Debriefing au cafe d'a cote apres la seance.",
  },
  {
    id: "c-03",
    title: "Theatre improvise",
    category: "culture",
    emoji: "🎭",
    modes: ["culture-club", "plus-one", "langue", "new-in-town"],
    duration: "1h30",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Spectacle d'impro ou le public decide. Fous rires garantis, zero pretention.",
  },
  {
    id: "c-04",
    title: "Concert intime",
    category: "culture",
    emoji: "🎶",
    modes: ["plus-one", "night-owl", "culture-club"],
    duration: "2h",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "Petite salle, artiste emergent, acoustique parfaite. La magie d'un live a taille humaine.",
  },
  {
    id: "c-05",
    title: "Open mic",
    category: "culture",
    emoji: "🎙️",
    modes: ["culture-club", "night-owl", "langue", "new-in-town"],
    duration: "2h",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Poesie, stand-up, chant... Monte sur scene ou reste dans le public. L'audace est recompensee.",
  },
  {
    id: "c-06",
    title: "Galerie d'art",
    category: "culture",
    emoji: "🎨",
    modes: ["culture-club", "tourist", "sober-tonight"],
    duration: "1h",
    priceRange: "gratuit",
    bestTime: "apres-midi",
    description:
      "Vernissage ou visite libre. L'art contemporain comme pretexte a la discussion.",
  },
  {
    id: "c-07",
    title: "Lecture publique",
    category: "culture",
    emoji: "📖",
    modes: ["culture-club", "sober-tonight", "langue"],
    duration: "1h30",
    priceRange: "gratuit",
    bestTime: "soiree",
    description:
      "Auteur en dedicace, lecture a voix haute, debat litteraire. Pour les esprits curieux.",
  },
  {
    id: "c-08",
    title: "Spectacle de rue",
    category: "culture",
    emoji: "🤹",
    modes: ["tourist", "dog-date", "new-in-town", "sober-tonight"],
    duration: "1h",
    priceRange: "gratuit",
    bestTime: "aperitif",
    description:
      "Jongleurs, musiciens, performeurs. La rue comme scene, le quartier comme theatre.",
  },

  // ── Aventure (8) ───────────────────────
  {
    id: "a-01",
    title: "Escape game",
    category: "aventure",
    emoji: "🔐",
    modes: ["gamer-night", "plus-one", "new-in-town"],
    duration: "1h",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "60 minutes pour resoudre des enigmes ensemble. Rien de mieux pour tester la complicite.",
  },
  {
    id: "a-02",
    title: "Bowling",
    category: "aventure",
    emoji: "🎳",
    modes: ["gamer-night", "plus-one", "new-in-town", "breakup"],
    duration: "1h30",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Strike, spare ou gutter — l'important c'est de rire. Ambiance neon et pop-corn.",
  },
  {
    id: "a-03",
    title: "Mini-golf",
    category: "aventure",
    emoji: "⛳",
    modes: ["plus-one", "sober-tonight", "dog-date", "new-in-town"],
    duration: "1h",
    priceRange: "€",
    bestTime: "aperitif",
    description:
      "18 trous, obstacles absurdes, competition amicale. Decontracte et fun.",
  },
  {
    id: "a-04",
    title: "Laser game",
    category: "aventure",
    emoji: "🔫",
    modes: ["gamer-night", "fit-date", "plus-one"],
    duration: "1h",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Gilet fluorescent, labyrinthe sombre, adrénaline. Tu veux etre dans mon equipe?",
  },
  {
    id: "a-05",
    title: "Arcade retro",
    category: "aventure",
    emoji: "👾",
    modes: ["gamer-night", "night-owl", "sober-tonight", "breakup"],
    duration: "1h30",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Pac-Man, borne de shoot, flipper. Nostalgie 8-bit et high scores a battre.",
  },
  {
    id: "a-06",
    title: "Cours de danse",
    category: "aventure",
    emoji: "💃",
    modes: ["plus-one", "fit-date", "new-in-town", "langue"],
    duration: "1h30",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "Salsa, bachata ou swing. Pas besoin de savoir danser — c'est justement le but.",
  },
  {
    id: "a-07",
    title: "Cours de cuisine",
    category: "aventure",
    emoji: "👨‍🍳",
    modes: ["foodie-quest", "plus-one", "sober-tonight", "langue"],
    duration: "2h",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "Mets la main a la pate, apprends une recette, mange ce que tu as cuisine. Creatif et delicieux.",
  },
  {
    id: "a-08",
    title: "Atelier poterie",
    category: "aventure",
    emoji: "🏺",
    modes: ["culture-club", "sober-tonight", "breakup", "plus-one"],
    duration: "2h",
    priceRange: "€€",
    bestTime: "apres-midi",
    description:
      "Les mains dans la terre, le tour qui tourne. Meditatif, creatif, et un souvenir a ramener.",
  },

  // ── Balade (8) ─────────────────────────
  {
    id: "b-01",
    title: "Canal Saint-Martin",
    category: "balade",
    emoji: "🌊",
    modes: ["dog-date", "sober-tonight", "tourist", "breakup"],
    duration: "1h30",
    priceRange: "gratuit",
    bestTime: "aperitif",
    description:
      "Berges du Lez, héron cendré, passerelle Juvénal. La balade la plus photogénique de Montpellier.",
  },
  {
    id: "b-02",
    title: "Peyrou de nuit",
    category: "balade",
    emoji: "🌙",
    modes: ["night-owl", "tourist", "plus-one", "breakup"],
    duration: "1h30",
    priceRange: "gratuit",
    bestTime: "nuit",
    description:
      "Arc de Triomphe illuminé, promenade du Peyrou déserte, vue sur l'aqueduc. Le romantisme brut.",
  },
  {
    id: "b-03",
    title: "Berges du Lez",
    category: "balade",
    emoji: "🌿",
    modes: ["dog-date", "fit-date", "tourist", "sober-tonight"],
    duration: "1h",
    priceRange: "gratuit",
    bestTime: "aperitif",
    description:
      "De Port Marianne au Lez en longeant les berges. Parcours piéton ombragé et terrasses.",
  },
  {
    id: "b-04",
    title: "Jardins secrets",
    category: "balade",
    emoji: "🌿",
    modes: ["sober-tonight", "dog-date", "culture-club", "tourist"],
    duration: "1h",
    priceRange: "gratuit",
    bestTime: "apres-midi",
    description:
      "Jardin des Plantes (1593), jardin de la Reine, cloître Saint-Charles. Les coins que personne ne connait.",
  },
  {
    id: "b-05",
    title: "Street art tour",
    category: "balade",
    emoji: "🎨",
    modes: ["culture-club", "tourist", "new-in-town"],
    duration: "2h",
    priceRange: "gratuit",
    bestTime: "apres-midi",
    description:
      "Figuerolles, Boutonnet, Beaux-Arts. Les murs racontent des histoires. Prends ton appareil photo.",
  },
  {
    id: "b-06",
    title: "Montpellier by night",
    category: "balade",
    emoji: "✨",
    modes: ["night-owl", "tourist", "plus-one", "seasonal"],
    duration: "2h",
    priceRange: "gratuit",
    bestTime: "nuit",
    description:
      "Esplanade, Place Royale du Peyrou, Écusson pavé. Montpellier brille après minuit.",
  },
  {
    id: "b-07",
    title: "Marche nocturne",
    category: "balade",
    emoji: "🏮",
    modes: ["foodie-quest", "tourist", "seasonal", "new-in-town"],
    duration: "1h30",
    priceRange: "€",
    bestTime: "soiree",
    description:
      "Marche de saison, producteurs locaux, degustations. Flane entre les etals, goute a tout.",
  },
  {
    id: "b-08",
    title: "Quartier historique",
    category: "balade",
    emoji: "🏛️",
    modes: ["tourist", "culture-club", "sober-tonight", "langue"],
    duration: "1h30",
    priceRange: "gratuit",
    bestTime: "apres-midi",
    description:
      "Le Marais, Saint-Germain, ile de la Cite. Chaque rue a 500 ans d'histoire a raconter.",
  },

  // ── Chill (6) ──────────────────────────
  {
    id: "ch-01",
    title: "Cafe cosy",
    category: "chill",
    emoji: "☕",
    modes: ["sober-tonight", "breakup", "langue", "new-in-town"],
    duration: "1h30",
    priceRange: "€",
    bestTime: "apres-midi",
    description:
      "Latte art, playlist lo-fi, canape en velours. L'endroit ou le temps s'arrete.",
  },
  {
    id: "ch-02",
    title: "Librairie-cafe",
    category: "chill",
    emoji: "📚",
    modes: ["culture-club", "sober-tonight", "langue"],
    duration: "2h",
    priceRange: "€",
    bestTime: "apres-midi",
    description:
      "Feuilleter des livres en sirotant un the. Partager des recommandations de lecture.",
  },
  {
    id: "ch-03",
    title: "Parc au coucher du soleil",
    category: "chill",
    emoji: "🌅",
    modes: ["dog-date", "sober-tonight", "fit-date", "breakup"],
    duration: "1h",
    priceRange: "gratuit",
    bestTime: "aperitif",
    description:
      "Buttes-Chaumont, Parc Monceau ou Tuileries. Le golden hour depuis un banc, c'est gratuit et magique.",
  },
  {
    id: "ch-04",
    title: "Pique-nique impromptu",
    category: "chill",
    emoji: "🧺",
    modes: ["dog-date", "sober-tonight", "plus-one", "seasonal"],
    duration: "2h",
    priceRange: "€",
    bestTime: "aperitif",
    description:
      "Fromage, baguette, raisin. Une couverture sur l'herbe et la ville en bruit de fond.",
  },
  {
    id: "ch-05",
    title: "Cinema plein air",
    category: "chill",
    emoji: "🎞️",
    modes: ["plus-one", "seasonal", "sober-tonight", "culture-club"],
    duration: "2h30",
    priceRange: "€",
    bestTime: "nuit",
    description:
      "Ecran geant sous les etoiles, transats et couvertures. La Villette en ete, c'est mythique.",
  },
  {
    id: "ch-06",
    title: "Meditation guidee",
    category: "chill",
    emoji: "🧘",
    modes: ["sober-tonight", "breakup", "fit-date"],
    duration: "1h",
    priceRange: "€",
    bestTime: "aperitif",
    description:
      "Seance collective, respiration, pleine conscience. Deconnecte du bruit ensemble.",
  },

  // ── Sport (4) ──────────────────────────
  {
    id: "s-01",
    title: "Running nocturne",
    category: "sport",
    emoji: "🏃",
    modes: ["fit-date", "night-owl", "sober-tonight"],
    duration: "1h",
    priceRange: "gratuit",
    bestTime: "nuit",
    description:
      "5km le long de la Seine, eclairage des ponts, finish devant la Tour Eiffel. La course la plus belle.",
  },
  {
    id: "s-02",
    title: "Yoga sunset",
    category: "sport",
    emoji: "🧘‍♀️",
    modes: ["fit-date", "sober-tonight", "breakup"],
    duration: "1h",
    priceRange: "€",
    bestTime: "aperitif",
    description:
      "Salutation au soleil face au coucher. Seance en plein air, tapis fourni, serenite garantie.",
  },
  {
    id: "s-03",
    title: "Ping-pong en plein air",
    category: "sport",
    emoji: "🏓",
    modes: ["fit-date", "gamer-night", "sober-tonight", "new-in-town"],
    duration: "1h",
    priceRange: "gratuit",
    bestTime: "aperitif",
    description:
      "Tables en beton, raquettes en bois, matchs en 3 sets. Simple, physique, addictif.",
  },
  {
    id: "s-04",
    title: "Escalade indoor",
    category: "sport",
    emoji: "🧗",
    modes: ["fit-date", "plus-one", "sober-tonight"],
    duration: "1h30",
    priceRange: "€€",
    bestTime: "soiree",
    description:
      "Bloc ou voie, tous niveaux. Tu assures l'autre — la confiance se construit main par main.",
  },
];

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/** Get ideas filtered by category */
export function getIdeasByCategory(category: DateCategory): DateIdea[] {
  return DATE_IDEAS.filter((idea) => idea.category === category);
}

/** Get ideas compatible with a specific (active) mode */
export function getIdeasByMode(mode: ModeKey): DateIdea[] {
  return DATE_IDEAS.filter((idea) => activeModes(idea.modes).includes(mode));
}

/** Get ideas within a price range */
export function getIdeasByPrice(maxPrice: PriceRange): DateIdea[] {
  const order: PriceRange[] = ["gratuit", "€", "€€", "€€€"];
  const maxIdx = order.indexOf(maxPrice);
  return DATE_IDEAS.filter((idea) => order.indexOf(idea.priceRange) <= maxIdx);
}

/** Get a random idea, optionally filtered */
export function getRandomIdea(
  filters?: {
    category?: DateCategory;
    maxPrice?: PriceRange;
    mode?: ModeKey;
  },
): DateIdea {
  let pool = [...DATE_IDEAS];

  if (filters?.category) {
    pool = pool.filter((i) => i.category === filters.category);
  }
  if (filters?.maxPrice) {
    const order: PriceRange[] = ["gratuit", "€", "€€", "€€€"];
    const maxIdx = order.indexOf(filters.maxPrice);
    pool = pool.filter((i) => order.indexOf(i.priceRange) <= maxIdx);
  }
  if (filters?.mode) {
    pool = pool.filter((i) => activeModes(i.modes).includes(filters.mode!));
  }

  if (pool.length === 0) pool = [...DATE_IDEAS];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Price range display string */
export function priceLabel(price: PriceRange): string {
  return price === "gratuit" ? "Gratuit" : price;
}
