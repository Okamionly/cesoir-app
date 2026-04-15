import type { ModeKey } from "./modes";

export interface Venue {
  name: string;
  address: string;
  type: "restaurant" | "bar" | "parc" | "musee" | "salle-de-sport" | "cafe" | "cinema" | "autre";
  compatible_modes: ModeKey[];
  lat: number;
  lng: number;
}

const VENUES: Venue[] = [
  // Restaurants
  { name: "Le Bouillon Chartier", address: "7 Rue du Faubourg Montmartre, 75009", type: "restaurant", compatible_modes: ["solo-diner", "tourist", "foodie-quest"], lat: 48.8736, lng: 2.3441 },
  { name: "Pink Mamma", address: "20bis Rue de Douai, 75009", type: "restaurant", compatible_modes: ["solo-diner", "plus-one", "foodie-quest"], lat: 48.8819, lng: 2.3338 },
  { name: "Chez Janou", address: "2 Rue Roger Verlomme, 75003", type: "restaurant", compatible_modes: ["solo-diner", "breakup", "foodie-quest"], lat: 48.8554, lng: 2.3656 },
  { name: "Le Relais de l'Entrecote", address: "15 Rue Marbeuf, 75008", type: "restaurant", compatible_modes: ["solo-diner", "tourist"], lat: 48.8689, lng: 2.3026 },
  { name: "Pho Tai", address: "13 Rue de Belleville, 75019", type: "restaurant", compatible_modes: ["solo-diner", "foodie-quest", "sober-tonight"], lat: 48.8717, lng: 2.3765 },
  { name: "Ober Mamma", address: "107 Boulevard Richard-Lenoir, 75011", type: "restaurant", compatible_modes: ["solo-diner", "plus-one", "foodie-quest"], lat: 48.8618, lng: 2.3729 },
  { name: "Le Petit Cler", address: "29 Rue Cler, 75007", type: "restaurant", compatible_modes: ["solo-diner", "tourist", "new-in-town"], lat: 48.8573, lng: 2.3070 },
  { name: "Chez Gladines", address: "30 Rue des 5 Diamants, 75013", type: "restaurant", compatible_modes: ["solo-diner", "foodie-quest", "new-in-town"], lat: 48.8293, lng: 2.3495 },

  // Bars
  { name: "Le Perchoir Marais", address: "33 Rue de la Verrerie, 75004", type: "bar", compatible_modes: ["plus-one", "night-owl", "new-in-town"], lat: 48.8562, lng: 2.3525 },
  { name: "Candelaria", address: "52 Rue de Saintonge, 75003", type: "bar", compatible_modes: ["night-owl", "plus-one", "tourist"], lat: 48.8632, lng: 2.3616 },
  { name: "Le Syndicat", address: "51 Rue du Faubourg Saint-Denis, 75010", type: "bar", compatible_modes: ["night-owl", "foodie-quest"], lat: 48.8720, lng: 2.3549 },
  { name: "Le Comptoir General", address: "80 Quai de Jemmapes, 75010", type: "bar", compatible_modes: ["night-owl", "plus-one", "culture-club"], lat: 48.8712, lng: 2.3645 },
  { name: "Little Red Door", address: "60 Rue Charlot, 75003", type: "bar", compatible_modes: ["night-owl", "plus-one"], lat: 48.8636, lng: 2.3623 },
  { name: "Le Baron Rouge", address: "1 Rue Theophile Roussel, 75012", type: "bar", compatible_modes: ["night-owl", "solo-diner", "new-in-town"], lat: 48.8487, lng: 2.3784 },
  { name: "Prescription Cocktail Club", address: "23 Rue Mazarine, 75006", type: "bar", compatible_modes: ["night-owl", "plus-one"], lat: 48.8543, lng: 2.3385 },

  // Cafes
  { name: "Cafe de Flore", address: "172 Boulevard Saint-Germain, 75006", type: "cafe", compatible_modes: ["langue", "sober-tonight", "tourist", "breakup"], lat: 48.8541, lng: 2.3328 },
  { name: "Boot Cafe", address: "19 Rue du Pont aux Choux, 75003", type: "cafe", compatible_modes: ["langue", "sober-tonight", "new-in-town"], lat: 48.8608, lng: 2.3626 },
  { name: "Nuage Cafe", address: "14 Rue des Abbesses, 75018", type: "cafe", compatible_modes: ["sober-tonight", "langue", "breakup"], lat: 48.8844, lng: 2.3369 },
  { name: "Ten Belles", address: "10 Rue de la Grange aux Belles, 75010", type: "cafe", compatible_modes: ["sober-tonight", "langue", "new-in-town"], lat: 48.8715, lng: 2.3654 },
  { name: "Treize au Jardin", address: "5 Rue de Medicis, 75006", type: "cafe", compatible_modes: ["sober-tonight", "breakup", "culture-club"], lat: 48.8499, lng: 2.3375 },

  // Parcs
  { name: "Parc des Buttes-Chaumont", address: "1 Rue Botzaris, 75019", type: "parc", compatible_modes: ["dog-date", "fit-date", "sober-tonight", "breakup"], lat: 48.8809, lng: 2.3828 },
  { name: "Jardin du Luxembourg", address: "75006 Paris", type: "parc", compatible_modes: ["dog-date", "fit-date", "tourist", "sober-tonight"], lat: 48.8462, lng: 2.3372 },
  { name: "Parc Monceau", address: "35 Boulevard de Courcelles, 75008", type: "parc", compatible_modes: ["dog-date", "fit-date", "sober-tonight"], lat: 48.8794, lng: 2.3089 },
  { name: "Bois de Vincennes", address: "Route de la Pyramide, 75012", type: "parc", compatible_modes: ["dog-date", "fit-date", "tourist"], lat: 48.8328, lng: 2.4253 },
  { name: "Jardin des Tuileries", address: "75001 Paris", type: "parc", compatible_modes: ["tourist", "sober-tonight", "dog-date"], lat: 48.8634, lng: 2.3275 },
  { name: "Parc de la Villette", address: "211 Avenue Jean Jaures, 75019", type: "parc", compatible_modes: ["dog-date", "fit-date", "culture-club"], lat: 48.8938, lng: 2.3903 },
  { name: "Promenade Plantee", address: "1 Coulée Verte René-Dumont, 75012", type: "parc", compatible_modes: ["fit-date", "sober-tonight", "tourist"], lat: 48.8487, lng: 2.3737 },

  // Musees
  { name: "Palais de Tokyo", address: "13 Avenue du President Wilson, 75116", type: "musee", compatible_modes: ["culture-club", "plus-one", "tourist"], lat: 48.8640, lng: 2.2973 },
  { name: "Musee d'Orsay", address: "1 Rue de la Legion d'Honneur, 75007", type: "musee", compatible_modes: ["culture-club", "tourist", "plus-one"], lat: 48.8600, lng: 2.3266 },
  { name: "Centre Pompidou", address: "Place Georges-Pompidou, 75004", type: "musee", compatible_modes: ["culture-club", "tourist", "langue"], lat: 48.8607, lng: 2.3522 },
  { name: "Musee Picasso", address: "5 Rue de Thorigny, 75003", type: "musee", compatible_modes: ["culture-club", "tourist"], lat: 48.8597, lng: 2.3625 },
  { name: "Fondation Louis Vuitton", address: "8 Avenue du Mahatma Gandhi, 75116", type: "musee", compatible_modes: ["culture-club", "plus-one", "tourist"], lat: 48.8810, lng: 2.2651 },
  { name: "Jeu de Paume", address: "1 Place de la Concorde, 75008", type: "musee", compatible_modes: ["culture-club", "tourist"], lat: 48.8658, lng: 2.3227 },
  { name: "Musee Rodin", address: "77 Rue de Varenne, 75007", type: "musee", compatible_modes: ["culture-club", "tourist", "sober-tonight"], lat: 48.8553, lng: 2.3157 },

  // Salles de sport
  { name: "Arkose Nation", address: "55 Rue de l'Ourcq, 75019", type: "salle-de-sport", compatible_modes: ["fit-date"], lat: 48.8864, lng: 2.3808 },
  { name: "CMG One Chatelet", address: "8 Rue de la Cossonnerie, 75001", type: "salle-de-sport", compatible_modes: ["fit-date"], lat: 48.8605, lng: 2.3489 },
  { name: "Climb Up Pantin", address: "46 Rue Cartier Bresson, 93500", type: "salle-de-sport", compatible_modes: ["fit-date"], lat: 48.8931, lng: 2.4039 },
  { name: "Yoga Village", address: "6 Rue Beaurepaire, 75010", type: "salle-de-sport", compatible_modes: ["fit-date", "sober-tonight"], lat: 48.8706, lng: 2.3601 },
  { name: "CrossFit Louvre", address: "16 Rue du Louvre, 75001", type: "salle-de-sport", compatible_modes: ["fit-date"], lat: 48.8610, lng: 2.3415 },

  // Gaming
  { name: "Meltdown Paris", address: "12 Rue Crespin du Gast, 75011", type: "bar", compatible_modes: ["gamer-night", "plus-one"], lat: 48.8647, lng: 2.3788 },
  { name: "Loading Bar", address: "98 Quai de la Loire, 75019", type: "bar", compatible_modes: ["gamer-night", "night-owl"], lat: 48.8852, lng: 2.3771 },
  { name: "Reset Bar", address: "17 Rue de Pontoise, 75005", type: "bar", compatible_modes: ["gamer-night", "sober-tonight"], lat: 48.8506, lng: 2.3487 },

  // Cinema
  { name: "MK2 Bibliotheque", address: "128-162 Avenue de France, 75013", type: "cinema", compatible_modes: ["plus-one", "culture-club", "breakup"], lat: 48.8333, lng: 2.3758 },
  { name: "Le Grand Rex", address: "1 Boulevard Poissonniere, 75002", type: "cinema", compatible_modes: ["plus-one", "culture-club", "tourist"], lat: 48.8711, lng: 2.3474 },
  { name: "Studio 28", address: "10 Rue Tholoze, 75018", type: "cinema", compatible_modes: ["culture-club", "plus-one"], lat: 48.8849, lng: 2.3361 },

  // Seasonal / special
  { name: "Patinoire de l'Hotel de Ville", address: "Place de l'Hotel de Ville, 75004", type: "autre", compatible_modes: ["seasonal", "plus-one", "tourist"], lat: 48.8566, lng: 2.3522 },
  { name: "Marche de Noel Tuileries", address: "Jardin des Tuileries, 75001", type: "autre", compatible_modes: ["seasonal", "tourist", "sober-tonight"], lat: 48.8634, lng: 2.3275 },
  { name: "Plages de Paris (ete)", address: "Quai de la Loire / Voie Pompidou", type: "autre", compatible_modes: ["seasonal", "fit-date", "dog-date"], lat: 48.8566, lng: 2.3522 },
];

/**
 * Suggest venues that match the given mode, sorted by distance from user's position.
 * Returns up to 10 results.
 */
export function suggestVenue(mode: ModeKey, lat: number, lng: number): Venue[] {
  const matching = VENUES.filter(v => v.compatible_modes.includes(mode));

  matching.sort((a, b) => {
    const distA = quickDist(lat, lng, a.lat, a.lng);
    const distB = quickDist(lat, lng, b.lat, b.lng);
    return distA - distB;
  });

  return matching.slice(0, 10);
}

/** Approximate distance (good enough for sorting within a city) */
function quickDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dx = (lat2 - lat1) * 111;
  const dy = (lng2 - lng1) * 111 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dx * dx + dy * dy);
}
