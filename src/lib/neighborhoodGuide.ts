/**
 * Neighborhood Guide — CeSoir
 *
 * Wave 14 pivot (2026-04-23): Montpellier beachhead. 8 neighborhoods
 * (Écusson, Comédie, Antigone, Port Marianne, Beaux-Arts, Figuerolles,
 *  Arceaux, Boutonnet), each with 8 curated spots across 4 categories
 * (restaurant, bar, activity, secret).
 *
 * Note: the field `arrondissement` is retained in the interface for
 * backwards-compat with components that display it (VenuePicker,
 * MapSearchBar, recommendations). In Montpellier it holds the "quartier"
 * name (no numbered arrondissements here). City-agnostic framework —
 * see `src/lib/cities.ts`.
 */

import { getActiveCity } from "./cities";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type SpotType =
  | "restaurant"
  | "bar"
  | "activity"
  | "secret";

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export interface Spot {
  id: string;
  name: string;
  type: SpotType;
  address: string;
  rating: number; // 1-5
  priceRange: PriceRange;
  description: string;
  popular: boolean; // "Populaire ce soir"
  secretTip?: string;
  distance: number; // km from neighborhood center
}

export type ActivityLevel = 1 | 2 | 3 | 4 | 5;

export interface GuideNeighborhood {
  id: string;
  name: string;
  /**
   * Historically "arrondissement" (Paris). Now reused to hold the
   * quartier label (Montpellier) so downstream components keep working.
   */
  arrondissement: string;
  emoji: string;
  vibeTags: string[];
  activityLevel: ActivityLevel;
  bestFor: string;
  spots: Spot[];
  localTips: string[];
}

// ─────────────────────────────────────────
// Category helpers
// ─────────────────────────────────────────

export function getCategoryLabel(type: SpotType): string {
  switch (type) {
    case "restaurant": return "Ou manger";
    case "bar": return "Ou boire";
    case "activity": return "Que faire";
    case "secret": return "Coins secrets";
  }
}

export function getCategoryEmoji(type: SpotType): string {
  switch (type) {
    case "restaurant": return "\uD83C\uDF7D\uFE0F";
    case "bar": return "\uD83C\uDF78";
    case "activity": return "\uD83C\uDFAD";
    case "secret": return "\uD83D\uDD12";
  }
}

export function getActivityLabel(level: ActivityLevel): string {
  switch (level) {
    case 1: return "Calme";
    case 2: return "Tranquille";
    case 3: return "Animee";
    case 4: return "Elevee";
    case 5: return "Electrique";
  }
}

export function getVibeLabel(tags: string[]): string {
  return tags.join(" & ");
}

// ─────────────────────────────────────────
// Neighborhood Data — 8 quartiers Montpellier
// ─────────────────────────────────────────

