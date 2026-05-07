"use client";

import { useState, useCallback, useEffect } from "react";

// ─────────────────────────────────────────
// Tutorial State Manager
// ─────────────────────────────────────────

const STORAGE_KEY = "cesoir_tutorial_done";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  /** CSS selector for the element to spotlight (null = full-screen overlay) */
  targetSelector: string | null;
  /** Where to position the tooltip relative to the target */
  tooltipPosition: "top" | "bottom" | "left" | "right";
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "bienvenue",
    title: "Bienvenue !",
    description:
      "CeSoir, c'est l'app pour trouver quelqu'un avec qui passer la soirée. On te fait le tour en 30 secondes.",
    targetSelector: null,
    tooltipPosition: "bottom",
  },
  {
    id: "modes",
    title: "Tes modes",
    description:
      "4 modes pour ce soir : Solo Diner, Night Owl, Plus-One, Foodie Quest. Choisis ton mood ici.",
    targetSelector: '[href="/modes"]',
    tooltipPosition: "top",
  },
  {
    id: "explore",
    title: "Explore",
    description:
      "Découvre les profils dispos autour de toi. Filtre par mode, distance, ou laisse-toi surprendre.",
    targetSelector: '[href="/browse"]',
    tooltipPosition: "top",
  },
  {
    id: "swipe",
    title: "Swipe",
    description:
      "Swipe à droite pour matcher, à gauche pour passer. C'est aussi simple que ça.",
    targetSelector: null,
    tooltipPosition: "bottom",
  },
  {
    id: "chat",
    title: "Chat",
    description:
      "Quand c'est mutuel, discutez ici pour organiser la soirée. Ice-breakers inclus.",
    targetSelector: '[href="/chat"]',
    tooltipPosition: "top",
  },
  {
    id: "profil",
    title: "Ton profil",
    description:
      "Ajoute tes photos, ta bio, tes vibes. Plus ton profil est complet, plus tu matches.",
    targetSelector: '[href="/profile"]',
    tooltipPosition: "top",
  },
  {
    id: "securite",
    title: "Sécurité",
    description:
      "Triple-tap sur le logo pour le mode SOS. Partage ta localisation en temps réel avec tes proches.",
    targetSelector: "[data-logo-moon]",
    tooltipPosition: "bottom",
  },
  {
    id: "cest-parti",
    title: "C'est parti !",
    description:
      "Tu es prêt. Ce soir, c'est ce soir. Amuse-toi bien !",
    targetSelector: null,
    tooltipPosition: "bottom",
  },
];

export interface UseTutorialReturn {
  /** The current step object, or null if tutorial is inactive */
  currentStep: TutorialStep | null;
  /** 0-indexed current step number */
  currentStepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether the tutorial is currently active */
  isActive: boolean;
  /** Advance to the next step (or finish if last) */
  nextStep: () => void;
  /** Skip the entire tutorial */
  skipAll: () => void;
  /** Restart the tutorial from the beginning */
  restartTutorial: () => void;
}

export function useTutorial(): UseTutorialReturn {
  const [stepIndex, setStepIndex] = useState(-1); // -1 = not started / inactive
  const [isActive, setIsActive] = useState(false);

  // Auto-start on first visit
  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the page has time to render targets
      const timer = setTimeout(() => {
        setStepIndex(0);
        setIsActive(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsActive(false);
    setStepIndex(-1);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((prev) => {
      const next = prev + 1;
      if (next >= TUTORIAL_STEPS.length) {
        // Will finish after the state update
        setTimeout(() => finish(), 0);
        return prev;
      }
      return next;
    });
  }, [finish]);

  const skipAll = useCallback(() => {
    finish();
  }, [finish]);

  const restartTutorial = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const currentStep =
    isActive && stepIndex >= 0 && stepIndex < TUTORIAL_STEPS.length
      ? TUTORIAL_STEPS[stepIndex]
      : null;

  return {
    currentStep,
    currentStepIndex: stepIndex,
    totalSteps: TUTORIAL_STEPS.length,
    isActive,
    nextStep,
    skipAll,
    restartTutorial,
  };
}
