"use client";

import { m } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { Navigation, Route, RotateCcw } from "@/components/ui/lucide";

interface MapFloatingActionsProps {
  onRecenter: () => void;
  onRoute: () => void;
  onRefresh?: () => void;
  canRecenter: boolean;
  /**
   * Set to `true` when the last geolocation fix is older than ~5 minutes.
   * Triggers a subtle breathing glow around the recenter button to invite
   * the user to refresh their position.
   */
  geoStale?: boolean;
  /**
   * `true` while a refresh is in flight — spins the refresh icon and
   * disables its pointer events.
   */
  refreshing?: boolean;
}

/**
 * Floating bottom-right button **stack** (vertical column).
 *
 * Consolidates every right-edge action into a single 44×44 stacked column
 * so the map never accumulates orphan floating icons. Order is top-to-bottom:
 *   1. Recenter  (Target/Navigation icon)  — live geolocation
 *   2. Itinerary (Route icon)              — opens "coming soon" modal
 *   3. Refresh   (RotateCcw icon)          — re-queries activity data
 *
 * Positioned clear of the LiveActivityPanel chip (bottom-left) and the
 * BottomNav (76px safe-area). Each button carries an ARIA label and is
 * keyboard reachable via natural Tab order.
 */
export default function MapFloatingActions({
  onRecenter,
  onRoute,
  onRefresh,
  canRecenter,
  geoStale = false,
  refreshing = false,
}: MapFloatingActionsProps) {
  return (
    <div
      className="absolute right-3 z-[880] flex flex-col gap-2"
      style={{ bottom: "calc(120px + env(safe-area-inset-bottom))" }}
    >
      {/* Recenter — primary action, top of column */}
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
          className="relative w-11 h-11 rounded-full bg-bg/90 backdrop-blur-xl border border-border flex items-center justify-center text-text shadow-lg tap-target disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          whileTap={canRecenter ? micro.tapScale : undefined}
          whileHover={canRecenter ? { y: -2 } : undefined}
          transition={springs.micro}
          aria-label={geoStale ? "Position obsolete — recentrer sur ma position" : "Recentrer sur ma position"}
        >
          <Navigation size={18} strokeWidth={2} aria-hidden="true" />
        </m.button>
      </div>

      {/* Itinerary */}
      <m.button
        onClick={onRoute}
        className="w-11 h-11 rounded-full bg-bg/90 backdrop-blur-xl border border-border flex items-center justify-center text-text shadow-lg tap-target focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        whileTap={micro.tapScale}
        whileHover={{ y: -2 }}
        transition={springs.micro}
        aria-label="Itineraire (bientot disponible)"
      >
        <Route size={18} strokeWidth={2} aria-hidden="true" />
      </m.button>

      {/* Refresh */}
      {onRefresh && (
        <m.button
          onClick={onRefresh}
          disabled={refreshing}
          className="w-11 h-11 rounded-full bg-bg/90 backdrop-blur-xl border border-border flex items-center justify-center text-text shadow-lg tap-target disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          whileTap={!refreshing ? micro.tapScale : undefined}
          whileHover={!refreshing ? { y: -2 } : undefined}
          transition={springs.micro}
          aria-label={refreshing ? "Actualisation en cours" : "Actualiser l'activite"}
        >
          <m.span
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={refreshing ? { duration: 1.2, repeat: Infinity, ease: "linear" } : { duration: 0 }}
            className="flex items-center justify-center"
          >
            <RotateCcw size={17} strokeWidth={2} aria-hidden="true" />
          </m.span>
        </m.button>
      )}
    </div>
  );
}
