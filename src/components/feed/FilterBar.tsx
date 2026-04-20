"use client";

/**
 * FilterBar — sticky horizontal filter chips under the LiveTicker.
 *
 * 4 filters: Tous / Amis / Ce soir / Près de moi. Selection persists in the
 * URL (?f=all|friends|tonight|nearby) so refresh / back-nav preserves it.
 */

import { m } from "motion/react";
import { haptics } from "@/lib/haptics";
import { useAccessibility } from "@/components/ui/ReducedMotion";
import { springs } from "@/lib/motion-design";

export type FeedFilter = "all" | "friends" | "tonight" | "nearby";

export const FEED_FILTER_VALUES: readonly FeedFilter[] = ["all", "friends", "tonight", "nearby"];

const FILTER_LABEL: Record<FeedFilter, string> = {
  all: "Tous",
  friends: "Amis",
  tonight: "Ce soir",
  nearby: "Près de moi",
};

export function isFeedFilter(v: string | null): v is FeedFilter {
  return v === "all" || v === "friends" || v === "tonight" || v === "nearby";
}

interface FilterBarProps {
  value: FeedFilter;
  onChange: (next: FeedFilter) => void;
}

export function FilterBar({ value, onChange }: FilterBarProps) {
  const { reducedMotion } = useAccessibility();

  return (
    <div
      className="sticky top-0 z-10 bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70 border-b border-border"
      role="tablist"
      aria-label="Filtre du fil"
    >
      <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar">
        {FEED_FILTER_VALUES.map((f) => {
          const active = value === f;
          return (
            <m.button
              key={f}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => {
                if (active) return;
                haptics.light();
                onChange(f);
              }}
              whileTap={reducedMotion ? undefined : { scale: 0.96, transition: springs.micro }}
              className={[
                "inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
                active
                  ? "bg-accent text-white border border-accent"
                  : "bg-card text-text-muted border border-border hover:text-text",
              ].join(" ")}
            >
              {FILTER_LABEL[f]}
            </m.button>
          );
        })}
      </div>
    </div>
  );
}
