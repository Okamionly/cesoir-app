"use client";

import { useMemo, useState } from "react";
import { m, useReducedMotion, type Variants } from "motion/react";
import { MODES, MODE_KEYS } from "@/lib/modes";
import type { Profile } from "@/lib/mock-profiles";
import { useProfiles } from "@/lib/useProfiles";
import { useGeolocation } from "@/lib/useGeolocation";
import { useModeCounts } from "@/lib/useModeCounts";
import { MODE_ICONS } from "@/components/ui/Icons";
import { modesVariants } from "@/lib/motion-design";
import PageHeader from "@/components/ui/PageHeader";
import { ModeCard } from "@/components/app/ModeCard";
import { SkeletonModesGrid } from "@/components/ui/skeletons";

const containerVariants: Variants = modesVariants.grid;
const cardVariants: Variants = modesVariants.modeCard;

export default function ModesPage() {
  const reducedMotion = useReducedMotion();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Load all nearby profiles once for card avatars (top-5 preview).
  const { latitude, longitude } = useGeolocation();
  const { profiles } = useProfiles(latitude ?? undefined, longitude ?? undefined);

  // Counts come from `mode_activations` (deduplicated per user/mode) so
  // desktop + mobile + refresh always show the same numbers, regardless
  // of the radius/age/limit filters applied to `useProfiles`.
  const { counts: countsByMode, loading: countsLoading } = useModeCounts();

  const topUsersByMode = useMemo(() => {
    const top: Record<string, Profile[]> = {};
    for (const key of MODE_KEYS) {
      top[key] = profiles.filter((p) => p.mode === key).slice(0, 5);
    }
    return top;
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

      {countsLoading && profiles.length === 0 ? (
        <div className="px-4 pb-24 pt-4">
          <SkeletonModesGrid count={MODE_KEYS.length} />
        </div>
      ) : (
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
      )}
    </div>
  );
}
