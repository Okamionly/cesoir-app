export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
  level: "calm" | "moderate" | "hot" | "fire";
  activeUsers: number;
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
    level: "fire",
    activeUsers: 42,
    topMode: "Night Owl",
    description: "Le quartier le plus actif ce soir",
  },
  {
    id: "2",
    name: "Bastille",
    lat: 48.8533,
    lng: 2.3692,
    radius: 400,
    level: "hot",
    activeUsers: 28,
    topMode: "Solo Diner",
    description: "Beaucoup de restos ouverts",
  },
  {
    id: "3",
    name: "Montmartre",
    lat: 48.8867,
    lng: 2.3431,
    radius: 600,
    level: "moderate",
    activeUsers: 15,
    topMode: "Tourist Tonight",
    description: "Vue magique ce soir",
  },
  {
    id: "4",
    name: "Chatelet",
    lat: 48.8584,
    lng: 2.3476,
    radius: 350,
    level: "hot",
    activeUsers: 31,
    topMode: "Culture Club",
    description: "Spectacles et sorties",
  },
  {
    id: "5",
    name: "Oberkampf",
    lat: 48.8654,
    lng: 2.3792,
    radius: 300,
    level: "fire",
    activeUsers: 38,
    topMode: "Night Owl",
    description: "Bars et soirees",
  },
  {
    id: "6",
    name: "Saint-Germain",
    lat: 48.853,
    lng: 2.3328,
    radius: 450,
    level: "moderate",
    activeUsers: 18,
    topMode: "Sober Tonight",
    description: "Cafes et librairies",
  },
  {
    id: "7",
    name: "Belleville",
    lat: 48.8717,
    lng: 2.3842,
    radius: 400,
    level: "calm",
    activeUsers: 8,
    topMode: "Foodie Quest",
    description: "Street food diverse",
  },
  {
    id: "8",
    name: "Canal Saint-Martin",
    lat: 48.8714,
    lng: 2.3652,
    radius: 350,
    level: "hot",
    activeUsers: 24,
    topMode: "Dog Date",
    description: "Balades au bord de l'eau",
  },
  {
    id: "9",
    name: "Pigalle",
    lat: 48.8822,
    lng: 2.3372,
    radius: 250,
    level: "moderate",
    activeUsers: 19,
    topMode: "Gamer Night",
    description: "Bars a jeux",
  },
  {
    id: "10",
    name: "Nation",
    lat: 48.8485,
    lng: 2.3961,
    radius: 400,
    level: "calm",
    activeUsers: 6,
    topMode: "Fit Date",
    description: "Parc de Vincennes a cote",
  },
];

export function getHotspotColor(level: Hotspot["level"]): string {
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

export function getHotspotLabel(level: Hotspot["level"]): string {
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
