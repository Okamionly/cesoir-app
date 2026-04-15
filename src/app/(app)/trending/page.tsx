"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModeKey, MODES } from "@/lib/modes";

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
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function TrendingPage() {
  const [activeMode, setActiveMode] = useState<ModeKey | null>(null);
  const [sort, setSort] = useState<SortOption>("popular");

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "popular", label: "Plus populaire" },
    { key: "closest", label: "Plus proche" },
    { key: "new", label: "Nouveaux" },
  ];

  const filtered = useMemo(() => {
    let list = [...MOCK_VENUES];

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
  }, [activeMode, sort]);

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22c4.97 0 8-3.03 8-8 0-4-2.5-7-4-8-.5 2.5-2 4-4 5-1-1-2-3.5-1.5-6C8 7 5 10 5 14c0 4.97 3.03 8 7 8z" />
          </svg>
          <h1 className="text-lg font-display font-bold text-text">Trending ce soir</h1>
        </div>
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
          {filtered.map((venue) => (
            <motion.article
              key={venue.id}
              variants={cardVariants}
              layout
              className="bg-card border border-border rounded-2xl overflow-hidden"
              aria-label={`${venue.name} - ${venue.type}`}
            >
              {/* Photo placeholder */}
              <div
                className="h-32 w-full"
                style={{
                  background: `linear-gradient(135deg, ${MODES[venue.modes[0]].color}33, #8B5CF633)`,
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
                  <div className="flex items-center gap-1 flex-shrink-0 bg-[#00FF88]/10 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" aria-hidden="true" />
                    <span className="text-[11px] font-bold text-[#00FF88]">{venue.people}</span>
                  </div>
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
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                  aria-label={`Y aller a ${venue.name}`}
                >
                  Y aller
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16" role="status">
            <p className="text-sm font-semibold text-text-muted">Aucun lieu pour ce filtre</p>
            <p className="text-xs text-text-muted mt-1">Essaie un autre mode</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
