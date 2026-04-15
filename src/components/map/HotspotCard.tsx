"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Hotspot } from "@/lib/hotspots";
import { getHotspotColor, getHotspotLabel } from "@/lib/hotspots";

interface HotspotCardProps {
  hotspot: Hotspot | null;
  onClose?: () => void;
  onExplore?: (hotspot: Hotspot) => void;
}

export default function HotspotCard({
  hotspot,
  onClose,
  onExplore,
}: HotspotCardProps) {
  if (!hotspot) return null;

  const color = getHotspotColor(hotspot.level);
  const label = getHotspotLabel(hotspot.level);

  return (
    <AnimatePresence>
      {hotspot && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
          />

          {/* Card */}
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6"
            role="dialog"
            aria-label={`Zone ${hotspot.name}`}
          >
            <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
              {/* Color bar at top */}
              <div className="h-1" style={{ backgroundColor: color }} />

              <div className="p-5">
                {/* Name and level badge */}
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-xl font-black text-white">
                    {hotspot.name}
                  </h3>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: `${color}CC` }}
                  >
                    {label}
                  </span>
                </div>

                {/* Active users */}
                <div className="mb-3 flex items-center gap-2">
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.6, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-white/70">
                    {hotspot.activeUsers} personnes actives
                  </span>
                </div>

                {/* Top mode */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm text-white/40">Mode populaire :</span>
                  <span
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${color}1A`,
                      color: color,
                    }}
                  >
                    {hotspot.topMode}
                  </span>
                </div>

                {/* Description */}
                <p className="mb-5 text-sm text-white/60">
                  {hotspot.description}
                </p>

                {/* Explore button */}
                <button
                  onClick={() => onExplore?.(hotspot)}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  }}
                  aria-label={`Explorer ${hotspot.name}`}
                >
                  Explorer
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
