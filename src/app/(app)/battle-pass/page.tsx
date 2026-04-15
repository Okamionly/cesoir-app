"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro, easings } from "@/lib/motion-design";

// ─── Types ───────────────────────────────────────
interface Tier {
  level: number;
  freeReward: { icon: string; label: string };
  premiumReward: { icon: string; label: string };
  xpRequired: number;
}

// ─── Data ────────────────────────────────────────
const SEASON = {
  name: "Saison 1 — Nuits de Printemps",
  endsIn: "23 jours",
  currentXP: 2350,
  maxXP: 5000,
};

const TIERS: Tier[] = [
  { level: 1, freeReward: { icon: "⚡", label: "100 XP" }, premiumReward: { icon: "🌸", label: "Cadre Sakura" }, xpRequired: 0 },
  { level: 2, freeReward: { icon: "✨", label: "200 XP" }, premiumReward: { icon: "💜", label: "Badge Violet" }, xpRequired: 500 },
  { level: 3, freeReward: { icon: "🔥", label: "+5 Karma" }, premiumReward: { icon: "🚀", label: "Boost 2h" }, xpRequired: 1000 },
  { level: 4, freeReward: { icon: "⭐", label: "300 XP" }, premiumReward: { icon: "🎭", label: "Emoji exclusif" }, xpRequired: 1500 },
  { level: 5, freeReward: { icon: "💫", label: "+10 Karma" }, premiumReward: { icon: "👑", label: "Cadre Royal" }, xpRequired: 2000 },
  { level: 6, freeReward: { icon: "🎯", label: "400 XP" }, premiumReward: { icon: "🌙", label: "Badge Lune" }, xpRequired: 2500 },
  { level: 7, freeReward: { icon: "💎", label: "+15 Karma" }, premiumReward: { icon: "⚡", label: "Super Boost 4h" }, xpRequired: 3000 },
  { level: 8, freeReward: { icon: "🏆", label: "500 XP" }, premiumReward: { icon: "🦋", label: "Cadre Papillon" }, xpRequired: 3500 },
  { level: 9, freeReward: { icon: "🌟", label: "+20 Karma" }, premiumReward: { icon: "💠", label: "Aura Diamant" }, xpRequired: 4200 },
  { level: 10, freeReward: { icon: "🎉", label: "1000 XP" }, premiumReward: { icon: "🌈", label: "Cadre Legendaire" }, xpRequired: 5000 },
];

// ─── Variants ────────────────────────────────────
const tierVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...springs.heavy, delay: 0.05 + i * 0.06 },
  }),
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.elastic,
  },
};

const rewardPopVariants = {
  hidden: { scale: 0, rotate: -45 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: springs.elastic,
  },
};

