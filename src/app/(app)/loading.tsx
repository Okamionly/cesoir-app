export default function Loading() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      {/* Pulsing logo */}
      <div className="flex flex-col items-center gap-1 mb-10">
        <span
          className="text-5xl text-accent drop-shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
        >
          ☾
        </span>
        <span className="text-sm font-bold text-text-muted tracking-wide">CeSoir</span>
      </div>

      {/* Skeleton cards */}
      <div className="w-full max-w-sm space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-bg-card overflow-hidden"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className="p-4 flex items-center gap-3">
              {/* Avatar skeleton */}
              <div
                className="w-12 h-12 rounded-full shrink-0 animate-shimmer"
              />
              <div className="flex-1 space-y-2">
                {/* Name skeleton */}
                <div
                  className="h-4 rounded animate-shimmer"
                  style={{ width: `${60 + i * 10}%` }}
                />
                {/* Sub-text skeleton */}
                <div
                  className="h-3 rounded animate-shimmer"
                  style={{ width: `${40 + i * 8}%` }}
                />
              </div>
            </div>
            {/* Tags skeleton */}
            <div className="px-4 pb-3 flex gap-2">
              <div className="h-5 w-16 rounded-full animate-shimmer" />
              <div className="h-5 w-20 rounded-full animate-shimmer" />
              <div className="h-5 w-14 rounded-full animate-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Gradient shimmer bar at bottom */}
      <div className="mt-8 w-32 h-1 rounded-full overflow-hidden">
        <div
          className="w-full h-full"
          style={{
            background: "linear-gradient(90deg, transparent, #8B5CF6, #00FF88, transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
