"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, type TargetAndTransition } from "motion/react";
import { feedVariants, springs } from "@/lib/motion-design";
import { MODES, type ModeKey } from "@/lib/modes";
import { useFeed, type FeedActivity } from "@/lib/useFeed";

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
  isNew?: boolean;
}

// --- Mock Data (fallback for demo mode) ---

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

/** Relative timestamp "il y a X min/h" */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "a l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `il y a ${diffD}j`;
}

/** Convert Supabase FeedActivity to the UI FeedItem shape */
function activityToFeedItem(a: FeedActivity): FeedItem {
  return {
    id: a.id,
    type: a.type,
    name: a.userName,
    photo: a.userAvatar ?? "",
    text: a.content,
    mode: (a.mode ?? "night-owl") as ModeKey,
    timeAgo: formatRelativeTime(a.createdAt),
    online: a.isOnline,
    isNew: a.isNew,
  };
}

// --- Card accent config per activity type ---

interface TypeAccent {
  border: string;
  bg: string;
  icon: React.ReactNode;
}

function getTypeAccent(type: FeedItemType): TypeAccent {
  switch (type) {
    case "availability":
      return {
        border: "border-[#00FF88]/30",
        bg: "bg-[#00FF88]/5",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        ),
      };
    case "looking":
      return {
        border: "border-[#8B5CF6]/30",
        bg: "bg-gradient-to-r from-[#8B5CF6]/5 to-[#EC4899]/5",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ),
      };
    case "area":
      return {
        border: "border-[#3B82F6]/30",
        bg: "bg-[#3B82F6]/5",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        ),
      };
    case "trending":
      return {
        border: "border-[#F59E0B]/30",
        bg: "bg-[#F59E0B]/5",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      };
  }
}

// --- Animation variants per type ---

const entranceByType: Record<FeedItemType, TargetAndTransition> = {
  availability: { opacity: 0, y: -40, rotateX: 15, scale: 0.92 },
  looking: { opacity: 0, x: -60, rotateY: 10, scale: 0.9 },
  area: { opacity: 0, y: 30, scale: 0.85 },
  trending: { opacity: 0, x: 60, rotateZ: -3, scale: 0.9 },
};

const newItemInitial: TargetAndTransition = {
  scale: 0.8,
  opacity: 0,
  y: -20,
};

// --- Skeleton loader ---

function FeedSkeleton() {
  return (
    <div className="px-4 space-y-2" role="status" aria-label="Chargement du fil">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-2xl p-3.5 flex items-start gap-3 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-border flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-border rounded-full w-3/4" />
            <div className="h-2.5 bg-border rounded-full w-1/2" />
            <div className="flex gap-2 mt-1">
              <div className="h-2 bg-border rounded-full w-16" />
              <div className="h-4 bg-border rounded-full w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Component ---

const containerVariants = feedVariants.container;

export default function FeedPage() {
  const {
    activities,
    loading: supaLoading,
    error: supaError,
    refresh,
    loadMore,
    hasMore,
    loadingMore,
  } = useFeed();

  const [refreshing, setRefreshing] = useState(false);
  const [timestampTick, setTimestampTick] = useState(0);
  const [demoSeed, setDemoSeed] = useState(0);

  // Derive demo mode from hook state (no effect needed)
  const useDemoMode = supaError != null || (activities.length === 0 && !supaLoading);

  // Convert Supabase activities to feed items, or fall back to mock
  const items = useMemo(() => {
    if (useDemoMode) {
      // demoSeed triggers a reshuffle in demo mode
      const shuffled = [...MOCK_FEED];
      if (demoSeed > 0) shuffled.sort(() => Math.random() - 0.5);
      return shuffled;
    }
    return activities.map(activityToFeedItem);
    // timestampTick forces re-computation of relative times
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, useDemoMode, timestampTick, demoSeed]);

  // Refresh timestamps every 30s for real-time items
  useEffect(() => {
    if (useDemoMode) return;
    const interval = setInterval(() => {
      setTimestampTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(interval);
  }, [useDemoMode]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (useDemoMode) {
      await new Promise((r) => setTimeout(r, 800));
      setDemoSeed((s) => s + 1);
    } else {
      await refresh();
    }
    setRefreshing(false);
  }, [useDemoMode, refresh]);

  const handleLoadMore = useCallback(async () => {
    if (useDemoMode) return;
    await loadMore();
  }, [useDemoMode, loadMore]);

  const showLoadMore = useDemoMode ? false : hasMore;
  const isLoading = !useDemoMode && supaLoading;

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
          {useDemoMode && (
            <span className="ml-auto text-[10px] font-semibold text-text-muted bg-card border border-border px-2 py-0.5 rounded-full">
              DEMO
            </span>
          )}
        </div>
      </header>

      {/* Pull to refresh */}
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

      {/* Loading skeleton */}
      {isLoading ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        /* Empty state */
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
        /* Feed list */
        <>
          <motion.ul
            className="px-4 space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            role="feed"
            aria-label="Fil d'activite en direct"
            aria-live="polite"
          >
            <AnimatePresence initial={false}>
              {items.map((item, idx) => {
                const mode = MODES[item.mode] ?? MODES["night-owl"];
                const isSystemItem = item.type === "area" || item.type === "trending";
                const accent = getTypeAccent(item.type);
                const isNew = item.isNew ?? false;

                return (
                  <motion.li
                    key={item.id}
                    initial={
                      isNew
                        ? newItemInitial
                        : entranceByType[item.type]
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                      x: 0,
                      scale: 1,
                      rotateX: 0,
                      rotateY: 0,
                      rotateZ: 0,
                    }}
                    exit={{ opacity: 0, y: 30, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ ...springs.heavy, stiffness: 180 }}
                    layout
                    aria-setsize={items.length}
                    aria-posinset={idx + 1}
                    whileHover={{
                      y: -3,
                      boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                      transition: springs.gentle,
                    }}
                    whileTap={{ scale: 0.98, transition: springs.micro }}
                    className={`relative bg-card border rounded-2xl p-3.5 flex items-start gap-3 ${accent.border} ${accent.bg}`}
                  >
                    {/* New-item glow overlay */}
                    {isNew && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        initial={{ boxShadow: "0 0 0px rgba(139,92,246,0)" }}
                        animate={{
                          boxShadow: [
                            "0 0 0px rgba(139,92,246,0)",
                            "0 0 20px rgba(139,92,246,0.5)",
                            "0 0 0px rgba(139,92,246,0)",
                          ],
                        }}
                        transition={{ duration: 1.5, repeat: 2 }}
                      />
                    )}

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
                            loading="lazy"
                            decoding="async"
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
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {/* Type indicator icon */}
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-text-muted">
                          {accent.icon}
                        </span>
                        {/* Relative time */}
                        <span className="text-[10px] text-text-muted">{item.timeAgo}</span>
                        {/* Mode badge */}
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

          {/* Charger plus button */}
          {showLoadMore && (
            <div className="px-4 mt-4 mb-6">
              <motion.button
                onClick={handleLoadMore}
                disabled={loadingMore}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={springs.snap}
                className="w-full py-3 text-center text-sm font-semibold text-accent bg-card border border-border rounded-2xl hover:border-accent/30 transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
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
                  "Charger plus"
                )}
              </motion.button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
