"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, ambient, micro } from "@/lib/motion-design";
import {
  GUIDE_NEIGHBORHOODS,
  type GuideNeighborhood,
  type Spot,
  type SpotType,
  getSpotsByType,
  getCategoryLabel,
  getCategoryEmoji,
  getActivityLabel,
  getGoogleMapsUrl,
} from "@/lib/neighborhoodGuide";

// ─────────────────────────────────────────
// Motion variants — Guide signature
// ─────────────────────────────────────────

const neighborhoodPillVariants = {
  hidden: { opacity: 0, x: 20, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...springs.snap, delay: i * 0.04 },
  }),
  tap: { scale: 0.93, transition: springs.micro },
};

const categorySectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const categoryHeaderVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.heavy,
  },
};

const spotCardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { ...springs.heavy, delay: i * 0.06 },
  }),
  hover: {
    y: -2,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    transition: springs.gentle,
  },
  tap: { scale: 0.98, transition: springs.micro },
};

const vibeSummaryVariants = {
  hidden: { opacity: 0, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: springs.cinematic,
  },
};

const starVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { ...springs.elastic, delay: i * 0.05 },
  }),
};

const crossfadeVariants = {
  enter: { opacity: 0, scale: 0.98 },
  center: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
};

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const SPOT_CATEGORIES: SpotType[] = ["restaurant", "bar", "activity", "secret"];

const PRICE_LABELS: Record<string, string> = {
  "$": "Abordable",
  "$$": "Moyen",
  "$$$": "Haut de gamme",
  "$$$$": "Luxe",
};

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────

