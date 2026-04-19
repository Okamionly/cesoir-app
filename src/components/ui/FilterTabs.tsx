"use client";

import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

export interface FilterTab<T extends string = string> {
  id: T;
  label: string;
  /** Optional emoji or short visual prefix. */
  icon?: string;
  /** Optional badge count shown to the right of the label. */
  count?: number;
}

interface FilterTabsProps<T extends string = string> {
  tabs: ReadonlyArray<FilterTab<T>>;
  active: T;
  onChange: (id: T) => void;
  /**
   * Optional extra classes on the outer scroll container.
   */
  className?: string;
  /**
   * Accessible label for the tablist — default is "Filtres".
   */
  ariaLabel?: string;
}

/**
 * Horizontal scrolling tab strip used for discovery filters, notification
 * categories, reviews filters, etc. Replaces the hand-rolled tab logic
 * flagged across `events/`, `notifications/`, `reviews/` in the UI audit.
 *
 * Pure-token styling: uses bg-card / text-text-muted / accent — no raw hex.
 */
export default function FilterTabs<T extends string = string>({
  tabs,
  active,
  onChange,
  className = "",
  ariaLabel = "Filtres",
}: FilterTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-2 overflow-x-auto scrollbar-none ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <motion.button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            whileTap={{ scale: 0.96 }}
            transition={springs.micro}
            className={[
              "flex-shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-full",
              "text-sm font-semibold transition-colors",
              isActive
                ? "bg-text text-bg"
                : "bg-card text-text-muted border border-border hover:text-text",
            ].join(" ")}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={[
                  "ml-1 px-1.5 rounded-full text-[10px]",
                  isActive ? "bg-bg/20 text-bg" : "bg-border text-text-muted",
                ].join(" ")}
              >
                {tab.count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
