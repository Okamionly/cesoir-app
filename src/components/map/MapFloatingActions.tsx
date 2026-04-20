"use client";

import { m } from "motion/react";
import { springs, micro } from "@/lib/motion-design";

interface MapFloatingActionsProps {
  onRecenter: () => void;
  onRoute: () => void;
  canRecenter: boolean;
  /**
   * Set to `true` when the last geolocation fix is older than ~5 minutes.
   * Triggers a subtle breathing glow around the recenter button to invite
   * the user to refresh their position.
   */
  geoStale?: boolean;
}

/**
 * Floating bottom-right button stack.
 * - Recenter (📍) recenters the map on the user's live geolocation.
 *   When `geoStale` is true, the button gets a breathing violet glow.
 * - Route (🎯) is a stub that opens a "Coming soon" modal elsewhere.
 */
export default function MapFloatingActions({ onRecenter, onRoute, canRecenter, geoStale = false }: MapFloatingActionsProps) {
  return (
    <div className="absolute bottom-44 right-3 z-[880] flex flex-col gap-2">
      <m.button
        onClick={onRoute}
        className="w-11 h-11 rounded-full bg-bg/85 backdrop-blur-md border border-border flex items-center justify-center text-base shadow-lg tap-target"
        whileTap={micro.tapScale}
        whileHover={{ y: -2 }}
        transition={springs.micro}
        aria-label="Itineraire (bientot disponible)"
      >
        🎯
      </m.button>
      <div className="relative">
        {geoStale && canRecenter && (
          <m.span
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: "0 0 0 0 rgba(139,92,246,0.55)",
            }}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(139,92,246,0.55)",
                "0 0 0 10px rgba(139,92,246,0)",
                "0 0 0 0 rgba(139,92,246,0)",
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <m.button
          onClick={onRecenter}
          disabled={!canRecenter}
          className="relative w-11 h-11 rounded-full bg-bg/85 backdrop-blur-md border border-border flex items-center justify-center text-base shadow-lg tap-target disabled:opacity-40"
          whileTap={canRecenter ? micro.tapScale : undefined}
          whileHover={canRecenter ? { y: -2 } : undefined}
          transition={springs.micro}
          aria-label={geoStale ? "Position obsolete — recentrer" : "Recentrer sur ma position"}
        >
          📍
        </m.button>
      </div>
    </div>
  );
}
