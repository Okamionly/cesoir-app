"use client";

import type { ModeKey } from "@/lib/modes";

interface QuickRepliesProps {
  mode: ModeKey;
  onSelect: (reply: string) => void;
}

const REPLIES: Partial<Record<ModeKey, string[]>> = {
  "solo-diner": [
    "On se retrouve ou ?",
    "Tu aimes quoi comme cuisine ?",
    "Tu connais un bon spot dans le coin ?",
    "20h ca te va ?",
    "Je reserve pour 2 ?",
  ],
  "plus-one": [
    "C'est a quelle heure exactement ?",
    "Il faut s'habiller comment ?",
    "On se retrouve sur place ?",
    "C'est quoi l'ambiance ?",
    "J'amene quelque chose ?",
  ],
  tourist: [
    "Tu es la pour combien de temps ?",
    "Tu as deja visite quoi ?",
    "Je connais un endroit parfait !",
    "Tu parles francais ?",
    "On se rejoint ou ?",
  ],
  "night-owl": [
    "T'es encore debout ?",
    "On se retrouve ou a cette heure ?",
    "Kebab ou pizza ?",
    "Balade nocturne ca te dit ?",
    "Je connais un bar ouvert tard",
  ],
  breakup: [
    "Comment tu te sens ?",
    "On peut juste parler si tu veux",
    "Film ou balade ?",
    "Zero pression, promis",
    "Ca va aller, on passe tous par la",
  ],
  "new-in-town": [
    "Tu habites dans quel quartier ?",
    "Ca fait combien de temps que t'es la ?",
    "Je te montre les bons plans du coin !",
    "Tu viens d'ou a la base ?",
    "Bienvenue a Paris !",
  ],
  langue: [
    "On parle en quelle langue ce soir ?",
    "Quel est ton niveau ?",
    "On alterne les langues ?",
    "Tu apprends depuis combien de temps ?",
    "Un cafe linguistique ca te dit ?",
  ],
  "dog-date": [
    "Comment s'appelle ton chien ?",
    "Il s'entend bien avec les autres ?",
    "Quel age il a ?",
    "Buttes-Chaumont ou Luxembourg ?",
    "Mon chien est tres joueur !",
  ],
  seasonal: [
    "Tu fais quoi pour les fetes ?",
    "On organise un truc entre 'orphelins' ?",
    "Soiree a combien ?",
    "J'apporte le dessert !",
    "Anti-Saint-Valentin ?",
  ],
  "fit-date": [
    "Tu cours a quelle allure ?",
    "Quel niveau en escalade ?",
    "On fait combien de km ?",
    "Tu as essaye le yoga ?",
    "RDV au parc ?",
  ],
  "foodie-quest": [
    "C'est quoi ta cuisine preferee ?",
    "Street food ou gastro ?",
    "Tu as deja essaye ce restau ?",
    "On partage les plats ?",
    "Mission accepted !",
  ],
  "culture-club": [
    "Tu as vu l'expo en ce moment ?",
    "Cinema d'auteur ca te parle ?",
    "On debriefe apres ?",
    "Place dispo ce soir !",
    "Tu preferes theatre ou musee ?",
  ],
  "sober-tonight": [
    "The ou mocktail ?",
    "Jeux de societe ca te dit ?",
    "Balade le long de la Seine ?",
    "Atelier patisserie ?",
    "Sobre et heureux !",
  ],
  "gamer-night": [
    "Console ou PC ?",
    "Tu joues a quoi en ce moment ?",
    "Debutant(e) accepte ?",
    "Bar gaming ou chez quelqu'un ?",
    "Mario Kart, qui perd paie !",
  ],
};

export default function QuickReplies({ mode, onSelect }: QuickRepliesProps) {
  const replies = REPLIES[mode] ?? REPLIES["solo-diner"] ?? [];

  if (replies.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {replies.map(reply => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          className="flex-shrink-0 px-3 py-2 bg-accent/10 text-accent rounded-full text-[12px] font-medium border border-accent/20 transition-all active:scale-[0.96] hover:bg-accent/20"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
