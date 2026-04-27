"use client";

import { useRef, useMemo, useCallback } from "react";
import { m, AnimatePresence } from "motion/react";
import type { ModeKey } from "@/lib/modes";
import { springs, micro } from "@/lib/motion-design";

// ─────────────────────────────────────────
// MODE-SPECIFIC CONVERSATION STARTERS
// ─────────────────────────────────────────

// Wave 15: broader type allows legacy mode slugs in historic chat threads.
const MODE_STARTERS: Record<string, string[]> = {
  "solo-diner": [
    "Tu connais un bon resto dans le coin?",
    "Cuisine préférée ce soir?",
    "Plutôt terrasse ou intérieur?",
  ],
  "night-owl": [
    "Quel bar tu recommandes après minuit?",
    "T'es plutôt cocktail ou bière?",
    "Tu sors souvent en semaine?",
  ],
  "plus-one": [
    "C'est quoi l'event ce soir?",
    "On se retrouve où?",
    "C'est quel genre de soirée?",
  ],
  tourist: [
    "Tu viens d'où?",
    "Qu'est-ce qu'il faut absolument voir ici?",
    "T'es là pour combien de temps?",
  ],
  breakup: [
    "Comment tu gères?",
    "Envie de parler ou juste sortir?",
    "Glace ou balade ce soir?",
  ],
  langue: [
    "Tu parles quelles langues?",
    "On pratique en quelle langue?",
    "T'es à quel niveau?",
  ],
  "dog-date": [
    "Il/elle s'appelle comment ton chien?",
    "Parc préféré pour les balades?",
    "C'est quelle race?",
  ],
  "gamer-night": [
    "Tu joues à quoi en ce moment?",
    "Console ou PC?",
    "Plutôt coop ou versus?",
  ],
  "foodie-quest": [
    "Le meilleur plat que t'as mangé récemment?",
    "Street food ou gastro?",
    "T'as un restau secret à partager?",
  ],
  "culture-club": [
    "Tu as vu quoi récemment?",
    "Expo ou spectacle ce soir?",
    "T'es plutôt musée ou cinéma?",
  ],
  "fit-date": [
    "Tu fais quoi comme sport?",
    "Match ou session?",
    "Plutôt matin ou soir pour s'entraîner?",
  ],
  "sober-tonight": [
    "Ça fait combien de temps?",
    "T'as un spot sobre préféré?",
    "Thé, jeux ou balade?",
  ],
  "new-in-town": [
    "T'es arrivé quand?",
    "Tu viens d'où à la base?",
    "Qu'est-ce qui te manque le plus?",
  ],
  seasonal: [
    "T'as prévu quoi pour ce soir?",
    "C'est ta première fois seul pour cette fête?",
    "Plutôt ambiance calme ou festive?",
  ],
};

// Fallback if mode doesn't match
const DEFAULT_STARTERS = [
  "C'est quoi ton plan pour ce soir?",
  "Tu connais un bon endroit pas loin?",
  "Ça fait longtemps que tu es sur CeSoir?",
];

// ─────────────────────────────────────────
// SMART FOLLOW-UP SUGGESTIONS
// Per-mode suggestions for later in the conversation
// ─────────────────────────────────────────

const MODE_FOLLOWUPS: Record<string, string[]> = {
  "solo-diner": [
    "Tu préfères quel quartier?",
    "Budget resto ce soir?",
    "T'as des allergies alimentaires?",
  ],
  "night-owl": [
    "Tu restes jusqu'à quelle heure?",
    "Après le bar on fait quoi?",
    "Tu connais un after sympa?",
  ],
  "plus-one": [
    "Dress code?",
    "C'est à quelle heure?",
    "Y'a d'autres gens qu'on connaît?",
  ],
  tourist: [
    "T'as déjà mangé où ce soir?",
    "Tu veux voir le quartier local?",
    "On se retrouve où exactement?",
  ],
  breakup: [
    "T'as envie de faire quoi exactement?",
    "Un endroit calme ça te dit?",
    "T'as besoin de décompresser?",
  ],
  langue: [
    "On se fait un café pour pratiquer?",
    "T'as des sujets préférés?",
    "Combien de temps t'as ce soir?",
  ],
  "dog-date": [
    "Ton chien est sociable?",
    "Parc ou balade en ville?",
    "Il/elle a quel âge?",
  ],
  "gamer-night": [
    "T'as un serveur Discord?",
    "On lance une partie ce soir?",
    "T'es dispo à quelle heure?",
  ],
  "foodie-quest": [
    "Budget illimité ou raisonnable?",
    "T'es aventureux niveau saveurs?",
    "On teste un truc nouveau?",
  ],
  "culture-club": [
    "T'as vu les critiques?",
    "On y va à quelle heure?",
    "Tu connais l'artiste?",
  ],
  "fit-date": [
    "T'es à quel niveau?",
    "On se retrouve à la salle?",
    "Durée de la session?",
  ],
  "sober-tonight": [
    "Tu connais un bon salon de thé?",
    "Plutôt jeux de société ou balade?",
    "T'as un endroit préféré?",
  ],
  "new-in-town": [
    "T'as déjà exploré quel quartier?",
    "Tu cherches quoi comme ambiance?",
    "On commence par où?",
  ],
  seasonal: [
    "On invite d'autres gens?",
    "T'as une tradition?",
    "Musique ou film de saison?",
  ],
};

const DEFAULT_FOLLOWUPS = [
  "On se retrouve où?",
  "T'es dispo à quelle heure?",
  "Ça te dit de se voir?",
];

// ─────────────────────────────────────────
// RE-ENGAGE QUESTIONS (after no response)
// ─────────────────────────────────────────

const REENGAGE_SUGGESTIONS = [
  "T'es toujours dans le coin?",
  "Sinon, on remet ça à un autre soir?",
  "Dis-moi ce qui te ferait plaisir ce soir",
];

// ─────────────────────────────────────────
// TIME-OF-DAY GREETINGS
// ─────────────────────────────────────────

function getTimeOfDayGreeting(): string | null {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bien dormi? Prêt pour ce soir?";
  if (hour >= 12 && hour < 17) return "Déjà en train de planifier ta soirée?";
  if (hour >= 17 && hour < 21) return "La soirée commence bientôt!";
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
