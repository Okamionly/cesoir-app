"use client";

import { useState, useMemo } from "react";
import { m, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import type { LiveHotspot } from "@/lib/useHotspots";
import { ChevronUp } from "@/components/ui/lucide";

interface LiveActivityPanelProps {
  hotspots: LiveHotspot[];
  loading: boolean;
  lastUpdated: Date;
  /**
   * Kept for API compatibility — refresh is now triggered from the
   * MapFloatingActions column (single source of map actions).
   */
  onRefresh?: () => void;
  userLat?: number;
  userLng?: number;
}

function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "a l'instant";
  const minutes = Math.floor(seconds / 60);
  return `il y a ${minutes} min`;
}

/**
 * Compact bottom-left **chip** that reveals a floating card on tap.
 *
 * Closed: 40px pill `• N dispos · freshness` with a chevron cue.
 * Open:   ~280px glass card with top-3 hottest spots + most active mode.
 *
 * Positioned at `left: 12px; bottom: calc(76px + safe-area + 12px)` so it
 * clears BottomNav and doesn't collide with the bottom-right action column.
 */
export default function LiveActivityPanel({
  hotspots,
  lastUpdated,
  userLat,
  userLng,
}: LiveActivityPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const totalActive = useMemo(
    () => hotspots.reduce((sum, h) => sum + h.count, 0),
    [hotspots],
  );

  const top3 = useMemo(() => {
    return [...hotspots]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((h) => ({
        ...h,
        distance:
          userLat && userLng ? distanceKm(userLat, userLng, h.lat, h.lng) : null,
      }));
  }, [hotspots, userLat, userLng]);

  const topMode = useMemo(() => {
    const modes: Record<string, number> = {};
    hotspots.forEach((h) => {
      modes[h.topMode] = (modes[h.topMode] || 0) + h.count;
    });
    let best = "";
    let max = 0;
    for (const [mode, count] of Object.entries(modes)) {
      if (count > max) {
        max = count;
        best = mode;
      }
    }
    return best;
  }, [hotspots]);

  const intensityColor = (intensity: LiveHotspot["intensity"]) => {
    switch (intensity) {
      case "low":
        return "var(--color-text-muted)";
      case "medium":
        return "var(--color-accent)";
      case "high":
        return "var(--color-accent-2)";
    }
  };

  return (
    <m.div
      className="absolute left-3 z-[900]"
      style={{ bottom: "calc(76px + env(safe-area-inset-bottom) + 12px)" }}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springs.heavy}
    >
      {/* Chip trigger */}
      <m.button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 bg-bg/90 backdrop-blur-xl border border-border rounded-full pl-3 pr-2.5 py-2 shadow-lg tap-target focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        whileTap={micro.tapScale}
        whileHover={{ y: -1 }}
        transition={springs.micro}
        aria-expanded={expanded}
        aria-label={`Activite en direct — ${totalActive} personne${totalActive === 1 ? "" : "s"}`}
      >
        <m.span
          className="w-1.5 h-1.5 rounded-full bg-safe"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          aria-hidden="true"
        />
        <m.span
          key={`total-${totalActive}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.snap}
          className="text-[12px] font-semibold text-text tabular-nums"
        >
          {totalActive}
        </m.span>
        <span className="text-[11px] text-text-muted">
          dispos · {timeAgo(lastUpdated)}
        </span>
        <m.span
          animate={{ rotate: expanded ? 0 : 180 }}
          transition={springs.snap}
          className="flex items-center justify-center text-text-muted"
          aria-hidden="true"
        >
          <ChevronUp size={14} strokeWidth={2.5} />
        </m.span>
      </m.button>

      {/* Expanded floating card */}
      <AnimatePresence>
        {expanded && (
          <m.div
            key="expanded"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={springs.snap}
            className="absolute bottom-full left-0 mb-2 w-[280px] bg-bg border border-border rounded-2xl shadow-glow overflow-hidden"
            role="region"
            aria-label="Details activite en direct"
          >
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  Spots les plus chauds
                </span>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-6 h-6 rounded-full hover:bg-bg-card flex items-center justify-center text-text-muted tap-target focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  aria-label="Fermer"
                >
                  <span className="text-[10px]" aria-hidden="true">✕</span>
                </button>
              </div>

              {top3.length === 0 ? (
                <p className="text-[11px] text-text-muted py-2">
                  Aucune activite pour l&apos;instant
                </p>
              ) : (
                <div className="space-y-2">
                  {top3.map((spot, idx) => (
                    <m.div
                      key={spot.id}
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springs.snap, delay: idx * 0.06 }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] font-bold text-text-muted w-3 shrink-0">
                          {idx + 1}
                        </span>
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: intensityColor(spot.intensity),
                          }}
                          aria-hidden="true"
                        />
                        <span className="text-[12px] font-semibold text-text truncate">
                          {spot.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-accent tabular-nums">
                          {spot.count}
                        </span>
                        {spot.distance !== null && (
                          <span className="text-[10px] text-text-muted tabular-nums">
                            {spot.distance < 1
                              ? `${Math.round(spot.distance * 1000)}m`
                              : `${spot.distance.toFixed(1)}km`}
                          </span>
                        )}
                      </div>
                    </m.div>
                  ))}
                </div>
              )}

              {topMode && (
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Mode le plus actif
                  </span>
                  <span className="bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full text-[10px] text-accent font-semibold">
                    {topMode}
                  </span>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
