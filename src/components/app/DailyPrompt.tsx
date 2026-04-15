"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

const DAILY_PROMPTS = [
  "Si tu pouvais diner avec n'importe qui ce soir, ce serait qui ?",
  "Quel est le meilleur conseil qu'on t'a donne ?",
  "Ton film comfort food, c'est lequel ?",
  "Si tu devais demenager demain, tu irais ou ?",
  "Le plat que tu pourrais manger tous les jours ?",
  "Ta chanson du moment qui tourne en boucle ?",
  "Le dernier truc qui t'a fait rire aux larmes ?",
  "Un talent cache que personne ne connait ?",
  "Ton endroit prefere dans la ville ?",
  "Si tu avais un super pouvoir ce soir, ce serait quoi ?",
  "Le meilleur premier RDV que tu as eu ?",
  "Un pays que tu veux absolument visiter ?",
  "C'est quoi ton emoji prefere et pourquoi ?",
  "Le dernier livre/podcast qui t'a marque ?",
  "Ta tradition du vendredi soir ?",
  "Le spot secret que tu partages avec personne ?",
  "Si tu ouvrais un bar, il s'appellerait comment ?",
  "Ton unpopular opinion culinaire ?",
  "Le truc que tu fais quand tu peux pas dormir ?",
  "Qu'est-ce qui te rend fier(e) cette semaine ?",
  "Le metier de reve que tu n'as jamais ose tenter ?",
  "Ton mood en 3 emojis ?",
  "La derniere chose que tu as apprise ?",
  "Le meilleur plan du mois ?",
  "Si ce soir etait parfait, a quoi ca ressemblerait ?",
  "Un truc que tu veux essayer avant la fin de l'annee ?",
  "Ton comfort show du moment ?",
  "Le meilleur mocktail/cocktail que tu as goute ?",
  "Un truc bizarre que tu collectionnes ?",
  "Quelle question tu aimerais qu'on te pose ce soir ?",
  "Le dernier endroit ou tu es alle pour la premiere fois ?",
];

/**
 * Returns the daily prompt index based on the current date.
 * Changes at midnight every day, cycles through all prompts.
 */
function getDailyIndex(): number {
  const now = new Date();
  // Days since epoch, mod prompt count
  const daysSinceEpoch = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  return daysSinceEpoch % DAILY_PROMPTS.length;
}

interface DailyPromptProps {
  /** Optional: override the auto-selected prompt */
  promptIndex?: number;
}

export default function DailyPrompt({ promptIndex }: DailyPromptProps) {
  const index = promptIndex ?? getDailyIndex();
  const prompt = DAILY_PROMPTS[index];

  const dayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }, []);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#00FF88]/10 border border-white/5 p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Decorative glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#8B5CF6]/15 blur-2xl" />

      {/* Date label */}
      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1.5">
        Question du jour &middot; {dayLabel}
      </p>

      {/* Prompt text */}
      <p className="text-[16px] text-white font-semibold leading-snug">
        &ldquo;{prompt}&rdquo;
      </p>

      {/* Subtle prompt number */}
      <p className="mt-3 text-[9px] text-white/15 font-mono">
        #{index + 1}/{DAILY_PROMPTS.length}
      </p>
    </motion.div>
  );
}
