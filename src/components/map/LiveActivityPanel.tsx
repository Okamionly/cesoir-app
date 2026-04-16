"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import type { LiveHotspot } from "@/lib/useHotspots";

interface LiveActivityPanelProps {
  hotspots: LiveHotspot[];
  loading: boolean;
  lastUpdated: Date;
  onRefresh: () => void;
  userLat?: number;
  userLng?: number;
}

function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
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

export default function LiveActivityPanel({
  hotspots,
  loading,
  lastUpdated,
  onRefresh,
  userLat,
  userLng,
}: LiveActivityPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [refreshSpin, setRefreshSpin] = useState(0);

  const totalActive = useMemo(
    () => hotspots.reduce((sum, h) => sum + h.count, 0),
    [hotspots]
  );

  // Top 3 hottest spots sorted by count, with distance
  const top3 = useMemo(() => {
    return [...hotspots]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((h) => ({
        ...h,
        distance:
          userLat && userLng
            ? distanceKm(userLat, userLng, h.lat, h.lng)
            : null,
      }));
  }, [hotspots, userLat, userLng]);

  // Most popular mode right now
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

  const handleRefresh = () => {
    setRefreshSpin((s) => s + 360);
    onRefresh();
  };

  const intensityColor = (intensity: LiveHotspot["intensity"]) => {
    switch (intensity) {
      case "low":
        return "#3B82F6";
      case "medium":
        return "#8B5CF6";
      case "high":
        return "#00FF88";
    }
  };

  return (
    <motion.div
      className="absolute bottom-24 left-3 right-3 z-[900]"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={springs.heavy}
    >
      <div className="bg-bg border border-border rounded-2xl overflow-hidden shadow-glow">
        {/* Collapsed header -- always visible */}
        <div
          role="button"
          tabIndex={0}
          className="w-full px-4 py-3 flex items-center justify-between tap-target cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); } }}
          aria-expanded={expanded}
          aria-label="Activite en direct"
        >
          <div className="flex items-center gap-2.5">
            <motion.div
              className="w-2 h-2 rounded-full bg-safe"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[13px] font-semibold text-text">
              <motion.span
                key={`total-${totalActive}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springs.snap}
                className="inline-block"
              >
                {totalActive}
              </motion.span>{" "}
              personnes actives pres de toi
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              className="w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted tap-target"
              aria-label="Actualiser"
              animate={{ rotate: refreshSpin }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              whileTap={micro.tapScale}
              disabled={loading}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </motion.button>

            {/* Expand chevron */}
            <motion.span
              className="text-text-muted text-[12px]"
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={springs.snap}
            >
              ▲
            </motion.span>
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springs.heavy}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Top 3 spots */}
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Spots les plus chauds
                  </span>
                  {top3.map((spot, idx) => (
                    <motion.div
                      key={spot.id}
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springs.snap, delay: idx * 0.08 }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[12px] font-bold text-text-muted w-4">
                          {idx + 1}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: intensityColor(spot.intensity),
                          }}
                        />
                        <span className="text-[12px] font-semibold text-text">
                          {spot.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.span
                          key={`spot-count-${spot.id}-${spot.count}`}
                          className="text-[12px] font-bold text-accent"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={springs.snap}
                        >
                          {spot.count}
                        </motion.span>
                        {spot.distance !== null && (
                          <span className="text-[10px] text-text-muted">
                            {spot.distance < 1
                              ? `${Math.round(spot.distance * 1000)}m`
                              : `${spot.distance.toFixed(1)}km`}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Top mode */}
                {topMode && (
                  <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...springs.snap, delay: 0.25 }}
                  >
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                      Mode le plus actif
                    </span>
                    <span className="bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full text-[10px] text-accent font-semibold">
                      {topMode}
                    </span>
                  </motion.div>
                )}

                {/* Last updated */}
                <motion.div
                  className="flex items-center justify-center pt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-[10px] text-text-muted">
                    Derniere mise a jour {timeAgo(lastUpdated)}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
