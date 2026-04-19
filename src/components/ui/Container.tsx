"use client";

import type { ReactNode } from "react";

type ContainerSize = "sm" | "md" | "lg" | "xl";

interface ContainerProps {
  children: ReactNode;
  /**
   * Max width preset. Defaults to "lg" (max-w-lg ≈ 512px) — matches the
   * near-unanimous baseline already adopted across the app.
   */
  size?: ContainerSize;
  /**
   * Extra classes. Kept last so consumer can override horizontal padding
   * or vertical rhythm on a case-by-case basis.
   */
  className?: string;
}

/**
 * Page-level width container. Replaces the ~96 inline
 * `max-w-lg mx-auto px-4` repetitions called out in the UI audit.
 *
 * Horizontal padding is safe-area aware via Tailwind's `pl-[env(safe-area-...)]`
 * fallbacks; we keep it simple here and rely on the parent layout for inset.
 */
const sizeMap: Record<ContainerSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export default function Container({
  children,
  size = "lg",
  className = "",
}: ContainerProps) {
  return (
    <div className={`${sizeMap[size]} mx-auto px-4 ${className}`.trim()}>
      {children}
    </div>
  );
}
