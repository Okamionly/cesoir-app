"use client";

import { motion, AnimatePresence } from "motion/react";
import { springs, achievementVariants } from "@/lib/motion-design";
import type { Venue } from "@/lib/venues";
import { formatDistance, formatPrice } from "@/lib/venues";

// ─────────────────────────────────────────
// Variants
// ─────────────────────────────────────────

const venueCardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...springs.heavy, delay: i * 0.08 },
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const checkmarkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springs.elastic,
  },
};

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  const stars: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) stars.push("\u2605");
    else if (i === fullStars && hasHalf) stars.push("\u2BEA");
    else stars.push("\u2606");
  }
  return (
    <span className="text-[11px] text-amber-400 tracking-tight" aria-label={`${rating} sur 5`}>
      {stars.join("")}
      <span className="ml-1 text-[10px] text-text-muted font-medium">{rating.toFixed(1)}</span>
    </span>
  );
}

function PopulaireBadge() {
  return (
    <motion.span
      animate={{
        scale: [1, 1.05, 1],
        transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const },
      }}
      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent/15 text-accent border border-accent/20"
    >
      {"\uD83D\uDD25"} Populaire ce soir
    </motion.span>
  );
}

function PhotoPlaceholder({ type }: { type: string }) {
  const icons: Record<string, string> = {
    restaurant: "\uD83C\uDF7D\uFE0F",
    bar: "\uD83C\uDF78",
    concert: "\uD83C\uDFB5",
    cinema: "\uD83C\uDFAC",
    balade: "\uD83C\uDF3F",
    cafe: "\u2615",
    musee: "\uD83C\uDFDB\uFE0F",
    sport: "\uD83C\uDFCB\uFE0F",
  };
  return (
    <div className="w-full h-28 rounded-xl bg-gradient-to-br from-accent/10 to-safe/10 flex items-center justify-center">
      <span className="text-[36px]">{icons[type] ?? "\uD83D\uDCCD"}</span>
    </div>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

interface VenuePickerProps {
  venues: (Venue & { distance: number })[];
  selectedId: string | null;
  onSelect: (venue: Venue) => void;
  onPropose: (venue: Venue) => void;
}

export default function VenuePicker({
  venues,
  selectedId,
  onSelect,
  onPropose,
}: VenuePickerProps) {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {venues.map((venue, i) => {
          const isSelected = selectedId === venue.id;

          return (
            <motion.div
              key={venue.id}
              custom={i}
              variants={venueCardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              <motion.button
                onClick={() => onSelect(venue)}
                className={`w-full text-left rounded-2xl border p-3 transition-colors ${
                  isSelected
                    ? "border-accent bg-accent/5"
                    : "border-border bg-bg-card hover:border-accent/30"
                }`}
                whileTap={{ scale: 0.98 }}
                style={
                  isSelected
                    ? {
                        boxShadow:
                          "0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.1)",
                      }
                    : undefined
                }
              >
                {/* Glow pulse on selected */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    animate={achievementVariants.glow.pulse}
                  />
                )}

                {/* Photo placeholder */}
                <PhotoPlaceholder type={venue.type} />

                {/* Content */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[14px] font-bold text-text truncate">
                          {venue.name}
                        </h4>
                        {isSelected && (
                          <motion.span
                            variants={checkmarkVariants}
                            initial="hidden"
                            animate="visible"
                            className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          >
                            {"\u2713"}
                          </motion.span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {venue.address}, {venue.arrondissement}
                      </p>
                    </div>
                    <span className="text-[12px] text-text-muted font-medium shrink-0">
                      {formatDistance(venue.distance)}
                    </span>
                  </div>

                  {/* Rating + price + badge row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRating rating={venue.rating} />
                    <span className="text-[11px] text-text-muted font-semibold">
                      {formatPrice(venue.priceRange)}
                    </span>
                    {venue.popular && <PopulaireBadge />}
                  </div>
                </div>

                {/* Propose button */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springs.snap}
                    className="mt-3"
                  >
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPropose(venue);
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={springs.snap}
                      className="w-full py-3 rounded-xl gradient-bg text-white text-[13px] font-bold shadow-glow"
                    >
                      Proposer ce lieu
                    </motion.button>
                  </motion.div>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
