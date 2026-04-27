"use client";

import { useEffect, useLayoutEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Transition } from "motion/react";
import { useTour, type TourStep } from "@/lib/useTour";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────────────────────────
// Tour — first-time onboarding spotlight overlay
//
// Renders an SVG mask that dims the whole viewport except for a
// rounded-rect "hole" cut out around the active step's target
// element. A tooltip floats next to the cutout, auto-flipping
// to stay onscreen.
//
// Implementation notes:
//  - The SVG mask is the only reliable cross-browser way to draw
//    a "darkening overlay with a transparent hole". Box-shadow
//    tricks fail on rounded corners and transparency layering.
//  - pointer-events on the backdrop are `none` so the highlighted
//    UI underneath stays interactive (per spec).
//  - The tooltip uses pointer-events: auto so its buttons remain
//    clickable.
//  - Position is recomputed on resize, scroll, and a 200ms RAF
//    poll while the step is active (cheap, handles late-mounting
//    targets like the swipe deck without observing every ancestor).
//  - prefers-reduced-motion gates spring transitions per spec.
// ─────────────────────────────────────────────────────────────

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  /** Final placement after collision detection. */
  placement: "top" | "bottom" | "left" | "right";
  /** Whether the tooltip rendered offscreen and we should hide it. */
  hidden: boolean;
}

const TOOLTIP_WIDTH = 296;
const TOOLTIP_GAP = 16; // gap between cutout and tooltip
const VIEWPORT_MARGIN = 12;

// Detect prefers-reduced-motion at module level — it's a hook target
// further down so we still pick up changes if the user toggles it.
function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return prefers;
}

function getTargetRect(selector: string): Rect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = (el as HTMLElement).getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function computeTooltipPosition(
  rect: Rect,
  preferred: TourStep["placement"],
  viewportW: number,
  viewportH: number,
): TooltipPosition {
  // Estimate tooltip height — actual content is short (title + 2 lines + 2
  // buttons). 168px is a safe upper bound; we don't need pixel precision.
  const tooltipH = 168;
  const candidates: Array<TooltipPosition["placement"]> =
    preferred === "auto" || !preferred
      ? ["bottom", "top", "right", "left"]
      : [preferred, "bottom", "top", "right", "left"];

  for (const placement of candidates) {
    let top = 0;
    let left = 0;
    switch (placement) {
      case "top":
        top = rect.top - tooltipH - TOOLTIP_GAP;
        left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case "bottom":
        top = rect.top + rect.height + TOOLTIP_GAP;
        left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - TOOLTIP_WIDTH - TOOLTIP_GAP;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left + rect.width + TOOLTIP_GAP;
        break;
    }

    // Clamp horizontally onto the viewport.
    left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(left, viewportW - TOOLTIP_WIDTH - VIEWPORT_MARGIN),
    );

    // If the placement keeps the tooltip vertically onscreen, accept it.
    const fitsVertical =
      top >= VIEWPORT_MARGIN &&
      top + tooltipH <= viewportH - VIEWPORT_MARGIN;
    if (fitsVertical) {
      return { top, left, placement, hidden: false };
    }
  }

  // Last-resort fallback: pin to bottom of viewport, centered horizontally.
  return {
    top: viewportH - tooltipH - VIEWPORT_MARGIN,
    left: Math.max(
      VIEWPORT_MARGIN,
      Math.min(
        viewportW / 2 - TOOLTIP_WIDTH / 2,
        viewportW - TOOLTIP_WIDTH - VIEWPORT_MARGIN,
      ),
    ),
    placement: "bottom",
    hidden: false,
  };
}

