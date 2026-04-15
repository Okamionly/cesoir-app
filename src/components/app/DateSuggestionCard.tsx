"use client";

import { useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "motion/react";
import {
  type DateIdea,
  CATEGORY_META,
  priceLabel,
} from "@/lib/dateIdeas";
import { MODES, type ModeKey } from "@/lib/modes";
import { springs, browseVariants, micro } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface DateSuggestionCardProps {
  idea: DateIdea;
  /** Called when user swipes right or taps "J'adore" */
  onSave: (idea: DateIdea) => void;
  /** Called when user swipes left or taps "Suivant" */
  onSkip: (idea: DateIdea) => void;
  /** Called when user taps "Proposer a {match}" */
  onPropose?: (idea: DateIdea) => void;
  /** Match name for the propose button */
  matchName?: string;
  /** Stack index for depth effect */
  stackIndex?: number;
}

// ─────────────────────────────────────────
// Swipe thresholds
// ─────────────────────────────────────────

const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function DateSuggestionCard({
  idea,
  onSave,
  onSkip,
  onPropose,
  matchName,
  stackIndex = 0,
}: DateSuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);

  // Drag motion values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const saveOpacity = useTransform(x, [0, 80, 150], [0, 0.5, 1]);
  const skipOpacity = useTransform(x, [-150, -80, 0], [1, 0.5, 0]);

  const categoryMeta = CATEGORY_META[idea.category];

  // Compatible modes (show max 4)
  const compatibleModes = idea.modes
    .slice(0, 4)
    .map((m) => MODES[m as ModeKey])
    .filter(Boolean);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const shouldSwipeRight =
        info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD;
      const shouldSwipeLeft =
        info.offset.x < -SWIPE_THRESHOLD ||
        info.velocity.x < -VELOCITY_THRESHOLD;

      if (shouldSwipeRight) {
        setExiting("right");
        onSave(idea);
      } else if (shouldSwipeLeft) {
        setExiting("left");
        onSkip(idea);
      }
    },
    [idea, onSave, onSkip],
  );

  const handleSaveClick = useCallback(() => {
    setExiting("right");
    onSave(idea);
  }, [idea, onSave]);

  const handleSkipClick = useCallback(() => {
    setExiting("left");
    onSkip(idea);
  }, [idea, onSkip]);

  const toggleExpand = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  if (exiting) {
    return (
      <motion.div
        className="absolute inset-0"
        initial={{ x: 0, opacity: 1 }}
        animate={{
          x: exiting === "right" ? 500 : -500,
          rotate: exiting === "right" ? 20 : -20,
          opacity: 0,
        }}
        transition={{ duration: 0.4 }}
      />
    );
  }

  return (
    <motion.div
      className="absolute inset-0 touch-none"
      style={{
        x,
        rotate,
        zIndex: 10 - stackIndex,
        cursor: "grab",
      }}
      variants={browseVariants.card}
      initial="initial"
      animate="center"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
    >
      {/* Card container */}
      <motion.div
        className="relative w-full h-full rounded-[28px] overflow-hidden bg-bg border border-border/50 flex flex-col"
        onClick={toggleExpand}
        layout
        transition={springs.heavy}
      >
        {/* Swipe indicators */}
        <motion.div
          className="absolute top-8 left-6 z-20 pointer-events-none"
          style={{ opacity: saveOpacity }}
        >
          <div className="px-5 py-2 rounded-2xl border-2 border-[#00FF88] bg-[#00FF88]/15 backdrop-blur-sm -rotate-6">
            <span className="text-[#00FF88] text-[18px] font-black tracking-widest">
              J&apos;ADORE
            </span>
          </div>
        </motion.div>
        <motion.div
          className="absolute top-8 right-6 z-20 pointer-events-none"
          style={{ opacity: skipOpacity }}
        >
          <div className="px-5 py-2 rounded-2xl border-2 border-[#ff4466] bg-[#ff4466]/15 backdrop-blur-sm rotate-6">
            <span className="text-[#ff4466] text-[18px] font-black tracking-widest">
              SUIVANT
            </span>
          </div>
        </motion.div>

        {/* Top section — Large emoji + category */}
        <div
          className="relative flex-shrink-0 flex flex-col items-center justify-center pt-10 pb-6"
          style={{
            background: `linear-gradient(180deg, ${categoryMeta.color}12 0%, transparent 100%)`,
          }}
        >
          {/* Category pill */}
          <div
            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${categoryMeta.color}15`,
              color: categoryMeta.color,
              border: `1px solid ${categoryMeta.color}30`,
            }}
          >
            {categoryMeta.emoji} {categoryMeta.label}
          </div>

          {/* Price badge */}
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-border/30 text-[11px] font-semibold text-text-muted">
            {priceLabel(idea.priceRange)}
          </div>

          {/* Main emoji */}
          <motion.span
            className="text-[80px] leading-none mb-3 select-none"
            animate={
              expanded
                ? { scale: 0.7, y: -10 }
                : { scale: 1, y: 0 }
            }
            transition={springs.elastic}
          >
            {idea.emoji}
          </motion.span>

          {/* Title */}
          <h3 className="text-[24px] font-black tracking-tight text-text text-center px-6">
            {idea.title}
          </h3>

          {/* Duration */}
          <div className="flex items-center gap-2 mt-2">
            <IconClock size={12} />
            <span className="text-[12px] text-text-muted font-medium">
              {idea.duration}
            </span>
            <span className="text-text-muted/30">|</span>
            <span className="text-[12px] text-text-muted font-medium capitalize">
              {idea.bestTime === "any" ? "Tout moment" : idea.bestTime}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 px-6 pb-4 overflow-y-auto">
          <p
            className={`text-[14px] text-text-soft leading-relaxed ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {idea.description}
          </p>

          {/* Compatible modes */}
          <div className="mt-4">
            <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] font-bold mb-2">
              Parfait pour
            </p>
            <div className="flex flex-wrap gap-1.5">
              {compatibleModes.map((mode) => (
                <span
                  key={mode.key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: `${mode.color}12`,
                    color: mode.color,
                    border: `1px solid ${mode.color}25`,
                  }}
                >
                  {mode.icon} {mode.name}
                </span>
              ))}
              {idea.modes.length > 4 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-border/30 text-text-muted">
                  +{idea.modes.length - 4}
                </span>
              )}
            </div>
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={springs.snap}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                  {/* All compatible modes */}
                  {idea.modes.length > 4 && (
                    <div>
                      <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] font-bold mb-2">
                        Tous les modes compatibles
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {idea.modes.map((m) => {
                          const mode = MODES[m as ModeKey];
                          if (!mode) return null;
                          return (
                            <span
                              key={m}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                              style={{
                                backgroundColor: `${mode.color}12`,
                                color: mode.color,
                              }}
                            >
                              {mode.icon} {mode.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick info grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <InfoTile
                      label="Budget"
                      value={priceLabel(idea.priceRange)}
                    />
                    <InfoTile label="Duree" value={idea.duration} />
                    <InfoTile
                      label="Moment"
                      value={
                        idea.bestTime === "any"
                          ? "Flexible"
                          : idea.bestTime.charAt(0).toUpperCase() +
                            idea.bestTime.slice(1)
                      }
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom action bar */}
        <div className="flex-shrink-0 px-6 pb-6 pt-2 flex items-center gap-3">
          {/* Skip button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleSkipClick();
            }}
            className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center text-text-muted"
            whileTap={micro.tapScale}
            aria-label="Suivant"
          >
            <IconX size={20} />
          </motion.button>

          {/* Propose button */}
          {onPropose && matchName && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onPropose(idea);
              }}
              className="flex-1 h-12 rounded-full gradient-bg text-white text-[13px] font-bold"
              whileTap={micro.tapScale}
            >
              Proposer a {matchName}
            </motion.button>
          )}

          {/* Save button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleSaveClick();
            }}
            className="w-12 h-12 rounded-full border-2 border-[#00FF88] flex items-center justify-center"
            whileTap={micro.tapScale}
            aria-label="Sauvegarder"
          >
            <IconHeart size={20} className="text-[#00FF88]" />
          </motion.button>
        </div>

        {/* Expand indicator */}
        <div className="flex justify-center pb-3">
          <div
            className={`w-8 h-[3px] rounded-full bg-border transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-border/20 rounded-xl p-2.5 text-center">
      <p className="text-[8px] text-text-muted uppercase tracking-wider font-bold">
        {label}
      </p>
      <p className="text-[13px] text-text font-bold mt-0.5">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// Inline Icons
// ─────────────────────────────────────────

function IconClock({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-text-muted"
      />
      <path
        d="M12 7v5l3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-text-muted"
      />
    </svg>
  );
}

function IconX({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHeart({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
      />
    </svg>
  );
}
