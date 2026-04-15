"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { timelineVariants, springs } from "@/lib/motion-design";
import Link from "next/link";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type TimelineEntryType =
  | "soiree"
  | "match"
  | "badge"
  | "level"
  | "event"
  | "review"
  | "streak";

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  date: string;
  title: string;
  subtitle?: string;
  /** Optional photo URL placeholder */
  photo?: string;
  /** Extra detail shown on expand */
  detail?: string;
  /** For soiree entries: link to memories */
  memoryLink?: string;
  /** Optional venue name */
  venue?: string;
  /** For reviews */
  rating?: number;
  /** For streaks / levels */
  count?: number;
}

// ─────────────────────────────────────────
// Entry config per type
// ─────────────────────────────────────────

const ENTRY_CONFIG: Record<
  TimelineEntryType,
  { icon: string; color: string; dotBg: string }
> = {
  soiree: { icon: "\uD83C\uDF19", color: "#8B5CF6", dotBg: "rgba(139,92,246,0.25)" },
  match: { icon: "\uD83D\uDC9C", color: "#c084fc", dotBg: "rgba(192,132,252,0.25)" },
  badge: { icon: "\uD83C\uDFC6", color: "#f59e0b", dotBg: "rgba(245,158,11,0.25)" },
  level: { icon: "\u2B50", color: "#00FF88", dotBg: "rgba(0,255,136,0.25)" },
  event: { icon: "\uD83D\uDCC5", color: "#f59e0b", dotBg: "rgba(245,158,11,0.25)" },
  review: { icon: "\u2B50", color: "#facc15", dotBg: "rgba(250,204,21,0.25)" },
  streak: { icon: "\uD83D\uDD25", color: "#ef4444", dotBg: "rgba(239,68,68,0.25)" },
};

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

interface TimelineCardProps {
  entry: TimelineEntry;
  index: number;
  side: "left" | "right";
}

export default function TimelineCard({ entry, index, side }: TimelineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = ENTRY_CONFIG[entry.type];
  const cardVariant = side === "left" ? timelineVariants.cardLeft : timelineVariants.cardRight;

  return (
    <div
      className={`relative flex items-start gap-0 ${
        side === "left" ? "flex-row" : "flex-row-reverse"
      }`}
      role="listitem"
      aria-label={`${entry.date}: ${entry.title}`}
    >
      {/* ── Card ── */}
      <motion.button
        variants={cardVariant}
        custom={index}
        onClick={() => setExpanded((prev) => !prev)}
        className={`flex-1 rounded-2xl border border-border bg-bg-card p-3.5 text-left transition-colors hover:border-[${config.color}]/30 ${
          side === "left" ? "mr-4" : "ml-4"
        }`}
        whileTap={{ scale: 0.97, transition: springs.micro }}
        aria-expanded={expanded}
      >
        {/* Header row */}
        <div className="flex items-center gap-2.5 mb-1">
          {/* Icon bubble */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[16px]"
            style={{ background: config.dotBg }}
            aria-hidden="true"
          >
            {config.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-[13px] leading-tight truncate">
              {entry.title}
            </p>
            {entry.subtitle && (
              <p className="text-text-muted text-[11px] truncate">
                {entry.subtitle}
              </p>
            )}
          </div>
          {/* Chevron */}
          <motion.svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            className="text-text-muted shrink-0"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={springs.snap}
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </div>

        {/* Optional photo */}
        {entry.photo && (
          <div
            className="w-full h-20 rounded-lg mt-2 bg-border/30 overflow-hidden"
            style={{
              backgroundImage: `url(${entry.photo})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}

        {/* Expandable details */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              variants={timelineVariants.expand}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="overflow-hidden"
            >
              <div className="pt-2.5 mt-2.5 border-t border-border">
                {entry.venue && (
                  <p className="text-text-muted text-[12px] mb-1.5">
                    <span className="text-white font-medium">Lieu:</span>{" "}
                    {entry.venue}
                  </p>
                )}
                {entry.rating !== undefined && (
                  <div className="flex items-center gap-1 mb-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className="text-[14px]"
                        style={{
                          opacity: i < entry.rating! ? 1 : 0.25,
                        }}
                      >
                        {"\u2B50"}
                      </span>
                    ))}
                    <span className="text-white text-[12px] font-semibold ml-1">
                      {entry.rating}/5
                    </span>
                  </div>
                )}
                {entry.detail && (
                  <p className="text-text-muted text-[12px] leading-relaxed">
                    {entry.detail}
                  </p>
                )}
                {entry.type === "soiree" && entry.memoryLink && (
                  <Link
                    href={entry.memoryLink}
                    className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                    style={{
                      background: "rgba(139,92,246,0.15)",
                      color: "#8B5CF6",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    Revivre ce moment
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Date label on the line ── */}
      <div className="flex flex-col items-center shrink-0 w-14">
        {/* Dot */}
        <motion.div
          variants={timelineVariants.dot}
          custom={index}
          className="w-3.5 h-3.5 rounded-full border-2 z-10"
          style={{
            borderColor: config.color,
            backgroundColor: config.dotBg,
          }}
        />
        {/* Date text */}
        <span className="text-text-muted text-[9px] font-medium mt-1 text-center leading-tight whitespace-nowrap">
          {entry.date}
        </span>
      </div>
    </div>
  );
}
