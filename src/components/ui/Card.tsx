"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

type CardPadding = "none" | "sm" | "md" | "lg";
type CardRadius = "md" | "lg" | "xl" | "2xl";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /**
   * Internal padding preset (maps to the rationalized 4px spacing scale).
   * - none → p-0
   * - sm   → p-3  (12px)
   * - md   → p-4  (16px) — default
   * - lg   → p-6  (24px)
   */
  padding?: CardPadding;
  /**
   * Corner radius preset. Defaults to "2xl" to match the dominant app shell.
   */
  radius?: CardRadius;
  /**
   * When true, removes the default border — useful for nested cards.
   */
  borderless?: boolean;
}

const paddingMap: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const radiusMap: Record<CardRadius, string> = {
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-2xl",
};

/**
 * Base card primitive. All specialized card components (ProfileCard,
 * SoireeCard, RecommendationCard…) should compose this shell so the
 * background + border + radius tokens stay unified. Uses semantic tokens
 * (`bg-card`, `border-border`) — never raw hex.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    padding = "md",
    radius = "2xl",
    borderless = false,
    className = "",
    ...rest
  },
  ref,
) {
  const classes = [
    "bg-card",
    borderless ? "" : "border border-border",
    radiusMap[radius],
    paddingMap[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});

export default Card;
