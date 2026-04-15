// ---------- Conversation Starters by Mode ----------

import type { ModeKey } from "./modes";

const STARTERS: Record<ModeKey, string[]> = {
  "solo-diner": [
    "Tu as un spot prefere dans le quartier, {name} ?",
    "C'est quoi ton plat guilty pleasure ?",
    "Quel est le dernier resto qui t'a bluffee, {name} ?",
    "Tu es plutot entree + plat ou plat + dessert ?",
    "Si tu devais manger un seul plat pour le reste de ta vie ?",
    "Dis-moi que tu aimes le fromage, {name}...",
    "Le pire repas que t'as jamais mange ?",
    "Tu cuisines ou tu commandes, {name} ?",
  ],
  "plus-one": [
    "Alors {name}, c'est quoi le plan ce soir ?",
    "T'as deja ete a cet endroit, {name} ?",
    "J'espere que t'es pret(e) pour une soiree de folie !",
    "C'est quoi le dernier event ou tu as kiffe, {name} ?",
    "Tu es plutot premier rang ou fond de salle ?",
    "On se retrouve ou, {name} ?",
    "Le meilleur concert de ta vie ?",
  ],
  tourist: [
    "Welcome {name}! What brings you to town?",
    "Qu'est-ce que tu veux absolument voir ici, {name} ?",
    "Tu connais deja des coins sympas ou je te guide ?",
    "C'est ta premiere fois ici, {name} ?",
    "Le meilleur souvenir de voyage jusqu'ici ?",
    "Tu es la pour combien de temps, {name} ?",
    "Quel est LE truc que tu veux gouter ici ?",
  ],
  "night-owl": [
    "Encore debout, {name} ? Moi aussi !",
    "C'est quoi ton spot de nuit prefere ?",
    "Les meilleures conversations arrivent apres minuit, non {name} ?",
    "Tu dors jamais ou c'est juste ce soir ?",
    "Kebab ou pizza a 2h du mat, {name} ?",
    "La nuit est jeune, on fait quoi ?",
    "Tu connais un bar ouvert tard, {name} ?",
  ],
  breakup: [
    "Hey {name}, comment tu te sens ce soir ?",
    "Pas de pression, juste de la bienveillance !",
    "On parle de tout sauf des ex, deal {name} ?",
    "Glace ou chocolat chaud ce soir ?",
    "Tu as regarde quoi de bien recemment, {name} ?",
    "Raconte-moi un truc cool qui t'est arrive cette semaine",
    "Le meilleur conseil qu'on t'a donne, {name} ?",
  ],
  "new-in-town": [
    "Bienvenue, {name} ! Tu viens d'ou ?",
    "C'est comment la vie ici pour l'instant, {name} ?",
    "T'as deja un quartier prefere ?",
    "Je peux te recommander plein de spots, {name} !",
    "Qu'est-ce qui te manque le plus de chez toi ?",
    "Le premier truc qui t'a surpris ici, {name} ?",
    "Tu cherches quoi comme ambiance ce soir ?",
  ],
  langue: [
    "On parle quelle langue ce soir, {name} ?",
    "Mon niveau est pas ouf, sois indulgent(e) {name} !",
    "Comment tu dis 'cheers' dans ta langue, {name} ?",
    "Enseigne-moi une expression que personne connait !",
    "Quelle est la langue la plus difficile que t'as apprise, {name} ?",
    "Tu as appris comment, en ecole ou autodidacte ?",
    "Le mot le plus drole dans ta langue, {name} ?",
  ],
  "dog-date": [
    "Montre-moi ton chien, {name} !",
    "Comment s'appelle ton compagnon a 4 pattes ?",
    "Ton chien est plutot calme ou energique, {name} ?",
    "Le parc prefere de ton toutou ?",
    "C'est quoi la race la plus mignonne selon toi ?",
    "Ton chien a des copains de jeu, {name} ?",
    "Le truc le plus drole que ton chien a fait ?",
  ],
  seasonal: [
    "Tu as prevu quoi pour les fetes, {name} ?",
    "Seul(e) pour les fetes aussi ? On se serre les coudes !",
    "C'est quoi ta tradition preferee, {name} ?",
    "Le meilleur cadeau que t'as recu ?",
    "Tu preferes le reveillon ou le jour meme, {name} ?",
    "On organise un truc ensemble ?",
    "Ton film de fetes prefere, {name} ?",
  ],
  "fit-date": [
    "C'est quoi ton sport du moment, {name} ?",
    "Tu cours souvent ou c'est nouveau pour toi ?",
    "Objectif fun ou objectif perfo, {name} ?",
    "Le meilleur spot pour s'entrainer dans le coin ?",
    "Tu as deja fait un semi-marathon, {name} ?",
    "Yoga ou HIIT ce soir ?",
    "Apres le sport, smoothie ou biere {name} ?",
  ],
  "foodie-quest": [
    "Pret(e) pour l'aventure culinaire, {name} ?",
    "C'est quoi la cuisine la plus exotique que t'as testee ?",
    "Tu as un palais aventurier ou conservateur, {name} ?",
    "Le meilleur street food de ta vie ?",
    "On va ou, {name} ? J'ai faim !",
    "Tu mets de la sauce piquante sur tout, {name} ?",
    "Le plat que tu refuses de gouter ?",
  ],
  "culture-club": [
    "T'as vu quoi de bien recemment, {name} ?",
    "Le dernier film qui t'a marque ?",
    "Tu lis quoi en ce moment, {name} ?",
    "Musee classique ou art contemporain ?",
    "L'artiste que tu voudrais rencontrer, {name} ?",
    "Theatre ou cinema, ton choix ?",
    "L'expo qu'il faut absolument voir en ce moment, {name} ?",
  ],
  "sober-tonight": [
    "C'est quoi ton mocktail prefere, {name} ?",
    "Jeux de societe ou balade ce soir ?",
    "Tu as un salon de the a recommander, {name} ?",
    "Le meilleur plan sobre que t'as fait ?",
    "Matcha latte ou chocolat chaud, {name} ?",
    "On fait un atelier creatif ce soir ?",
    "C'est quoi ton jeu de societe prefere ?",
  ],
  "gamer-night": [
    "C'est quoi ton jeu du moment, {name} ?",
    "PC, console ou board games ?",
    "Pret(e) pour un challenge, {name} ?",
    "Tu joues competitif ou chill ?",
    "Le meilleur jeu de tous les temps selon toi, {name} ?",
    "T'as deja fait un escape game, {name} ?",
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
