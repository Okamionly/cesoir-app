"use client";

import { m } from "motion/react";
import Image from "next/image";
import { springs, micro } from "@/lib/motion-design";
import { MODES } from "@/lib/modes";
import { MODE_COLORS } from "@/lib/mode-colors";
import type { Profile } from "@/lib/mock-profiles";

export interface MapCarouselItem {
  type: "profile" | "event" | "hotspot";
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  /** profile-specific */
  photo?: string;
  mode?: Profile["mode"];
  /** event/hotspot-specific */
  emoji?: string;
  intensity?: "low" | "medium" | "high";
}

interface MapCarouselProps {
  items: MapCarouselItem[];
  onSelect: (item: MapCarouselItem) => void;
}

/**
 * Horizontal glassmorphic carousel showing the items currently visible
 * on the map. Tap a card = fly to its coords on the map. Native overflow
 * scroll (CSS scroll-snap) — mobile-first UX.
 */
export default function MapCarousel({ items, onSelect }: MapCarouselProps) {
  if (items.length === 0) return null;

  return (
    <div className="absolute bottom-24 left-0 right-0 z-[850] pointer-events-none">
      <div className="px-3 pointer-events-auto">
        <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5 px-1">
          {items.length} sur la carte
        </p>
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {items.map((item, idx) => {
            const color = item.mode ? (MODE_COLORS[item.mode] || "var(--color-accent)") : "var(--color-accent)";
            return (
              <m.button
                key={`${item.type}-${item.id}`}
                onClick={() => onSelect(item)}
                className="shrink-0 w-40 flex items-center gap-2.5 bg-bg/85 backdrop-blur-md border border-border/60 rounded-2xl p-2.5 shadow-lg tap-target text-left"
                style={{ scrollSnapAlign: "start" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.snap, delay: idx * 0.03 }}
                whileTap={micro.tapScale}
                whileHover={{ y: -2 }}
              >
                {item.type === "profile" && item.photo ? (
                  <span
                    className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden border-2"
                    style={{ borderColor: color }}
                  >
                    <Image src={item.photo} alt={item.title} fill sizes="40px" style={{ objectFit: "cover" }} />
                  </span>
                ) : (
                  <span
                    className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[18px]"
                    style={{
                      background: item.type === "event"
                        ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))"
                        : "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                    }}
                  >
                    {item.emoji ?? "📍"}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-text truncate">{item.title}</p>
                  <p className="text-[9px] text-text-muted truncate">
                    {item.mode && MODES[item.mode] ? MODES[item.mode].name : item.subtitle}
                  </p>
                </div>
              </m.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
