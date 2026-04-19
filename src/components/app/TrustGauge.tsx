"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { springs } from "@/lib/motion-design";
import {
  DEFAULT_TRUST_BREAKDOWN,
  getTrustScoreColor,
  getTrustScoreGradient,
  type TrustBreakdownItem,
} from "@/lib/trust-colors";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type BreakdownItem = TrustBreakdownItem;

interface TrustGaugeProps {
  /** Trust score 0-100 */
  score: number;
  /** Optional breakdown for arc segments */
  breakdown?: BreakdownItem[];
  /** Size in px (default 200) */
  size?: number;
}

const DEFAULT_BREAKDOWN = DEFAULT_TRUST_BREAKDOWN;
const getScoreColor = getTrustScoreColor;
const getScoreGradient = getTrustScoreGradient;

// ─────────────────────────────────────────
// Animated counter hook
// ─────────────────────────────────────────

function useAnimatedCounter(target: number, delay: number = 0.3): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1200;
      const startTime = performance.now();

      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [target, delay]);

  return display;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function TrustGauge({
  score,
  breakdown = DEFAULT_BREAKDOWN,
  size = 200,
}: TrustGaugeProps) {
  const displayScore = useAnimatedCounter(score, 0.4);
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const strokeWidth = 10;
  const bgStrokeWidth = 6;

  // Main arc progress
  const progress = score / 100;
  const mainOffset = circumference * (1 - progress);

  // Score colors
  const scoreColor = getScoreColor(score);
  const [gradStart, gradEnd] = getScoreGradient(score);

  // Breakdown arcs (inner ring, smaller)
  const innerRadius = radius - 18;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const totalMaxPoints = breakdown.reduce((sum, b) => sum + b.maxPoints, 0);

  // Calculate breakdown arc positions
  let arcOffset = 0;
  const breakdownArcs = breakdown.map((item) => {
    const segmentLength = (item.maxPoints / totalMaxPoints) * innerCircumference;
    const filledLength = (item.points / item.maxPoints) * segmentLength;
    const gap = 4; // gap between segments
    const arc = {
      ...item,
      offset: arcOffset,
      segmentLength: segmentLength - gap,
      filledLength: Math.max(filledLength - gap, 0),
    };
    arcOffset += segmentLength;
    return arc;
  });

  // Label
  const label =
    score >= 80
      ? "Excellent"
      : score >= 60
        ? "Bon"
        : score >= 40
          ? "En progression"
          : "A ameliorer";

  const gradientId = `trust-gauge-gradient-${size}`;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG Gauge */}
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score de confiance: ${score} sur 100 - ${label}`}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradStart} />
              <stop offset="100%" stopColor={gradEnd} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-white/8"
            strokeWidth={bgStrokeWidth}
          />

          {/* Main progress arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: mainOffset }}
            transition={springs.cinematic}
          />

          {/* Inner breakdown ring - background */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="none"
            stroke="currentColor"
            className="text-white/5"
            strokeWidth={4}
          />

          {/* Inner breakdown arcs */}
          {breakdownArcs.map((arc) => (
            <motion.circle
              key={arc.label}
              cx={center}
              cy={center}
              r={innerRadius}
              fill="none"
              stroke={arc.color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${arc.filledLength} ${innerCircumference - arc.filledLength}`}
              strokeDashoffset={-arc.offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: arc.filledLength > 0 ? 0.7 : 0.15 }}
              transition={{ ...springs.cinematic, delay: 0.6 }}
            />
          ))}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.elastic, delay: 0.3 }}
            className="text-5xl font-black font-display"
            style={{ color: scoreColor }}
          >
            {displayScore}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.heavy, delay: 0.5 }}
            className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-1"
          >
            {label}
          </motion.span>
        </div>
      </div>

      {/* Breakdown legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.7 }}
        className="w-full max-w-xs space-y-2"
      >
        {breakdown.map((item, i) => {
          const pct = item.maxPoints > 0 ? (item.points / item.maxPoints) * 100 : 0;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.heavy, delay: 0.8 + i * 0.08 }}
              className="flex items-center gap-3"
            >
              {/* Color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              {/* Label + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-medium text-text truncate">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-semibold text-text-muted ml-2">
                    {item.points}/{item.maxPoints}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ ...springs.cinematic, delay: 1 + i * 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
