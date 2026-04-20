"use client";

import { m } from "motion/react";
import { springs, micro } from "@/lib/motion-design";

interface MapFloatingActionsProps {
  onRecenter: () => void;
  onRoute: () => void;
  canRecenter: boolean;
}

/**
 * Floating bottom-right button stack.
 * - Recenter (📍) recenters the map on the user's live geolocation.
 * - Route (🎯) is a stub that opens a "Coming soon" modal elsewhere.
 */
export default function MapFloatingActions({ onRecenter, onRoute, canRecenter }: MapFloatingActionsProps) {
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
      <m.button
        onClick={onRecenter}
        disabled={!canRecenter}
        className="w-11 h-11 rounded-full bg-bg/85 backdrop-blur-md border border-border flex items-center justify-center text-base shadow-lg tap-target disabled:opacity-40"
        whileTap={canRecenter ? micro.tapScale : undefined}
        whileHover={canRecenter ? { y: -2 } : undefined}
        transition={springs.micro}
        aria-label="Recentrer sur ma position"
      >
        📍
      </m.button>
    </div>
  );
}
