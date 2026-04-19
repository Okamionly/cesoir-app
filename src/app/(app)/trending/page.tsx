"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trendingVariants, springs } from "@/lib/motion-design";
import { ModeKey, MODES, MODE_KEYS } from "@/lib/modes";
import { supabase } from "@/lib/supabase";
import { RackFocus } from "@/components/motion/RackFocus";
import EmptyState from "@/components/ui/EmptyState";
import { app as appTokens } from "@/lib/design-tokens";

// --- Types ---

interface Venue {
  id: string;
  name: string;
  type: string;
  neighborhood: string;
  distance: number;
  people: number;
  modes: ModeKey[];
}

interface TrendingRow {
  venue_name: string;
  visits: number;
  unique_visitors: number;
  last_visit_at: string;
  modes: string[] | null;
}

type SortOption = "popular" | "closest" | "new";

// --- Mock Data (12 venues) ---

const MOCK_VENUES: Venue[] = [
  { id: "v1", name: "Le Petit Cler", type: "Bistrot", neighborhood: "7e arr.", distance: 0.4, people: 18, modes: ["solo-diner", "foodie-quest"] },
  { id: "v2", name: "Meltdown Bar", type: "Bar gaming", neighborhood: "Republique", distance: 1.2, people: 32, modes: ["gamer-night", "plus-one"] },
  { id: "v3", name: "Palais de Tokyo", type: "Musee / Expo", neighborhood: "16e arr.", distance: 3.8, people: 24, modes: ["culture-club"] },
  { id: "v4", name: "Cafe Craft", type: "Cafe", neighborhood: "Oberkampf", distance: 0.9, people: 11, modes: ["sober-tonight", "langue"] },
  { id: "v5", name: "Le Baron Rouge", type: "Bar a vin", neighborhood: "Bastille", distance: 1.5, people: 27, modes: ["solo-diner", "night-owl"] },
  { id: "v6", name: "Parc des Buttes-Chaumont", type: "Parc", neighborhood: "19e arr.", distance: 2.3, people: 15, modes: ["dog-date", "fit-date"] },
  { id: "v7", name: "Le Dernier Bar Avant la Fin du Monde", type: "Bar geek", neighborhood: "Chatelet", distance: 2.0, people: 41, modes: ["gamer-night", "plus-one"] },
  { id: "v8", name: "Le Bouillon Chartier", type: "Restaurant", neighborhood: "Grands Boulevards", distance: 1.8, people: 22, modes: ["solo-diner", "tourist"] },
  { id: "v9", name: "Jardin du Luxembourg", type: "Parc", neighborhood: "6e arr.", distance: 2.5, people: 9, modes: ["fit-date", "sober-tonight"] },
  { id: "v10", name: "Hasard Ludique", type: "Tiers-lieu", neighborhood: "18e arr.", distance: 3.1, people: 19, modes: ["culture-club", "sober-tonight"] },
  { id: "v11", name: "Arcade Street", type: "Arcade bar", neighborhood: "Bastille", distance: 1.6, people: 35, modes: ["gamer-night"] },
  { id: "v12", name: "Chez Janou", type: "Restaurant", neighborhood: "Marais", distance: 1.1, people: 14, modes: ["foodie-quest", "solo-diner"] },
];

const FILTER_MODES: ModeKey[] = ["solo-diner", "night-owl", "gamer-night", "culture-club", "fit-date", "foodie-quest", "sober-tonight", "dog-date"];

// --- Component ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardVariants = trendingVariants.spot;

