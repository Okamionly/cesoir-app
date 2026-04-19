"use client";

import { app } from "@/lib/design-tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MeshGradientProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
}

// ---------------------------------------------------------------------------
// Intensity map
// ---------------------------------------------------------------------------

const OPACITY_MAP: Record<string, number> = {
  low: 0.08,
  medium: 0.15,
  high: 0.25,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MeshGradient({
  className = "",
  intensity = "low",
}: MeshGradientProps) {
  const opacity = OPACITY_MAP[intensity];

  // Mesh uses the two brand tokens plus two tonal variations of violet to
  // give depth without bleeding into the Tailwind palette namespace.
  const blobs = [
    { color: app.violet, size: "60%", top: "10%", left: "10%", delay: "0s", duration: "18s" },
    { color: app.vert, size: "50%", top: "50%", left: "60%", delay: "-4s", duration: "20s" },
    { color: app.violet, size: "55%", top: "60%", left: "15%", delay: "-8s", duration: "16s" },
    { color: app.violet, size: "45%", top: "15%", left: "55%", delay: "-12s", duration: "19s" },
  ];

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {blobs.map((blob, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
            width: blob.size,
            height: blob.size,
            top: blob.top,
            left: blob.left,
            animation: `mesh-move ${blob.duration} ease-in-out infinite`,
            animationDelay: blob.delay,
          }}
        />
      ))}
    </div>
  );
}
