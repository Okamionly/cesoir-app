"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { feedVariants, springs } from "@/lib/motion-design";
import { MODES, type ModeKey } from "@/lib/modes";
import { useFeed, type FeedActivity } from "@/lib/useFeed";
import StoriesBar from "@/components/app/StoriesBar";
import EmptyState from "@/components/ui/EmptyState";

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
  };
}

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

  const useDemoMode = supaError != null || (activities.length === 0 && !supaLoading);

  const items = useMemo(() => {
    if (useDemoMode) {
      const shuffled = [...MOCK_FEED];
      if (demoSeed > 0) shuffled.sort(() => Math.random() - 0.5);
      return shuffled;
    }
    return activities.map(activityToFeedItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, useDemoMode, timestampTick, demoSeed]);

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
      {/* Header — simple, clean */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-text">En direct</h1>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]" />
            </span>
          </div>
          <Link
            href="/all"
            className="text-[12px] font-medium text-text-muted hover:text-accent transition-colors shrink-0"
          >
            Decouvrir tout
          </Link>
        </div>
      </header>

      {/* Stories bar */}
      <StoriesBar />

      {/* Divider */}
      <div className="border-b border-border" />

      {/* Pull to refresh */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="w-full py-3 text-center text-xs font-medium text-text-muted hover:text-accent transition-colors disabled:opacity-50"
        aria-label="Actualiser le fil d'activite"
      >
        {refreshing ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </motion.span>
        ) : (
          "Actualiser"
        )}
      </button>

      {/* Discreet AI helper link */}
      <div className="px-4 pb-2 -mt-1 flex justify-center">
        <Link
          href="/assistant"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-muted hover:text-accent transition-colors"
        >
          <span aria-hidden="true">🤖</span>
          Aide-moi a decider
        </Link>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          emoji="☾"
          title="Rien a signaler pour le moment"
          subtitle="L'activite apparaitra ici des que ca bouge"
          actionLabel="Explorer les profils"
          actionHref="/browse"
        />
      ) : (
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

                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    layout
                    aria-setsize={items.length}
                    aria-posinset={idx + 1}
                    className="bg-card border border-border rounded-2xl p-3.5 flex items-start gap-3"
                  >
                    {/* Avatar / icon */}
                    {isSystemItem ? (
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-card border border-border"
                        aria-hidden="true"
                      >
                        {item.type === "area" ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-muted">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                            <path d="M12 22c4.97 0 8-3.03 8-8 0-4-2.5-7-4-8-.5 2.5-2 4-4 5-1-1-2-3.5-1.5-6C8 7 5 10 5 14c0 4.97 3.03 8 7 8z" />
                          </svg>
                        )}
                      </div>
                    ) : (
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.photo}
                          alt={`Photo de ${item.name}`}
                          loading="lazy"
                          decoding="async"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {item.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00FF88] border-2 border-card" aria-label="En ligne" />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text leading-snug">
                        <span className="font-semibold">{item.name}</span>{" "}
                        <span className="text-text-muted">{item.text}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-text-muted">{item.timeAgo}</span>
                        <span className="text-text-muted">·</span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
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

          {/* Load more button */}
          {showLoadMore && (
            <div className="px-4 mt-4 mb-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 text-center text-sm font-medium text-text-muted bg-card border border-border rounded-2xl hover:border-accent/30 transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                      <path d="M21 3v6h-6" />
                    </svg>
                  </motion.span>
                ) : (
                  "Charger plus"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
