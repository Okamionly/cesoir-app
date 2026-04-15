"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useTutorial } from "@/lib/useTutorial";
import { Confetti } from "@/components/ui/Confetti";

// ─────────────────────────────────────────
// Tutorial Overlay — Spotlight + Tooltip
// ─────────────────────────────────────────

/** Rect describing a DOM element's position */
interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Padding around the spotlight hole */
const SPOTLIGHT_PAD = 8;
/** Tooltip max width */
const TOOLTIP_MAX_W = 320;
/** Gap between spotlight and tooltip */
const TOOLTIP_GAP = 12;

/**
 * Build a CSS clip-path that cuts a rounded-rect hole in a full-screen overlay.
 * The hole reveals the target element underneath.
 */
function buildClipPath(rect: SpotlightRect | null, vw: number, vh: number): string {
  if (!rect) {
    // No target — full overlay, no hole
    return "none";
  }

  const x = rect.left - SPOTLIGHT_PAD;
  const y = rect.top - SPOTLIGHT_PAD;
  const w = rect.width + SPOTLIGHT_PAD * 2;
  const h = rect.height + SPOTLIGHT_PAD * 2;
  const r = 16; // border-radius of the hole

  // Outer rectangle (full viewport) + inner rounded-rect hole (counter-clockwise)
  // Using polygon with evenodd fill-rule via CSS isn't possible,
  // so we use an SVG-based approach via url() or a simpler inset strategy.
  // Actually, the cleanest approach: use a large box-shadow on a positioned element.
  // But clip-path polygon approach works for rectangular holes:

  return `polygon(
    evenodd,
    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
    ${x}px ${y + r}px,
    ${x + r}px ${y}px,
    ${x + w - r}px ${y}px,
    ${x + w}px ${y + r}px,
    ${x + w}px ${y + h - r}px,
    ${x + w - r}px ${y + h}px,
    ${x + r}px ${y + h}px,
    ${x}px ${y + h - r}px,
    ${x}px ${y + r}px
  )`;
}

/**
 * Compute tooltip position so it stays within viewport bounds.
 */
function computeTooltipStyle(
  rect: SpotlightRect | null,
  preferredPos: "top" | "bottom" | "left" | "right",
  vw: number,
  vh: number,
): React.CSSProperties {
  if (!rect) {
    // Center on screen for full-overlay steps
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: TOOLTIP_MAX_W,
      width: "calc(100vw - 48px)",
    };
  }

  const style: React.CSSProperties = {
    position: "fixed",
    maxWidth: TOOLTIP_MAX_W,
    width: "calc(100vw - 48px)",
  };

  const centerX = rect.left + rect.width / 2;

  // Horizontal centering, clamped to viewport
  const tooltipW = Math.min(TOOLTIP_MAX_W, vw - 48);
  let left = centerX - tooltipW / 2;
  left = Math.max(16, Math.min(left, vw - tooltipW - 16));
  style.left = left;

  if (preferredPos === "top") {
    const spaceAbove = rect.top - SPOTLIGHT_PAD;
    if (spaceAbove > 120) {
      style.bottom = vh - rect.top + SPOTLIGHT_PAD + TOOLTIP_GAP;
    } else {
      // Fallback to bottom
      style.top = rect.top + rect.height + SPOTLIGHT_PAD + TOOLTIP_GAP;
    }
  } else {
    const spaceBelow = vh - (rect.top + rect.height + SPOTLIGHT_PAD);
    if (spaceBelow > 120) {
      style.top = rect.top + rect.height + SPOTLIGHT_PAD + TOOLTIP_GAP;
    } else {
      // Fallback to top
      style.bottom = vh - rect.top + SPOTLIGHT_PAD + TOOLTIP_GAP;
    }
  }

  return style;
}

// ─────────────────────────────────────────
// Swipe icons for the "Swipe" step
// ─────────────────────────────────────────

