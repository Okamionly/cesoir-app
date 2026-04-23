"use client";

/**
 * EventFilters — horizontally-scrollable chip row for the Soirees listing.
 *
 * Two rows:
 *  1. "When" (tonight / tomorrow / weekend / all) — single-select
 *  2. Category (techno / house / jazz / …)        — single-select, toggleable
 */

import { m, type Transition } from "motion/react";
import { springs } from "@/lib/motion-design";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_ORDER,
  type EventCategory,
  type EventFiltersState,
  type EventWhenFilter,
} from "@/lib/events-types";

const WHEN_TABS: Array<{ id: EventWhenFilter; label: string }> = [
  { id: "tonight", label: "Ce soir" },
  { id: "tomorrow", label: "Demain" },
  { id: "weekend", label: "Ce week-end" },
  { id: "all", label: "Tout" },
];

export interface EventFiltersProps {
  value: EventFiltersState;
  onChange: (next: EventFiltersState) => void;
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <m.button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={springs.micro as Transition}
      className={[
        "flex-shrink-0 inline-flex items-center rounded-full px-3.5 py-1.5",
        "text-[12px] font-semibold whitespace-nowrap transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        active
          ? "bg-text text-bg"
          : "bg-card text-text-muted border border-border hover:text-text hover:border-accent/30",
      ].join(" ")}
    >
      {label}
    </m.button>
  );
}

export default function EventFilters({ value, onChange }: EventFiltersProps) {
  return (
    <div className="space-y-2">
      {/* When row */}
      <div
        role="tablist"
        aria-label="Quand"
        className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4"
      >
        {WHEN_TABS.map((tab) => (
          <Chip
            key={tab.id}
            active={value.when === tab.id}
            label={tab.label}
            onClick={() => onChange({ ...value, when: tab.id })}
          />
        ))}
      </div>

      {/* Category row */}
      <div
        role="tablist"
        aria-label="Categories"
        className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4"
      >
        <Chip
          active={value.category === null}
          label="Toutes"
          onClick={() => onChange({ ...value, category: null })}
        />
        {EVENT_CATEGORY_ORDER.map((cat: EventCategory) => (
          <Chip
            key={cat}
            active={value.category === cat}
            label={EVENT_CATEGORY_LABELS[cat]}
            onClick={() =>
              onChange({
                ...value,
                category: value.category === cat ? null : cat,
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
