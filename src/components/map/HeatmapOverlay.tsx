"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import type { LiveHotspot } from "@/lib/useHotspots";
import maplibregl from "maplibre-gl";

interface HeatmapOverlayProps {
  hotspots: LiveHotspot[];
  map: maplibregl.Map | null;
  visible: boolean;
  onToggle: () => void;
}

const INTENSITY_COLORS: Record<
  LiveHotspot["intensity"],
  { center: string; mid: string; border: string; glow: string }
> = {
  low: {
    center: "rgba(59,130,246,0.28)",
    mid: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.30)",
    glow: "0 0 24px rgba(59,130,246,0.20)",
  },
  medium: {
    center: "rgba(139,92,246,0.32)",
    mid: "rgba(139,92,246,0.14)",
    border: "rgba(139,92,246,0.35)",
    glow: "0 0 32px rgba(139,92,246,0.28)",
  },
  high: {
    center: "rgba(0,255,136,0.35)",
    mid: "rgba(0,255,136,0.15)",
    border: "rgba(0,255,136,0.40)",
    glow: "0 0 40px rgba(0,255,136,0.35)",
  },
};

// Scale circle size based on user count
function circleSize(count: number): number {
  // min 60px, max 180px
  return Math.min(180, Math.max(60, 40 + count * 3.5));
}

/**
 * HeatmapOverlay renders colored circles on the MapLibre map
 * at hotspot positions. Uses DOM markers for motion animations.
 */
export default function HeatmapOverlay({
  hotspots,
  map,
  visible,
  onToggle,
}: HeatmapOverlayProps) {
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Inject keyframes for the pulse animation
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("heatmap-pulse-styles")) return;

    const style = document.createElement("style");
    style.id = "heatmap-pulse-styles";
    style.textContent = `
      @keyframes heatmap-pulse {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.15); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Manage map markers
  useEffect(() => {
    if (!map) return;

    // Clean up previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!visible) return;

    hotspots.forEach((spot, idx) => {
      const colors = INTENSITY_COLORS[spot.intensity];
      const size = circleSize(spot.count);
      const isHigh = spot.intensity === "high";

      const el = document.createElement("div");
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        pointer-events: none;
        background: radial-gradient(circle, ${colors.center} 0%, ${colors.mid} 50%, transparent 70%);
        border: 1px solid ${colors.border};
        box-shadow: ${colors.glow};
        opacity: 0;
        transform: scale(0);
        transition: none;
      `;

      // Animate in with stagger using springs.elastic timing
      const delay = idx * 60;
      setTimeout(() => {
        el.style.transition = "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out";
        el.style.opacity = "0.85";
        el.style.transform = "scale(1)";

        // Add pulse for high-activity zones
        if (isHigh) {
          setTimeout(() => {
            el.style.transition = "none";
            el.style.animation = "heatmap-pulse 2.5s ease-in-out infinite";
          }, 700);
        }
      }, delay);

      // Count label in center
      const label = document.createElement("div");
      label.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 11px;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        pointer-events: none;
        white-space: nowrap;
      `;
      label.textContent = `${spot.count}`;
      el.style.position = "relative";
      el.appendChild(label);

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([spot.lng, spot.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, visible, hotspots]);

  return null;
}

/**
 * Fallback heatmap for offline/CSS-only map mode.
 * Renders positioned div circles within a relative container.
 */
export function HeatmapFallback({
  hotspots,
  visible,
  center,
}: {
  hotspots: LiveHotspot[];
  visible: boolean;
  center: { lat: number; lng: number };
}) {
  if (!visible) return null;

  return (
    <>
      <AnimatePresence>
        {hotspots.map((spot, idx) => {
          const colors = INTENSITY_COLORS[spot.intensity];
          const size = circleSize(spot.count);
          const isHigh = spot.intensity === "high";

          // Convert lat/lng to percentage position
          const top = `${30 + (spot.lat - center.lat) * 5000}%`;
          const left = `${50 + (spot.lng - center.lng) * 5000}%`;

          return (
            <motion.div
              key={`heat-fb-${spot.id}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: size,
                height: size,
                background: `radial-gradient(circle, ${colors.center} 0%, ${colors.mid} 50%, transparent 70%)`,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.glow,
                top,
                left,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isHigh ? [1, 1.15, 1] : 1,
                opacity: 0.85,
              }}
              transition={
                isHigh
                  ? {
                      scale: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
                      opacity: { ...springs.elastic, delay: idx * 0.06 },
                    }
                  : { ...springs.elastic, delay: idx * 0.06 }
              }
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
            >
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-white drop-shadow-md">
                {spot.count}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </>
  );
}
