"use client";

// ========================================
// Smart Queue — Curated top matches, refreshed hourly
// ========================================
//
// Unlike Browse (endless swipe), Queue shows 5-10 high-quality
// matches in a scrollable list. Each card has detailed info
// and clear accept/pass actions.

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, ambient, micro } from "@/lib/motion-design";
import { MODES, type ModeKey } from "@/lib/modes";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { useSmartQueue } from "@/lib/useSmartQueue";
import { useAuth } from "@/context/AuthContext";
import { useInteractions } from "@/lib/useInteractions";
import type { MatchCandidate } from "@/lib/matching";
import QueueCard from "@/components/app/QueueCard";
import { IconMoon, IconHeart } from "@/components/ui/Icons";

// ─── Mock queue for demo mode ───

function buildMockQueue(): MatchCandidate[] {
  // Convert a subset of mock profiles to MatchCandidate shape
  return MOCK_PROFILES.slice(0, 8).map((p, i) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    gender: "non-specifie",
    bio: p.bio,
    avatar_url: p.photo,
    is_verified: i % 3 === 0,
    distance_km: p.distance,
    score: 90 - i * 5,
    scoreBreakdown: {
      mode: 30 + (i % 3) * 5,
      distance: 20 - i * 2,
      timing: 15,
      social: 10 - (i % 4),
    },
    sharedModes: [p.mode] as ModeKey[],
    activeModes: [p.mode] as ModeKey[],
    availableTime: new Date(Date.now() - i * 3 * 60_000).toISOString(),
    lat: 48.8566 + (Math.random() - 0.5) * 0.02,
    lng: 2.3522 + (Math.random() - 0.5) * 0.02,
  }));
}

// ─── Countdown Timer ───

