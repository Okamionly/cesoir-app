/**
 * Static geographical definitions for CeSoir hotspot clusters.
 *
 * Wave 14 pivot (2026-04-23): active city is Montpellier. These are real
 * Montpellier neighbourhoods/venues used as cluster centers. Live user
 * counts are computed at runtime by `useHotspots()` from the `profiles`
 * table (see `src/lib/useHotspots.ts`). NO mock counts.
 *
 * Paris hotspots are preserved at the bottom of this file (commented
 * exported) for the expansion wave — do not delete. The canonical export
 * is `HOTSPOTS`, which resolves to the active city's hotspots via
 * `getActiveCity()`.
 */
import { ACTIVE_CITY } from "./cities";

export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
  topMode: string;
  description: string;
}

// ─────────────────────────────────────────
// Montpellier — active beachhead (Wave 14)
// 10 neighborhoods covering intra-muros + Port Marianne.
// ─────────────────────────────────────────

export const MONTPELLIER_HOTSPOTS: Hotspot[] = [
  {
    id: "1",
    name: "Écusson",
    lat: 43.6108,
    lng: 3.8763,
    radius: 300,
    topMode: "Night Owl",
    description: "Centre historique, rue de l'Aiguillerie, bars",
  },
  {
    id: "2",
    name: "Comédie",
    lat: 43.6082,
    lng: 3.8794,
    radius: 250,
    topMode: "Plus-One",
    description: "Place centrale, cafés, restos",
  },
  {
    id: "3",
    name: "Antigone",
    lat: 43.6103,
    lng: 3.8889,
    radius: 400,
    topMode: "Culture Club",
    description: "Quartier moderne Ricardo Bofill",
  },
  {
    id: "4",
    name: "Port Marianne",
    lat: 43.6017,
    lng: 3.9077,
    radius: 400,
    topMode: "Night Owl",
    description: "Nouveau quartier, rooftops",
  },
  {
    id: "5",
    name: "Beaux-Arts",
    lat: 43.6175,
    lng: 3.8825,
    radius: 300,
    topMode: "Culture Club",
    description: "Jeune, art, galeries",
  },
  {
    id: "6",
    name: "Figuerolles",
    lat: 43.6036,
    lng: 3.8658,
    radius: 300,
    topMode: "Night Owl",
    description: "Bohème, street art, bars de nuit",
  },
  {
    id: "7",
    name: "Arceaux",
    lat: 43.6133,
    lng: 3.8622,
    radius: 300,
    topMode: "Foodie Quest",
    description: "Marché, cafés terrasses",
  },
  {
    id: "8",
    name: "Boutonnet",
    lat: 43.6211,
    lng: 3.8717,
    radius: 250,
    topMode: "Gamer Night",
    description: "Étudiant, résidences, bars",
  },
  {
    id: "9",
    name: "Saint-Roch",
    lat: 43.6048,
    lng: 3.8850,
    radius: 300,
    topMode: "Solo Diner",
    description: "Gare + affaires, restos éclectiques",
  },
  {
    id: "10",
    name: "Les Aubes",
    lat: 43.6151,
    lng: 3.8954,
    radius: 350,
    topMode: "Fit Date",
    description: "Berges du Lez, parcs, balades",
  },
];

// ─────────────────────────────────────────
// Paris — legacy (kept for expansion)
// NOT exported as canonical HOTSPOTS. Use CityConfig in cities.ts to
// flip the active city when expansion lands.
// ─────────────────────────────────────────

export const PARIS_HOTSPOTS: Hotspot[] = [
  { id: "1", name: "Le Marais", lat: 48.8566, lng: 2.3522, radius: 500, topMode: "Night Owl", description: "Le quartier le plus actif ce soir" },
  { id: "2", name: "Bastille", lat: 48.8533, lng: 2.3692, radius: 400, topMode: "Solo Diner", description: "Beaucoup de restos ouverts" },
  { id: "3", name: "Montmartre", lat: 48.8867, lng: 2.3431, radius: 600, topMode: "Tourist Tonight", description: "Vue magique ce soir" },
  { id: "4", name: "Chatelet", lat: 48.8584, lng: 2.3476, radius: 350, topMode: "Culture Club", description: "Spectacles et sorties" },
  { id: "5", name: "Oberkampf", lat: 48.8654, lng: 2.3792, radius: 300, topMode: "Night Owl", description: "Bars et soirees" },
  { id: "6", name: "Saint-Germain", lat: 48.853, lng: 2.3328, radius: 450, topMode: "Sober Tonight", description: "Cafes et librairies" },
  { id: "7", name: "Belleville", lat: 48.8717, lng: 2.3842, radius: 400, topMode: "Foodie Quest", description: "Street food diverse" },
  { id: "8", name: "Canal Saint-Martin", lat: 48.8714, lng: 2.3652, radius: 350, topMode: "Dog Date", description: "Balades au bord de l'eau" },
  { id: "9", name: "Pigalle", lat: 48.8822, lng: 2.3372, radius: 250, topMode: "Gamer Night", description: "Bars a jeux" },
  { id: "10", name: "Nation", lat: 48.8485, lng: 2.3961, radius: 400, topMode: "Fit Date", description: "Parc de Vincennes a cote" },
  { id: "11", name: "Republique", lat: 48.8675, lng: 2.3637, radius: 380, topMode: "Plus-One", description: "Place animee ce soir" },
  { id: "12", name: "Grands Boulevards", lat: 48.8717, lng: 2.3445, radius: 320, topMode: "Culture Club", description: "Theatres et cinemas" },
];

// ─────────────────────────────────────────
// Canonical export — resolves to the active city's hotspots.
// ─────────────────────────────────────────

/** The active city's hotspots. Use this as the single source of truth. */
export const HOTSPOTS: Hotspot[] =
  ACTIVE_CITY === "paris" ? PARIS_HOTSPOTS : MONTPELLIER_HOTSPOTS;

/** Derive a level label from a live count — replaces the hardcoded level field. */
export type HotspotLevel = "calm" | "moderate" | "hot" | "fire";

export function countToLevel(count: number): HotspotLevel {
  if (count >= 30) return "fire";
  if (count >= 15) return "hot";
  if (count >= 5) return "moderate";
  return "calm";
}

export function getHotspotColor(level: HotspotLevel): string {
  switch (level) {
    case "calm":
      return "#06B6D4";
    case "moderate":
      return "#F59E0B";
    case "hot":
      return "#F97316";
    case "fire":
      return "#EF4444";
  }
}

export function getHotspotLabel(level: HotspotLevel): string {
  switch (level) {
    case "calm":
      return "Calme";
    case "moderate":
      return "Modere";
    case "hot":
      return "Anime";
    case "fire":
      return "En feu";
  }
}
