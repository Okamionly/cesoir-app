export interface Neighborhood {
  id: string;
  name: string;
  vibe: string;
  vibeScore: number; // 0-100
  topModes: string[];
  description: string;
  bestTime: string;
  safetyScore: number; // 1-5
}

export const PARIS_NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "1",
    name: "Le Marais",
    vibe: "Branche & Eclectique",
    vibeScore: 92,
    topModes: ["Night Owl", "Culture Club"],
    description: "Le coeur battant de Paris la nuit",
    bestTime: "20h-2h",
    safetyScore: 4,
  },
  {
    id: "2",
    name: "Bastille",
    vibe: "Festif & Populaire",
    vibeScore: 85,
    topModes: ["Solo Diner", "Night Owl"],
    description: "Restos et bars pour tous les gouts",
    bestTime: "19h-1h",
    safetyScore: 4,
  },
  {
    id: "3",
    name: "Montmartre",
    vibe: "Romantique & Artistique",
    vibeScore: 88,
    topModes: ["Tourist Tonight", "Culture Club"],
    description: "Vue imprenable et artistes de rue",
    bestTime: "18h-23h",
    safetyScore: 3,
  },
  {
    id: "4",
    name: "Oberkampf",
    vibe: "Underground & Tendance",
    vibeScore: 90,
    topModes: ["Night Owl", "Gamer Night"],
    description: "La scene alternative parisienne",
    bestTime: "21h-3h",
    safetyScore: 3,
  },
  {
    id: "5",
    name: "Saint-Germain",
    vibe: "Chic & Intellectuel",
    vibeScore: 78,
    topModes: ["Sober Tonight", "Solo Diner"],
    description: "Cafes litteraires et jazz clubs",
    bestTime: "18h-23h",
    safetyScore: 5,
  },
  {
    id: "6",
    name: "Belleville",
    vibe: "Multiculturel & Foodie",
    vibeScore: 82,
    topModes: ["Foodie Quest", "Langue Exchange"],
    description: "Street food du monde entier",
    bestTime: "19h-0h",
    safetyScore: 3,
  },
  {
    id: "7",
    name: "Canal Saint-Martin",
    vibe: "Decontracte & Nature",
    vibeScore: 80,
    topModes: ["Dog Date", "Fit Date"],
    description: "Pique-niques et balades au fil de l'eau",
    bestTime: "17h-22h",
    safetyScore: 4,
  },
  {
    id: "8",
    name: "Pigalle",
    vibe: "Rock & Ludique",
    vibeScore: 86,
    topModes: ["Gamer Night", "Night Owl"],
    description: "Bars a jeux et salles de concert",
    bestTime: "20h-2h",
    safetyScore: 3,
  },
];
