"use client";

import { useState, useEffect, useMemo } from "react";
import { getCurrentSeason, type ParticleType } from "@/lib/seasons";

// ── Particle config per type ────────────────────────────

const PARTICLE_MAP: Record<ParticleType, { chars: string[]; direction: "down" | "up" }> = {
  snowflakes:   { chars: ["\u2744\uFE0F", "\u2744", "\u2745", "\u2746"], direction: "down" },
  hearts:       { chars: ["\uD83D\uDC95", "\uD83D\uDC96", "\u2764\uFE0F", "\uD83D\uDC97"], direction: "down" },
  "music-notes":{ chars: ["\uD83C\uDFB5", "\uD83C\uDFB6", "\u266A", "\u266B"], direction: "down" },
  leaves:       { chars: ["\uD83C\uDF42", "\uD83C\uDF41", "\uD83C\uDF43"], direction: "down" },
  fireworks:    { chars: ["\uD83C\uDF86", "\u2728", "\u2B50", "\uD83D\uDCAB"], direction: "up" },
  bats:         { chars: ["\uD83E\uDD87", "\uD83D\uDC7B", "\uD83D\uDD77\uFE0F"], direction: "down" },
  confetti:     { chars: ["\uD83C\uDF89", "\u2728", "\uD83C\uDF8A"], direction: "down" },
  petals:       { chars: ["\uD83C\uDF38", "\uD83C\uDF3C", "\uD83C\uDF37"], direction: "down" },
  none:         { chars: [], direction: "down" },
};

const PARTICLE_COUNT = 18;

interface Particle {
  id: number;
  char: string;
  x: number;        // % from left
  size: number;      // rem
  duration: number;  // seconds
  delay: number;     // seconds
  sway: number;      // px horizontal drift
  opacity: number;
}

function generateParticles(type: ParticleType): Particle[] {
  const config = PARTICLE_MAP[type];
  if (!config || config.chars.length === 0) return [];

  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    char: config.chars[i % config.chars.length],
    x: Math.random() * 100,
    size: 0.8 + Math.random() * 1.0,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 10,
    sway: 20 + Math.random() * 40,
    opacity: 0.4 + Math.random() * 0.5,
  }));
}

// ── Component ───────────────────────────────────────────

export default function SeasonalOverlay() {
  const [enabled, setEnabled] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const season = useMemo(() => getCurrentSeason(), []);
  const particles = useMemo(() => generateParticles(season.particleType), [season.particleType]);
  const direction = PARTICLE_MAP[season.particleType]?.direction ?? "down";

  // Check localStorage preference + reduced motion
  useEffect(() => {
    const stored = localStorage.getItem("cesoir-seasonal-particles");
    if (stored === "off") setEnabled(false);

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  if (!enabled || prefersReducedMotion || particles.length === 0) return null;

  return (
    <>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes seasonal-fall {
          0% {
            transform: translateY(-5vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--p-opacity);
          }
          90% {
            opacity: var(--p-opacity);
          }
          100% {
            transform: translateY(105vh) translateX(var(--p-sway)) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes seasonal-rise {
          0% {
            transform: translateY(105vh) translateX(0) scale(0.3);
            opacity: 0;
          }
          15% {
            opacity: var(--p-opacity);
            transform: translateY(80vh) translateX(calc(var(--p-sway) * 0.2)) scale(1);
          }
          85% {
            opacity: var(--p-opacity);
          }
          100% {
            transform: translateY(-5vh) translateX(var(--p-sway)) scale(0.6);
            opacity: 0;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 50 }}
      >
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: direction === "down" ? "-5vh" : undefined,
              bottom: direction === "up" ? "-5vh" : undefined,
              fontSize: `${p.size}rem`,
              animation: `${direction === "down" ? "seasonal-fall" : "seasonal-rise"} ${p.duration}s ${p.delay}s linear infinite`,
              "--p-sway": `${p.sway}px`,
              "--p-opacity": `${p.opacity}`,
              willChange: "transform, opacity",
            } as React.CSSProperties}
          >
            {p.char}
          </span>
        ))}
      </div>
    </>
  );
}
