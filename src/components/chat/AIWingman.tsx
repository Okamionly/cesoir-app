"use client";

import { useRef, useMemo, useCallback } from "react";
import { m, AnimatePresence } from "motion/react";
import type { ModeKey } from "@/lib/modes";
import { springs, micro } from "@/lib/motion-design";

// ─────────────────────────────────────────
// MODE-SPECIFIC CONVERSATION STARTERS
// ─────────────────────────────────────────

const MODE_STARTERS: Record<ModeKey, string[]> = {
  "solo-diner": [
    "Tu connais un bon resto dans le coin?",
    "Cuisine preferee ce soir?",
    "Plutot terrasse ou interieur?",
  ],
  "night-owl": [
    "Quel bar tu recommandes apres minuit?",
    "T'es plutot cocktail ou biere?",
    "Tu sors souvent en semaine?",
  ],
  "plus-one": [
    "C'est quoi l'event ce soir?",
    "On se retrouve ou?",
    "C'est quel genre de soiree?",
  ],
  tourist: [
    "Tu viens d'ou?",
    "Qu'est-ce qu'il faut absolument voir ici?",
    "T'es la pour combien de temps?",
  ],
  breakup: [
    "Comment tu geres?",
    "Envie de parler ou juste sortir?",
    "Glace ou balade ce soir?",
  ],
  langue: [
    "Tu parles quelles langues?",
    "On pratique en quelle langue?",
    "T'es a quel niveau?",
  ],
  "dog-date": [
    "Il/elle s'appelle comment ton chien?",
    "Parc prefere pour les balades?",
    "C'est quelle race?",
  ],
  "gamer-night": [
    "Tu joues a quoi en ce moment?",
    "Console ou PC?",
    "Plutot coop ou versus?",
  ],
  "foodie-quest": [
    "Le meilleur plat que t'as mange recemment?",
    "Street food ou gastro?",
    "T'as un restau secret a partager?",
  ],
  "culture-club": [
    "Tu as vu quoi recemment?",
    "Expo ou spectacle ce soir?",
    "T'es plutot musee ou cinema?",
  ],
  "fit-date": [
    "Tu fais quoi comme sport?",
    "Match ou session?",
    "Plutot matin ou soir pour s'entrainer?",
  ],
  "sober-tonight": [
    "Ca fait combien de temps?",
    "T'as un spot sobre prefere?",
    "The, jeux ou balade?",
  ],
  "new-in-town": [
    "T'es arrive quand?",
    "Tu viens d'ou a la base?",
    "Qu'est-ce qui te manque le plus?",
  ],
  seasonal: [
    "T'as prevu quoi pour ce soir?",
    "C'est ta premiere fois seul pour cette fete?",
    "Plutot ambiance calme ou festive?",
  ],
};

// Fallback if mode doesn't match
const DEFAULT_STARTERS = [
  "C'est quoi ton plan pour ce soir?",
  "Tu connais un bon endroit pas loin?",
  "Ca fait longtemps que tu es sur CeSoir?",
];

// ─────────────────────────────────────────
// SMART FOLLOW-UP SUGGESTIONS
// Per-mode suggestions for later in the conversation
// ─────────────────────────────────────────

const MODE_FOLLOWUPS: Record<ModeKey, string[]> = {
  "solo-diner": [
    "Tu preferes quel quartier?",
    "Budget resto ce soir?",
    "T'as des allergies alimentaires?",
  ],
  "night-owl": [
    "Tu restes jusqu'a quelle heure?",
    "Apres le bar on fait quoi?",
    "Tu connais un after sympa?",
  ],
  "plus-one": [
    "Dress code?",
    "C'est a quelle heure?",
    "Y'a d'autres gens qu'on connait?",
  ],
  tourist: [
    "T'as deja mange ou ce soir?",
    "Tu veux voir le quartier local?",
    "On se retrouve ou exactement?",
  ],
  breakup: [
    "T'as envie de faire quoi exactement?",
    "Un endroit calme ca te dit?",
    "T'as besoin de decompresser?",
  ],
  langue: [
    "On se fait un cafe pour pratiquer?",
    "T'as des sujets preferes?",
    "Combien de temps t'as ce soir?",
  ],
  "dog-date": [
    "Ton chien est sociable?",
    "Parc ou balade en ville?",
    "Il/elle a quel age?",
  ],
  "gamer-night": [
    "T'as un serveur Discord?",
    "On lance une partie ce soir?",
    "T'es dispo a quelle heure?",
  ],
  "foodie-quest": [
    "Budget illimite ou raisonnable?",
    "T'es aventureux niveau saveurs?",
    "On teste un truc nouveau?",
  ],
  "culture-club": [
    "T'as vu les critiques?",
    "On y va a quelle heure?",
    "Tu connais l'artiste?",
  ],
  "fit-date": [
    "T'es a quel niveau?",
    "On se retrouve a la salle?",
    "Duree de la session?",
  ],
  "sober-tonight": [
    "Tu connais un bon salon de the?",
    "Plutot jeux de societe ou balade?",
    "T'as un endroit prefere?",
  ],
  "new-in-town": [
    "T'as deja explore quel quartier?",
    "Tu cherches quoi comme ambiance?",
    "On commence par ou?",
  ],
  seasonal: [
    "On invite d'autres gens?",
    "T'as une tradition?",
    "Musique ou film de saison?",
  ],
};

