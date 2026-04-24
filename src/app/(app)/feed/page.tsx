"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { m, AnimatePresence } from "motion/react";
import { feedVariants, springs } from "@/lib/motion-design";
import { MODES, type ModeKey } from "@/lib/modes";
import { useFeed, type FeedActivity } from "@/lib/useFeed";
import { useFeedReactions } from "@/lib/useFeedReactions";
import EmptyState from "@/components/ui/EmptyState";
import { Magnetic } from "@/components/motion/Magnetic";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonChatRow } from "@/components/ui/skeletons";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useAccessibility } from "@/components/ui/ReducedMotion";
import { LiveTicker } from "@/components/feed/LiveTicker";
import { NewItemsBanner } from "@/components/feed/NewItemsBanner";
import { ReactionBar } from "@/components/feed/ReactionBar";
import EventsWidget from "@/components/feed/EventsWidget";
import {
  FilterBar,
  isFeedFilter,
  type FeedFilter,
} from "@/components/feed/FilterBar";
import { RotateCcw, MapPin, Flame } from "@/components/ui/lucide";

// --- Types ---

type FeedItemType = "availability" | "looking" | "area" | "trending";

interface FeedItem {
  id: string;
  type: FeedItemType;
  name: string;
  photo: string;
  text: string;
  mode: ModeKey;
  createdAtIso: string;
  timeAgo: string;
  online: boolean;
  isReal: boolean;
  isNew?: boolean;
}

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
    createdAtIso: a.createdAt,
    timeAgo: formatRelativeTime(a.createdAt),
    online: a.isOnline,
    isReal: true,
    isNew: a.isNew,
  };
}

function isRecent(iso: string | undefined): boolean {
  if (!iso) return false;
  const diffMs = Date.now() - new Date(iso).getTime();
  return diffMs > 0 && diffMs < 5 * 60_000;
}

// --- Skeleton loader ---

function FeedSkeleton() {
  return (
    <div className="px-4 space-y-2" role="status" aria-label="Chargement du fil">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-2xl"
        >
          <SkeletonChatRow />
        </div>
      ))}
    </div>
  );
}

// --- Component ---

const containerVariants = feedVariants.container;
const itemVariants = feedVariants.card;

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedPageInner />
    </Suspense>
  );
}

function FeedPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reducedMotion } = useAccessibility();

  const filterFromUrl = searchParams.get("f");
  const initialFilter: FeedFilter = isFeedFilter(filterFromUrl) ? filterFromUrl : "all";
  const [filter, setFilter] = useState<FeedFilter>(initialFilter);

  const handleFilterChange = useCallback(
    (next: FeedFilter) => {
      setFilter(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("f");
      else params.set("f", next);
      const qs = params.toString();
      router.replace(qs ? `/feed?${qs}` : "/feed", { scroll: false });
    },
    [router, searchParams],
  );

  const {
    activities,
    loading: supaLoading,
    error: supaError,
    refresh,
    loadMore,
    hasMore,
    loadingMore,
    newCount,
    acknowledgeNew,
  } = useFeed();

  const [refreshing, setRefreshing] = useState(false);
  const [timestampTick, setTimestampTick] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const rawItems = useMemo(() => {
    return activities.map(activityToFeedItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, timestampTick]);

  // Apply filter (client-side; "friends"/"nearby" fall back to "all" until backend wiring lands)
  const items = useMemo(() => {
    switch (filter) {
      case "tonight": {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startIso = startOfDay.toISOString();
        return rawItems.filter((i) => !i.isReal || !i.createdAtIso || i.createdAtIso >= startIso);
      }
      case "friends":
      case "nearby":
        // UI-only for now: mark placeholder by passing everything through.
        // TODO: wire to squads / mutual_likes + geo-proximity.
        return rawItems;
      case "all":
      default:
        return rawItems;
    }
  }, [rawItems, filter]);

  // Collect real activity IDs for reaction hook
  const realActivityIds = useMemo(
    () => items.filter((i) => i.isReal).map((i) => i.id),
    [items],
  );
  const { get: getReactions, toggle: toggleReaction } = useFeedReactions(realActivityIds);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleLoadMore = useCallback(async () => {
    await loadMore();
  }, [loadMore]);

  const handleBannerClick = useCallback(() => {
    acknowledgeNew();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }, [acknowledgeNew, reducedMotion]);

  const showLoadMore = hasMore;
  const isLoading = supaLoading;

  const content = (
    <>
      <EventsWidget />
      <LiveTicker onRefresh={handleRefresh} refreshing={refreshing} />
      <FilterBar value={filter} onChange={handleFilterChange} />

      <NewItemsBanner
        count={newCount}
        onClick={handleBannerClick}
        onDismiss={acknowledgeNew}
      />

      {supaError && (
        <div
          className="mx-4 mt-2 mb-1 rounded-xl bg-card border border-border px-3 py-2 text-[11px] text-text-muted"
          role="note"
        >
          Impossible de charger l&apos;activite en direct pour le moment.
        </div>
      )}

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
          <m.ul
            ref={listRef}
            className="px-4 pt-3 space-y-2"
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
                const recent = item.isReal && isRecent(item.createdAtIso);
                const reactions = item.isReal ? getReactions(item.id) : null;

                return (
                  <m.li
                    key={item.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    whileHover={{ y: -2, transition: springs.gentle }}
                    whileTap={{ scale: 0.99, transition: springs.micro }}
                    aria-setsize={items.length}
                    aria-posinset={idx + 1}
                    className={[
                      "relative bg-card border rounded-2xl p-3.5",
                      recent
                        ? "border-accent/40 shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_6px_24px_-12px_rgba(139,92,246,0.45)]"
                        : "border-border",
                    ].join(" ")}
                  >
                    {recent && (
                      <span
                        className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/30 px-1.5 py-0.5 text-[9px] font-semibold text-accent uppercase tracking-wide"
                        aria-label="Publication récente"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full bg-accent ${reducedMotion ? "" : "animate-pulse"}`}
                          aria-hidden="true"
                        />
                        Nouveau
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      {/* Avatar / icon */}
                      {isSystemItem ? (
                        <div
                          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-card border border-border"
                          aria-hidden="true"
                        >
                          {item.type === "area" ? (
                            <MapPin size={16} strokeWidth={2} className="text-text-muted" />
                          ) : (
                            <Flame size={16} strokeWidth={2} className="text-text-muted" />
                          )}
                        </div>
                      ) : (
                        <div className="relative flex-shrink-0">
                          {item.photo ? (
                            <Image
                              src={item.photo}
                              alt={`Photo de ${item.name}`}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted text-sm">
                              {item.name.charAt(0)}
                            </div>
                          )}
                          {item.online && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-accent-2 border-2 border-card" aria-label="En ligne" />
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

                        {/* Reactions (real items only) */}
                        {item.isReal && reactions && (
                          <ReactionBar
                            feedActivityId={item.id}
                            reactions={reactions}
                            onToggle={toggleReaction}
                          />
                        )}
                      </div>
                    </div>
                  </m.li>
                );
              })}
            </AnimatePresence>
          </m.ul>

          {/* Load more button — magnetic on fine pointers */}
          {showLoadMore && (
            <m.div
              className="px-4 mt-4 mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.1 }}
            >
              <Magnetic as="div" strength={0.08} radius={120}>
                <m.button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  whileHover={{ borderColor: "color-mix(in srgb, var(--color-accent) 40%, transparent)", transition: springs.gentle }}
                  whileTap={{ scale: 0.97, transition: springs.micro }}
                  className="w-full py-3 text-center text-sm font-medium text-text-muted bg-card border border-border rounded-2xl transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <m.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                    </m.span>
                  ) : (
                    "Charger plus"
                  )}
                </m.button>
              </Magnetic>
            </m.div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-bg pb-24">
      <PageHeader
        title="En direct"
        hairlineVariant="vert-violet"
        actions={
          <span className="relative flex h-2 w-2" aria-label="Activité en direct">
            <span className={`absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75 ${reducedMotion ? "" : "animate-ping"}`} />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-2" />
          </span>
        }
      />

      <PullToRefresh onRefresh={handleRefresh}>{content}</PullToRefresh>
    </div>
  );
}
