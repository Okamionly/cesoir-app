"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DATE_IDEAS,
  CATEGORY_META,
  ALL_CATEGORIES,
  getRandomIdea,
  priceLabel,
  type DateIdea,
  type DateCategory,
  type PriceRange,
} from "@/lib/dateIdeas";
import { MODES, type ModeKey } from "@/lib/modes";
import { springs, micro } from "@/lib/motion-design";
import DateSuggestionCard from "@/components/app/DateSuggestionCard";

// ─────────────────────────────────────────
// Motion variants for this page
// ─────────────────────────────────────────

const ideasVariants = {
  chip: {
    hidden: { opacity: 0, x: -15, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { ...springs.snap, delay: i * 0.04 },
    }),
    tap: { scale: 0.92, transition: springs.micro },
  },
  card: {
    hidden: { opacity: 0, scale: 0.85, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { ...springs.elastic, delay: i * 0.04 },
    }),
    hover: {
      y: -4,
      boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
      transition: springs.gentle,
    },
    tap: { scale: 0.97, transition: springs.micro },
  },
  grid: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.1 },
    },
  },
  savedItem: {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: springs.elastic,
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: -50,
      transition: { duration: 0.2 },
    },
  },
};

// ─────────────────────────────────────────
// Price filter options
// ─────────────────────────────────────────

const PRICE_OPTIONS: { label: string; value: PriceRange | "all" }[] = [
  { label: "Tous", value: "all" },
  { label: "Gratuit", value: "gratuit" },
  { label: "€", value: "€" },
  { label: "€€", value: "€€" },
  { label: "€€€", value: "€€€" },
];

const DURATION_OPTIONS: { label: string; maxMinutes: number | null }[] = [
  { label: "Tous", maxMinutes: null },
  { label: "< 1h", maxMinutes: 60 },
  { label: "1-2h", maxMinutes: 120 },
  { label: "2h+", maxMinutes: 999 },
];

/** Parse duration string to minutes */
function parseDuration(d: string): number {
  const match = d.match(/(\d+)h?(\d+)?/);
  if (!match) return 90;
  const hours = parseInt(match[1], 10);
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  // If the number is small and no "h", treat as hours
  if (d.includes("h")) return hours * 60 + mins;
  return hours;
}

// ─────────────────────────────────────────
// Main page
// ─────────────────────────────────────────

