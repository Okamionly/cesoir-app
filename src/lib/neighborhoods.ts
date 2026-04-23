/**
 * Neighborhoods — compact vibe summary for map sidebar.
 *
 * Wave 14 pivot (2026-04-23): Montpellier. 8 quartiers with vibe scores
 * and top modes, used by the map sidebar and compatibility surfaces.
 */

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

export const MONTPELLIER_NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "1",
    name: "Écusson",
    vibe: "Historique & Animé",
    vibeScore: 92,
    topModes: ["Night Owl", "Culture Club"],
    description: "Le centre historique pavé qui ne dort pas",
    bestTime: "20h-2h",
    safetyScore: 4,
  },
  {
    id: "2",
    name: "Comédie",
    vibe: "Central & Café",
    vibeScore: 85,
    topModes: ["Plus-One", "Solo Diner"],
    description: "La place centrale, rendez-vous de toute la ville",
    bestTime: "18h-23h",
    safetyScore: 5,
  },
  {
    id: "3",
    name: "Antigone",
    vibe: "Architectural & Moderne",
    vibeScore: 76,
    topModes: ["Culture Club", "Sober Tonight"],
    description: "Le quartier néo-classique de Bofill",
    bestTime: "17h-22h",
    safetyScore: 5,
  },
  {
    id: "4",
    name: "Port Marianne",
    vibe: "Rooftops & Jeune",
    vibeScore: 88,
    topModes: ["Night Owl", "Plus-One"],
    description: "Rooftops, bassins et vie nocturne moderne",
    bestTime: "19h-1h",
    safetyScore: 5,
  },
  {
    id: "5",
    name: "Beaux-Arts",
    vibe: "Arty & Tendance",
    vibeScore: 87,
    topModes: ["Culture Club", "Langue Exchange"],
    description: "Galeries, ateliers, soirées vernissage",
    bestTime: "19h-23h",
    safetyScore: 4,
  },
  {
    id: "6",
    name: "Figuerolles",
    vibe: "Bohème & Street Art",
    vibeScore: 89,
    topModes: ["Night Owl", "Foodie Quest"],
    description: "Fresques murales, bars alternatifs tardifs",
    bestTime: "21h-3h",
    safetyScore: 3,
  },
  {
    id: "7",
    name: "Arceaux",
    vibe: "Marché & Familial",
    vibeScore: 78,
    topModes: ["Foodie Quest", "Dog Date"],
    description: "Marché bio, aqueduc, terrasses ensoleillées",
    bestTime: "10h-20h",
    safetyScore: 5,
  },
  {
    id: "8",
    name: "Boutonnet",
    vibe: "Étudiant & Rock",
    vibeScore: 86,
    topModes: ["Gamer Night", "Night Owl"],
    description: "Bars étudiants, Rockstore, sorties jeudi soir",
    bestTime: "21h-3h",
    safetyScore: 4,
  },
];

/**
 * Back-compat alias — `PARIS_NEIGHBORHOODS` was the old canonical export
 * until the Wave 14 Montpellier pivot. Callers should migrate to
 * `MONTPELLIER_NEIGHBORHOODS` or the generic `NEIGHBORHOODS` below.
 */
export const PARIS_NEIGHBORHOODS = MONTPELLIER_NEIGHBORHOODS;

/** Canonical export — the active city's neighborhoods. */
export const NEIGHBORHOODS = MONTPELLIER_NEIGHBORHOODS;
