"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MODES, type ModeKey } from "@/lib/modes";

interface Question {
  id: string;
  text: string;
  options: { label: string; modes: ModeKey[] }[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "Tu preferes diner ou boire un verre ?",
    options: [
      { label: "Diner tranquille", modes: ["solo-diner", "foodie-quest"] },
      { label: "Un bon verre", modes: ["night-owl", "sober-tonight"] },
      { label: "Les deux !", modes: ["solo-diner", "night-owl"] },
    ],
  },
  {
    id: "q2",
    text: "Seul(e) ou en groupe ?",
    options: [
      { label: "En tete-a-tete", modes: ["solo-diner", "breakup", "langue"] },
      { label: "Petit groupe (3-5)", modes: ["plus-one", "gamer-night"] },
      { label: "Plus on est de fous", modes: ["seasonal", "culture-club"] },
    ],
  },
  {
    id: "q3",
    text: "T'es plutot quel moment de la soiree ?",
    options: [
      { label: "Aperitif (18h-20h)", modes: ["fit-date", "dog-date", "sober-tonight"] },
      { label: "Diner (20h-22h)", modes: ["solo-diner", "foodie-quest", "culture-club"] },
      { label: "After (23h+)", modes: ["night-owl", "gamer-night"] },
    ],
  },
  {
    id: "q4",
    text: "Qu'est-ce qui te motive ce soir ?",
    options: [
      { label: "Rencontrer des gens", modes: ["new-in-town", "tourist", "langue"] },
      { label: "Decouvrir un spot", modes: ["foodie-quest", "culture-club"] },
      { label: "Se changer les idees", modes: ["breakup", "fit-date", "dog-date"] },
      { label: "Faire la fete", modes: ["plus-one", "night-owl", "seasonal"] },
    ],
  },
  {
    id: "q5",
    text: "Ton vibe du moment ?",
    options: [
      { label: "Chill & zen", modes: ["sober-tonight", "breakup", "dog-date"] },
      { label: "Aventurier", modes: ["foodie-quest", "tourist", "fit-date"] },
      { label: "Social butterfly", modes: ["plus-one", "langue", "new-in-town"] },
      { label: "Geek assumee", modes: ["gamer-night", "culture-club"] },
    ],
  },
];

const STORAGE_KEY = "cesoir_onboarding_done";

interface OnboardingQuizProps {
  onComplete?: (suggestedModes: ModeKey[]) => void;
}

export default function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<ModeKey[][]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = useCallback(
    (modes: ModeKey[]) => {
      const newAnswers = [...answers, modes];
      setAnswers(newAnswers);

      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        setShowResults(true);
      }
    },
    [currentQ, answers],
  );

  // Tally mode scores and pick top 3
  const suggestedModes: ModeKey[] = (() => {
    if (!showResults) return [];

    const scores = new Map<ModeKey, number>();
    for (const ans of answers) {
      for (const mode of ans) {
        scores.set(mode, (scores.get(mode) ?? 0) + 1);
      }
    }

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mode]) => mode);
  })();

  const handleDone = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onComplete?.(suggestedModes);
  }, [suggestedModes, onComplete]);

  const question = QUESTIONS[currentQ];
  const progressPct = ((currentQ + (showResults ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="bg-[#111] border border-white/8 rounded-3xl p-6 max-w-md mx-auto">
      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#00FF88] rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {/* Question number */}
            <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold mb-2">
              Question {currentQ + 1}/{QUESTIONS.length}
            </p>

            {/* Question text */}
            <h2 className="text-[20px] text-white font-black leading-tight mb-6">
              {question.text}
            </h2>

            {/* Options */}
            <div className="space-y-2">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt.modes)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-[14px] text-white hover:bg-[#8B5CF6]/15 hover:border-[#8B5CF6]/30 transition-all active:scale-[0.98] tap-target"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-[11px] text-[#00FF88] uppercase tracking-widest font-bold mb-2">
              Resultat
            </p>
            <h2 className="text-[20px] text-white font-black leading-tight mb-2">
              Tes modes CeSoir
            </h2>
            <p className="text-[13px] text-white/50 mb-6">
              Voila les 3 modes qui te correspondent le mieux
            </p>

            <div className="space-y-3 mb-6">
              {suggestedModes.map((modeKey, i) => {
                const mode = MODES[modeKey];
                return (
                  <motion.div
                    key={modeKey}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8"
                    style={{ backgroundColor: `${mode.color}15` }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span className="text-[24px]">{mode.icon}</span>
                    <div>
                      <p className="text-[14px] text-white font-semibold">
                        {mode.name}
                      </p>
                      <p className="text-[11px] text-white/40 line-clamp-1">
                        {mode.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <button
              onClick={handleDone}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#00FF88] text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            >
              C'est parti !
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