const DEFAULT_FOLLOWUPS = [
  "On se retrouve ou?",
  "T'es dispo a quelle heure?",
  "Ca te dit de se voir?",
];

// ─────────────────────────────────────────
// RE-ENGAGE QUESTIONS (after no response)
// ─────────────────────────────────────────

const REENGAGE_SUGGESTIONS = [
  "T'es toujours dans le coin?",
  "Sinon, on remet ca a un autre soir?",
  "Dis-moi ce qui te ferait plaisir ce soir",
];

// ─────────────────────────────────────────
// TIME-OF-DAY GREETINGS
// ─────────────────────────────────────────

function getTimeOfDayGreeting(): string | null {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bien dormi? Pret pour ce soir?";
  if (hour >= 12 && hour < 17) return "Deja en train de planifier ta soiree?";
  if (hour >= 17 && hour < 21) return "La soiree commence bientot!";
  if (hour >= 21 || hour < 5) return "La nuit est jeune!";
  return null;
}

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────

interface AIWingmanProps {
  mode: string | null;
  messageCount: number;
  onSelectSuggestion: (text: string) => void;
  /** Number of consecutive messages sent without a reply */
  unansweredCount?: number;
}

export default function AIWingman({
  mode,
  messageCount,
  onSelectSuggestion,
  unansweredCount = 0,
}: AIWingmanProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Don't show after message 6 (suggestions are no longer needed)
  if (messageCount >= 6) return null;

  const modeKey = mode as ModeKey;

  // Smart suggestion logic
  const { chips, label } = useMemo(() => {
    // Re-engage after 2+ unanswered messages
    if (unansweredCount >= 2) {
      return {
        chips: REENGAGE_SUGGESTIONS,
        label: "Relance",
      };
    }

    // First message: mode-specific starters + time-of-day greeting
    if (messageCount === 0) {
      const starters = MODE_STARTERS[modeKey] ?? DEFAULT_STARTERS;
      const greeting = getTimeOfDayGreeting();
      const allChips = greeting ? [greeting, ...starters] : starters;
      return {
        chips: allChips,
        label: "Pour demarrer",
      };
    }

    // Messages 1-2: still show starters (user might want more)
    if (messageCount <= 2) {
      const starters = MODE_STARTERS[modeKey] ?? DEFAULT_STARTERS;
      return {
        chips: starters,
        label: "Suggestions",
      };
    }

    // Messages 3-5: switch to follow-up suggestions
    const followups = MODE_FOLLOWUPS[modeKey] ?? DEFAULT_FOLLOWUPS;
    return {
      chips: followups,
      label: "Continuer la conversation",
    };
  }, [messageCount, modeKey, unansweredCount]);

  const handleTap = useCallback(
    (text: string) => {
      onSelectSuggestion(text);
    },
    [onSelectSuggestion],
  );

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={`wingman-${messageCount >= 3 ? "followup" : "starter"}-${unansweredCount >= 2 ? "reengage" : "normal"}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={springs.elastic}
        className="px-3 pb-2"
        role="region"
        aria-label="Suggestions de messages"
      >
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2 px-1">
          {unansweredCount >= 2 ? "💡 " : ""}
          {label}
        </p>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto no-scrollbar"
        >
          {chips.map((chip, i) => (
            <m.button
              key={chip}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                ...springs.elastic,
                delay: i * 0.06,
              }}
              whileTap={micro.tapScale}
              onClick={() => handleTap(chip)}
              className="shrink-0 px-3.5 py-2 rounded-full border border-accent/20 bg-accent/5 text-[12px] text-accent font-medium tap-target whitespace-nowrap"
            >
              {chip}
            </m.button>
          ))}
        </div>
      </m.div>
    </AnimatePresence>
  );
}
