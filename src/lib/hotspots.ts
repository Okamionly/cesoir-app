/**
 * Static geographical definitions for Paris hotspot clusters.
 *
 * These are REAL Paris neighbourhoods/venues used as cluster centers.
 * Live user counts are computed at runtime by `useHotspots()` from the
 * `profiles` table (see `src/lib/useHotspots.ts`). NO mock counts.
 */
export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
  topMode: string;
  description: string;
}

export const PARIS_HOTSPOTS: Hotspot[] = [
  {
    id: "1",
    name: "Le Marais",
    lat: 48.8566,
    lng: 2.3522,
    radius: 500,
    topMode: "Night Owl",
    description: "Le quartier le plus actif ce soir",
  },
  {
    id: "2",
    name: "Bastille",
    lat: 48.8533,
    lng: 2.3692,
    radius: 400,
    topMode: "Solo Diner",
    description: "Beaucoup de restos ouverts",
  },
  {
    id: "3",
    name: "Montmartre",
    lat: 48.8867,
    lng: 2.3431,
    radius: 600,
    topMode: "Tourist Tonight",
    description: "Vue magique ce soir",
  },
  {
    id: "4",
    name: "Chatelet",
    lat: 48.8584,
    lng: 2.3476,
    radius: 350,
    topMode: "Culture Club",
    description: "Spectacles et sorties",
  },
  {
    id: "5",
    name: "Oberkampf",
    lat: 48.8654,
    lng: 2.3792,
    radius: 300,
    topMode: "Night Owl",
    description: "Bars et soirees",
  },
  {
    id: "6",
    name: "Saint-Germain",
    lat: 48.853,
    lng: 2.3328,
    radius: 450,
    topMode: "Sober Tonight",
    description: "Cafes et librairies",
  },
  {
    id: "7",
    name: "Belleville",
    lat: 48.8717,
    lng: 2.3842,
    radius: 400,
    topMode: "Foodie Quest",
    description: "Street food diverse",
  },
  {
    id: "8",
    name: "Canal Saint-Martin",
    lat: 48.8714,
    lng: 2.3652,
    radius: 350,
    topMode: "Dog Date",
    description: "Balades au bord de l'eau",
  },
  {
    id: "9",
    name: "Pigalle",
    lat: 48.8822,
    lng: 2.3372,
    radius: 250,
    topMode: "Gamer Night",
    description: "Bars a jeux",
  },
  {
    id: "10",
    name: "Nation",
    lat: 48.8485,
    lng: 2.3961,
    radius: 400,
    topMode: "Fit Date",
    description: "Parc de Vincennes a cote",
  },
  {
    id: "11",
    name: "Republique",
    lat: 48.8675,
    lng: 2.3637,
    radius: 380,
    topMode: "Plus-One",
    description: "Place animee ce soir",
  },
  {
    id: "12",
    name: "Grands Boulevards",
    lat: 48.8717,
    lng: 2.3445,
    radius: 320,
    topMode: "Culture Club",
    description: "Theatres et cinemas",
  },
];

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