function CountdownTimer({ targetIso }: { targetIso: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function tick() {
      const now = Date.now();
      const target = new Date(targetIso).getTime();
      const diff = Math.max(0, target - now);

      if (diff <= 0) {
        setRemaining("Pret !");
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      if (h > 0) {
        setRemaining(`${h}h ${String(m).padStart(2, "0")}min`);
      } else {
        setRemaining(`${m}min ${String(s).padStart(2, "0")}s`);
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  return (
    <span className="font-mono text-[12px] text-accent font-semibold tabular-nums">
      {remaining.split("").map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.snap}
          className="inline-block"
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Empty State ───

function EmptyState({ refreshAt, canRefresh, onRefresh }: {
  refreshAt: string | null;
  canRefresh: boolean;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-center px-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Moon icon with ambient float */}
      <motion.div
        className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-6"
        animate={ambient.float(6)}
      >
        <IconMoon size={36} className="text-accent" />
      </motion.div>

      <h2 className="text-[20px] font-black text-text mb-2">
        C&apos;est tout pour le moment
      </h2>

      {refreshAt && !canRefresh ? (
        <>
          <p className="text-[13px] text-text-muted mb-4">
            Reviens pour de nouveaux profils dans
          </p>
          <div className="bg-accent/5 border border-accent/10 rounded-2xl px-6 py-3 mb-6">
            <CountdownTimer targetIso={refreshAt} />
          </div>
        </>
      ) : (
        <p className="text-[13px] text-text-muted mb-6">
          Tous les profils ont ete evalues
        </p>
      )}

      {canRefresh && (
        <motion.button
          onClick={onRefresh}
          className="gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-bold shadow-glow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
        >
          Rafraichir ma selection
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── Loading Skeleton ───

function QueueSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-[24px] overflow-hidden border border-border"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: i * 0.1 }}
        >
          {/* Photo skeleton */}
          <div className="h-[200px] skeleton-shimmer" />
          {/* Info skeleton */}
          <div className="p-4 space-y-3">
            <div className="h-4 w-32 rounded-full skeleton-shimmer" />
            <div className="h-3 w-48 rounded-full skeleton-shimmer" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full skeleton-shimmer" />
              <div className="h-6 w-20 rounded-full skeleton-shimmer" />
            </div>
            <div className="flex gap-3 pt-1">
              <div className="flex-1 h-12 rounded-2xl skeleton-shimmer" />
              <div className="flex-1 h-12 rounded-2xl skeleton-shimmer" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Page ───

export default function QueuePage() {
  const { user } = useAuth();
  const {
    queue: realQueue,
    loading,
    error,
    refreshAt,
    canRefresh,
    refresh,
    markSeen,
    remaining,
  } = useSmartQueue();
  const { like, pass } = useInteractions(user?.id);

  // Mock fallback
  const mockQueue = useMemo(() => buildMockQueue(), []);
  const queue = realQueue.length > 0 ? realQueue : (loading ? [] : mockQueue);

  // --- Pull-to-refresh ---
  const mainRef = useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const el = mainRef.current;
    if (el && el.scrollTop > 0) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullY(Math.min(delta * 0.4, 80));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullY > 50 && canRefresh) {
      setRefreshing(true);
      await refresh();
      setRefreshing(false);
    }
    setPullY(0);
  }, [pullY, canRefresh, refresh]);

  // --- Actions ---
  const handleAccept = useCallback(async (id: string) => {
    const candidate = queue.find((m) => m.id === id);
    if (candidate) {
      const mode = candidate.sharedModes[0] ?? candidate.activeModes[0];
      await like(id, mode);
    }
    markSeen(id);
  }, [queue, like, markSeen]);

  const handlePass = useCallback(async (id: string) => {
    await pass(id);
    markSeen(id);
  }, [pass, markSeen]);

  return (
    <div
      className="min-h-screen bg-bg flex flex-col max-w-lg mx-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div
          className="shrink-0 flex items-center justify-center overflow-hidden transition-all"
          style={{ height: refreshing ? 40 : pullY }}
        >
          <motion.div
            className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full"
            animate={{ rotate: refreshing ? 360 : pullY * 3 }}
            transition={
              refreshing
                ? { repeat: Infinity, duration: 0.6, ease: "linear" }
                : { duration: 0 }
            }
          />
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-text">
              Ta selection
            </h1>
            <p className="text-[12px] text-text-muted mt-0.5">
              {queue.length > 0
                ? `${queue.length} profil${queue.length > 1 ? "s" : ""} selectionne${queue.length > 1 ? "s" : ""} pour toi`
                : "Selection personnalisee"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh countdown */}
            {refreshAt && !canRefresh && (
              <div className="flex items-center gap-1.5 bg-accent/5 border border-accent/10 rounded-full px-3 py-1.5">
                <span className="text-[10px] text-text-muted">Prochain :</span>
                <CountdownTimer targetIso={refreshAt} />
              </div>
            )}

            {/* Refresh button */}
            {canRefresh && !loading && (
              <motion.button
                onClick={refresh}
                className="bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold px-3 py-1.5 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={micro.tapScale}
              >
                Rafraichir
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Queue content */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto pb-[100px]"
        role="list"
        aria-label="Selection de profils"
      >
        {/* Loading state */}
        {loading && queue.length === 0 && <QueueSkeleton />}

        {/* Error state */}
        {error && !loading && queue.length === 0 && (
          <div className="flex flex-col items-center justify-center px-8 pt-20 text-center">
            <p className="text-[14px] text-text-muted mb-4">{error}</p>
            <button
              onClick={refresh}
              className="gradient-bg text-white px-6 py-2.5 rounded-full text-[13px] font-semibold"
            >
              Reessayer
            </button>
          </div>
        )}

        {/* Queue cards */}
        {!loading && queue.length > 0 && (
          <div className="space-y-4 px-4 pt-2">
            <AnimatePresence mode="popLayout">
              {queue.map((candidate, i) => (
                <QueueCard
                  key={candidate.id}
                  candidate={candidate}
                  index={i}
                  onAccept={handleAccept}
                  onPass={handlePass}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state — all cards reviewed */}
        {!loading && queue.length === 0 && !error && (
          <EmptyState
            refreshAt={refreshAt}
            canRefresh={canRefresh}
            onRefresh={refresh}
          />
        )}
      </main>
    </div>
  );
}