export default function IdeasPage() {
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<
    DateCategory | "all"
  >("all");
  const [selectedPrice, setSelectedPrice] = useState<PriceRange | "all">("all");
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  // State
  const [savedIdeas, setSavedIdeas] = useState<DateIdea[]>([]);
  const [showSwipeMode, setShowSwipeMode] = useState(false);
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);
  const [randomIdea, setRandomIdea] = useState<DateIdea | null>(null);
  const [diceSpinning, setDiceSpinning] = useState(false);
  const diceRef = useRef<HTMLButtonElement>(null);

  // Filtered ideas
  const filteredIdeas = useMemo(() => {
    return DATE_IDEAS.filter((idea) => {
      if (selectedCategory !== "all" && idea.category !== selectedCategory)
        return false;
      if (selectedPrice !== "all") {
        const order: PriceRange[] = ["gratuit", "€", "€€", "€€€"];
        if (order.indexOf(idea.priceRange) > order.indexOf(selectedPrice))
          return false;
      }
      if (selectedDuration !== null) {
        const mins = parseDuration(idea.duration);
        if (selectedDuration === 60 && mins > 60) return false;
        if (selectedDuration === 120 && (mins < 60 || mins > 120)) return false;
        if (selectedDuration === 999 && mins <= 120) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedPrice, selectedDuration]);

  // Swipe mode ideas (filtered)
  const swipeIdeas = useMemo(() => {
    return filteredIdeas.filter(
      (i) => !savedIdeas.some((s) => s.id === i.id),
    );
  }, [filteredIdeas, savedIdeas]);

  // AI recommendation — based on most common mode across saved ideas
  const aiRecommendation = useMemo(() => {
    if (savedIdeas.length < 2) return null;
    // Count mode frequency
    const modeCounts: Record<string, number> = {};
    savedIdeas.forEach((idea) => {
      idea.modes.forEach((m) => {
        modeCounts[m] = (modeCounts[m] || 0) + 1;
      });
    });
    const topMode = Object.entries(modeCounts).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] as ModeKey | undefined;
    if (!topMode) return null;

    // Find an unsaved idea matching the top mode
    const candidates = DATE_IDEAS.filter(
      (i) =>
        i.modes.includes(topMode) && !savedIdeas.some((s) => s.id === i.id),
    );
    if (candidates.length === 0) return null;
    return {
      idea: candidates[Math.floor(Math.random() * candidates.length)],
      mode: MODES[topMode],
    };
  }, [savedIdeas]);

  // Handlers
  const handleSave = useCallback((idea: DateIdea) => {
    setSavedIdeas((prev) => {
      if (prev.some((i) => i.id === idea.id)) return prev;
      return [...prev, idea];
    });
    setCurrentSwipeIndex((i) => i + 1);
  }, []);

  const handleSkip = useCallback(() => {
    setCurrentSwipeIndex((i) => i + 1);
  }, []);

  const handleRemoveSaved = useCallback((id: string) => {
    setSavedIdeas((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleDiceRoll = useCallback(() => {
    setDiceSpinning(true);
    // Wait for spin animation then reveal
    setTimeout(() => {
      const idea = getRandomIdea(
        selectedCategory !== "all" ? { category: selectedCategory } : undefined,
      );
      setRandomIdea(idea);
      setDiceSpinning(false);
    }, 600);
  }, [selectedCategory]);

  const handleSaveFromGrid = useCallback((idea: DateIdea) => {
    setSavedIdeas((prev) => {
      if (prev.some((i) => i.id === idea.id)) return prev;
      return [...prev, idea];
    });
  }, []);

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-text">
              Quoi faire ce soir ?
            </h1>
            <p className="text-[12px] text-text-muted mt-0.5">
              {filteredIdeas.length} idee{filteredIdeas.length !== 1 ? "s" : ""}{" "}
              pour toi
            </p>
          </div>

          {/* Dice button */}
          <motion.button
            ref={diceRef}
            onClick={handleDiceRoll}
            className="w-11 h-11 rounded-full gradient-bg flex items-center justify-center shadow-glow"
            whileTap={micro.tapScale}
            animate={
              diceSpinning
                ? { rotate: 720, scale: [1, 1.2, 1] }
                : { rotate: 0, scale: 1 }
            }
            transition={
              diceSpinning
                ? { ...springs.rubber, duration: 0.6 }
                : springs.snap
            }
            aria-label="Suggestion aleatoire"
          >
            <span className="text-[20px] select-none">🎲</span>
          </motion.button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
          <motion.button
            variants={ideasVariants.chip}
            custom={0}
            initial="hidden"
            animate="visible"
            whileTap="tap"
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
              selectedCategory === "all"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-text-muted"
            }`}
          >
            Tous
          </motion.button>
          {ALL_CATEGORIES.map((cat, i) => {
            const meta = CATEGORY_META[cat];
            return (
              <motion.button
                key={cat}
                variants={ideasVariants.chip}
                custom={i + 1}
                initial="hidden"
                animate="visible"
                whileTap="tap"
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? "all" : cat)
                }
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                  selectedCategory === cat
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text-muted"
                }`}
              >
                {meta.emoji} {meta.label}
              </motion.button>
            );
          })}
        </div>

        {/* Price + Duration filters */}
        <div className="flex gap-4 px-5 pb-3">
          {/* Price */}
          <div className="flex gap-1.5">
            {PRICE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedPrice(opt.value)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                  selectedPrice === opt.value
                    ? "gradient-bg text-white"
                    : "bg-border/30 text-text-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-px bg-border/50" />

          {/* Duration */}
          <div className="flex gap-1.5">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setSelectedDuration(opt.maxMinutes)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                  selectedDuration === opt.maxMinutes
                    ? "gradient-bg text-white"
                    : "bg-border/30 text-text-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-2 px-5 pb-3">
          <button
            onClick={() => setShowSwipeMode(false)}
            className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all ${
              !showSwipeMode
                ? "bg-accent/10 text-accent border border-accent/30"
                : "bg-border/20 text-text-muted border border-transparent"
            }`}
          >
            Grille
          </button>
          <button
            onClick={() => {
              setShowSwipeMode(true);
              setCurrentSwipeIndex(0);
            }}
            className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all ${
              showSwipeMode
                ? "bg-accent/10 text-accent border border-accent/30"
                : "bg-border/20 text-text-muted border border-transparent"
            }`}
          >
            Swipe
          </button>
        </div>
      </header>

      {/* AI Recommendation banner */}
      <AnimatePresence>
        {aiRecommendation && !showSwipeMode && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={springs.heavy}
            className="mx-4 mt-4 overflow-hidden"
          >
            <div className="gradient-bg-subtle rounded-2xl p-4 border border-accent/10">
              <div className="flex items-start gap-3">
                <span className="text-[28px]">{aiRecommendation.idea.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-accent uppercase tracking-[0.2em] font-bold mb-1">
                    Base sur tes gouts
                  </p>
                  <p className="text-[14px] font-bold text-text truncate">
                    {aiRecommendation.idea.title}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                    Parce que tu aimes le mode{" "}
                    <span style={{ color: aiRecommendation.mode.color }}>
                      {aiRecommendation.mode.name}
                    </span>
                  </p>
                </div>
                <motion.button
                  onClick={() => handleSaveFromGrid(aiRecommendation.idea)}
                  className="shrink-0 w-9 h-9 rounded-full border-2 border-accent/30 flex items-center justify-center"
                  whileTap={micro.tapScale}
                  aria-label="Sauvegarder la suggestion"
                >
                  <SaveHeart
                    saved={savedIdeas.some(
                      (s) => s.id === aiRecommendation.idea.id,
                    )}
                  />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Random idea reveal */}
      <AnimatePresence>
        {randomIdea && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRandomIdea(null)}
          >
            <motion.div
              className="w-full max-w-sm bg-bg rounded-[28px] overflow-hidden border border-border/50"
              initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.6, rotate: 10, opacity: 0 }}
              transition={springs.elastic}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Emoji header */}
              <div
                className="flex flex-col items-center py-8"
                style={{
                  background: `linear-gradient(180deg, ${
                    CATEGORY_META[randomIdea.category].color
                  }15 0%, transparent 100%)`,
                }}
              >
                <motion.span
                  className="text-[72px] leading-none"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...springs.elastic, delay: 0.2 }}
                >
                  {randomIdea.emoji}
                </motion.span>
              </div>

              <div className="px-6 pb-6">
                <h3 className="text-[22px] font-black text-text text-center">
                  {randomIdea.title}
                </h3>
                <p className="text-[13px] text-text-soft text-center mt-2 leading-relaxed">
                  {randomIdea.description}
                </p>

                {/* Meta */}
                <div className="flex justify-center gap-4 mt-4">
                  <span className="text-[11px] text-text-muted">
                    {randomIdea.duration}
                  </span>
                  <span className="text-text-muted/30">|</span>
                  <span className="text-[11px] text-text-muted">
                    {priceLabel(randomIdea.priceRange)}
                  </span>
                  <span className="text-text-muted/30">|</span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{
                      color: CATEGORY_META[randomIdea.category].color,
                    }}
                  >
                    {CATEGORY_META[randomIdea.category].label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setRandomIdea(null)}
                    className="flex-1 h-11 rounded-full border-2 border-border text-text-muted text-[13px] font-bold"
                    whileTap={micro.tapScale}
                  >
                    Fermer
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      handleSaveFromGrid(randomIdea);
                      setRandomIdea(null);
                    }}
                    className="flex-1 h-11 rounded-full gradient-bg text-white text-[13px] font-bold"
                    whileTap={micro.tapScale}
                  >
                    Sauvegarder
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      {showSwipeMode ? (
        /* ─── Swipe mode ─── */
        <div className="relative px-4 pt-4" style={{ height: "65vh" }}>
          {swipeIdeas.length > 0 && currentSwipeIndex < swipeIdeas.length ? (
            <>
              {/* Stack behind cards */}
              {[2, 1].map((offset) => {
                const idx = currentSwipeIndex + offset;
                if (idx >= swipeIdeas.length) return null;
                return (
                  <motion.div
                    key={swipeIdeas[idx].id}
                    className="absolute inset-0 rounded-[28px] bg-bg border border-border/30"
                    animate={{
                      scale: 1 - offset * 0.05,
                      y: offset * 8,
                      opacity: 1 - offset * 0.2,
                    }}
                    transition={springs.gentle}
                  />
                );
              })}

              {/* Active card */}
              <AnimatePresence mode="popLayout">
                <DateSuggestionCard
                  key={swipeIdeas[currentSwipeIndex].id}
                  idea={swipeIdeas[currentSwipeIndex]}
                  onSave={handleSave}
                  onSkip={() => handleSkip()}
                  stackIndex={0}
                />
              </AnimatePresence>

              {/* Progress */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                <span className="text-[10px] text-text-muted bg-bg/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  {currentSwipeIndex + 1} / {swipeIdeas.length}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-[48px] mb-4">🎉</span>
              <p className="text-[16px] font-bold text-text">
                Tu as tout explore !
              </p>
              <p className="text-[12px] text-text-muted mt-1">
                {savedIdeas.length} idee{savedIdeas.length !== 1 ? "s" : ""}{" "}
                sauvegardee{savedIdeas.length !== 1 ? "s" : ""}
              </p>
              <motion.button
                onClick={() => setCurrentSwipeIndex(0)}
                className="mt-4 px-6 py-2.5 rounded-full gradient-bg text-white text-[13px] font-bold"
                whileTap={micro.tapScale}
              >
                Recommencer
              </motion.button>
            </div>
          )}
        </div>
      ) : (
        /* ─── Grid mode ─── */
        <>
          {filteredIdeas.length > 0 ? (
            <motion.div
              className="grid grid-cols-2 gap-3 px-4 pt-4"
              variants={ideasVariants.grid}
              initial="hidden"
              animate="visible"
              key={`${selectedCategory}-${selectedPrice}-${selectedDuration}`}
            >
              {filteredIdeas.map((idea, i) => (
                <IdeaGridCard
                  key={idea.id}
                  idea={idea}
                  index={i}
                  saved={savedIdeas.some((s) => s.id === idea.id)}
                  onSave={() => handleSaveFromGrid(idea)}
                  onRemove={() => handleRemoveSaved(idea.id)}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              onReset={() => {
                setSelectedCategory("all");
                setSelectedPrice("all");
                setSelectedDuration(null);
              }}
            />
          )}
        </>
      )}

      {/* Saved ideas section */}
      {savedIdeas.length > 0 && (
        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-black text-text">
              Mes idees sauvegardees
            </h2>
            <span className="text-[11px] text-text-muted bg-border/30 px-2.5 py-1 rounded-full font-semibold">
              {savedIdeas.length}
            </span>
          </div>

          <motion.div className="space-y-2" layout>
            <AnimatePresence>
              {savedIdeas.map((idea) => (
                <motion.div
                  key={idea.id}
                  variants={ideasVariants.savedItem}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border/50"
                >
                  <span className="text-[28px] shrink-0">{idea.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-text truncate">
                      {idea.title}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {idea.duration} · {priceLabel(idea.priceRange)} ·{" "}
                      {CATEGORY_META[idea.category].label}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => handleRemoveSaved(idea.id)}
                    className="shrink-0 w-8 h-8 rounded-full bg-border/30 flex items-center justify-center text-text-muted"
                    whileTap={micro.tapScale}
                    aria-label={`Retirer ${idea.title}`}
                  >
                    <IconMinus size={14} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Grid card
// ─────────────────────────────────────────

function IdeaGridCard({
  idea,
  index,
  saved,
  onSave,
  onRemove,
}: {
  idea: DateIdea;
  index: number;
  saved: boolean;
  onSave: () => void;
  onRemove: () => void;
}) {
  const categoryMeta = CATEGORY_META[idea.category];

  return (
    <motion.div
      variants={ideasVariants.card}
      custom={index}
      whileHover="hover"
      whileTap="tap"
      className="rounded-2xl overflow-hidden bg-bg border border-border/50 transition-colors hover:border-border"
    >
      {/* Top section with emoji */}
      <div
        className="relative flex items-center justify-center py-6"
        style={{
          background: `linear-gradient(180deg, ${categoryMeta.color}10 0%, transparent 100%)`,
        }}
      >
        <span className="text-[40px] select-none">{idea.emoji}</span>

        {/* Save button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            saved ? onRemove() : onSave();
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: saved ? "rgba(0,255,136,0.15)" : "rgba(0,0,0,0.05)",
          }}
          whileTap={micro.tapScale}
          aria-label={saved ? "Retirer" : "Sauvegarder"}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={saved ? "saved" : "unsaved"}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              transition={springs.elastic}
            >
              <SaveHeart saved={saved} />
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Price pill */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/5 text-[9px] font-bold text-text-muted">
          {priceLabel(idea.priceRange)}
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pb-3">
        <h3 className="text-[13px] font-bold text-text leading-tight">
          {idea.title}
        </h3>
        <p className="text-[10px] text-text-muted mt-1 line-clamp-2 leading-relaxed">
          {idea.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
            style={{
              backgroundColor: `${categoryMeta.color}12`,
              color: categoryMeta.color,
            }}
          >
            {categoryMeta.emoji} {categoryMeta.label}
          </span>
          <span className="text-[9px] text-text-muted">{idea.duration}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// SaveHeart — animated heart icon
// ─────────────────────────────────────────

function SaveHeart({ saved }: { saved: boolean }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={saved ? "#00FF88" : "none"}
        stroke={saved ? "#00FF88" : "currentColor"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

// ─────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center px-8 pt-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
    >
      <div className="w-16 h-16 rounded-full bg-border/30 flex items-center justify-center mb-5">
        <span className="text-[28px]">🔍</span>
      </div>
      <p className="text-[15px] font-bold text-text mb-1 text-center">
        Aucune idee ne correspond
      </p>
      <p className="text-[12px] text-text-muted mb-6 text-center">
        Essaie d&apos;elargir tes filtres
      </p>
      <motion.button
        onClick={onReset}
        className="gradient-bg text-white px-6 py-2.5 rounded-full text-[13px] font-semibold"
        whileTap={micro.tapScale}
      >
        Reinitialiser les filtres
      </motion.button>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Inline Icons
// ─────────────────────────────────────────

function IconMinus({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
