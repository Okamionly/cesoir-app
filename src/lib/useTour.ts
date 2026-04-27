"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────
// useTour — first-time onboarding tour state manager
//
// Separate from `useTutorial` (which runs an 8-step app-wide
// guided tutorial). The tour is a focused 4-step spotlight
// overlay that fires ONCE per browser, only when:
//   1. localStorage flag `cesoir-tour-completed` is NOT set, AND
//   2. the user has never completed a swipe (`first_swipe` not in
//      analytics fired set) — which functionally means "less than
//      one swipe done", as required by the spec.
//
// The hook exposes `complete`, `skip`, `next`, `reset` and the
// derived state. Persistence uses localStorage with try/catch
// around every read/write because Safari Private Mode throws on
// `setItem` (see lessons.md gotchas).
// ─────────────────────────────────────────────────────────────

export const TOUR_STORAGE_KEY = "cesoir-tour-completed";
export const TOUR_SIGNUP_TS_KEY = "cesoir-signup-ts";

/** Single step targeting one DOM node by CSS selector. */
export interface TourStep {
  /** Stable id for analytics & React keys. */
  id: string;
  /** CSS selector resolved at runtime when the step activates. */
  selector: string;
  /** Headline shown above the description. */
  title: string;
  /** Body copy — one short sentence. */
  body: string;
  /** Preferred tooltip side; auto-flips at runtime if it would clip offscreen. */
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  /** Extra padding (px) around the spotlight cutout. Default 8. */
  padding?: number;
  /** Force a circular cutout instead of a rounded rectangle. */
  shape?: "rect" | "circle";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "swipe-deck",
    selector: '[data-tour="swipe-deck"]',
    title: "Swipe à droite pour matcher",
    body: "Glisse la carte à droite pour liker, à gauche pour passer. C'est aussi simple que ça.",
    placement: "bottom",
    padding: 4,
    shape: "rect",
  },
  {
    id: "like-button",
    selector: '[data-tour="like-button"]',
    title: "Like quelqu'un qui te plaît",
    body: "Tape le cœur pour liker sans glisser. Match instantané si c'est mutuel.",
    placement: "top",
    padding: 12,
    shape: "circle",
  },
  {
    id: "modes-tab",
    selector: '[data-tour="modes-tab"]',
    title: "Choisis ton mode pour ce soir",
    body: "Solo Diner, Night Owl, Dog Date… 14 façons de sortir. Choisis ton mood ici.",
    placement: "top",
    padding: 8,
    shape: "rect",
  },
  {
    id: "profile-tab",
    selector: '[data-tour="profile-tab"]',
    title: "Complète ton profil pour matcher plus",
    body: "Photos, bio, vibes : plus ton profil est complet, plus tu attires les bons matchs.",
    placement: "top",
    padding: 8,
    shape: "rect",
  },
];

export interface UseTourReturn {
  /** Whether the tour overlay should be rendered. */
  active: boolean;
  /** 0-indexed current step. */
  currentStep: number;
  /** Total step count (cached so consumers can render dots). */
  totalSteps: number;
  /** Resolved current step object, or null when inactive. */
  step: TourStep | null;
  /** Programmatically open the tour (used by the auto-trigger effect). */
  start: () => void;
  /** Advance one step; auto-completes after the last step. */
  next: () => void;
  /** Mark the tour as fully completed (writes localStorage). */
  complete: () => void;
  /** Dismiss the tour early (also writes localStorage). */
  skip: () => void;
  /** Debug helper — clears the localStorage flag and reopens at step 0. */
  reset: () => void;
}

// Local helpers — wrapped in try/catch because Safari Private Mode
// + some embedded webviews throw on storage access.
function readDone(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  } catch {
    // If we can't read storage, treat the tour as already done so
    // we never trap users in a permanent overlay loop.
    return true;
  }
}

function writeDone(): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  } catch {
    // Storage write failed — the tour will retry next mount, which
    // is acceptable degraded behaviour.
  }
}

function clearDone(): void {
  try {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch {
    // No-op
  }
}

// Mirrors the convention used by `analytics.ts → trackFirstTime`.
// We probe the same key so we know whether a swipe has ever been recorded.
const ANALYTICS_FIRED_KEY = "cesoir_core_events_fired";
function hasAnySwipe(): boolean {
  try {
    const raw = localStorage.getItem(ANALYTICS_FIRED_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return false;
    return parsed.includes("first_swipe");
  } catch {
    return false;
  }
}

export function useTour(): UseTourReturn {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-detect first-time conditions once, on mount.
  // Conditions (per spec):
  //   - tour-completed flag NOT set
  //   - user has < 1 swipe done
  // We delay the actual reveal by 700ms so the swipe deck (which
  // uses a Suspense + skeleton + lazy data fetch) has time to mount
  // its targets. Without the delay, the SVG mask resolves to the
  // viewport bounds (target missing → 0×0 cutout shows nothing).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (readDone()) return;
    if (hasAnySwipe()) {
      // User has swiped before — don't pester them with an onboarding
      // overlay. Mark as done so future renders skip the probe.
      writeDone();
      return;
    }
    const t = window.setTimeout(() => {
      setCurrentStep(0);
      setActive(true);
    }, 700);
    return () => window.clearTimeout(t);
  }, []);

  const complete = useCallback(() => {
    writeDone();
    setActive(false);
    setCurrentStep(0);
  }, []);

  const skip = useCallback(() => {
    writeDone();
    setActive(false);
    setCurrentStep(0);
  }, []);

  const start = useCallback(() => {
    setCurrentStep(0);
    setActive(true);
  }, []);

  const next = useCallback(() => {
    setCurrentStep((prev) => {
      const candidate = prev + 1;
      if (candidate >= TOUR_STEPS.length) {
        // Defer write+close so this state update flushes cleanly.
        // (calling setActive inside the same setState would be flagged
        // by React as an update during render.)
        queueMicrotask(() => {
          writeDone();
          setActive(false);
        });
        return prev;
      }
      return candidate;
    });
  }, []);

  const reset = useCallback(() => {
    clearDone();
    setCurrentStep(0);
    setActive(true);
  }, []);

  const step = useMemo(
    () => (active ? TOUR_STEPS[currentStep] ?? null : null),
    [active, currentStep],
  );

  return {
    active,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    step,
    start,
    next,
    complete,
    skip,
    reset,
  };
}