export default function TrendingPage() {
  const [activeMode, setActiveMode] = useState<ModeKey | null>(null);
  const [sort, setSort] = useState<SortOption>("popular");
  const [liveVenues, setLiveVenues] = useState<Venue[] | null>(null);

  // Pull `trending_venues_view` aggregations; fallback to MOCK when empty.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("trending_venues_view")
        .select("venue_name, visits, unique_visitors, last_visit_at, modes");
      if (cancelled || error || !data || data.length === 0) return;
      const validModes = new Set(MODE_KEYS as string[]);
      const venues: Venue[] = (data as TrendingRow[]).map((row, i) => {
        const cleanModes = (row.modes ?? []).filter((m): m is ModeKey =>
          validModes.has(m),
        );
        return {
          id: `live-${i}-${row.venue_name}`,
          name: row.venue_name,
          type: "Lieu",
          neighborhood: "Paris",
          distance: 1, // No geo on view; placeholder so existing UI keeps working.
          people: row.unique_visitors,
          modes: cleanModes.length > 0 ? cleanModes : ["solo-diner"],
        };
      });
      setLiveVenues(venues);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceVenues: Venue[] = liveVenues && liveVenues.length > 0 ? liveVenues : MOCK_VENUES;

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "popular", label: "Plus populaire" },
    { key: "closest", label: "Plus proche" },
    { key: "new", label: "Nouveaux" },
  ];

  const filtered = useMemo(() => {
    let list = [...sourceVenues];

    if (activeMode) {
      list = list.filter((v) => v.modes.includes(activeMode));
    }

    switch (sort) {
      case "popular":
        list.sort((a, b) => b.people - a.people);
        break;
      case "closest":
        list.sort((a, b) => a.distance - b.distance);
        break;
      case "new":
        list.sort(() => Math.random() - 0.5);
        break;
    }

    return list;
  }, [sourceVenues, activeMode, sort]);

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header — flame pulse + hairline */}
      <header className="relative sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <RackFocus duration={0.5}>
          <div className="flex items-center gap-2">
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              animate={{
                filter: [
                  "drop-shadow(0 0 0px color-mix(in srgb, var(--color-accent) 0%, transparent))",
                  "drop-shadow(0 0 8px color-mix(in srgb, var(--color-accent) 70%, transparent))",
                  "drop-shadow(0 0 0px color-mix(in srgb, var(--color-accent) 0%, transparent))",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M12 22c4.97 0 8-3.03 8-8 0-4-2.5-7-4-8-.5 2.5-2 4-4 5-1-1-2-3.5-1.5-6C8 7 5 10 5 14c0 4.97 3.03 8 7 8z" />
            </motion.svg>
            <h1 className="text-lg font-display font-bold text-text">Trending ce soir</h1>
          </div>
        </RackFocus>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              `linear-gradient(90deg, transparent, color-mix(in srgb, ${appTokens.rose} 40%, transparent), color-mix(in srgb, var(--color-accent) 40%, transparent), transparent)`,
          }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </header>

      {/* Mode filter pills */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2" role="tablist" aria-label="Filtrer par mode">
          <button
            onClick={() => setActiveMode(null)}
            role="tab"
            aria-selected={activeMode === null}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeMode === null
                ? "bg-accent text-white"
                : "bg-card border border-border text-text-muted hover:text-text"
            }`}
          >
            Tous
          </button>
          {FILTER_MODES.map((mk) => {
            const mode = MODES[mk];
            return (
              <button
                key={mk}
                onClick={() => setActiveMode(activeMode === mk ? null : mk)}
                role="tab"
                aria-selected={activeMode === mk}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  activeMode === mk
                    ? "text-white"
                    : "bg-card border border-border text-text-muted hover:text-text"
                }`}
                style={activeMode === mk ? { backgroundColor: mode.color } : undefined}
              >
                <span aria-hidden="true">{mode.icon}</span> {mode.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort options */}
      <div className="px-4 pb-3">
        <div className="flex gap-2" role="radiogroup" aria-label="Trier par">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              role="radio"
              aria-checked={sort === opt.key}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                sort === opt.key
                  ? "text-accent bg-accent/10"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Venue cards */}
      <motion.div
        className="px-4 space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={`${activeMode}-${sort}`}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((venue, index) => (
            <motion.article
              key={venue.id}
              variants={cardVariants}
              custom={index}
              layout
              whileHover={{ scale: 1.02, y: -2, boxShadow: "0 10px 30px color-mix(in srgb, var(--color-text) 18%, transparent)", transition: springs.gentle }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
              aria-label={`${venue.name} - ${venue.type}`}
            >
              {/* Photo placeholder */}
              <div
                className="h-32 w-full"
                style={{
                  background: `linear-gradient(135deg, ${MODES[venue.modes[0]].color}33, color-mix(in srgb, var(--color-accent) 20%, transparent))`,
                }}
                aria-hidden="true"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl opacity-40">{MODES[venue.modes[0]].icon}</span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-text">{venue.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {venue.type} &middot; {venue.neighborhood} &middot; {venue.distance} km
                    </p>
                  </div>
                  <motion.div
                    className="flex items-center gap-1 flex-shrink-0 bg-accent-2/10 px-2 py-1 rounded-full"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-2" aria-hidden="true" />
                    <span className="text-[11px] font-bold text-accent-2">{venue.people}</span>
                  </motion.div>
                </div>

                {/* Mode tags */}
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {venue.modes.map((mk) => (
                    <span
                      key={mk}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: MODES[mk].color }}
                    >
                      {MODES[mk].name}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <button
                  className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
                  aria-label={`Y aller a ${venue.name}`}
                >
                  Y aller
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <EmptyState
            emoji="📍"
            title="Aucun lieu pour ce filtre"
            subtitle="Essaie un autre mode"
          />
        )}
      </motion.div>
    </div>
  );
}
