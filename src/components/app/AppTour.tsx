"use client";

import { useState, useEffect, useCallback } from "react";

const TOUR_KEY = "cesoir_tour_completed";

const steps = [
  {
    title: "Choisis ton mode",
    description: "CeSoir a 14 modes differents. Solo Diner, Night Owl, Dog Date... Choisis celui qui te correspond ce soir.",
    icon: "\uD83C\uDFAF",
  },
  {
    title: "Swipe les profils",
    description: "Decouvre les personnes disponibles autour de toi. Swipe a droite si tu veux les rencontrer.",
    icon: "\uD83D\uDC4B",
  },
  {
    title: "Match & Chat",
    description: "Quand c'est mutuel, c'est un match ! Discutez pour organiser la soiree.",
    icon: "\uD83D\uDCAC",
  },
  {
    title: "Retrouvez-vous",
    description: "Choisissez un lieu, une heure, et passez une super soiree. Ce soir, c'est ce soir !",
    icon: "\uD83C\uDF1F",
  },
];

export default function AppTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      setVisible(true);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      // Finish tour
      localStorage.setItem(TOUR_KEY, "true");
      setVisible(false);
    }
  }, [step]);

  const skipTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
  }, []);

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-bg rounded-3xl p-8 text-center">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? "bg-accent w-6" : i < step ? "bg-accent/40" : "bg-border"
              }`}
            />
          ))}
        </div>

        <p className="text-5xl mb-4">{current.icon}</p>
        <h2 className="text-[20px] font-black mb-2">{current.title}</h2>
        <p className="text-[14px] text-text-muted leading-relaxed mb-8">
          {current.description}
        </p>

        <div className="flex gap-3">
          {!isLast && (
            <button
              onClick={skipTour}
              className="flex-1 py-3 rounded-full text-sm font-medium text-text-muted border border-border"
            >
              Passer
            </button>
          )}
          <button
            onClick={nextStep}
            className="flex-1 py-3 rounded-full text-sm font-bold text-white gradient-bg"
          >
            {isLast ? "C'est parti !" : "Suivant"}
          </button>
        </div>

        <p className="text-[10px] text-text-muted mt-4">
          {step + 1} / {steps.length}
        </p>
      </div>
    </div>
  );
}
