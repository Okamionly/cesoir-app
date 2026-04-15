/**
 * Neighborhood Guide — CeSoir
 * Rich data for 8 Paris neighborhoods, each with 16 spots across 4 categories.
 */

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
// Neighborhood Data — 8 quartiers, 16 spots each
// ─────────────────────────────────────────

export const GUIDE_NEIGHBORHOODS: GuideNeighborhood[] = [
  // ── 1. MARAIS ──
  {
    id: "marais",
    name: "Marais",
    arrondissement: "3e-4e",
    emoji: "\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08",
    vibeTags: ["Branchee", "Eclectique", "LGBT friendly"],
    activityLevel: 5,
    bestFor: "Bars & Culture",
    localTips: [
      "Le meilleur falafel est chez L'As du Fallafel, mais la file est longue — allez chez Mi-Va-Mi juste a cote.",
      "La Place des Vosges est magique la nuit, entrez par le passage cote est.",
      "Les galeries de la rue Debelleyme ferment tard le jeudi soir.",
    ],
    spots: [
      { id: "m1", name: "Breizh Cafe", type: "restaurant", address: "109 Rue Vieille du Temple", rating: 4.5, priceRange: "$$", description: "Crepes gastronomiques au sarrasin bio", popular: true, distance: 0.2 },
      { id: "m2", name: "Chez Janou", type: "restaurant", address: "2 Rue Roger Verlomme", rating: 4.3, priceRange: "$$", description: "Mousse au chocolat legendaire a volonte", popular: true, distance: 0.3 },
      { id: "m3", name: "L'As du Fallafel", type: "restaurant", address: "34 Rue des Rosiers", rating: 4.6, priceRange: "$", description: "Le roi du falafel parisien depuis 1979", popular: false, distance: 0.1 },
      { id: "m4", name: "Cafe des Musees", type: "restaurant", address: "49 Rue de Turenne", rating: 4.2, priceRange: "$$", description: "Bistrot authentique, plats du marche", popular: false, distance: 0.4 },
      { id: "m5", name: "Le Mary Celeste", type: "bar", address: "1 Rue Commines", rating: 4.4, priceRange: "$$", description: "Cocktails d'auteur et huitres au comptoir", popular: true, distance: 0.2 },
      { id: "m6", name: "Candelaria", type: "bar", address: "52 Rue de Saintonge", rating: 4.5, priceRange: "$$", description: "Bar cache derriere une taqueria — mezcal expert", popular: true, distance: 0.3 },
      { id: "m7", name: "Le Perchoir Marais", type: "bar", address: "33 Rue de la Verrerie", rating: 4.1, priceRange: "$$$", description: "Rooftop avec vue sur les toits de Paris", popular: false, distance: 0.5 },
      { id: "m8", name: "Boot Cafe", type: "bar", address: "19 Rue du Pont aux Choux", rating: 4.0, priceRange: "$", description: "Micro-cafe de specialite, 6 places assises", popular: false, distance: 0.3 },
      { id: "m9", name: "Musee Picasso", type: "activity", address: "5 Rue de Thorigny", rating: 4.7, priceRange: "$$", description: "Collection permanente dans un hotel particulier", popular: true, distance: 0.4 },
      { id: "m10", name: "Maison Europeenne de la Photo", type: "activity", address: "5/7 Rue de Fourcy", rating: 4.3, priceRange: "$", description: "Expo photo contemporaine, nocturne mercredi", popular: false, distance: 0.2 },
      { id: "m11", name: "Balade Place des Vosges", type: "activity", address: "Place des Vosges", rating: 4.8, priceRange: "$", description: "La plus ancienne place de Paris, sublime la nuit", popular: false, distance: 0.3 },
      { id: "m12", name: "Centre Pompidou", type: "activity", address: "Place Georges Pompidou", rating: 4.6, priceRange: "$$", description: "Art moderne + vue panoramique au 6e etage", popular: true, distance: 0.5 },
      { id: "m13", name: "Le Tresor", type: "secret", address: "5 Rue du Tresor", rating: 4.2, priceRange: "$$", description: "Terrasse cachee dans une impasse — zero touriste", popular: false, secretTip: "Demandez la table du fond dans la cour", distance: 0.1 },
      { id: "m14", name: "Passage de l'Ancre", type: "secret", address: "223 Rue Saint-Martin", rating: 4.0, priceRange: "$", description: "Passage secret du XVIIe, derniere reparatrice de parapluies", popular: false, secretTip: "Poussez la porte en bois a droite", distance: 0.4 },
      { id: "m15", name: "Jardin Anne Frank", type: "secret", address: "14 Impasse Berthaud", rating: 4.4, priceRange: "$", description: "Jardin cache derriere le Centre Pompidou", popular: false, secretTip: "Entree discrete par l'impasse, ouvert jusqu'a 20h30", distance: 0.3 },
      { id: "m16", name: "Cour de Venise", type: "secret", address: "57 Rue de Turbigo", rating: 3.9, priceRange: "$", description: "Cour interieure avec street art et atelier d'artistes", popular: false, secretTip: "Tapez le code 1234B ou attendez un resident", distance: 0.5 },
    ],
  },

  // ── 2. OBERKAMPF ──
  {
    id: "oberkampf",
    name: "Oberkampf",
    arrondissement: "11e",
    emoji: "\uD83C\uDFB8",
    vibeTags: ["Underground", "Festive", "Nocturne"],
    activityLevel: 5,
    bestFor: "Live Music & Nightlife",
    localTips: [
      "La rue Jean-Pierre Timbaud est le vrai spot — evitez la rue Oberkampf trop touristique.",
      "Les concerts au Nouveau Casino commencent toujours en retard, arrivez vers 21h30.",
      "Le kebab de chez Urfa Durum a 3h du mat' est un rite de passage.",
    ],
    spots: [
      { id: "o1", name: "Le Chateaubriand", type: "restaurant", address: "129 Av Parmentier", rating: 4.6, priceRange: "$$$", description: "Neo-bistrot etoile, menu surprise uniquement", popular: true, distance: 0.3 },
      { id: "o2", name: "Le Servan", type: "restaurant", address: "32 Rue Saint-Maur", rating: 4.4, priceRange: "$$", description: "Cuisine franco-asiatique inventive", popular: false, distance: 0.2 },
      { id: "o3", name: "Urfa Durum", type: "restaurant", address: "58 Rue du Faubourg Saint-Denis", rating: 4.3, priceRange: "$", description: "Kebab lahmacun legendaire, ouvert tres tard", popular: true, distance: 0.4 },
      { id: "o4", name: "Yard", type: "restaurant", address: "6 Rue de Mont-Louis", rating: 4.2, priceRange: "$$", description: "Brunch inventif dans un loft industriel", popular: false, distance: 0.5 },
      { id: "o5", name: "Moonshiner", type: "bar", address: "5 Rue Sedaine", rating: 4.5, priceRange: "$$", description: "Speakeasy cache derriere une pizzeria", popular: true, distance: 0.3 },
      { id: "o6", name: "Cafe Charbon", type: "bar", address: "109 Rue Oberkampf", rating: 4.1, priceRange: "$", description: "Institution du quartier depuis les 90s", popular: true, distance: 0.1 },
      { id: "o7", name: "La Fine Mousse", type: "bar", address: "6 Av Jean Aicard", rating: 4.3, priceRange: "$$", description: "20 bieres craft au fuit, carte tournante", popular: false, distance: 0.2 },
      { id: "o8", name: "Le Comptoir General", type: "bar", address: "80 Quai de Jemmapes", rating: 4.4, priceRange: "$$", description: "Bar-musee africain dans un entrepot", popular: false, distance: 0.6 },
      { id: "o9", name: "Nouveau Casino", type: "activity", address: "109 Rue Oberkampf", rating: 4.3, priceRange: "$$", description: "Salle mythique: electro, rock, hip-hop", popular: true, distance: 0.1 },
      { id: "o10", name: "La Bellevilloise", type: "activity", address: "19-21 Rue Boyer", rating: 4.2, priceRange: "$$", description: "Concerts, expos et brunch le dimanche", popular: true, distance: 0.5 },
      { id: "o11", name: "Point Ephemere", type: "activity", address: "200 Quai de Valmy", rating: 4.1, priceRange: "$", description: "Art contemporain + DJ sets au bord du canal", popular: false, distance: 0.7 },
      { id: "o12", name: "Atelier des Lumieres", type: "activity", address: "38 Rue Saint-Maur", rating: 4.7, priceRange: "$$", description: "Expositions immersives dans une fonderie", popular: false, distance: 0.3 },
      { id: "o13", name: "La Gare", type: "secret", address: "1 Rue Pierre Semard", rating: 4.0, priceRange: "$", description: "Ancienne gare reconvertie en bar ephemere l'ete", popular: false, secretTip: "Ouvre seulement de mai a septembre", distance: 0.4 },
      { id: "o14", name: "Passage Lisa", type: "secret", address: "Rue de la Folie-Mericourt", rating: 3.8, priceRange: "$", description: "Micro-ruelle avec fresques cachees", popular: false, secretTip: "Cherchez la porte bleue entre le 42 et le 44", distance: 0.2 },
      { id: "o15", name: "Le 1999", type: "secret", address: "14 Rue Jean-Pierre Timbaud", rating: 4.2, priceRange: "$$", description: "Bar retro annees 90, jeux N64 et cocktails", popular: false, secretTip: "Le mot de passe change chaque semaine sur Instagram", distance: 0.1 },
      { id: "o16", name: "Jardin Truillot", type: "secret", address: "Rue du Chemin Vert", rating: 3.9, priceRange: "$", description: "Jardin partage invisible depuis la rue", popular: false, secretTip: "Entree par la grille du 103 rue Amelot", distance: 0.3 },
    ],
  },

  // ── 3. MONTMARTRE ──
  {
    id: "montmartre",
    name: "Montmartre",
    arrondissement: "18e",
    emoji: "\uD83C\uDFA8",
    vibeTags: ["Romantique", "Panoramique", "Artistique"],
    activityLevel: 3,
    bestFor: "Rendez-vous romantiques",
    localTips: [
      "Evitez la place du Tertre (piege a touristes) — allez plutot rue Lepic.",
      "Le coucher de soleil depuis le parvis du Sacre-Coeur est le meilleur de Paris gratuit.",
      "Les vignes de Montmartre sont ouvertes pendant la Fete des Vendanges en octobre.",
    ],
    spots: [
      { id: "mt1", name: "Le Coq Rico", type: "restaurant", address: "98 Rue Lepic", rating: 4.5, priceRange: "$$$", description: "Rotisserie gastronomique, volailles d'exception", popular: true, distance: 0.2 },
      { id: "mt2", name: "Le Relais Gascon", type: "restaurant", address: "6 Rue des Abbesses", rating: 4.1, priceRange: "$", description: "Salades geantes a partager", popular: false, distance: 0.3 },
      { id: "mt3", name: "Pink Mamma Montmartre", type: "restaurant", address: "Rue des Martyrs", rating: 4.3, priceRange: "$$", description: "Italien XXL sur 4 etages avec terrasse", popular: true, distance: 0.4 },
      { id: "mt4", name: "Soul Kitchen", type: "restaurant", address: "33 Rue Lamarck", rating: 4.2, priceRange: "$$", description: "Veggie creative avec vue sur Paris", popular: false, distance: 0.5 },
      { id: "mt5", name: "Le Tres Particulier", type: "bar", address: "23 Av Junot", rating: 4.6, priceRange: "$$$", description: "Bar cache d'hotel particulier avec jardin secret", popular: true, distance: 0.4 },
      { id: "mt6", name: "Hardware Societe", type: "bar", address: "10 Rue Lamarck", rating: 4.2, priceRange: "$$", description: "Cafe de specialite australien, brunch culte", popular: false, distance: 0.3 },
      { id: "mt7", name: "La Fourmi", type: "bar", address: "74 Rue des Martyrs", rating: 4.0, priceRange: "$", description: "Ambiance artistes et etudiants, happy hour genereux", popular: true, distance: 0.2 },
      { id: "mt8", name: "Lulu White", type: "bar", address: "12 Rue Frochot", rating: 4.4, priceRange: "$$", description: "Speakeasy jazz Nouvelle-Orleans, absinthe maison", popular: false, distance: 0.5 },
      { id: "mt9", name: "Musee de Montmartre", type: "activity", address: "12 Rue Cortot", rating: 4.5, priceRange: "$$", description: "Ancien atelier de Renoir avec jardins", popular: false, distance: 0.3 },
      { id: "mt10", name: "Sacre-Coeur au coucher du soleil", type: "activity", address: "Parvis du Sacre-Coeur", rating: 4.9, priceRange: "$", description: "Vue 360 sur Paris, street performers", popular: true, distance: 0.1 },
      { id: "mt11", name: "Le Moulin Rouge (exterieur)", type: "activity", address: "82 Bd de Clichy", rating: 4.0, priceRange: "$", description: "Selfie iconique devant les ailes rouges", popular: true, distance: 0.6 },
      { id: "mt12", name: "Espace Dali", type: "activity", address: "11 Rue Poulbot", rating: 4.2, priceRange: "$$", description: "Sculptures surrealistes dans une cave voutee", popular: false, distance: 0.2 },
      { id: "mt13", name: "Clos Montmartre", type: "secret", address: "Rue des Saules", rating: 4.3, priceRange: "$", description: "Le dernier vignoble de Paris — 2000 pieds de vigne", popular: false, secretTip: "Visible depuis la rue, mais l'interieur ouvre en octobre", distance: 0.2 },
      { id: "mt14", name: "Passage de la Sorciere", type: "secret", address: "Rue Andre del Sarte", rating: 3.8, priceRange: "$", description: "Escalier etroit et courbe avec murs fleuris", popular: false, secretTip: "Le meilleur spot photo secret de la butte", distance: 0.3 },
      { id: "mt15", name: "Le Passe-Muraille", type: "secret", address: "Place Marcel Ayme", rating: 4.1, priceRange: "$", description: "Statue d'un homme qui traverse un mur — insolite", popular: false, secretTip: "Inspiree de la nouvelle de Marcel Ayme", distance: 0.4 },
      { id: "mt16", name: "Square Suzanne Buisson", type: "secret", address: "Rue Girardon", rating: 4.4, priceRange: "$", description: "Petit parc cache avec fontaine et bancs romantiques", popular: false, secretTip: "Apportez du vin et un plaid le soir", distance: 0.3 },
    ],
  },

  // ── 4. BASTILLE ──
  {
    id: "bastille",
    name: "Bastille",
    arrondissement: "11e-12e",
    emoji: "\uD83C\uDFB7",
    vibeTags: ["Eclectique", "Gastronomique", "Jazz"],
    activityLevel: 4,
    bestFor: "Diner & Jazz",
    localTips: [
      "La rue de Lappe est bruyante mais le Balajo (bal musette) vaut le detour le jeudi.",
      "Le Marche d'Aligre le matin, puis brunch rue Paul Bert — enchainement parfait.",
      "Les caves jazz du Sunset ouvrent tard, le set de minuit est le meilleur.",
    ],
    spots: [
      { id: "b1", name: "Septime", type: "restaurant", address: "80 Rue de Charonne", rating: 4.8, priceRange: "$$$$", description: "Une etoile Michelin, reserve 3 semaines avant", popular: true, distance: 0.3 },
      { id: "b2", name: "Le Baron Rouge", type: "restaurant", address: "1 Rue Theophile Roussel", rating: 4.4, priceRange: "$", description: "Bar a vin brut, huitres sur le zinc", popular: true, distance: 0.4 },
      { id: "b3", name: "Paul Bert", type: "restaurant", address: "18 Rue Paul Bert", rating: 4.3, priceRange: "$$", description: "Le steak-frites reference du quartier", popular: false, distance: 0.5 },
      { id: "b4", name: "Mokonuts", type: "restaurant", address: "5 Rue Saint-Bernard", rating: 4.5, priceRange: "$$", description: "Cafe-bakery italo-libanais, cookies mythiques", popular: false, distance: 0.3 },
      { id: "b5", name: "Bluebird", type: "bar", address: "12 Rue Saint-Bernard", rating: 4.2, priceRange: "$$", description: "Cocktails tiki dans un decor tropical", popular: true, distance: 0.3 },
      { id: "b6", name: "Le Balajo", type: "bar", address: "9 Rue de Lappe", rating: 4.0, priceRange: "$$", description: "Bal musette historique — salsa le jeudi", popular: true, distance: 0.2 },
      { id: "b7", name: "Pause Cafe", type: "bar", address: "41 Rue de Charonne", rating: 3.9, priceRange: "$", description: "Terrasse mythique vue dans les films", popular: false, distance: 0.2 },
      { id: "b8", name: "Concrete", type: "bar", address: "Port de la Rapee", rating: 4.3, priceRange: "$$", description: "Club techno sur une peniche, after le dimanche", popular: false, distance: 0.7 },
      { id: "b9", name: "Opera Bastille", type: "activity", address: "Place de la Bastille", rating: 4.5, priceRange: "$$$", description: "Operas et ballets dans un ecrin moderne", popular: true, distance: 0.1 },
      { id: "b10", name: "Promenade Plantee", type: "activity", address: "Av Daumesnil", rating: 4.6, priceRange: "$", description: "La premiere coulee verte de Paris — inspirateur de la High Line", popular: false, distance: 0.4 },
      { id: "b11", name: "Sunset Sunside", type: "activity", address: "60 Rue des Lombards", rating: 4.4, priceRange: "$$", description: "Double salle jazz — acoustique et electrique", popular: true, distance: 0.8 },
      { id: "b12", name: "Marche d'Aligre", type: "activity", address: "Place d'Aligre", rating: 4.3, priceRange: "$", description: "Marche populaire + halle couverte, ambiance village", popular: false, distance: 0.5 },
      { id: "b13", name: "Rue Cremieux", type: "secret", address: "Rue Cremieux", rating: 4.1, priceRange: "$", description: "Rue coloree facade pastel — le Notting Hill parisien", popular: false, secretTip: "Venez tot le matin pour eviter les influenceurs", distance: 0.4 },
      { id: "b14", name: "Cour Damoye", type: "secret", address: "12 Place de la Bastille", rating: 4.0, priceRange: "$", description: "Passage pave cache entre les immeubles", popular: false, secretTip: "Acces par le porche a cote du Cafe de l'Industrie", distance: 0.1 },
      { id: "b15", name: "Viaduc des Arts", type: "secret", address: "1-129 Av Daumesnil", rating: 4.2, priceRange: "$$", description: "Ateliers artisans sous les arches du viaduc", popular: false, secretTip: "Le luthier au n.59 accepte les visiteurs", distance: 0.5 },
      { id: "b16", name: "Port de l'Arsenal", type: "secret", address: "Bd de la Bastille", rating: 4.3, priceRange: "$", description: "Marina cachee avec bancs face aux bateaux", popular: false, secretTip: "Parfait pour un pique-nique nocturne discrete", distance: 0.2 },
    ],
  },

  // ── 5. SAINT-GERMAIN ──
  {
    id: "saint-germain",
    name: "Saint-Germain",
    arrondissement: "6e",
    emoji: "\uD83D\uDCDA",
    vibeTags: ["Chic", "Litteraire", "Raffine"],
    activityLevel: 3,
    bestFor: "Cafes & Restaurants chic",
    localTips: [
      "Les Deux Magots et le Cafe de Flore sont chers — Le Pre aux Clercs est mieux et moins cher.",
      "La librairie Shakespeare & Co ferme a 22h mais l'ambiance nocturne devant est unique.",
      "Les jardins du Luxembourg ferment au coucher du soleil — verifiez l'heure exacte.",
    ],
    spots: [
      { id: "sg1", name: "Le Comptoir du Pantheon", type: "restaurant", address: "5 Rue Soufflot", rating: 4.3, priceRange: "$$", description: "Vue sur le Pantheon, cuisine bourgeoise", popular: true, distance: 0.5 },
      { id: "sg2", name: "Polene", type: "restaurant", address: "35 Rue Debelleyme", rating: 4.5, priceRange: "$$", description: "Boulangerie neo-classique, feuillete matinal", popular: false, distance: 0.3 },
      { id: "sg3", name: "Le Procope", type: "restaurant", address: "13 Rue de l'Ancienne Comedie", rating: 4.2, priceRange: "$$$", description: "Le plus vieux cafe de Paris (1686) — coq au vin", popular: true, distance: 0.2 },
      { id: "sg4", name: "Bouillon Racine", type: "restaurant", address: "3 Rue Racine", rating: 4.4, priceRange: "$$", description: "Art nouveau somptueux, prix doux", popular: false, distance: 0.3 },
      { id: "sg5", name: "Prescription Cocktail Club", type: "bar", address: "23 Rue Mazarine", rating: 4.4, priceRange: "$$$", description: "Speakeasy elegant, cocktails pharmaco-chic", popular: true, distance: 0.2 },
      { id: "sg6", name: "Cafe de Flore", type: "bar", address: "172 Bd Saint-Germain", rating: 4.0, priceRange: "$$$", description: "Institution litteraire — Sartre et Beauvoir y vivaient", popular: true, distance: 0.1 },
      { id: "sg7", name: "Le Bar du Marche", type: "bar", address: "75 Rue de Seine", rating: 3.9, priceRange: "$$", description: "Terrasse animee, serveurs en mariniere", popular: false, distance: 0.2 },
      { id: "sg8", name: "Tiger Bar", type: "bar", address: "13 Rue Princesse", rating: 4.2, priceRange: "$$", description: "Cocktails asiatiques dans un ecrin sombre", popular: false, distance: 0.3 },
      { id: "sg9", name: "Musee d'Orsay", type: "activity", address: "1 Rue de la Legion d'Honneur", rating: 4.8, priceRange: "$$", description: "Impressionnistes dans une gare — nocturne jeudi", popular: true, distance: 0.6 },
      { id: "sg10", name: "Shakespeare & Company", type: "activity", address: "37 Rue de la Bucherie", rating: 4.7, priceRange: "$", description: "Librairie mythique depuis 1951, lectures publiques", popular: true, distance: 0.4 },
      { id: "sg11", name: "Jardin du Luxembourg", type: "activity", address: "Rue de Medicis", rating: 4.9, priceRange: "$", description: "Le plus beau jardin de Paris, fontaine Medicis", popular: false, distance: 0.3 },
      { id: "sg12", name: "Eglise Saint-Sulpice", type: "activity", address: "2 Rue Palatine", rating: 4.3, priceRange: "$", description: "Orgue monumental et gnomon astronomique (Da Vinci Code)", popular: false, distance: 0.2 },
      { id: "sg13", name: "Cour de Rohan", type: "secret", address: "Cour du Commerce Saint-Andre", rating: 4.1, priceRange: "$", description: "Trois cours medievales reliees — XVe siecle", popular: false, secretTip: "Entrez par le passage du Commerce Saint-Andre", distance: 0.2 },
      { id: "sg14", name: "Pont des Arts (cote gauche)", type: "secret", address: "Pont des Arts", rating: 4.5, priceRange: "$", description: "Vue sur l'Ile de la Cite, moins de monde cote gauche", popular: false, secretTip: "Apportez une bouteille — mieux que le Pont Neuf", distance: 0.5 },
      { id: "sg15", name: "Relais Odeon", type: "secret", address: "132 Bd Saint-Germain", rating: 3.9, priceRange: "$$", description: "Terrasse chauffee discrete, bons prix pour le quartier", popular: false, secretTip: "La salle du fond est calme meme le samedi", distance: 0.1 },
      { id: "sg16", name: "Librairie Taschen", type: "secret", address: "2 Rue de Buci", rating: 4.0, priceRange: "$", description: "Librairie-galerie d'art, livres geants et expo rotative", popular: false, secretTip: "Entrez juste pour regarder — personne ne vous jugera", distance: 0.2 },
    ],
  },

  // ── 6. CANAL SAINT-MARTIN ──
  {
    id: "canal-saint-martin",
    name: "Canal Saint-Martin",
    arrondissement: "10e",
    emoji: "\uD83D\uDEB6",
    vibeTags: ["Hipster", "Brunch", "Balade"],
    activityLevel: 3,
    bestFor: "Brunch & Balades",
    localTips: [
      "Le meilleur moment au canal c'est le dimanche matin quand les quais sont fermes aux voitures.",
      "Apportez une couverture et du vin pour les berges — c'est le pique-nique parfait.",
      "L'ecluse du Temple est le point le plus photogenique du canal.",
    ],
    spots: [
      { id: "csm1", name: "Hotel du Nord", type: "restaurant", address: "102 Quai de Jemmapes", rating: 4.1, priceRange: "$$", description: "Brasserie iconique du film d'Arletty", popular: true, distance: 0.1 },
      { id: "csm2", name: "Chez Prune", type: "restaurant", address: "36 Rue Beaurepaire", rating: 4.0, priceRange: "$", description: "Brunch culte avec terrasse sur le canal", popular: true, distance: 0.2 },
      { id: "csm3", name: "Holybelly", type: "restaurant", address: "19 Rue Lucien Sampaix", rating: 4.5, priceRange: "$$", description: "Pancakes australiens et cafe de specialite", popular: false, distance: 0.3 },
      { id: "csm4", name: "Hai Kai", type: "restaurant", address: "108 Quai de Jemmapes", rating: 4.3, priceRange: "$$", description: "Fusion franco-asiatique face au canal", popular: false, distance: 0.2 },
      { id: "csm5", name: "Chez Prune (bar)", type: "bar", address: "36 Rue Beaurepaire", rating: 4.0, priceRange: "$", description: "Demi en terrasse face au canal — essentiel", popular: true, distance: 0.2 },
      { id: "csm6", name: "Le Comptoir General", type: "bar", address: "80 Quai de Jemmapes", rating: 4.4, priceRange: "$$", description: "Entrepot colonial reconverti, cocktails tropicaux", popular: true, distance: 0.3 },
      { id: "csm7", name: "Gravity Bar", type: "bar", address: "44 Rue des Vinaigriers", rating: 4.2, priceRange: "$$", description: "Craft beer et burgers dans un loft", popular: false, distance: 0.2 },
      { id: "csm8", name: "Chez Jeannette", type: "bar", address: "47 Rue du Fbg Saint-Denis", rating: 3.9, priceRange: "$", description: "Deco retro, DJ le weekend, terrasse animee", popular: false, distance: 0.4 },
      { id: "csm9", name: "Ecluses du canal (balade)", type: "activity", address: "Quai de Jemmapes", rating: 4.6, priceRange: "$", description: "Promenade le long des ecluses illuminees", popular: true, distance: 0.1 },
      { id: "csm10", name: "Marche couvert Saint-Martin", type: "activity", address: "31 Rue du Chateau d'Eau", rating: 4.0, priceRange: "$", description: "Halle couverte avec producteurs locaux", popular: false, distance: 0.4 },
      { id: "csm11", name: "Cine MK2 Quai de Seine", type: "activity", address: "14 Quai de la Seine", rating: 4.2, priceRange: "$$", description: "Cinema indie face au bassin, terrasse l'ete", popular: false, distance: 0.6 },
      { id: "csm12", name: "Artazart", type: "activity", address: "83 Quai de Valmy", rating: 4.1, priceRange: "$", description: "Librairie-galerie design au bord du canal", popular: false, distance: 0.3 },
      { id: "csm13", name: "Jardin Villemin", type: "secret", address: "Rue des Recollets", rating: 4.2, priceRange: "$", description: "Parc cache entre le canal et la gare de l'Est", popular: false, secretTip: "Le spot de yoga gratuit le samedi matin", distance: 0.3 },
      { id: "csm14", name: "Passage Brady", type: "secret", address: "46 Rue du Faubourg Saint-Denis", rating: 3.8, priceRange: "$", description: "Le 'Little India' de Paris — curry a 8 euros", popular: false, secretTip: "Le restaurant du fond a gauche est le meilleur", distance: 0.5 },
      { id: "csm15", name: "Le Point Ephemere (terrasse)", type: "secret", address: "200 Quai de Valmy", rating: 4.0, priceRange: "$", description: "Terrasse face au canal, gratuit sans consommation", popular: false, secretTip: "Arrivez avant 18h pour avoir une table", distance: 0.5 },
      { id: "csm16", name: "Square Frederic Lemaitre", type: "secret", address: "Bd Saint-Martin", rating: 3.7, priceRange: "$", description: "Micro-square avec fontaine, personne ne le connait", popular: false, secretTip: "Parfait pour une pause entre deux bars", distance: 0.2 },
    ],
  },

  // ── 7. CHATELET ──
  {
    id: "chatelet",
    name: "Chatelet",
    arrondissement: "1er",
    emoji: "\uD83D\uDECD\uFE0F",
    vibeTags: ["Central", "Anime", "Late-night"],
    activityLevel: 4,
    bestFor: "Shopping & Late-night",
    localTips: [
      "La rue des Lombards est LA rue du jazz a Paris — 3 clubs en 100 metres.",
      "Le Forum des Halles est moche mais la Canopee au 1er etage a une bonne vue.",
      "Pour manger bien et pas cher apres minuit: la rue Montorgueil.",
    ],
    spots: [
      { id: "ch1", name: "Au Pied de Cochon", type: "restaurant", address: "6 Rue Coquilliere", rating: 4.1, priceRange: "$$$", description: "Ouvert 24h/24 depuis 1946, soupe a l'oignon mythique", popular: true, distance: 0.2 },
      { id: "ch2", name: "Champeaux", type: "restaurant", address: "Forum des Halles", rating: 4.0, priceRange: "$$", description: "Brasserie Ducasse sous la Canopee", popular: false, distance: 0.1 },
      { id: "ch3", name: "Stohrer", type: "restaurant", address: "51 Rue Montorgueil", rating: 4.4, priceRange: "$$", description: "La plus ancienne patisserie de Paris (1730)", popular: true, distance: 0.3 },
      { id: "ch4", name: "Frenchie To Go", type: "restaurant", address: "9 Rue du Nil", rating: 4.3, priceRange: "$", description: "Lobster roll et pulled pork version parisienne", popular: false, distance: 0.3 },
      { id: "ch5", name: "Le Sous Bock", type: "bar", address: "49 Rue Saint-Honore", rating: 4.0, priceRange: "$", description: "Bar a bieres legendaire, 400 references", popular: true, distance: 0.3 },
      { id: "ch6", name: "Le Barav", type: "bar", address: "6 Rue Charles-Francois Dupuis", rating: 4.2, priceRange: "$$", description: "Bar a vin nature, planches genereuses", popular: false, distance: 0.4 },
      { id: "ch7", name: "Le Dernier Bar", type: "bar", address: "15 Rue Quincampoix", rating: 4.3, priceRange: "$$", description: "Bar geek Star Wars / comics, cocktails thematiques", popular: true, distance: 0.2 },
      { id: "ch8", name: "Experimental Cocktail Club", type: "bar", address: "37 Rue Saint-Sauveur", rating: 4.5, priceRange: "$$$", description: "Pionnier du cocktail parisien, cave voutee", popular: false, distance: 0.4 },
      { id: "ch9", name: "Theatre du Chatelet", type: "activity", address: "Place du Chatelet", rating: 4.6, priceRange: "$$$", description: "Comedies musicales et operas dans un ecrin imperial", popular: true, distance: 0.1 },
      { id: "ch10", name: "Fontaine des Innocents", type: "activity", address: "Place Joachim du Bellay", rating: 4.0, priceRange: "$", description: "Fontaine Renaissance, point de rencontre nocturne", popular: false, distance: 0.1 },
      { id: "ch11", name: "Tour Saint-Jacques", type: "activity", address: "Square de la Tour Saint-Jacques", rating: 4.2, priceRange: "$$", description: "Montee au sommet de la tour gothique (saison)", popular: false, distance: 0.2 },
      { id: "ch12", name: "La Samaritaine", type: "activity", address: "9 Rue de la Monnaie", rating: 4.4, priceRange: "$", description: "Grand magasin Art Deco restaure, rooftop gratuit", popular: true, distance: 0.3 },
      { id: "ch13", name: "Passage du Grand Cerf", type: "secret", address: "145 Rue Saint-Denis", rating: 4.3, priceRange: "$", description: "Le plus haut passage couvert de Paris, verriere Art Deco", popular: false, secretTip: "Les boutiques ferment tot mais le passage reste ouvert", distance: 0.3 },
      { id: "ch14", name: "Rue du Nil", type: "secret", address: "Rue du Nil", rating: 4.1, priceRange: "$$", description: "Micro-rue 100% gastronomie — boucher, fromager, caviste", popular: false, secretTip: "Tout est tenu par le chef de Frenchie", distance: 0.3 },
      { id: "ch15", name: "Couloir du Louvre medieval", type: "secret", address: "Sous le Carrousel du Louvre", rating: 4.0, priceRange: "$", description: "Ruines medievales sous le Louvre, acces gratuit", popular: false, secretTip: "Entree par le Carrousel sans billet musee", distance: 0.5 },
      { id: "ch16", name: "Eglise Saint-Eustache (orgue)", type: "secret", address: "2 Impasse Saint-Eustache", rating: 4.4, priceRange: "$", description: "Concert d'orgue gratuit le dimanche a 17h30", popular: false, secretTip: "Le plus grand orgue de France — 8000 tuyaux", distance: 0.2 },
    ],
  },

  // ── 8. BELLEVILLE ──
  {
    id: "belleville",
    name: "Belleville",
    arrondissement: "20e",
    emoji: "\uD83C\uDFA4",
    vibeTags: ["Street art", "Multiculturel", "Authentique"],
    activityLevel: 3,
    bestFor: "World Food & Street Art",
    localTips: [
      "Le Parc de Belleville offre la meilleure vue gratuite sur Paris — mieux que Montmartre.",
      "La rue Denoyez change de fresques toutes les semaines — chaque visite est differente.",
      "Le meilleur pho de Paris est au Pho 14 bis, rue de Belleville.",
    ],
    spots: [
      { id: "bv1", name: "Le Baratin", type: "restaurant", address: "3 Rue Jouye-Rouve", rating: 4.4, priceRange: "$$", description: "Cave-bistrot legendaire, vin nature et plats canailles", popular: true, distance: 0.2 },
      { id: "bv2", name: "Pho 14", type: "restaurant", address: "129 Av de Choisy", rating: 4.3, priceRange: "$", description: "Le pho reference depuis 30 ans", popular: true, distance: 0.5 },
      { id: "bv3", name: "Dong Huong", type: "restaurant", address: "14 Rue Louis Bonnet", rating: 4.2, priceRange: "$", description: "Cuisine vietnamienne authentique, bo bun genereux", popular: false, distance: 0.3 },
      { id: "bv4", name: "Aux Deux Amis", type: "restaurant", address: "45 Rue Oberkampf", rating: 4.5, priceRange: "$$", description: "Tapas francaises et vins nature, ambiance festive", popular: false, distance: 0.4 },
      { id: "bv5", name: "La Commune", type: "bar", address: "80 Bd de Belleville", rating: 4.1, priceRange: "$", description: "Bar associatif, concerts punk et expos", popular: true, distance: 0.2 },
      { id: "bv6", name: "Le Barbouquin", type: "bar", address: "4 Rue Jouye-Rouve", rating: 4.0, priceRange: "$", description: "Bar-librairie, bouquinez en buvant", popular: false, distance: 0.2 },
      { id: "bv7", name: "La Marquise", type: "bar", address: "34 Rue de Menilmontant", rating: 4.2, priceRange: "$$", description: "Cocktails sur rooftop avec vue panoramique", popular: true, distance: 0.3 },
      { id: "bv8", name: "Le Zorba", type: "bar", address: "137 Rue du Faubourg du Temple", rating: 3.8, priceRange: "$", description: "Cafe-bar populaire, DJ le weekend, prix mini", popular: false, distance: 0.4 },
      { id: "bv9", name: "Rue Denoyez (street art)", type: "activity", address: "Rue Denoyez", rating: 4.6, priceRange: "$", description: "Galerie a ciel ouvert, fresques murales geantes", popular: true, distance: 0.1 },
      { id: "bv10", name: "Parc de Belleville", type: "activity", address: "47 Rue des Couronnes", rating: 4.7, priceRange: "$", description: "Le plus haut parc de Paris — vue 180 degres", popular: true, distance: 0.2 },
      { id: "bv11", name: "La Maroquinerie", type: "activity", address: "23 Rue Boyer", rating: 4.2, priceRange: "$$", description: "Salle de concerts indie et rock, ambiance intimiste", popular: false, distance: 0.4 },
      { id: "bv12", name: "Galerie Jour et Nuit", type: "activity", address: "Rue Denoyez", rating: 3.9, priceRange: "$", description: "Galerie underground, vernissages le jeudi", popular: false, distance: 0.1 },
      { id: "bv13", name: "Villa de l'Ermitage", type: "secret", address: "Villa de l'Ermitage", rating: 4.5, priceRange: "$", description: "Ruelle pavee avec maisons de campagne en plein Paris", popular: false, secretTip: "Ressemble a un village provencal — surreal", distance: 0.3 },
      { id: "bv14", name: "Regard Saint-Martin", type: "secret", address: "42 Rue des Cascades", rating: 3.8, priceRange: "$", description: "Vestige medieval du reseau hydraulique de Paris", popular: false, secretTip: "Un des 4 regards encore visibles dans Paris", distance: 0.4 },
      { id: "bv15", name: "Escalier rue du Transvaal", type: "secret", address: "Rue du Transvaal", rating: 4.0, priceRange: "$", description: "Escalier street art avec vue sur le Sacre-Coeur", popular: false, secretTip: "Montez les 100 marches au coucher du soleil", distance: 0.5 },
      { id: "bv16", name: "Passage Plantin", type: "secret", address: "Passage Plantin", rating: 3.9, priceRange: "$", description: "Impasse pavee avec ateliers d'artistes et vigne vierge", popular: false, secretTip: "Sonnez au 3 pour visiter l'atelier de ceramique", distance: 0.2 },
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
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address + ", Paris")}`;
}
