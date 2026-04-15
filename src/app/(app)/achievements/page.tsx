"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { achievementVariants, springs, micro } from "@/lib/motion-design";
import {
  ALL_BADGES,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
  getBadgesGrouped,
  type Badge,
  type BadgeCategory,
  type BadgeRarity,
} from "@/lib/badges";
import { useBadges, type BadgeProgress } from "@/lib/useBadges";
import { useGamification } from "@/lib/useGamification";

// ─────────────────────────────────────────
// Category order for display
// ─────────────────────────────────────────

const CATEGORY_ORDER: BadgeCategory[] = [
  "social",
  "explorer",
  "streak",
  "safety",
  "quality",
  "special",
];

// ─────────────────────────────────────────
// Rarity border styles
// ─────────────────────────────────────────

function rarityBorderClass(rarity: BadgeRarity, earned: boolean): string {
  if (!earned) return "border-border";
  switch (rarity) {
    case "common":
      return "border-[#6b7280]";
    case "rare":
      return "border-[#3b82f6]";
    case "epic":
      return "border-[#8B5CF6]";
    case "legendary":
      return "border-[#f59e0b]";
  }
}

function rarityBgClass(rarity: BadgeRarity, earned: boolean): string {
  if (!earned) return "bg-bg-card";
  switch (rarity) {
    case "common":
      return "bg-[#6b7280]/5";
    case "rare":
      return "bg-[#3b82f6]/5";
    case "epic":
      return "bg-[#8B5CF6]/5";
    case "legendary":
      return "bg-[#f59e0b]/5";
  }
}

function rarityGlow(rarity: BadgeRarity): string {
  return RARITY_CONFIG[rarity].glowColor;
}

function rarityLabel(rarity: BadgeRarity): string {
  return RARITY_CONFIG[rarity].label;
}

