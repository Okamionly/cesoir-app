import type { ModeKey } from "./modes";

// ─────────────────────────────────────────
// Venue types & interface
// ─────────────────────────────────────────

export type VenueCategory =
  | "restaurant"
  | "bar"
  | "concert"
  | "cinema"
  | "balade"
  | "cafe"
  | "musee"
  | "sport";

export interface Venue {
  id: string;
  name: string;
  type: VenueCategory;
  address: string;
  arrondissement: string;
  lat: number;
  lng: number;
  rating: number;
  priceRange: 1 | 2 | 3;
  popular: boolean;
  compatible_modes: ModeKey[];
}

// ─────────────────────────────────────────
// 40 Paris venues across 8 categories
// ─────────────────────────────────────────

const VENUES: Venue[] = [
  // ── Restaurants (8) ──
  {
    id: "r1", name: "Le Bouillon Chartier", type: "restaurant",
    address: "7 Rue du Faubourg Montmartre", arrondissement: "9e",
    lat: 48.8736, lng: 2.3441, rating: 4.3, priceRange: 1, popular: true,
    compatible_modes: ["solo-diner", "tourist", "foodie-quest"],
  },
  {
    id: "r2", name: "Chez Janou", type: "restaurant",
    address: "2 Rue Roger Verlomme", arrondissement: "3e",
    lat: 48.8554, lng: 2.3656, rating: 4.5, priceRange: 2, popular: false,
    compatible_modes: ["solo-diner", "breakup", "foodie-quest"],
  },
  {
    id: "r3", name: "Pink Mamma", type: "restaurant",
    address: "20bis Rue de Douai", arrondissement: "9e",
    lat: 48.8819, lng: 2.3338, rating: 4.4, priceRange: 2, popular: true,
    compatible_modes: ["solo-diner", "plus-one", "foodie-quest"],
  },
  {
    id: "r4", name: "Big Mamma", type: "restaurant",
    address: "176 Rue du Temple", arrondissement: "3e",
    lat: 48.8638, lng: 2.3580, rating: 4.2, priceRange: 2, popular: true,
    compatible_modes: ["solo-diner", "plus-one", "foodie-quest", "new-in-town"],
  },
  {
    id: "r5", name: "Le Relais de l'Entrecote", type: "restaurant",
    address: "15 Rue Marbeuf", arrondissement: "8e",
    lat: 48.8689, lng: 2.3026, rating: 4.1, priceRange: 2, popular: false,
    compatible_modes: ["solo-diner", "tourist"],
  },
  {
    id: "r6", name: "Pho Tai", type: "restaurant",
    address: "13 Rue de Belleville", arrondissement: "19e",
    lat: 48.8717, lng: 2.3765, rating: 4.0, priceRange: 1, popular: false,
    compatible_modes: ["solo-diner", "foodie-quest", "sober-tonight"],
  },
  {
    id: "r7", name: "Ober Mamma", type: "restaurant",
    address: "107 Boulevard Richard-Lenoir", arrondissement: "11e",
    lat: 48.8618, lng: 2.3729, rating: 4.3, priceRange: 2, popular: true,
    compatible_modes: ["solo-diner", "plus-one", "foodie-quest"],
  },
  {
    id: "r8", name: "Chez Gladines", type: "restaurant",
    address: "30 Rue des 5 Diamants", arrondissement: "13e",
    lat: 48.8293, lng: 2.3495, rating: 4.2, priceRange: 1, popular: false,
    compatible_modes: ["solo-diner", "foodie-quest", "new-in-town"],
  },

  // ── Bars (8) ──
  {
    id: "b1", name: "Le Perchoir Marais", type: "bar",
    address: "33 Rue de la Verrerie", arrondissement: "4e",
    lat: 48.8562, lng: 2.3525, rating: 4.4, priceRange: 2, popular: true,
    compatible_modes: ["plus-one", "night-owl", "new-in-town"],
  },
  {
    id: "b2", name: "Candelaria", type: "bar",
    address: "52 Rue de Saintonge", arrondissement: "3e",
    lat: 48.8632, lng: 2.3616, rating: 4.6, priceRange: 3, popular: true,
    compatible_modes: ["night-owl", "plus-one", "tourist"],
  },
  {
    id: "b3", name: "Little Red Door", type: "bar",
    address: "60 Rue Charlot", arrondissement: "3e",
    lat: 48.8636, lng: 2.3623, rating: 4.5, priceRange: 3, popular: true,
    compatible_modes: ["night-owl", "plus-one"],
  },
  {
    id: "b4", name: "Le Syndicat", type: "bar",
    address: "51 Rue du Faubourg Saint-Denis", arrondissement: "10e",
    lat: 48.8720, lng: 2.3549, rating: 4.5, priceRange: 2, popular: false,
    compatible_modes: ["night-owl", "foodie-quest"],
  },
  {
    id: "b5", name: "Le Comptoir General", type: "bar",
    address: "80 Quai de Jemmapes", arrondissement: "10e",
    lat: 48.8712, lng: 2.3645, rating: 4.3, priceRange: 2, popular: true,
    compatible_modes: ["night-owl", "plus-one", "culture-club"],
  },
  {
    id: "b6", name: "Le Baron Rouge", type: "bar",
    address: "1 Rue Theophile Roussel", arrondissement: "12e",
    lat: 48.8487, lng: 2.3784, rating: 4.4, priceRange: 1, popular: false,
    compatible_modes: ["night-owl", "solo-diner", "new-in-town"],
  },
  {
    id: "b7", name: "Prescription Cocktail Club", type: "bar",
    address: "23 Rue Mazarine", arrondissement: "6e",
    lat: 48.8543, lng: 2.3385, rating: 4.3, priceRange: 3, popular: false,
    compatible_modes: ["night-owl", "plus-one"],
  },
  {
    id: "b8", name: "Meltdown Paris", type: "bar",
    address: "12 Rue Crespin du Gast", arrondissement: "11e",
    lat: 48.8647, lng: 2.3788, rating: 4.1, priceRange: 1, popular: false,
    compatible_modes: ["gamer-night", "plus-one", "night-owl"],
  },

  // ── Concerts (4) ──
  {
    id: "c1", name: "Le Bataclan", type: "concert",
    address: "50 Boulevard Voltaire", arrondissement: "11e",
    lat: 48.8632, lng: 2.3701, rating: 4.5, priceRange: 2, popular: true,
    compatible_modes: ["plus-one", "night-owl", "culture-club"],
  },
  {
    id: "c2", name: "L'Olympia", type: "concert",
    address: "28 Boulevard des Capucines", arrondissement: "9e",
    lat: 48.8710, lng: 2.3306, rating: 4.7, priceRange: 3, popular: true,
    compatible_modes: ["plus-one", "culture-club", "tourist"],
  },
  {
    id: "c3", name: "Le Baiser Sale", type: "concert",
    address: "58 Rue des Lombards", arrondissement: "1er",
    lat: 48.8596, lng: 2.3485, rating: 4.3, priceRange: 2, popular: false,
    compatible_modes: ["night-owl", "culture-club", "plus-one"],
  },
  {
    id: "c4", name: "L'International", type: "concert",
    address: "5 Rue Moret", arrondissement: "11e",
    lat: 48.8660, lng: 2.3794, rating: 4.0, priceRange: 1, popular: false,
    compatible_modes: ["night-owl", "culture-club", "new-in-town"],
  },

  // ── Cinema (4) ──
  {
    id: "ci1", name: "MK2 Bibliotheque", type: "cinema",
    address: "128-162 Avenue de France", arrondissement: "13e",
    lat: 48.8333, lng: 2.3758, rating: 4.3, priceRange: 2, popular: true,
    compatible_modes: ["plus-one", "culture-club", "breakup"],
  },
  {
    id: "ci2", name: "UGC Cine Cite Les Halles", type: "cinema",
    address: "7 Place de la Rotonde", arrondissement: "1er",
    lat: 48.8622, lng: 2.3470, rating: 4.0, priceRange: 2, popular: false,
    compatible_modes: ["plus-one", "culture-club"],
  },
  {
    id: "ci3", name: "Le Grand Rex", type: "cinema",
    address: "1 Boulevard Poissonniere", arrondissement: "2e",
    lat: 48.8711, lng: 2.3474, rating: 4.6, priceRange: 2, popular: true,
    compatible_modes: ["plus-one", "culture-club", "tourist"],
  },
  {
    id: "ci4", name: "Studio 28", type: "cinema",
    address: "10 Rue Tholoze", arrondissement: "18e",
    lat: 48.8849, lng: 2.3361, rating: 4.4, priceRange: 1, popular: false,
    compatible_modes: ["culture-club", "plus-one", "breakup"],
  },

  // ── Balades (4) ──
  {
    id: "bl1", name: "Canal Saint-Martin", type: "balade",
    address: "Quai de Valmy", arrondissement: "10e",
    lat: 48.8712, lng: 2.3653, rating: 4.6, priceRange: 1, popular: true,
    compatible_modes: ["dog-date", "sober-tonight", "breakup", "new-in-town"],
  },
  {
    id: "bl2", name: "Buttes-Chaumont", type: "balade",
    address: "1 Rue Botzaris", arrondissement: "19e",
    lat: 48.8809, lng: 2.3828, rating: 4.7, priceRange: 1, popular: true,
    compatible_modes: ["dog-date", "fit-date", "sober-tonight", "breakup"],
  },
  {
    id: "bl3", name: "Promenade Plantee", type: "balade",
    address: "1 Coulee Verte Rene-Dumont", arrondissement: "12e",
    lat: 48.8487, lng: 2.3737, rating: 4.5, priceRange: 1, popular: false,
    compatible_modes: ["fit-date", "sober-tonight", "tourist"],
  },
  {
    id: "bl4", name: "Jardin du Luxembourg", type: "balade",
    address: "Rue de Medicis", arrondissement: "6e",
    lat: 48.8462, lng: 2.3372, rating: 4.8, priceRange: 1, popular: true,
    compatible_modes: ["dog-date", "fit-date", "tourist", "sober-tonight"],
  },

  // ── Cafes (4) ──
  {
    id: "ca1", name: "Cafe de Flore", type: "cafe",
    address: "172 Boulevard Saint-Germain", arrondissement: "6e",
    lat: 48.8541, lng: 2.3328, rating: 4.2, priceRange: 3, popular: true,
    compatible_modes: ["langue", "sober-tonight", "tourist", "breakup"],
  },
  {
    id: "ca2", name: "Boot Cafe", type: "cafe",
    address: "19 Rue du Pont aux Choux", arrondissement: "3e",
    lat: 48.8608, lng: 2.3626, rating: 4.5, priceRange: 1, popular: false,
    compatible_modes: ["langue", "sober-tonight", "new-in-town"],
  },
  {
    id: "ca3", name: "Ten Belles", type: "cafe",
    address: "10 Rue de la Grange aux Belles", arrondissement: "10e",
    lat: 48.8715, lng: 2.3654, rating: 4.4, priceRange: 1, popular: false,
    compatible_modes: ["sober-tonight", "langue", "new-in-town"],
  },
  {
    id: "ca4", name: "Treize au Jardin", type: "cafe",
    address: "5 Rue de Medicis", arrondissement: "6e",
    lat: 48.8499, lng: 2.3375, rating: 4.3, priceRange: 2, popular: false,
    compatible_modes: ["sober-tonight", "breakup", "culture-club"],
  },

  // ── Musees (4) ──
  {
    id: "m1", name: "Palais de Tokyo", type: "musee",
    address: "13 Avenue du President Wilson", arrondissement: "16e",
    lat: 48.8640, lng: 2.2973, rating: 4.4, priceRange: 2, popular: true,
    compatible_modes: ["culture-club", "plus-one", "tourist"],
  },
  {
    id: "m2", name: "Musee d'Orsay", type: "musee",
    address: "1 Rue de la Legion d'Honneur", arrondissement: "7e",
    lat: 48.8600, lng: 2.3266, rating: 4.8, priceRange: 2, popular: true,
    compatible_modes: ["culture-club", "tourist", "plus-one"],
  },
  {
    id: "m3", name: "Centre Pompidou", type: "musee",
    address: "Place Georges-Pompidou", arrondissement: "4e",
    lat: 48.8607, lng: 2.3522, rating: 4.5, priceRange: 2, popular: true,
    compatible_modes: ["culture-club", "tourist", "langue"],
  },
  {
    id: "m4", name: "Fondation Louis Vuitton", type: "musee",
    address: "8 Avenue du Mahatma Gandhi", arrondissement: "16e",
    lat: 48.8810, lng: 2.2651, rating: 4.6, priceRange: 3, popular: false,
    compatible_modes: ["culture-club", "plus-one", "tourist"],
  },

  // ── Sport (4) ──
  {
    id: "s1", name: "Arkose Nation", type: "sport",
    address: "55 Rue de l'Ourcq", arrondissement: "19e",
    lat: 48.8864, lng: 2.3808, rating: 4.5, priceRange: 2, popular: true,
    compatible_modes: ["fit-date"],
  },
  {
    id: "s2", name: "CMG One Chatelet", type: "sport",
    address: "8 Rue de la Cossonnerie", arrondissement: "1er",
    lat: 48.8605, lng: 2.3489, rating: 4.0, priceRange: 2, popular: false,
    compatible_modes: ["fit-date"],
  },
  {
    id: "s3", name: "Climb Up Pantin", type: "sport",
    address: "46 Rue Cartier Bresson", arrondissement: "Pantin",
    lat: 48.8931, lng: 2.4039, rating: 4.4, priceRange: 2, popular: false,
    compatible_modes: ["fit-date"],
  },
  {
    id: "s4", name: "Yoga Village", type: "sport",
    address: "6 Rue Beaurepaire", arrondissement: "10e",
    lat: 48.8706, lng: 2.3601, rating: 4.6, priceRange: 2, popular: false,
    compatible_modes: ["fit-date", "sober-tonight"],
  },
];

