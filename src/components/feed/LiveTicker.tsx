"use client";

/**
 * LiveTicker — top-of-feed live-activity bar.
 *
 * Shows two real-time counts:
 *   • actifs maintenant — profiles.is_online AND last_seen > now()-5min
 *   • plans ce soir     — flash_plans.status='open' AND when_at <= tonight_end
 *
 * Subscribes to postgres_changes and polls every 30s as a safety net so the
 * header never stales. Respects prefers-reduced-motion for the number-flip
 * animation and the pulse dot.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { useRealtimeChannel } from "@/lib/hooks/useSupabaseQuery";
import { useAccessibility } from "@/components/ui/ReducedMotion";
import { RotateCcw } from "@/components/ui/lucide";

function tonightEnd(): string {
  // "Tonight" = up to 06:00 tomorrow morning (local).
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(6, 0, 0, 0);
  return end.toISOString();
}

function fiveMinAgo(): string {
  return new Date(Date.now() - 5 * 60_000).toISOString();
}

interface FlipNumberProps {
  value: number;
  reducedMotion: boolean;
}

function FlipNumber({ value, reducedMotion }: FlipNumberProps) {
  if (reducedMotion) {
    return <span className="tabular-nums">{value}</span>;
  }
  return (
    <span className="relative inline-block tabular-nums min-w-[2ch] text-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="inline-block"
        >
          {value}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

interface LiveTickerProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function LiveTicker({ onRefresh, refreshing = false }: LiveTickerProps) {
  const { reducedMotion } = useAccessibility();
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [plansCount, setPlansCount] = useState<number | null>(null);

  const refreshCounts = useCallback(async () => {
    const [activeRes, plansRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_online", true)
        .gte("last_seen", fiveMinAgo()),
      supabase
        .from("flash_plans")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .lte("when_at", tonightEnd()),
    ]);
    if (typeof activeRes.count === "number") setActiveCount(activeRes.count);
    if (typeof plansRes.count === "number") setPlansCount(plansRes.count);
  }, []);

  // Capture latest refreshCounts in a ref so our effect can stay deps-free
  // and still call the current version (avoids set-state-in-effect lint).
  const refreshRef = useRef(refreshCounts);
  useEffect(() => {
    refreshRef.current = refreshCounts;
  }, [refreshCounts]);

  useEffect(() => {
    const tick = () => {
      refreshRef.current();
    };
    const idleId = typeof window !== "undefined"
      ? window.setTimeout(tick, 0)
      : null;
    const interval = setInterval(tick, 30_000);
    return () => {
      if (idleId !== null) window.clearTimeout(idleId);
      clearInterval(interval);
    };
  }, []);

  // Realtime: refresh counts whenever profiles or flash_plans change
  useRealtimeChannel(
    (client) =>
      client
        .channel("live-ticker")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => void refreshCounts(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "flash_plans" },
          () => void refreshCounts(),
        ),
    [],
  );

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12px]"
      aria-label="Activité en direct — statistiques"
    >
      <div className="flex items-center gap-2 flex-wrap text-text-muted">
        {/* Pulse dot */}
        <span className="relative inline-flex h-2 w-2 flex-shrink-0" aria-hidden="true">
          {!reducedMotion && (
            <span className="absolute inset-0 inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="inline-flex items-baseline gap-1">
          <span className="font-semibold text-text">
            <FlipNumber value={activeCount ?? 0} reducedMotion={reducedMotion} />
          </span>
          {/* 2026-04-26: French grammar — singular for 0/1, plural >=2.
              "0 actifs" sounded weird ("0 actif" too — but accept it).
              Use "actif" when value <= 1 ("1 actif maintenant"),
              "actifs" otherwise. */}
          <span>{(activeCount ?? 0) <= 1 ? "actif maintenant" : "actifs maintenant"}</span>
        </span>
        <span className="text-text-muted/60" aria-hidden="true">·</span>
        <span className="inline-flex items-baseline gap-1">
          <span className="font-semibold text-text">
            <FlipNumber value={plansCount ?? 0} reducedMotion={reducedMotion} />
          </span>
          <span>{(plansCount ?? 0) <= 1 ? "plan ce soir" : "plans ce soir"}</span>
        </span>
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Actualiser le fil"
          className="inline-flex items-center justify-center p-1.5 rounded-full text-text-muted hover:text-text hover:bg-card transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <m.span
            animate={refreshing && !reducedMotion ? { rotate: 360 } : {}}
            transition={refreshing ? { duration: 0.9, repeat: Infinity, ease: "linear" } : {}}
            className="inline-block"
          >
            <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
          </m.span>
        </button>
      )}
    </div>
  );
}
