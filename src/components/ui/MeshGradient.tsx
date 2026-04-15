"use client";

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

  const blobs = [
    { color: "#8B5CF6", size: "60%", top: "10%", left: "10%", delay: "0s", duration: "18s" },
    { color: "#00FF88", size: "50%", top: "50%", left: "60%", delay: "-4s", duration: "20s" },
    { color: "#3b82f6", size: "55%", top: "60%", left: "15%", delay: "-8s", duration: "16s" },
    { color: "#a855f7", size: "45%", top: "15%", left: "55%", delay: "-12s", duration: "19s" },
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
