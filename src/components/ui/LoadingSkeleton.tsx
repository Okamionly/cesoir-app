/**
 * @deprecated Use `@/components/ui/skeletons` instead.
 * The variant-based API here is superseded by dedicated primitives
 * (SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonList, SkeletonPage).
 */

interface LoadingSkeletonProps {
  variant?: "card" | "row" | "avatar" | "text";
  count?: number;
  className?: string;
}

const variantStyles: Record<string, string> = {
  card: "w-full h-48 rounded-2xl",
  row: "w-full h-14 rounded-lg",
  avatar: "w-12 h-12 rounded-full",
  text: "w-full h-4 rounded",
};

function SkeletonItem({
  variant = "text",
  className = "",
}: {
  variant: string;
  className?: string;
}) {
  const base = variantStyles[variant] ?? variantStyles.text;

  return (
    <div
      className={`skeleton-shimmer ${base} ${className}`}
      aria-hidden="true"
    />
  );
}

export default function Skeleton({
  variant = "text",
  count = 1,
  className = "",
}: LoadingSkeletonProps) {
  if (count === 1) {
    return (
      <div role="status" aria-label="Chargement...">
        <SkeletonItem variant={variant} className={className} />
      </div>
    );
  }

  return (
    <div
      className={`flex ${variant === "row" || variant === "text" ? "flex-col gap-3" : "flex-wrap gap-4"}`}
      role="status"
      aria-label="Chargement..."
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} variant={variant} className={className} />
      ))}
    </div>
  );
}
