"use client";

import { useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useProfileCompleteness } from "@/lib/useProfileCompleteness";
import type { CompletenessItem } from "@/lib/useProfileCompleteness";

// ─────────────────────────────────────────
// Bar fill color by percent
// ─────────────────────────────────────────

function barColor(percent: number): string {
  if (percent >= 80) return "var(--color-safe)";
  if (percent >= 50) return "#F59E0B";
  return "var(--color-accent)";
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

interface MissingItemProps {
  item: CompletenessItem;
  index: number;
}

function MissingItem({ item, index }: MissingItemProps) {
  return (
    <m.div
      key={item.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ ...springs.snap, delay: index * 0.04 }}
    >
      <Link
        href={item.href}
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-bg border border-border hover:border-border-dark/30 transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="shrink-0 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--color-accent)" }}
            aria-hidden="true"
          />
          <span className="text-[13px] font-medium text-text truncate">{item.label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-text-muted">+{item.weight}%</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-text-muted"
            aria-hidden="true"
          >
            <path
              d="M5 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Link>
    </m.div>
  );
}

// ─────────────────────────────────────────
// Success state
// ─────────────────────────────────────────

function SuccessState() {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.elastic}
      className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border"
      style={{
        background: "color-mix(in srgb, var(--color-safe) 8%, transparent)",
        borderColor: "color-mix(in srgb, var(--color-safe) 30%, transparent)",
      }}
      role="status"
      aria-label="Profil 100% complet"
    >
      <span className="text-[20px]" aria-hidden="true">+</span>
      <span
        className="text-[14px] font-semibold"
        style={{ color: "var(--color-safe)" }}
      >
        Profil parfait !
      </span>
    </m.div>
  );
}

// ─────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-2 rounded-full bg-bg-card w-full animate-pulse" />
      <div className="space-y-2">
        {[80, 65, 50].map((w) => (
          <div
            key={w}
            className="h-11 rounded-xl bg-bg-card animate-pulse"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export function ProfileCompleteness() {
  const { percent, missing, isComplete, loading } = useProfileCompleteness();

  // Auto-collapse list when already >= 80% complete
  const [open, setOpen] = useState(() => percent < 80);

  // Keep open state in sync if percent crosses threshold after load
  // (controlled via effect would add complexity — initial value is good enough)

  if (loading) {
    return (
      <div className="px-6 mb-6">
        <Skeleton />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="px-6 mb-6">
        <SuccessState />
      </div>
    );
  }

  const visibleMissing = missing.slice(0, 4);
  const color = barColor(percent);

  return (
    <m.section
      className="px-6 mb-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      aria-labelledby="completeness-heading"
    >
      {/* ── Header row ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between mb-2.5 gap-3 tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg"
        aria-expanded={open}
        aria-controls="completeness-list"
      >
        <span
          id="completeness-heading"
          className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em]"
        >
          Complétion du profil
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-[13px] font-bold tabular-nums"
            style={{ color }}
          >
            {percent}%
          </span>
          <m.svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-text-muted shrink-0"
            animate={{ rotate: open ? 90 : 0 }}
            transition={springs.snap}
            aria-hidden="true"
          >
            <path
              d="M5 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </m.svg>
        </div>
      </button>

      {/* ── Progress bar ── */}
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Profil complété à ${percent}%`}
        className="h-2 rounded-full bg-bg-card overflow-hidden mb-3"
      >
        <m.div
          className="h-full rounded-full origin-left"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ ...springs.gentle, delay: 0.1 }}
        />
      </div>

      {/* ── Expandable missing items ── */}
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id="completeness-list"
            key="list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ...springs.heavy, duration: 0.28 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-1">
              {visibleMissing.map((item, i) => (
                <MissingItem key={item.id} item={item} index={i} />
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.section>
  );
}
