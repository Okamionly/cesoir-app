/**
 * MasteryStrip — Wave 17 (mig 046).
 *
 * Renders a horizontal strip of 4 mode chips on the user's profile.
 * Each chip shows:
 *   - Mode emoji + name
 *   - Current tier label ("Apprenti" / "Initié" / "Maître")
 *     OR a faded "—" when not yet at apprenti
 *   - Progress bar with `count/threshold` (e.g. "7/10") toward next tier
 *
 * Reuses MODES (definitions + colors), MASTERY_LABELS (i18n), and the
 * `useMasteryTiers` hook for the data.
 *
 * Empty state: when the user has 0 mutual IRL meets across all 4 modes,
 * we render a single coachmark line instead of 4 empty chips, since
 * showing "0/3" everywhere reads as "you've done nothing" — which is
 * truthful but bad onboarding UX.
 */
"use client";

import { m } from "motion/react";
import { MODES, MODE_KEYS } from "@/lib/modes";
import { MODE_COLORS } from "@/lib/mode-colors";
import {
  MASTERY_LABELS,
  useMasteryTiers,
  type MasteryProgress,
} from "@/lib/useMasteryTiers";
import { springs } from "@/lib/motion-design";

export interface MasteryStripProps {
  /** Optional className passthrough for layout tuning. */
  className?: string;
}

export default function MasteryStrip({ className = "" }: MasteryStripProps) {
  const { byMode, loading, topMastery } = useMasteryTiers();

  // Don't render anything during the initial fetch — avoids a flash of
  // "0/3" chips before the real counts arrive.
  if (loading) {
    return (
      <div
        className={`px-6 ${className}`}
        aria-busy="true"
        aria-label="Chargement de la maîtrise par mode"
      >
        <div className="bg-bg-card border border-border rounded-2xl h-[112px] animate-pulse" />
      </div>
    );
  }

  // No mastery anywhere → coachmark empty state. Still mounts the
  // section so the heading appears in the IA — keeps the table of
  // contents predictable.
  const hasAny = byMode.some((m) => m.count > 0);

  return (
    <section
      className={`px-6 ${className}`}
      aria-labelledby="mastery-label"
    >
      <h3
        id="mastery-label"
        className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-3.5"
      >
        Maîtrise par mode
        {topMastery && (
          <span className="ml-2 text-text-muted/70 normal-case tracking-normal font-normal">
            · top : {MODES[topMastery.mode].name} {MASTERY_LABELS[topMastery.tier!]}
          </span>
        )}
      </h3>

      {!hasAny ? (
        <p className="text-[12px] text-text-muted leading-relaxed bg-bg-card border border-border rounded-2xl px-4 py-3">
          Confirme tes premiers RDV IRL pour gagner ta première maîtrise — il en
          faut 3 dans le même mode pour passer Apprenti.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2" role="list">
          {MODE_KEYS.map((mode, i) => {
            const progress = byMode.find((p) => p.mode === mode)!;
            return (
              <m.li
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.05 + i * 0.04 }}
              >
                <MasteryChip progress={progress} />
              </m.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─────────────────────────────────────────
// Chip
// ─────────────────────────────────────────

function MasteryChip({ progress }: { progress: MasteryProgress }) {
  const def = MODES[progress.mode];
  const color = MODE_COLORS[progress.mode] ?? "#8B5CF6";
  const tierLabel = progress.tier ? MASTERY_LABELS[progress.tier] : null;
  const isMaxed = progress.tier === "maitre";

  return (
    <div
      className="rounded-2xl border bg-bg-card overflow-hidden transition-colors"
      style={{
        borderColor: progress.tier ? `${color}55` : "var(--color-border)",
        boxShadow: isMaxed ? `0 0 14px ${color}40` : undefined,
      }}
    >
      <div className="px-3 py-2.5">
        {/* Top row — emoji + mode name + tier */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[14px] leading-none" aria-hidden="true">
              {def.icon}
            </span>
            <span className="text-[12px] font-semibold text-text truncate">
              {def.name}
            </span>
          </div>
          {tierLabel ? (
            <span
              className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ color }}
              aria-label={`Tier ${tierLabel}`}
            >
              {tierLabel}
            </span>
          ) : (
            <span
              className="text-[10px] font-medium uppercase tracking-wider text-text-muted whitespace-nowrap"
              aria-label="Aucun tier atteint"
            >
              —
            </span>
          )}
        </div>

        {/* Progress bar + count label */}
        <div
          className="flex items-center gap-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.nextThreshold ?? progress.count}
          aria-valuenow={Math.min(progress.count, progress.nextThreshold ?? progress.count)}
          aria-label={`${def.name} ${progress.progressLabel}`}
        >
          <div
            className="h-1 flex-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.10)" }}
          >
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${Math.round(progress.progressFraction * 100)}%`,
                background: color,
              }}
            />
          </div>
          <span
            className="text-[10px] tabular-nums font-bold whitespace-nowrap"
            style={{ color: progress.tier ? color : "var(--color-text-muted)" }}
          >
            {progress.progressLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
