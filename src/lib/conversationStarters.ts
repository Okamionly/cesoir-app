// ---------- Conversation Starters by Mode ----------
// Wave 15: active modes are solo-diner / plus-one / night-owl / foodie-quest.
// Other keys kept for WAVE-16 when killed modes revisit. Using broader type.

import type { ModeKey } from "./modes";

const STARTERS: Record<string, string[]> = {
  "solo-diner": [
    "Tu as un spot préféré dans le quartier, {name} ?",
    "C'est quoi ton plat guilty pleasure ?",
    "Quel est le dernier resto qui t'a bluffée, {name} ?",
    "Tu es plutôt entrée + plat ou plat + dessert ?",
    "Si tu devais manger un seul plat pour le reste de ta vie ?",
    "Dis-moi que tu aimes le fromage, {name}...",
    "Le pire repas que t'as jamais mangé ?",
    "Tu cuisines ou tu commandes, {name} ?",
  ],
  "plus-one": [
    "Alors {name}, c'est quoi le plan ce soir ?",
    "T'as déjà été à cet endroit, {name} ?",
    "J'espère que t'es prêt(e) pour une soirée de folie !",
    "C'est quoi le dernier event où tu as kiffé, {name} ?",
    "Tu es plutôt premier rang ou fond de salle ?",
    "On se retrouve où, {name} ?",
    "Le meilleur concert de ta vie ?",
  ],
  tourist: [
    "Welcome {name}! What brings you to town?",
    "Qu'est-ce que tu veux absolument voir ici, {name} ?",
    "Tu connais déjà des coins sympas ou je te guide ?",
    "C'est ta première fois ici, {name} ?",
    "Le meilleur souvenir de voyage jusqu'ici ?",
    "Tu es là pour combien de temps, {name} ?",
    "Quel est LE truc que tu veux goûter ici ?",
  ],
  "night-owl": [
    "Encore debout, {name} ? Moi aussi !",
    "C'est quoi ton spot de nuit préféré ?",
    "Les meilleures conversations arrivent après minuit, non {name} ?",
    "Tu dors jamais ou c'est juste ce soir ?",
    "Kebab ou pizza à 2h du mat, {name} ?",
    "La nuit est jeune, on fait quoi ?",
    "Tu connais un bar ouvert tard, {name} ?",
  ],
  breakup: [
    "Hey {name}, comment tu te sens ce soir ?",
    "Pas de pression, juste de la bienveillance !",
    "On parle de tout sauf des ex, deal {name} ?",
    "Glace ou chocolat chaud ce soir ?",
    "Tu as regardé quoi de bien récemment, {name} ?",
    "Raconte-moi un truc cool qui t'est arrivé cette semaine",
    "Le meilleur conseil qu'on t'a donné, {name} ?",
  ],
  "new-in-town": [
    "Bienvenue, {name} ! Tu viens d'où ?",
    "C'est comment la vie ici pour l'instant, {name} ?",
    "T'as déjà un quartier préféré ?",
    "Je peux te recommander plein de spots, {name} !",
    "Qu'est-ce qui te manque le plus de chez toi ?",
    "Le premier truc qui t'a surpris ici, {name} ?",
    "Tu cherches quoi comme ambiance ce soir ?",
  ],
  langue: [
    "On parle quelle langue ce soir, {name} ?",
    "Mon niveau est pas ouf, sois indulgent(e) {name} !",
    "Comment tu dis 'cheers' dans ta langue, {name} ?",
    "Enseigne-moi une expression que personne connaît !",
    "Quelle est la langue la plus difficile que t'as apprise, {name} ?",
    "Tu as appris comment, en école ou autodidacte ?",
    "Le mot le plus drôle dans ta langue, {name} ?",
  ],
  "dog-date": [
    "Montre-moi ton chien, {name} !",
    "Comment s'appelle ton compagnon à 4 pattes ?",
    "Ton chien est plutôt calme ou énergique, {name} ?",
    "Le parc préféré de ton toutou ?",
    "C'est quoi la race la plus mignonne selon toi ?",
    "Ton chien a des copains de jeu, {name} ?",
    "Le truc le plus drôle que ton chien a fait ?",
  ],
  seasonal: [
    "Tu as prévu quoi pour les fêtes, {name} ?",
    "Seul(e) pour les fêtes aussi ? On se serre les coudes !",
    "C'est quoi ta tradition préférée, {name} ?",
    "Le meilleur cadeau que t'as reçu ?",
    "Tu préfères le réveillon ou le jour même, {name} ?",
    "On organise un truc ensemble ?",
    "Ton film de fêtes préféré, {name} ?",
  ],
  "fit-date": [
    "C'est quoi ton sport du moment, {name} ?",
    "Tu cours souvent ou c'est nouveau pour toi ?",
    "Objectif fun ou objectif perfo, {name} ?",
    "Le meilleur spot pour s'entraîner dans le coin ?",
    "Tu as déjà fait un semi-marathon, {name} ?",
    "Yoga ou HIIT ce soir ?",
    "Après le sport, smoothie ou bière {name} ?",
  ],
  "foodie-quest": [
    "Prêt(e) pour l'aventure culinaire, {name} ?",
    "C'est quoi la cuisine la plus exotique que t'as testée ?",
    "Tu as un palais aventurier ou conservateur, {name} ?",
    "Le meilleur street food de ta vie ?",
    "On va où, {name} ? J'ai faim !",
    "Tu mets de la sauce piquante sur tout, {name} ?",
    "Le plat que tu refuses de goûter ?",
  ],
  "culture-club": [
    "T'as vu quoi de bien récemment, {name} ?",
    "Le dernier film qui t'a marqué ?",
    "Tu lis quoi en ce moment, {name} ?",
    "Musée classique ou art contemporain ?",
    "L'artiste que tu voudrais rencontrer, {name} ?",
    "Théâtre ou cinéma, ton choix ?",
    "L'expo qu'il faut absolument voir en ce moment, {name} ?",
  ],
  "sober-tonight": [
    "C'est quoi ton mocktail préféré, {name} ?",
    "Jeux de société ou balade ce soir ?",
    "Tu as un salon de thé à recommander, {name} ?",
    "Le meilleur plan sobre que t'as fait ?",
    "Matcha latte ou chocolat chaud, {name} ?",
    "On fait un atelier créatif ce soir ?",
    "C'est quoi ton jeu de société préféré ?",
  ],
  "gamer-night": [
    "C'est quoi ton jeu du moment, {name} ?",
    "PC, console ou board games ?",
    "Prêt(e) pour un challenge, {name} ?",
    "Tu joues compétitif ou chill ?",
    "Le meilleur jeu de tous les temps selon toi, {name} ?",
    "T'as déjà fait un escape game, {name} ?",
    "Mario Kart ou Smash Bros ce soir ?",
  ],
};

/**
 * Returns 3 random conversation starters for a given mode,
 * personalized with the profile name.
 */
export function getStarters(mode: ModeKey, profileName: string): string[] {
  const pool = STARTERS[mode] ?? STARTERS["solo-diner"];

  // Fisher-Yates shuffle a copy
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled
    .slice(0, 3)
    .map((s) => s.replace(/\{name\}/g, profileName));
}