function rarityDotColor(rarity: BadgeRarity): string {
  return RARITY_CONFIG[rarity].borderColor;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function AchievementsPage() {
  const { all, earned, totalEarned, loading } = useBadges();
  const { level, title, xp, progress, nextLevelXP } = useGamification();
  const [selected, setSelected] = useState<BadgeProgress | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<BadgeCategory>
  >(new Set());

  // Group badge progress by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    config: CATEGORY_CONFIG[cat],
    badges: all.filter((bp) => bp.badge.category === cat),
    earnedCount: all.filter((bp) => bp.badge.category === cat && bp.earned)
      .length,
    totalCount: ALL_BADGES.filter((b) => b.category === cat).length,
  }));

  const toggleCategory = (cat: BadgeCategory) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  // XP bar values
  const xpForLevel = nextLevelXP > 0 ? nextLevelXP : 1;
  const levelProgress = progress;

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-safe">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-[22px] font-black text-text font-display">
          Mes trophees
        </h1>
        <p className="text-[13px] text-text-muted mt-1">
          {totalEarned}/{ALL_BADGES.length} debloques
        </p>
      </header>

      {/* Level card */}
      <div className="mx-5 mb-6 p-5 rounded-2xl border border-accent/20 bg-accent/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] text-accent font-semibold">
              Niveau {level}
            </p>
            <p className="text-[18px] font-black text-text">{title}</p>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-black gradient-text">{xp}</p>
            <p className="text-[11px] text-text-muted">XP total</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-bg"
            style={{ transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: levelProgress }}
            transition={springs.heavy}
          />
        </div>
        <p className="text-[11px] text-text-muted mt-1.5">
          {Math.round(levelProgress * xpForLevel)}/{xpForLevel} XP pour le
          niveau {level + 1}
        </p>
      </div>

      {/* Badge counter bar */}
      <div className="mx-5 mb-4 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-accent"
            style={{ transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: totalEarned / ALL_BADGES.length }}
            transition={springs.heavy}
          />
        </div>
        <span className="text-[13px] font-bold text-accent shrink-0">
          {totalEarned}/{ALL_BADGES.length}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      )}

      {/* Categories with collapsible sections */}
      {!loading &&
        grouped.map(({ category, config, badges, earnedCount, totalCount }) => {
          const isCollapsed = collapsedCategories.has(category);

          return (
            <section key={category} className="px-5 mb-5">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center justify-between w-full py-2 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <h2 className="text-[15px] font-bold text-text">
                    {config.label}
                  </h2>
                  <span className="text-[12px] text-text-muted font-medium">
                    {earnedCount}/{totalCount}
                  </span>
                </div>
                <motion.svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text-muted"
                  animate={{ rotate: isCollapsed ? -90 : 0 }}
                  transition={springs.snap}
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </button>

              {/* Badge grid */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={springs.snap}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-3 gap-3 pt-1 pb-2">
                      {badges.map((bp, i) => (
                        <BadgeCard
                          key={bp.badge.id}
                          bp={bp}
                          index={i}
                          onSelect={() => setSelected(bp)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={springs.elastic}
              className={`bg-bg rounded-3xl p-6 max-w-sm w-full border-2 shadow-glow ${rarityBorderClass(selected.badge.rarity, selected.earned)}`}
              onClick={(e) => e.stopPropagation()}
              style={
                selected.earned && selected.badge.rarity === "legendary"
                  ? {
                      boxShadow: `0 0 40px ${rarityGlow(selected.badge.rarity)}`,
                    }
                  : undefined
              }
            >
              <div className="text-center">
                {/* Rarity label */}
                <div className="flex justify-center mb-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: rarityDotColor(selected.badge.rarity),
                      backgroundColor: `${rarityDotColor(selected.badge.rarity)}15`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: rarityDotColor(selected.badge.rarity),
                      }}
                    />
                    {rarityLabel(selected.badge.rarity)}
                  </span>
                </div>

                <span className="text-5xl mb-3 block">
                  {selected.badge.emoji}
                </span>
                <h3 className="text-[20px] font-black text-text mb-1">
                  {selected.badge.name}
                </h3>
                <p className="text-[14px] text-text-muted mb-4">
                  {selected.badge.description}
                </p>

                {selected.earned ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-safe/10 text-safe text-[12px] font-semibold">
                    <svg
                      width={14}
                      height={14}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {selected.earnedAt
                      ? `Debloque le ${new Date(selected.earnedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`
                      : "Debloque"}
                  </div>
                ) : (
                  <div>
                    <p className="text-[12px] text-text-muted mb-2">
                      {selected.badge.requirement}
                    </p>
                    {selected.progress !== null && selected.progress > 0 && (
                      <div className="mt-2">
                        <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: rarityDotColor(
                                selected.badge.rarity,
                              ),
                              transformOrigin: "left",
                            }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: selected.progress }}
                            transition={springs.heavy}
                          />
                        </div>
                        <p className="text-[11px] text-text-muted mt-1">
                          {selected.progressLabel}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[13px] font-bold gradient-text mt-3">
                  +{selected.badge.xp} XP
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-full mt-5 py-3 rounded-full border border-border text-[14px] font-semibold text-text-muted hover:text-text transition-colors"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────
// BadgeCard sub-component
// ─────────────────────────────────────────

function BadgeCard({
  bp,
  index,
  onSelect,
}: {
  bp: BadgeProgress;
  index: number;
  onSelect: () => void;
}) {
  const { badge, earned, progress, progressLabel } = bp;
  const isLegendary = earned && badge.rarity === "legendary";

  if (earned) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{
          opacity: 1,
          scale: [0.85, 1.3, 0.95, 1.05, 1],
          filter: "grayscale(0)",
        }}
        transition={{
          scale: {
            duration: 0.8,
            times: [0, 0.3, 0.5, 0.7, 1],
            delay: index * 0.06,
          },
          opacity: { duration: 0.3, delay: index * 0.06 },
        }}
        onClick={onSelect}
        className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${rarityBorderClass(badge.rarity, true)} ${rarityBgClass(badge.rarity, true)} hover:brightness-110`}
        whileTap={micro.tapScale}
        style={
          isLegendary
            ? {
                boxShadow: `0 0 20px ${rarityGlow(badge.rarity)}`,
              }
            : undefined
        }
      >
        {/* Legendary glow animation */}
        {isLegendary && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 10px ${rarityGlow(badge.rarity)}`,
                `0 0 30px ${rarityGlow(badge.rarity)}`,
                `0 0 10px ${rarityGlow(badge.rarity)}`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span className="text-2xl">{badge.emoji}</span>
        <span className="text-[11px] font-semibold text-text text-center leading-tight">
          {badge.name}
        </span>
        {/* Rarity dot */}
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{ backgroundColor: rarityDotColor(badge.rarity) }}
        />
      </motion.button>
    );
  }

  // Locked badge
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 0.5, scale: 1, filter: "grayscale(1)" }}
      transition={{ duration: 0.4, delay: index * 0.06 + 0.3 }}
      onClick={onSelect}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-opacity ${rarityBorderClass(badge.rarity, false)} ${rarityBgClass(badge.rarity, false)} hover:opacity-70`}
      whileTap={micro.tapScale}
    >
      <span className="text-2xl">{badge.emoji}</span>
      <span className="text-[11px] font-semibold text-text-muted text-center leading-tight">
        {badge.name}
      </span>

      {/* Progress bar for in-progress badges */}
      {progress !== null && progress > 0 && progress < 1 && (
        <div className="w-full mt-1">
          <div className="w-full h-1 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-accent/60"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-[9px] text-text-muted text-center mt-0.5">
            {progressLabel}
          </p>
        </div>
      )}

      {/* Lock icon for badges with zero progress */}
      {(progress === null || progress === 0) && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-border flex items-center justify-center">
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none">
            <path
              d="M19 11H5V21H19V11Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M17 11V7A5 5 0 007 7V11"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>
      )}
    </motion.button>
  );
}