export default function GuidePage() {
  const [activeNeighborhood, setActiveNeighborhood] = useState<string>("marais");

  const neighborhood = useMemo(
    () => GUIDE_NEIGHBORHOODS.find((n) => n.id === activeNeighborhood) ?? GUIDE_NEIGHBORHOODS[0],
    [activeNeighborhood],
  );

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <h1 className="text-[20px] font-black tracking-tight text-text">
              Guide du quartier
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#00FF88]" />
              <span className="text-[11px] text-text-muted font-medium">
                {neighborhood.name}, {neighborhood.arrondissement}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-border/30 flex items-center justify-center">
            <IconLocation size={18} />
          </div>
        </div>

        {/* Neighborhood pills — horizontal scroll */}
        <div className="px-5 pt-2 pb-3">
          <motion.div
            className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.03 },
              },
            }}
          >
            {GUIDE_NEIGHBORHOODS.map((n, i) => (
              <motion.button
                key={n.id}
                variants={neighborhoodPillVariants}
                custom={i}
                whileTap="tap"
                onClick={() => setActiveNeighborhood(n.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
                  activeNeighborhood === n.id
                    ? "gradient-bg text-white shadow-lg shadow-accent/20"
                    : "bg-card border border-border text-text-muted hover:text-text hover:border-border/80"
                }`}
              >
                <span aria-hidden="true">{n.emoji}</span>
                {n.name}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </header>

      {/* Content — crossfade on neighborhood switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={neighborhood.id}
          variants={crossfadeVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {/* Vibe summary */}
          <motion.div
            className="mx-5 mt-5 p-4 rounded-2xl bg-card border border-border/50"
            variants={vibeSummaryVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{neighborhood.emoji}</span>
              <h2 className="text-[16px] font-bold text-text">{neighborhood.name}</h2>
              <span className="text-[11px] text-text-muted ml-auto">{neighborhood.arrondissement}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <VibePill label={`Ambiance: ${neighborhood.vibeTags[0]}`} />
              <VibePill label={`Activite: ${getActivityLabel(neighborhood.activityLevel)}`} />
              <VibePill label={`Meilleur pour: ${neighborhood.bestFor}`} />
            </div>
            {/* Activity level bar */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">
                Niveau
              </span>
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full ${
                      level <= neighborhood.activityLevel
                        ? "bg-gradient-to-r from-accent to-[#00FF88]"
                        : "bg-border/30"
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ ...springs.heavy, delay: level * 0.05 }}
                    style={{ originX: 0 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Category sections */}
          {SPOT_CATEGORIES.map((category) => {
            const spots = getSpotsByType(neighborhood, category);
            return (
              <CategorySection
                key={`${neighborhood.id}-${category}`}
                category={category}
                spots={spots}
              />
            );
          })}

          {/* Local tips */}
          <LocalTips tips={neighborhood.localTips} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function VibePill({ label }: { label: string }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-semibold text-accent">
      {label}
    </span>
  );
}

function CategorySection({ category, spots }: { category: SpotType; spots: Spot[] }) {
  return (
    <motion.section
      className="px-5 mt-6"
      variants={categorySectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {/* Category header */}
      <motion.div
        className="flex items-center gap-2 mb-3"
        variants={categoryHeaderVariants}
      >
        <span className="text-lg" aria-hidden="true">
          {getCategoryEmoji(category)}
        </span>
        <h3 className="text-[15px] font-bold text-text">
          {getCategoryLabel(category)}
        </h3>
        <span className="text-[10px] text-text-muted ml-auto font-medium">
          {spots.length} lieux
        </span>
      </motion.div>

      {/* Spot cards */}
      <div className="space-y-2.5">
        {spots.map((spot, i) => (
          <SpotCard key={spot.id} spot={spot} index={i} />
        ))}
      </div>
    </motion.section>
  );
}

function SpotCard({ spot, index }: { spot: Spot; index: number }) {
  return (
    <motion.article
      className="bg-card border border-border/50 rounded-xl p-3.5 relative overflow-hidden"
      variants={spotCardVariants}
      custom={index}
      whileHover="hover"
      whileTap="tap"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Name + popular badge */}
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-bold text-text truncate">{spot.name}</h4>
            {spot.popular && <PopularBadge />}
          </div>

          {/* Type + distance + price */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-text-muted">
              {spot.type === "secret" ? "Coin secret" : spot.type === "restaurant" ? "Restaurant" : spot.type === "bar" ? "Bar" : "Activite"}
            </span>
            <span className="text-[10px] text-text-muted">·</span>
            <span className="text-[10px] text-text-muted">{spot.distance}km</span>
            <span className="text-[10px] text-text-muted">·</span>
            <span className="text-[10px] text-accent font-semibold">{spot.priceRange}</span>
          </div>

          {/* Description */}
          <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed line-clamp-2">
            {spot.description}
          </p>

          {/* Secret tip */}
          {spot.secretTip && (
            <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg bg-accent/5 border border-accent/10">
              <IconKey size={10} />
              <span className="text-[10px] text-accent font-medium italic">
                {spot.secretTip}
              </span>
            </div>
          )}
        </div>

        {/* Right side: rating + CTA */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Rating stars */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                variants={starVariants}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <IconStar
                  size={10}
                  filled={i < Math.floor(spot.rating)}
                  half={i === Math.floor(spot.rating) && spot.rating % 1 >= 0.5}
                />
              </motion.div>
            ))}
            <span className="text-[10px] font-bold text-text ml-1">
              {spot.rating.toFixed(1)}
            </span>
          </div>

          {/* Y aller button */}
          <a
            href={getGoogleMapsUrl(spot.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full gradient-bg text-white text-[10px] font-bold shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-shadow"
            aria-label={`Itineraire vers ${spot.name}`}
          >
            <IconNav size={10} />
            Y aller
          </a>
        </div>
      </div>
    </motion.article>
  );
}

function PopularBadge() {
  return (
    <motion.span
      className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-[8px] font-bold text-[#00FF88] uppercase tracking-wider"
      animate={ambient.breathe(3)}
    >
      <span className="w-1 h-1 rounded-full bg-[#00FF88]" />
      Populaire ce soir
    </motion.span>
  );
}

function LocalTips({ tips }: { tips: string[] }) {
  return (
    <motion.section
      className="px-5 mt-8 mb-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={springs.heavy}
    >
      <div className="flex items-center gap-2 mb-3">
        <IconUsers size={16} />
        <h3 className="text-[15px] font-bold text-text">
          Les habitues recommandent...
        </h3>
      </div>
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            className="flex gap-2.5 p-3 rounded-xl bg-card border border-border/50"
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ ...springs.heavy, delay: i * 0.08 }}
          >
            <span className="text-[14px] shrink-0 mt-0.5" aria-hidden="true">
              {i === 0 ? "\uD83D\uDCA1" : i === 1 ? "\uD83C\uDF1F" : "\uD83D\uDD11"}
            </span>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {tip}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ─────────────────────────────────────────
// Inline Icons
// ─────────────────────────────────────────

function IconLocation({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconNav({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M3 11l19-9-9 19-2-8-8-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconKey({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
        stroke="#8B5CF6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconStar({ size = 24, filled = false, half = false }: { size?: number; filled?: boolean; half?: boolean }) {
  if (half) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
        <defs>
          <linearGradient id="halfStar">
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="url(#halfStar)"
          stroke="#F59E0B"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? "#F59E0B" : "none"}
        stroke="#F59E0B"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconUsers({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="#8B5CF6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="#8B5CF6" strokeWidth="1.5" />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="#8B5CF6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