function SwipeIllustration() {
  return (
    <div className="flex items-center justify-center gap-8 my-4">
      <motion.div
        animate={{ x: [-5, -20, -5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>
        <span className="text-[10px] text-text-muted font-semibold">Passer</span>
      </motion.div>

      <motion.div
        animate={{ x: [5, 20, 5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-10 h-10 rounded-full bg-[#00FF88]/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#00FF88" stroke="none" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <span className="text-[10px] text-text-muted font-semibold">Matcher</span>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────

export default function TutorialOverlay() {
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    isActive,
    nextStep,
    skipAll,
  } = useTutorial();

  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [slideDir, setSlideDir] = useState(1); // 1 = forward
  const overlayRef = useRef<HTMLDivElement>(null);

  // Track viewport size
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Find and track the target element
  useEffect(() => {
    if (!currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const el = document.querySelector(currentStep.targetSelector!);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetRect(null);
      }
    };

    // Initial find + poll in case element isn't rendered yet
    findTarget();
    const interval = setInterval(findTarget, 300);
    window.addEventListener("scroll", findTarget, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", findTarget);
    };
  }, [currentStep]);

  const handleNext = useCallback(() => {
    // Last step triggers confetti
    if (currentStepIndex === totalSteps - 2) {
      // Moving to the "C'est parti!" step
      setSlideDir(1);
      nextStep();
    } else if (currentStepIndex === totalSteps - 1) {
      // Finishing the tutorial
      setShowConfetti(true);
      setTimeout(() => {
        skipAll();
      }, 1500);
    } else {
      setSlideDir(1);
      nextStep();
    }
  }, [currentStepIndex, totalSteps, nextStep, skipAll]);

  const handleSkip = useCallback(() => {
    skipAll();
  }, [skipAll]);

  if (!isActive || !currentStep) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isCestParti = currentStep.id === "cest-parti";
  const isSwipeStep = currentStep.id === "swipe";
  const isBienvenue = currentStep.id === "bienvenue";
  const hasTarget = currentStep.targetSelector !== null;

  const clipPath = buildClipPath(targetRect, viewportSize.w, viewportSize.h);
  const tooltipStyle = computeTooltipStyle(
    targetRect,
    currentStep.tooltipPosition,
    viewportSize.w,
    viewportSize.h,
  );

  return (
    <>
      {/* Confetti for final step */}
      <Confetti active={showConfetti} />

      <AnimatePresence mode="wait">
        <motion.div
          key="tutorial-overlay"
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90]"
          aria-modal="true"
          role="dialog"
          aria-label={`Tutoriel etape ${currentStepIndex + 1} sur ${totalSteps}: ${currentStep.title}`}
        >
          {/* Semi-transparent backdrop */}
          {hasTarget && targetRect ? (
            // Overlay with spotlight hole using box-shadow technique
            <motion.div
              className="absolute inset-0 pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onClick={handleNext}
              style={{
                clipPath,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
              }}
            />
          ) : (
            // Full overlay for non-targeted steps
            <motion.div
              className="absolute inset-0 bg-black/75 backdrop-blur-sm pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onClick={handleNext}
            />
          )}

          {/* Spotlight ring glow around target */}
          {hasTarget && targetRect && (
            <motion.div
              className="absolute pointer-events-none rounded-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                boxShadow: [
                  "0 0 0px rgba(139,92,246,0.3)",
                  "0 0 20px rgba(139,92,246,0.6)",
                  "0 0 0px rgba(139,92,246,0.3)",
                ],
              }}
              transition={{
                opacity: { duration: 0.3 },
                scale: springs.elastic,
                boxShadow: { duration: 2, repeat: Infinity },
              }}
              style={{
                top: targetRect.top - SPOTLIGHT_PAD,
                left: targetRect.left - SPOTLIGHT_PAD,
                width: targetRect.width + SPOTLIGHT_PAD * 2,
                height: targetRect.height + SPOTLIGHT_PAD * 2,
                border: "2px solid rgba(139,92,246,0.4)",
              }}
            />
          )}

          {/* Tooltip bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, scale: 0.8, x: slideDir * 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: slideDir * -40 }}
              transition={springs.elastic}
              className="pointer-events-auto"
              style={tooltipStyle}
            >
              <div className="bg-bg rounded-3xl p-6 shadow-2xl border border-border relative">
                {/* Arrow pointing to target (only for targeted steps) */}
                {hasTarget && targetRect && currentStep.tooltipPosition === "top" && (
                  <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-bg border-r border-b border-border"
                    aria-hidden="true"
                  />
                )}
                {hasTarget && targetRect && currentStep.tooltipPosition === "bottom" && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-bg border-l border-t border-border"
                    aria-hidden="true"
                  />
                )}

                {/* Step counter */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase">
                    {currentStepIndex + 1} / {totalSteps}
                  </span>
                  {!isLastStep && (
                    <button
                      onClick={handleSkip}
                      className="text-[11px] font-semibold text-text-muted hover:text-text transition-colors"
                    >
                      Passer le tuto
                    </button>
                  )}
                </div>

                {/* Welcome icon for first step */}
                {isBienvenue && (
                  <motion.div
                    className="text-center mb-3"
                    animate={{
                      rotate: [0, -5, 5, -3, 0],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-4xl">&#x263E;</span>
                  </motion.div>
                )}

                {/* C'est parti celebration icon */}
                {isCestParti && (
                  <motion.div
                    className="text-center mb-3"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={springs.elastic}
                  >
                    <span className="text-4xl">&#x1F389;</span>
                  </motion.div>
                )}

                {/* Title */}
                <h2 className="text-lg font-black text-text mb-1.5">
                  {currentStep.title}
                </h2>

                {/* Description */}
                <p className="text-[13px] text-text-muted leading-relaxed mb-4">
                  {currentStep.description}
                </p>

                {/* Swipe illustration for swipe step */}
                {isSwipeStep && <SwipeIllustration />}

                {/* Step indicator dots */}
                <div className="flex justify-center gap-1.5 mb-4">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 rounded-full"
                      animate={{
                        width: i === currentStepIndex ? 20 : 6,
                        backgroundColor:
                          i === currentStepIndex
                            ? "#8B5CF6"
                            : i < currentStepIndex
                              ? "rgba(139,92,246,0.4)"
                              : "rgba(139,92,246,0.15)",
                      }}
                      transition={springs.snap}
                    />
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  {!isLastStep && (
                    <button
                      onClick={handleSkip}
                      className="flex-1 py-2.5 rounded-full text-sm font-medium text-text-muted border border-border active:scale-95 transition-transform"
                    >
                      Passer
                    </button>
                  )}
                  <motion.button
                    onClick={handleNext}
                    whileTap={{ scale: 0.95 }}
                    transition={springs.micro}
                    className="flex-1 py-2.5 rounded-full text-sm font-bold text-white gradient-bg"
                  >
                    {isLastStep ? "C'est parti !" : "Suivant"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