export default function Tour() {
  const { active, currentStep, totalSteps, step, next, skip } = useTour();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  // Mount detection so we can portal into document.body without SSR mismatch.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track viewport size for responsive math.
  useEffect(() => {
    if (!active) return;
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [active]);

  // Resolve the active target's rect, then keep it in sync. We poll on a
  // 200ms interval while active because the swipe deck mounts late and
  // its `<motion.div>` shifts bounds during entrance animation; one-shot
  // measurement (or even a ResizeObserver on the target) would miss
  // those changes. Polling 5×/s costs ~1ms/frame — fine for a momentary
  // overlay.
  useLayoutEffect(() => {
    if (!active || !step) {
      setRect(null);
      return;
    }
    const measure = () => {
      const next = getTargetRect(step.selector);
      // Only setState when something changed, to avoid render churn.
      setRect((prev) => {
        if (
          prev &&
          next &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.height === next.height
        ) {
          return prev;
        }
        return next;
      });
    };
    measure();
    const interval = window.setInterval(measure, 200);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [active, step]);

  // ESC dismisses (per spec).
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skip();
      } else if (e.key === "Enter" || e.key === " ") {
        // Keyboard-accessible advance.
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, next, skip]);

  // Compute padding-inflated cutout bounds and tooltip position.
  const computed = useMemo(() => {
    if (!rect || !step || viewport.w === 0)
      return { cutout: null as Rect | null, tooltip: null as TooltipPosition | null };
    const padding = step.padding ?? 8;
    const cutout: Rect = {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };
    const tooltip = computeTooltipPosition(
      cutout,
      step.placement,
      viewport.w,
      viewport.h,
    );
    return { cutout, tooltip };
  }, [rect, step, viewport]);

  const handleNext = useCallback(() => {
    next();
  }, [next]);

  const handleSkip = useCallback(() => {
    skip();
  }, [skip]);

  if (!mounted || !active || !step) return null;

  // If the target hasn't resolved yet (e.g. swipe deck still loading),
  // render a soft "scrim only" state for a moment so the user sees the
  // overlay come up rather than nothing. The poll above will fill in
  // the cutout as soon as the target mounts.
  const cutout = computed.cutout;
  const tooltip = computed.tooltip;

  // Animation params — gated on prefers-reduced-motion per spec.
  const overlayTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: [0.16, 1, 0.3, 1] };
  const tooltipTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : (springs.snap as Transition);

  // Unique mask id per step so AnimatePresence cross-fades cleanly.
  const maskId = `tour-mask-${step.id}`;

  // Cutout shape — circular if requested AND target is roughly square,
  // otherwise rounded rect with a soft 18px corner radius.
  const useCircle =
    step.shape === "circle" &&
    cutout !== null &&
    Math.abs(cutout.width - cutout.height) < 24;

  const overlay = (
    <motion.div
      key="tour-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={overlayTransition}
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998, // sits over BottomNav (z-50) and FAB (z-40) but
        // below toast layer (z-9999) — see lessons.md gotchas.
        pointerEvents: "none",
      }}
    >
      {/* SVG mask — the dim layer is a black rect with the cutout
          punched through via mask-image. pointer-events: none lets
          underlying UI stay interactive (spec requirement). */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId}>
            {/* White = visible (dim), black = cutout (clear). */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {cutout && (
              useCircle ? (
                <circle
                  cx={cutout.left + cutout.width / 2}
                  cy={cutout.top + cutout.height / 2}
                  r={Math.max(cutout.width, cutout.height) / 2}
                  fill="black"
                />
              ) : (
                <rect
                  x={cutout.left}
                  y={cutout.top}
                  width={cutout.width}
                  height={cutout.height}
                  rx={18}
                  ry={18}
                  fill="black"
                />
              )
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask={`url(#${maskId})`}
        />
        {/* Soft accent ring around the cutout — purely decorative,
            picks up on the CeSoir violet token. */}
        {cutout && !useCircle && (
          <rect
            x={cutout.left}
            y={cutout.top}
            width={cutout.width}
            height={cutout.height}
            rx={18}
            ry={18}
            fill="none"
            stroke="rgba(139, 92, 246, 0.65)"
            strokeWidth="2"
            strokeDasharray="0"
          />
        )}
        {cutout && useCircle && (
          <circle
            cx={cutout.left + cutout.width / 2}
            cy={cutout.top + cutout.height / 2}
            r={Math.max(cutout.width, cutout.height) / 2}
            fill="none"
            stroke="rgba(139, 92, 246, 0.65)"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Tooltip — its own pointer-events:auto subtree so the CTAs
          remain clickable even though the parent overlay is `none`. */}
      {tooltip && !tooltip.hidden && (
        <motion.div
          key={`tour-tooltip-${step.id}`}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? {} : { opacity: 0, y: 8, scale: 0.96 }}
          transition={tooltipTransition}
          style={{
            position: "absolute",
            top: tooltip.top,
            left: tooltip.left,
            width: TOOLTIP_WIDTH,
            pointerEvents: "auto",
          }}
          className="rounded-2xl bg-bg shadow-2xl border border-border p-5"
        >
          {/* Step counter — small dots + numeric label */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`block h-1.5 rounded-full transition-all ${
                    i === currentStep
                      ? "w-6 bg-accent"
                      : i < currentStep
                        ? "w-1.5 bg-accent/40"
                        : "w-1.5 bg-border"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-text-muted tabular-nums">
              {currentStep + 1} / {totalSteps}
            </span>
          </div>

          <h3
            id="tour-title"
            className="text-[16px] font-bold text-text leading-tight mb-1.5"
          >
            {step.title}
          </h3>
          <p
            id="tour-body"
            className="text-[13px] text-text-muted leading-relaxed mb-4"
          >
            {step.body}
          </p>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="text-[13px] font-medium text-text-muted hover:text-text px-2 py-2 -ml-2 tap-target transition-colors"
            >
              Passer
            </button>
            <button
              type="button"
              onClick={handleNext}
              autoFocus
              className="gradient-bg text-white text-[13px] font-semibold px-5 py-2.5 rounded-full tap-target shadow-[0_4px_16px_-4px_rgba(139,92,246,0.45)]"
            >
              {currentStep + 1 === totalSteps ? "Terminer" : "Suivant"}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  return createPortal(
    <AnimatePresence mode="wait">{overlay}</AnimatePresence>,
    document.body,
  );
}
