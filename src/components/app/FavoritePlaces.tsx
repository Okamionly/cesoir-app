"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import { VENUES, type Venue, type VenueCategory } from "@/lib/venues";

// ─────────────────────────────────────────
// Category icons (inline SVG for zero deps)
// ─────────────────────────────────────────

const VENUE_ICONS: Record<VenueCategory, string> = {
  restaurant: "\uD83C\uDF7D\uFE0F",
  bar: "\uD83C\uDF78",
  concert: "\uD83C\uDFB5",
  cinema: "\uD83C\uDFAC",
  balade: "\uD83C\uDF3F",
  cafe: "\u2615",
  musee: "\uD83C\uDFDB\uFE0F",
  sport: "\uD83C\uDFCB\uFE0F",
};

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface FavoritePlacesProps {
  /** Array of venue IDs from the user profile */
  venueIds: string[];
  /** Show "Souvent ici" badge */
  showFrequentBadge?: boolean;
  /** Called when a venue is tapped (opens map) */
  onVenueTap?: (venue: Venue) => void;
  className?: string;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function FavoritePlaces({
  venueIds,
  showFrequentBadge = true,
  onVenueTap,
  className = "",
}: FavoritePlacesProps) {
  const venues = useMemo(
    () =>
      venueIds
        .map((id) => VENUES.find((v) => v.id === id))
        .filter(Boolean) as Venue[],
    [venueIds],
  );

  if (venues.length === 0) return null;

  const handleTap = (venue: Venue) => {
    if (onVenueTap) {
      onVenueTap(venue);
    } else {
      // Fallback: open Google Maps
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`,
        "_blank",
        "noopener",
      );
    }
  };

  return (
    <div className={`${className}`}>
      {/* Section title */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">
          Lieux favoris
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Venue list */}
      <div className="space-y-2">
        {venues.slice(0, 5).map((venue, i) => (
          <motion.button
            key={venue.id}
            onClick={() => handleTap(venue)}
            className="w-full flex items-center gap-3 bg-black border border-white/10 rounded-xl px-4 py-3 text-left hover:border-[#8B5CF6]/20 transition-colors group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.heavy, delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            aria-label={`${venue.name}, ${venue.arrondissement}`}
          >
            {/* Type icon */}
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">
              {VENUE_ICONS[venue.type]}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-white font-semibold truncate group-hover:text-[#8B5CF6] transition-colors">
                {venue.name}
              </p>
              <p className="text-[11px] text-white/40 truncate">
                {venue.arrondissement} &middot; {capitalize(venue.type)}
              </p>
            </div>

            {/* "Souvent ici" badge */}
            {showFrequentBadge && venue.popular && (
              <motion.span
                className="shrink-0 px-2 py-0.5 rounded-full bg-[#00FF88]/10 text-[#00FF88] text-[10px] font-bold uppercase tracking-wider"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...springs.elastic, delay: 0.3 + i * 0.05 }}
              >
                Souvent ici
              </motion.span>
            )}

            {/* Map arrow */}
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/20 shrink-0 group-hover:text-[#8B5CF6] transition-colors"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