export const GUIDE_NEIGHBORHOODS: GuideNeighborhood[] = [
  // ── 1. ÉCUSSON ──
  {
    id: "ecusson",
    name: "Écusson",
    arrondissement: "Centre historique",
    emoji: "\uD83C\uDFF0",
    vibeTags: ["Historique", "Animé", "Pavé"],
    activityLevel: 5,
    bestFor: "Bars & ruelles",
    localTips: [
      "La rue de l'Aiguillerie concentre le meilleur de la vie nocturne — bars à tapas et caves.",
      "La Place Saint-Roch en terrasse au coucher du soleil est un passage obligé.",
      "Évite la Comédie trop touristique le samedi soir, prends la rue de l'Argenterie.",
    ],
    spots: [
      { id: "e1", name: "Le Pastis", type: "restaurant", address: "3 Rue Terral", rating: 4.4, priceRange: "$$", description: "Cuisine méridionale créative, produits du marché", popular: true, distance: 0.2 },
      { id: "e2", name: "La Réserve Rimbaud", type: "restaurant", address: "820 Av de Saint-Maur", rating: 4.7, priceRange: "$$$$", description: "Étoilé Michelin, menu dégustation au bord du Lez", popular: true, distance: 1.2 },
      { id: "e3", name: "Le Pitchoun", type: "bar", address: "18 Rue du Plan d'Agde", rating: 4.3, priceRange: "$", description: "Institution étudiante, planches et pichet de rosé", popular: true, distance: 0.3 },
      { id: "e4", name: "Le Mazerand", type: "bar", address: "5 Rue du Faubourg du Courreau", rating: 4.2, priceRange: "$$", description: "Cocktails d'auteur dans un ancien atelier", popular: false, distance: 0.4 },
      { id: "e5", name: "Place de la Canourgue", type: "activity", address: "Place de la Canourgue", rating: 4.5, priceRange: "$", description: "La plus jolie place du vieux Montpellier, arbres centenaires", popular: false, distance: 0.2 },
      { id: "e6", name: "Musée Fabre", type: "activity", address: "39 Bd Bonne Nouvelle", rating: 4.6, priceRange: "$$", description: "Collection de peinture du XVIIe au XXe — chef-d'œuvre Courbet", popular: true, distance: 0.5 },
      { id: "e7", name: "Mikvé médiéval", type: "secret", address: "1 Rue de la Barralerie", rating: 4.4, priceRange: "$", description: "Bain rituel juif du XIIe siècle caché sous une maison", popular: false, secretTip: "Visite guidée sur demande à l'Office du Tourisme", distance: 0.3 },
      { id: "e8", name: "Passage Lonjon", type: "secret", address: "Rue de la Loge", rating: 4.0, priceRange: "$", description: "Passage couvert 1895 avec verrière Art Nouveau", popular: false, secretTip: "Le marchand de disques du fond est une caverne d'Ali Baba", distance: 0.2 },
    ],
  },

  // ── 2. COMÉDIE ──
  {
    id: "comedie",
    name: "Comédie",
    arrondissement: "Centre",
    emoji: "\uD83C\uDFAD",
    vibeTags: ["Central", "Touristique", "Café"],
    activityLevel: 4,
    bestFor: "Cafés & rencontres",
    localTips: [
      "Le matin, prends ton café au Grand Café Riche — c'est l'ancêtre de la ville.",
      "La fontaine des Trois Grâces est LE point de rendez-vous — même les locaux disent 'rdv à la Comédie'.",
      "Évite les brasseries de la place le soir, prix touristiques — va une rue plus loin.",
    ],
    spots: [
      { id: "c1", name: "La Diligence", type: "restaurant", address: "2 Place Pétrarque", rating: 4.3, priceRange: "$$$", description: "Cuisine languedocienne dans une cave voûtée du XIIIe", popular: true, distance: 0.3 },
      { id: "c2", name: "Tamarillos", type: "restaurant", address: "2 Place du Marché aux Fleurs", rating: 4.6, priceRange: "$$$", description: "Gastronomie végétale inventive, menu autour des fleurs", popular: false, distance: 0.2 },
      { id: "c3", name: "Le Grand Café Riche", type: "bar", address: "8 Place de la Comédie", rating: 4.1, priceRange: "$$", description: "Institution 1880, terrasse face à l'Opéra", popular: true, distance: 0 },
      { id: "c4", name: "Le Corum Café", type: "bar", address: "1 Esplanade Charles de Gaulle", rating: 4.0, priceRange: "$", description: "Terrasse panoramique, happy hour 18h-20h", popular: false, distance: 0.3 },
      { id: "c5", name: "Opéra Comédie", type: "activity", address: "11 Boulevard Victor Hugo", rating: 4.7, priceRange: "$$$", description: "Opéra à l'italienne classé, programme riche", popular: true, distance: 0 },
      { id: "c6", name: "L'Esplanade Charles de Gaulle", type: "activity", address: "Esplanade Charles de Gaulle", rating: 4.3, priceRange: "$", description: "Longue promenade plantée, marché des livres le weekend", popular: false, distance: 0.2 },
      { id: "c7", name: "Toits du Polygone", type: "secret", address: "Centre commercial Le Polygone", rating: 3.9, priceRange: "$", description: "Terrasse gratuite au dernier étage, vue sur les toits", popular: false, secretTip: "Accessible par les ascenseurs du parking, personne ne sait", distance: 0.3 },
      { id: "c8", name: "Cour de l'Hôtel Saint-Côme", type: "secret", address: "32 Grand Rue Jean Moulin", rating: 4.2, priceRange: "$", description: "Cour d'honneur XVIIIe, escalier monumental", popular: false, secretTip: "Entrée libre en semaine, pousse simplement la porte", distance: 0.2 },
    ],
  },

  // ── 3. ANTIGONE ──
  {
    id: "antigone",
    name: "Antigone",
    arrondissement: "Quartier moderne",
    emoji: "\uD83C\uDFDB\uFE0F",
    vibeTags: ["Architecture", "Néo-classique", "Moderne"],
    activityLevel: 3,
    bestFor: "Architecture & balade",
    localTips: [
      "Le quartier entier est signé Ricardo Bofill — monumental, photogénique à tout moment.",
      "La Place du Nombre d'Or est parfaitement symétrique — spot photo incontournable.",
      "Viens au coucher du soleil, la lumière rase sur les colonnes est dingue.",
    ],
    spots: [
      { id: "a1", name: "L'Écailler", type: "restaurant", address: "4 Rue du Plan d'Agde", rating: 4.4, priceRange: "$$$", description: "Fruits de mer et huîtres de Bouzigues toute l'année", popular: true, distance: 0.4 },
      { id: "a2", name: "Insensé", type: "restaurant", address: "Place de Thessalie", rating: 4.5, priceRange: "$$$", description: "Bistronomie creative sous les arcades de Bofill", popular: false, distance: 0.1 },
      { id: "a3", name: "Le Pub Saint-Martin", type: "bar", address: "1 Rue du Clos René", rating: 4.0, priceRange: "$", description: "Pub irlandais, soirées trivia et foot", popular: true, distance: 0.3 },
      { id: "a4", name: "Les Berges du Lez", type: "bar", address: "Quai des Tanneurs", rating: 4.2, priceRange: "$", description: "Guinguette éphémère l'été au bord de l'eau", popular: false, distance: 0.5 },
      { id: "a5", name: "Place du Nombre d'Or", type: "activity", address: "Place du Nombre d'Or", rating: 4.6, priceRange: "$", description: "Place circulaire néo-classique, proportions dorées", popular: true, distance: 0 },
      { id: "a6", name: "Médiathèque Émile Zola", type: "activity", address: "218 Boulevard de l'Aéroport", rating: 4.3, priceRange: "$", description: "Bibliothèque moderne spectaculaire, expositions gratuites", popular: false, distance: 0.4 },
      { id: "a7", name: "Jardin des Plantes", type: "secret", address: "Boulevard Henri IV", rating: 4.5, priceRange: "$", description: "Plus vieux jardin botanique de France (1593), peu connu", popular: false, secretTip: "La roseraie ouvre à 8h — avant les visiteurs", distance: 0.7 },
      { id: "a8", name: "Cours de l'Echiquier", type: "secret", address: "Rue de l'Echiquier", rating: 3.8, priceRange: "$", description: "Impasse entre deux immeubles Bofill avec fontaine intérieure", popular: false, secretTip: "Perspective parfaite au téléobjectif", distance: 0.2 },
    ],
  },

  // ── 4. PORT MARIANNE ──
  {
    id: "port-marianne",
    name: "Port Marianne",
    arrondissement: "Nouveau quartier",
    emoji: "\uD83C\uDF06",
    vibeTags: ["Moderne", "Rooftops", "Jeune"],
    activityLevel: 4,
    bestFor: "Rooftops & startups",
    localTips: [
      "Le quartier d'affaires le soir, mais les bassins attirent les apéros en terrasse.",
      "Le Rooftop Belaroïa a la meilleure vue sur le bassin Jacques Coeur.",
      "Location de vélo électrique pour explorer — c'est étendu.",
    ],
    spots: [
      { id: "pm1", name: "Mia", type: "restaurant", address: "285 Rue de l'Acropole", rating: 4.5, priceRange: "$$$", description: "Cuisine méditerranéenne contemporaine, terrasse sur bassin", popular: true, distance: 0.2 },
      { id: "pm2", name: "Terminal #1", type: "restaurant", address: "Rue Buffon", rating: 4.1, priceRange: "$$", description: "Cantine street food avec 10 comptoirs du monde", popular: true, distance: 0.4 },
      { id: "pm3", name: "Rooftop Belaroïa", type: "bar", address: "30 Rue Jules Ferry", rating: 4.6, priceRange: "$$$", description: "Terrasse 14e étage, DJ le weekend, vue à 360°", popular: true, distance: 0.3 },
      { id: "pm4", name: "Le Grand Café de la Mer", type: "bar", address: "Place Georges Frêche", rating: 4.2, priceRange: "$$", description: "Grande terrasse face à l'Hôtel de Ville futuriste", popular: false, distance: 0.1 },
      { id: "pm5", name: "Bassin Jacques Cœur", type: "activity", address: "Bassin Jacques Cœur", rating: 4.4, priceRange: "$", description: "Plan d'eau avec location de kayak et paddle", popular: false, distance: 0.2 },
      { id: "pm6", name: "Pierresvives", type: "activity", address: "907 Av du Professeur Blayac", rating: 4.3, priceRange: "$", description: "Médiathèque/archives signée Zaha Hadid, incontournable", popular: false, distance: 1.5 },
      { id: "pm7", name: "Rives du Lez (nord)", type: "secret", address: "Berges nord du Lez", rating: 4.1, priceRange: "$", description: "Chemin piéton peu fréquenté, hérons et martins-pêcheurs", popular: false, secretTip: "Parfait pour courir ou pique-niquer au lever du soleil", distance: 0.4 },
      { id: "pm8", name: "Cité Créative", type: "secret", address: "130 Rue Henri Becquerel", rating: 3.9, priceRange: "$", description: "Ancienne EAI reconvertie, fresques géantes et cantines", popular: false, secretTip: "Open house le premier jeudi de chaque mois", distance: 0.8 },
    ],
  },

  // ── 5. BEAUX-ARTS ──
  {
    id: "beaux-arts",
    name: "Beaux-Arts",
    arrondissement: "Quartier arty",
    emoji: "\uD83C\uDFA8",
    vibeTags: ["Arty", "Jeune", "Galeries"],
    activityLevel: 4,
    bestFor: "Art & dates cool",
    localTips: [
      "Le quartier des étudiants en art — ateliers ouverts le jeudi soir.",
      "La rue de l'Université concentre les meilleures galeries indépendantes.",
      "Les mercredis aux Halles Laissac — marché bio + concerts au coucher du soleil.",
    ],
    spots: [
      { id: "ba1", name: "Le Petit Jardin", type: "restaurant", address: "20 Rue Jean-Jacques Rousseau", rating: 4.5, priceRange: "$$", description: "Terrasse arborée cachée, cuisine saisonnière", popular: true, distance: 0.2 },
      { id: "ba2", name: "Chez Boris", type: "restaurant", address: "7 Rue de l'Université", rating: 4.3, priceRange: "$", description: "Bistrot russo-français, bortsch et pelmeni faits maison", popular: false, distance: 0.1 },
      { id: "ba3", name: "Le Cherry Bomb", type: "bar", address: "3 Rue de la Carbonnerie", rating: 4.4, priceRange: "$$", description: "Bar rock indé, concerts le weekend, bonne bière", popular: true, distance: 0.2 },
      { id: "ba4", name: "Le Bar à Vin", type: "bar", address: "Rue Clos René", rating: 4.2, priceRange: "$$", description: "Sélection pointue de vins nature du Languedoc", popular: false, distance: 0.3 },
      { id: "ba5", name: "Halle Tropisme", type: "activity", address: "121 Rue Fontcouverte", rating: 4.6, priceRange: "$", description: "Friche artistique 4000m² — concerts, expos, cantine", popular: true, distance: 1.0 },
      { id: "ba6", name: "Galerie AL/MA", type: "activity", address: "4 Rue Marcel de Serres", rating: 4.3, priceRange: "$", description: "Galerie contemporaine pointue, vernissages jeudi soir", popular: false, distance: 0.2 },
      { id: "ba7", name: "Square des Arceaux", type: "secret", address: "Place des Arceaux", rating: 4.0, priceRange: "$", description: "Ancienne chapelle reconvertie, jardin caché derrière", popular: false, secretTip: "Ouvert le matin, presque personne n'y va", distance: 0.4 },
      { id: "ba8", name: "Ateliers ouverts Passage Bruyas", type: "secret", address: "Passage Bruyas", rating: 4.1, priceRange: "$", description: "12 ateliers d'artistes dans un passage XIXe", popular: false, secretTip: "Portes ouvertes tous les 1er jeudis du mois", distance: 0.3 },
    ],
  },

  // ── 6. FIGUEROLLES ──
  {
    id: "figuerolles",
    name: "Figuerolles",
    arrondissement: "Bohème",
    emoji: "\uD83C\uDFB2",
    vibeTags: ["Bohème", "Street art", "Nocturne"],
    activityLevel: 4,
    bestFor: "Street art & nuits",
    localTips: [
      "Le quartier le plus alternatif — fresques murales tous les 20 mètres.",
      "Le Marché des Arceaux le samedi matin débouche naturellement sur un brunch à Figuerolles.",
      "La Rue du Faubourg du Courreau ne ferme jamais — bars ouverts jusqu'à 3h.",
    ],
    spots: [
      { id: "f1", name: "Le Bouchon Saint-Roch", type: "restaurant", address: "14 Rue du Plan d'Agde", rating: 4.4, priceRange: "$$", description: "Bouchon lyonnais au Sud — tablier de sapeur et quenelles", popular: true, distance: 0.2 },
      { id: "f2", name: "La Panacée Cantine", type: "restaurant", address: "14 Rue de l'Ecole de Pharmacie", rating: 4.2, priceRange: "$", description: "Cantine du centre d'art contemporain, bio et pas cher", popular: false, distance: 0.3 },
      { id: "f3", name: "La Pleine Lune", type: "bar", address: "26 Rue du Plan d'Agde", rating: 4.5, priceRange: "$", description: "Bar à concerts underground, programmation pointue", popular: true, distance: 0.2 },
      { id: "f4", name: "Black Sheep", type: "bar", address: "36 Avenue du Pont Juvénal", rating: 4.1, priceRange: "$$", description: "Craft beer pub, 16 robinets, burgers en cuisine ouverte", popular: false, distance: 0.3 },
      { id: "f5", name: "Street Art Tour Figuerolles", type: "activity", address: "Place de la Chapelle Neuve", rating: 4.5, priceRange: "$", description: "Parcours autoguidé de 30 fresques murales", popular: true, distance: 0.1 },
      { id: "f6", name: "La Panacée", type: "activity", address: "14 Rue de l'Ecole de Pharmacie", rating: 4.3, priceRange: "$", description: "Centre d'art contemporain gratuit, expositions audacieuses", popular: false, distance: 0.3 },
      { id: "f7", name: "Jardin de la Reine", type: "secret", address: "Rue Bonnard", rating: 4.2, priceRange: "$", description: "Mini-jardin à la française caché derrière une grille", popular: false, secretTip: "Ouvre seulement de mai à septembre, 14h-18h", distance: 0.2 },
      { id: "f8", name: "Escalier Figuerolles", type: "secret", address: "Montée des Carmes", rating: 4.0, priceRange: "$", description: "Escalier couvert de mosaïques collaboratives", popular: false, secretTip: "Prends-le au coucher du soleil, direction Peyrou", distance: 0.1 },
    ],
  },

  // ── 7. ARCEAUX ──
  {
    id: "arceaux",
    name: "Arceaux",
    arrondissement: "Familial",
    emoji: "\uD83C\uDFDB\uFE0F",
    vibeTags: ["Marché", "Familial", "Terrasses"],
    activityLevel: 3,
    bestFor: "Marchés & brunchs",
    localTips: [
      "Le marché des Arceaux (mardi et samedi matin) est le rendez-vous des Montpelliérains.",
      "L'aqueduc Saint-Clément au-dessus attire les coureurs et pique-niqueurs.",
      "Prends ton verre au Café de l'Aqueduc, vue directe sur les arches.",
    ],
    spots: [
      { id: "ar1", name: "La Table de Loïc", type: "restaurant", address: "49 Rue du Faubourg Boutonnet", rating: 4.6, priceRange: "$$$", description: "Bistronomie locavore, menu qui change chaque semaine", popular: true, distance: 0.3 },
      { id: "ar2", name: "Le Marché des Arceaux", type: "restaurant", address: "Boulevard des Arceaux", rating: 4.5, priceRange: "$", description: "Marché de producteurs — brunch improvisé avec les stands", popular: true, distance: 0 },
      { id: "ar3", name: "Café de l'Aqueduc", type: "bar", address: "24 Boulevard des Arceaux", rating: 4.2, priceRange: "$$", description: "Terrasse face aux arches de l'aqueduc Saint-Clément", popular: true, distance: 0 },
      { id: "ar4", name: "La Bière du Pape", type: "bar", address: "11 Rue Four des Flammes", rating: 4.3, priceRange: "$$", description: "Cave à bières locales, planches de charcuterie corse", popular: false, distance: 0.2 },
      { id: "ar5", name: "Aqueduc Saint-Clément", type: "activity", address: "Boulevard des Arceaux", rating: 4.7, priceRange: "$", description: "Aqueduc du XVIIIe, 800m long, point de vue spectaculaire", popular: true, distance: 0 },
      { id: "ar6", name: "Promenade du Peyrou", type: "activity", address: "Place Royale du Peyrou", rating: 4.8, priceRange: "$", description: "Terrasse monumentale surplombant la ville — coucher de soleil", popular: true, distance: 0.3 },
      { id: "ar7", name: "Vieux cimetière protestant", type: "secret", address: "Rue du Pioch de Boutonnet", rating: 4.1, priceRange: "$", description: "Cimetière XIXe romantique, tombes sculpteurs", popular: false, secretTip: "Ouvert le matin uniquement, très calme", distance: 0.4 },
      { id: "ar8", name: "Château d'eau du Peyrou", type: "secret", address: "Place Royale du Peyrou", rating: 4.0, priceRange: "$", description: "Pavillon octogonal 1768 qui domine la ville", popular: false, secretTip: "Visite intérieur sur demande Journées du Patrimoine", distance: 0.3 },
    ],
  },

  // ── 8. BOUTONNET ──
  {
    id: "boutonnet",
    name: "Boutonnet",
    arrondissement: "Étudiant",
    emoji: "\uD83C\uDF93",
    vibeTags: ["Étudiant", "Pas cher", "Animé"],
    activityLevel: 4,
    bestFor: "Sorties étudiantes",
    localTips: [
      "Les jeudis soir, c'est LE quartier qui bouge — 70K étudiants à Montpellier.",
      "La rue du Faubourg Boutonnet aligne bars et kebabs tard le soir.",
      "Le Parc de la Chaussée du Pont Juvénal pour se détendre après les exams.",
    ],
    spots: [
      { id: "bo1", name: "Chez Moumoune", type: "restaurant", address: "54 Rue du Faubourg Boutonnet", rating: 4.3, priceRange: "$", description: "Kebab turc légendaire — ouvert jusqu'à 3h du mat'", popular: true, distance: 0.1 },
      { id: "bo2", name: "Le Petit Pois", type: "restaurant", address: "15 Rue du Faubourg Boutonnet", rating: 4.4, priceRange: "$", description: "Cantine végé à prix mini, menu du jour 10€", popular: false, distance: 0.1 },
      { id: "bo3", name: "Le Rockstore", type: "bar", address: "20 Rue de Verdun", rating: 4.5, priceRange: "$", description: "Club rock mythique de Montpellier depuis 1986", popular: true, distance: 0.3 },
      { id: "bo4", name: "Charlie's Bar", type: "bar", address: "32 Rue de l'Université", rating: 4.1, priceRange: "$", description: "Bar étudiant, happy hour 18h-21h, billard gratuit", popular: true, distance: 0.2 },
      { id: "bo5", name: "Jardin botanique de Boutonnet", type: "activity", address: "163 Rue Auguste Broussonnet", rating: 4.4, priceRange: "$", description: "Faculté de pharmacie, jardin conservatoire d'essences rares", popular: false, distance: 0.3 },
      { id: "bo6", name: "Place Albert 1er", type: "activity", address: "Place Albert 1er", rating: 4.2, priceRange: "$", description: "Point de ralliement étudiant — concerts improvisés l'été", popular: true, distance: 0.2 },
      { id: "bo7", name: "Cour Saint-Charles", type: "secret", address: "Ancien hôpital Saint-Charles", rating: 4.3, priceRange: "$", description: "Cloître médiéval reconverti en campus — accès libre", popular: false, secretTip: "Parfait spot pour réviser ou lire au calme", distance: 0.4 },
      { id: "bo8", name: "Sentier des Moulins", type: "secret", address: "Rue des Moulins", rating: 3.9, priceRange: "$", description: "Micro-sentier entre vieux moulins à vent restaurés", popular: false, secretTip: "Se termine à un belvédère que personne ne connaît", distance: 0.5 },
    ],
  },
];

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

export function getSpotsByType(neighborhood: GuideNeighborhood, type: SpotType): Spot[] {
  return neighborhood.spots.filter((s) => s.type === type);
}

export function getPopularSpots(neighborhood: GuideNeighborhood): Spot[] {
  return neighborhood.spots.filter((s) => s.popular);
}

export function getGoogleMapsUrl(address: string): string {
  const city = getActiveCity().name;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address + ", " + city)}`;
}