// ─────────────────────────────────────────
// Activity-to-venue category mapping
// ─────────────────────────────────────────

export const ACTIVITY_VENUE_MAP: Record<string, VenueCategory[]> = {
  diner: ["restaurant"],
  verre: ["bar"],
  concert: ["concert"],
  balade: ["balade"],
  cinema: ["cinema"],
  cafe: ["cafe"],
  musee: ["musee"],
  sport: ["sport"],
};

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/** Approximate distance in km (good enough for sorting within a city) */
function quickDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dx = (lat2 - lat1) * 111;
  const dy = (lng2 - lng1) * 111 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dx * dx + dy * dy);
}

/** Format distance as human-readable string */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/** Price range as euro signs */
export function formatPrice(range: 1 | 2 | 3): string {
  return "\u20AC".repeat(range);
}

/**
 * Suggest venues matching an activity type, sorted by distance from user.
 * Returns up to `limit` results.
 */
export function suggestVenuesByActivity(
  activity: string,
  lat: number,
  lng: number,
  limit = 4,
): (Venue & { distance: number })[] {
  const categories = ACTIVITY_VENUE_MAP[activity] ?? [];
  const matching = VENUES.filter(v => categories.includes(v.type));

  return matching
    .map(v => ({ ...v, distance: quickDist(lat, lng, v.lat, v.lng) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Suggest venues that match the given mode, sorted by distance.
 * Returns up to `limit` results.
 */
export function suggestVenue(mode: ModeKey, lat: number, lng: number, limit = 10): Venue[] {
  const matching = VENUES.filter(v => v.compatible_modes.includes(mode));

  matching.sort((a, b) => {
    const distA = quickDist(lat, lng, a.lat, a.lng);
    const distB = quickDist(lat, lng, b.lat, b.lng);
    return distA - distB;
  });

  return matching.slice(0, limit);
}

export { VENUES };