// ─── Component ───────────────────────────────────
export default function BattlePassPage() {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [isPremium] = useState(false);

  const currentTier = TIERS.findIndex((t) => SEASON.currentXP < t.xpRequired);
  const unlockedUpTo = currentTier === -1 ? TIERS.length : currentTier;
  const progressPct = (SEASON.currentXP / SEASON.maxXP) * 100;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/discover"
            className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center tap-target"
            aria-label="Retour"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-bold text-text">Battle Pass</h1>
            <p className="text-[11px] text-text-muted">{SEASON.name}</p>
          </div>
        </div>
      </header>

      <div className="px-5 pt-5 pb-24">
        {/* Season banner */}
        <motion.div
          className="relative rounded-2xl overflow-hidden mb-6 p-5"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Decorative stars */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/30"
              style={{ top: `${20 + i * 15}%`, left: `${10 + i * 18}%` }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
            />
          ))}

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[20px]">🌸</span>
              <h2 className="text-[16px] font-black text-white">{SEASON.name}</h2>
            </div>
            <p className="text-[12px] text-white/60 mb-4">
              Se termine dans {SEASON.endsIn}
            </p>

            {/* XP Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-white/80">Progression</span>
                <span className="text-[11px] font-bold text-white">{SEASON.currentXP} / {SEASON.maxXP} XP</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #8B5CF6, #00FF88)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ ...springs.heavy, delay: 0.3 }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/50">Tier {unlockedUpTo} / {TIERS.length}</span>
              <div className="flex items-center gap-1.5">
                {isPremium ? (
                  <span className="text-[10px] font-bold text-[#f59e0b] bg-[#f59e0b]/20 px-2 py-0.5 rounded-full">
                    PREMIUM
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                    GRATUIT
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Track legend */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-accent/20 border border-accent/30" />
            <span className="text-[10px] text-text-muted font-medium">Gratuit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "linear-gradient(135deg, #f59e0b, #ec4899)" }} />
            <span className="text-[10px] text-text-muted font-medium">Premium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-safe" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] text-text-muted font-medium">Debloque</span>
          </div>
        </div>

        {/* Tiers list */}
        <div className="space-y-2.5">
          {TIERS.map((tier, i) => {
            const isUnlocked = i < unlockedUpTo;
            const isCurrent = i === unlockedUpTo;
            const tierPct = tier.xpRequired > 0 ? Math.min(100, (SEASON.currentXP / tier.xpRequired) * 100) : 100;

            return (
              <motion.div
                key={tier.level}
                variants={tierVariants}
                initial="hidden"
                animate="visible"
                custom={i}
                className={`relative bg-bg-card border rounded-2xl overflow-hidden transition-colors ${
                  isCurrent
                    ? "border-accent/40 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                    : isUnlocked
                    ? "border-safe/20"
                    : "border-border"
                }`}
              >
                {/* Progress bar for current tier */}
                {isCurrent && (
                  <motion.div
                    className="absolute top-0 left-0 h-full opacity-5"
                    style={{ background: "linear-gradient(90deg, #8B5CF6, #00FF88)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${tierPct}%` }}
                    transition={{ ...springs.heavy, delay: 0.5 + i * 0.06 }}
                  />
                )}

                <div className="relative flex items-center gap-3 p-3.5">
                  {/* Level number */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-black ${
                      isUnlocked
                        ? "gradient-bg text-white"
                        : isCurrent
                        ? "border-2 border-accent text-accent"
                        : "bg-border text-text-muted"
                    }`}
                  >
                    {isUnlocked ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      tier.level
                    )}
                  </div>

                  {/* Free reward */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <motion.span
                        className="text-[16px]"
                        variants={isUnlocked ? rewardPopVariants : undefined}
                        initial={isUnlocked ? "hidden" : undefined}
                        animate={isUnlocked ? "visible" : undefined}
                      >
                        {tier.freeReward.icon}
                      </motion.span>
                      <span className={`text-[12px] font-semibold ${isUnlocked ? "text-text" : "text-text-muted"}`}>
                        {tier.freeReward.label}
                      </span>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="w-px h-8 bg-border shrink-0" />

                  {/* Premium reward */}
                  <div className="flex items-center gap-2">
                    <motion.span
                      className={`text-[16px] ${!isPremium && !isUnlocked ? "opacity-40 grayscale" : ""}`}
                      variants={isUnlocked && isPremium ? rewardPopVariants : undefined}
                      initial={isUnlocked && isPremium ? "hidden" : undefined}
                      animate={isUnlocked && isPremium ? "visible" : undefined}
                    >
                      {tier.premiumReward.icon}
                    </motion.span>
                    <span className={`text-[12px] font-semibold ${
                      isUnlocked && isPremium ? "text-text" : "text-text-muted opacity-50"
                    }`}>
                      {tier.premiumReward.label}
                    </span>
                    {!isPremium && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted/40 shrink-0" aria-hidden="true">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* XP requirement label */}
                {!isUnlocked && (
                  <div className="px-3.5 pb-2">
                    <span className="text-[9px] text-text-muted font-medium">
                      {tier.xpRequired} XP requis
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Premium CTA */}
        {!isPremium && (
          <motion.div
            className="mt-6 rounded-2xl p-5 text-center"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(236,72,153,0.08))" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.heavy, delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[24px]">👑</span>
              <h3 className="text-[16px] font-black text-text">Debloquer Premium</h3>
            </div>
            <p className="text-[12px] text-text-muted mb-4 leading-relaxed">
              Accede aux recompenses exclusives : cadres de profil, badges rares, boosts et plus encore.
            </p>
            <motion.button
              className="w-full py-3.5 rounded-full text-[14px] font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ec4899)" }}
              whileTap={micro.tapScale}
            >
              Debloquer Premium
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
