"use client";

import { useMemo, useState } from "react";
import { m, useReducedMotion, type Variants } from "motion/react";
import { MODES, MODE_KEYS } from "@/lib/modes";
import type { Profile } from "@/lib/mock-profiles";
import { useProfiles } from "@/lib/useProfiles";
import { useGeolocation } from "@/lib/useGeolocation";
import { MODE_ICONS } from "@/components/ui/Icons";
import { modesVariants } from "@/lib/motion-design";
import PageHeader from "@/components/ui/PageHeader";
import { ModeCard } from "@/components/app/ModeCard";

const containerVariants: Variants = modesVariants.grid;
const cardVariants: Variants = modesVariants.modeCard;

export default function ModesPage() {
  const reducedMotion = useReducedMotion();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Load all nearby profiles once, then group by mode client-side.
  const { latitude, longitude } = useGeolocation();
  const { profiles } = useProfiles(latitude ?? undefined, longitude ?? undefined);

  const { topUsersByMode, countsByMode } = useMemo(() => {
    const top: Record<string, Profile[]> = {};
    const counts: Record<string, number> = {};
    for (const key of MODE_KEYS) {
      const list = profiles.filter((p) => p.mode === key);
      counts[key] = list.length;
      top[key] = list.slice(0, 5);
    }
    return { topUsersByMode: top, countsByMode: counts };
  }, [profiles]);

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader
        title="Modes"
        subtitle="Choisis ton ambiance pour ce soir"
        icon={<span className="text-lg text-accent">☾</span>}
        iconAnimation="rotate"
        hairlineVariant="vert-violet"
      />

      <m.main
        className="px-4 pb-24 pt-4 space-y-2.5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-label="Liste des modes"
        onMouseLeave={() => setHoveredKey(null)}
      >
        {MODE_KEYS.map((key, index) => {
          const mode = MODES[key];
          const count = countsByMode[key] ?? 0;
          const Icon = MODE_ICONS[key];
          const topUsers = topUsersByMode[key] ?? [];

          return (
            <m.div
              key={key}
              variants={cardVariants}
              custom={index}
              animate={reducedMotion ? undefined : modesVariants.floatLoop(index)}
            >
              <ModeCard
                mode={mode}
                count={count}
                Icon={Icon}
                isHovered={hoveredKey === key}
                isAnyHovered={hoveredKey !== null}
                onHoverStart={() => setHoveredKey(key)}
                onHoverEnd={() =>
                  setHoveredKey((current) => (current === key ? null : current))
                }
                topUsers={topUsers}
              />
            </m.div>
          );
        })}
      </m.main>
    </div>
  );
}
