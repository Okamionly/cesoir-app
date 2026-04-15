"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { feedVariants, springs } from "@/lib/motion-design";
import { MODES, ModeKey } from "@/lib/modes";

// --- Types ---

type FeedItemType = "availability" | "looking" | "area" | "trending";

interface FeedItem {
  id: string;
  type: FeedItemType;
  name: string;
  photo: string;
  text: string;
  mode: ModeKey;
  timeAgo: string;
  online: boolean;
}

// --- Mock Data (15 items) ---

function photo(gender: "women" | "men", id: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

const MOCK_FEED: FeedItem[] = [
  { id: "f1", type: "availability", name: "Marie", photo: photo("women", 90), text: "vient de confirmer dispo en Solo Diner", mode: "solo-diner", timeAgo: "il y a 2 min", online: true },
  { id: "f2", type: "looking", name: "Lucas", photo: photo("men", 24), text: "cherche un +1 pour un concert a Bastille", mode: "plus-one", timeAgo: "il y a 5 min", online: true },
  { id: "f3", type: "area", name: "CeSoir", photo: "", text: "3 nouvelles personnes actives a Chatelet", mode: "night-owl", timeAgo: "il y a 8 min", online: false },
  { id: "f4", type: "trending", name: "CeSoir", photo: "", text: "Gamer Night trending ce soir", mode: "gamer-night", timeAgo: "il y a 12 min", online: false },
  { id: "f5", type: "availability", name: "Chloe", photo: photo("women", 67), text: "est dispo pour un foodie tour a Belleville", mode: "foodie-quest", timeAgo: "il y a 15 min", online: true },
  { id: "f6", type: "looking", name: "Thomas", photo: photo("men", 75), text: "cherche quelqu'un pour une expo au Palais de Tokyo", mode: "culture-club", timeAgo: "il y a 18 min", online: false },
  { id: "f7", type: "area", name: "CeSoir", photo: "", text: "5 personnes actives pres du Canal Saint-Martin", mode: "sober-tonight", timeAgo: "il y a 20 min", online: false },
  { id: "f8", type: "availability", name: "Ines", photo: photo("women", 52), text: "propose une balade avec son chien au Parc Monceau", mode: "dog-date", timeAgo: "il y a 22 min", online: true },
  { id: "f9", type: "trending", name: "CeSoir", photo: "", text: "Sober Tonight en forte hausse dans le 10e", mode: "sober-tonight", timeAgo: "il y a 25 min", online: false },
  { id: "f10", type: "looking", name: "Lea", photo: photo("women", 42), text: "cherche un partenaire de yoga au Luxembourg", mode: "fit-date", timeAgo: "il y a 30 min", online: true },
  { id: "f11", type: "availability", name: "Hugo", photo: photo("men", 41), text: "est dispo pour un running nocturne", mode: "fit-date", timeAgo: "il y a 35 min", online: false },
  { id: "f12", type: "area", name: "CeSoir", photo: "", text: "8 nouvelles personnes actives a Oberkampf", mode: "night-owl", timeAgo: "il y a 40 min", online: false },
  { id: "f13", type: "availability", name: "Priya", photo: photo("women", 64), text: "cherche quelqu'un pour tester un restau coreen", mode: "foodie-quest", timeAgo: "il y a 45 min", online: true },
  { id: "f14", type: "trending", name: "CeSoir", photo: "", text: "Dog Date explose dans le 16e", mode: "dog-date", timeAgo: "il y a 50 min", online: false },
  { id: "f15", type: "looking", name: "Axel", photo: photo("men", 39), text: "monte une equipe pour un escape game a Republique", mode: "gamer-night", timeAgo: "il y a 55 min", online: true },
];

// --- Helpers ---

function getTypeIcon(type: FeedItemType): string {
  switch (type) {
    case "availability": return "check";
    case "looking": return "search";
    case "area": return "map";
    case "trending": return "fire";
  }
}

// --- Component ---

const containerVariants = feedVariants.container;

const itemVariants = {
  hidden: { opacity: 0, y: -40, rotateX: 15, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: { ...springs.heavy, stiffness: 180 },
  },
  exit: { opacity: 0, y: 30, scale: 0.9, transition: { duration: 0.2 } },
};

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setItems(MOCK_FEED);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      // Shuffle and reset
      setItems([...MOCK_FEED].sort(() => Math.random() - 0.5));
      setRefreshing(false);
    }, 1200);
  }, []);

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF88]" />
          </span>
          <h1 className="text-lg font-display font-bold text-text">En direct</h1>
        </div>
      </header>

      {/* Pull to refresh indicator */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="w-full py-3 text-center text-xs font-semibold text-text-muted hover:text-accent transition-colors disabled:opacity-50"
        aria-label="Actualiser le fil d'activite"
      >
        {refreshing ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </motion.span>
        ) : (
          "Actualiser"
        )}
      </button>

      {/* Feed list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center" role="status">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-text-muted">Rien a signaler pour le moment</p>
          <p className="text-xs text-text-muted mt-1">L&apos;activite apparaitra ici des que ca bouge</p>
        </div>
      ) : (
        <motion.ul
          className="px-4 space-y-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          role="feed"
          aria-label="Fil d'activite en direct"
        >
          <AnimatePresence>
            {items.map((item) => {
              const mode = MODES[item.mode];
              const isSystemItem = item.type === "area" || item.type === "trending";

              return (
                <motion.li
                  key={item.id}
                  variants={itemVariants}
                  exit="exit"
                  layout
                  whileHover={{ y: -3, boxShadow: "0 8px 25px rgba(0,0,0,0.15)", transition: springs.gentle }}
                  whileTap={{ scale: 0.98, transition: springs.micro }}
                  className="bg-card border border-border rounded-2xl p-3.5 flex items-start gap-3"
                >
                  {/* Avatar / icon */}
                  {isSystemItem ? (
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                      aria-hidden="true"
                    >
                      {item.type === "area" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22c4.97 0 8-3.03 8-8 0-4-2.5-7-4-8-.5 2.5-2 4-4 5-1-1-2-3.5-1.5-6C8 7 5 10 5 14c0 4.97 3.03 8 7 8z" />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-full p-[2px]"
                        style={{ background: `linear-gradient(135deg, ${mode.color}, #8B5CF6)` }}
                      >
                        <img
                          src={item.photo}
                          alt={`Photo de ${item.name}`}
                          className="w-full h-full rounded-full object-cover border-2 border-bg"
                        />
                      </div>
                      {item.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00FF88] border-2 border-bg" aria-label="En ligne" />
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text leading-snug">
                      <span className="font-bold">{item.name}</span>{" "}
                      <span className="text-text-muted">{item.text}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-text-muted">{item.timeAgo}</span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: mode.color }}
                      >
                        <span aria-hidden="true">{mode.icon}</span>
                        {mode.name}
                      </span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
