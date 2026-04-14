/** Skeleton loading components with shimmer animation */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonAvatar({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-full w-12 h-12 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ className = "", lines = 3 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer rounded h-3"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden bg-bg-card border border-border ${className}`}
      role="status"
      aria-label="Chargement..."
    >
      {/* Image area */}
      <div className="animate-shimmer aspect-[3/4] w-full" />
      {/* Content area */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <SkeletonAvatar className="w-10 h-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="animate-shimmer rounded h-4 w-3/4" />
            <div className="animate-shimmer rounded h-3 w-1/2" />
          </div>
        </div>
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

export function SkeletonProfile({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`space-y-6 ${className}`}
      role="status"
      aria-label="Chargement du profil..."
    >
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3">
        <SkeletonAvatar className="w-24 h-24" />
        <div className="animate-shimmer rounded h-5 w-40" />
        <div className="animate-shimmer rounded h-3 w-24" />
      </div>
      {/* Stats row */}
      <div className="flex justify-center gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="animate-shimmer rounded h-6 w-10" />
            <div className="animate-shimmer rounded h-3 w-14" />
          </div>
        ))}
      </div>
      {/* Bio lines */}
      <div className="px-6">
        <SkeletonText lines={4} />
      </div>
      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-1 px-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-shimmer aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
