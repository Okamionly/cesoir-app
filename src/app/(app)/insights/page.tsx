"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────

const MONTHS = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

/** Activity heatmap: 28 days, values 0-4 */
const HEATMAP_DATA: number[] = [
  0, 1, 2, 0, 3, 1, 0,
  1, 2, 4, 3, 1, 0, 0,
  2, 3, 1, 4, 2, 1, 0,
  0, 1, 3, 2, 4, 3, 2,
];

const HEATMAP_COLORS: Record<number, string> = {
  0: "rgba(139,92,246,0.06)",
  1: "rgba(139,92,246,0.2)",
  2: "rgba(139,92,246,0.4)",
  3: "rgba(139,92,246,0.7)",
  4: "rgba(0,255,136,0.8)",
};

const STATS = [
  { label: "Soirees ce mois", value: "14", trend: "+12%", up: true },
  { label: "Matchs", value: "23", trend: null, up: false },
  { label: "Messages envoyes", value: "187", trend: null, up: false },
  { label: "Taux de reponse", value: "78%", trend: null, up: false, circular: 0.78 },
  { label: "Temps moyen avant RDV", value: "1h45", trend: null, up: false },
];

const MODE_BREAKDOWN = [
  { label: "Solo Diner", pct: 35, color: "#a855f7" },
  { label: "Night Owl", pct: 25, color: "#6366f1" },
  { label: "Plus-One", pct: 20, color: "#ec4899" },
  { label: "Culture Club", pct: 12, color: "#7c3aed" },
  { label: "Autre", pct: 8, color: "#9CA3AF" },
];

const PEAK_HOURS = [
  { hour: "18h", level: 25 },
  { hour: "19h", level: 45 },
  { hour: "20h", level: 80 },
  { hour: "21h", level: 100 },
  { hour: "22h", level: 70 },
  { hour: "23h", level: 40 },
  { hour: "00h", level: 15 },
];

const PROFILE_ATTRACT = {
  ageRange: "24-30 ans",
  topMode: "Solo Diner",
  avgRating: 4.6,
};

// ─────────────────────────────────────────
// DONUT CHART (pure SVG)
// ─────────────────────────────────────────

function DonutChart({ segments }: { segments: typeof MODE_BREAKDOWN }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <svg viewBox="0 0 160 160" className="w-40 h-40 mx-auto" aria-label="Repartition des modes">
      {segments.map((seg, i) => {
        const segLength = (seg.pct / 100) * circumference;
        const offset = cumulativeOffset;
        cumulativeOffset += segLength;

        return (
          <motion.circle
            key={seg.label}
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${segLength} ${circumference - segLength}`}
            strokeDashoffset={-offset}
            style={{ transformOrigin: "center" }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: -offset }}
            transition={{
              ...springs.cinematic,
              delay: 0.6 + i * 0.15,
            }}
          />
        );
      })}
      {/* Center label */}
      <text x="80" y="76" textAnchor="middle" className="fill-text text-[22px] font-black" fontFamily="var(--font-display)">
        5
      </text>
      <text x="80" y="94" textAnchor="middle" className="fill-text-muted text-[10px]">
        modes
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────
// CIRCULAR PROGRESS (for taux de reponse)
// ─────────────────────────────────────────

function CircularProgress({ pct }: { pct: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const filled = pct * circ;

  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90" aria-label={`${Math.round(pct * 100)}%`}>
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="3.5" />
      <motion.circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ ...springs.cinematic, delay: 0.8 }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default function InsightsPage() {
  const now = new Date();
  const [monthIdx, setMonthIdx] = useState(now.getMonth());

  const peakMax = Math.max(...PEAK_HOURS.map((h) => h.level));
  const peakHourEntry = PEAK_HOURS.find((h) => h.level === peakMax);

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-safe">
      {/* ── HEADER ── */}
      <motion.header
        className="px-5 pt-6 pb-4 flex items-center justify-between"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.heavy}
      >
        <div>
          <h1 className="text-[22px] font-black text-text font-display">Mes Insights</h1>
          <p className="text-[13px] text-text-muted mt-0.5">Ton activite en un coup d'oeil</p>
        </div>
        {/* Month selector */}
        <select
          value={monthIdx}
          onChange={(e) => setMonthIdx(Number(e.target.value))}
          className="text-[12px] font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 tap-target appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Selectionner le mois"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
      </motion.header>

      {/* ── SECTION 1: HEATMAP ── */}
      <motion.section
        className="px-5 mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.1 }}
      >
        <h2 className="text-[15px] font-bold text-text mb-3">Activite</h2>

        {/* 4 weeks x 7 days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {HEATMAP_DATA.map((level, i) => (
            <motion.div
              key={i}
              className="aspect-square rounded-[6px]"
              style={{ background: HEATMAP_COLORS[level] }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                ...springs.snap,
                delay: i * 0.01,
              }}
              aria-label={`Jour ${i + 1}: niveau ${level}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-text-muted">Peu actif</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="w-3 h-3 rounded-[3px]"
              style={{ background: HEATMAP_COLORS[level] }}
            />
          ))}
          <span className="text-[10px] text-text-muted">Tres actif</span>
        </div>
      </motion.section>

      {/* ── SECTION 2: STATS CARDS ── */}
      <motion.section
        className="mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.2 }}
      >
        <h2 className="text-[15px] font-bold text-text mb-3 px-5">Ce mois-ci</h2>

        <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="shrink-0 min-w-[130px] p-4 rounded-2xl border border-border bg-bg-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.heavy, delay: 0.3 + i * 0.08 }}
            >
              <p className="text-[10px] text-text-muted font-medium mb-1.5 leading-tight">{stat.label}</p>

              <div className="flex items-center gap-2">
                {stat.circular != null ? (
                  <CircularProgress pct={stat.circular} />
                ) : null}

                <div>
                  <p className="text-[22px] font-black text-text leading-none">{stat.value}</p>
                  {stat.trend && (
                    <span
                      className={`text-[10px] font-semibold ${stat.up ? "text-safe" : "text-danger"}`}
                    >
                      {stat.up ? "\u2191" : "\u2193"}{stat.trend}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 3: MODE BREAKDOWN ── */}
      <motion.section
        className="px-5 mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.35 }}
      >
        <h2 className="text-[15px] font-bold text-text mb-4">Repartition des modes</h2>

        <div className="flex items-center gap-6">
          {/* Donut */}
          <DonutChart segments={MODE_BREAKDOWN} />

          {/* Legend */}
          <div className="flex flex-col gap-2 flex-1">
            {MODE_BREAKDOWN.map((seg, i) => (
              <motion.div
                key={seg.label}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.heavy, delay: 0.7 + i * 0.06 }}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                <span className="text-[11px] text-text truncate flex-1">{seg.label}</span>
                <span className="text-[11px] font-bold text-text-muted">{seg.pct}%</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 4: PEAK HOURS ── */}
      <motion.section
        className="px-5 mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.5 }}
      >
        <h2 className="text-[15px] font-bold text-text mb-4">Heures de pointe</h2>

        <div className="flex flex-col gap-2.5">
          {PEAK_HOURS.map((entry, i) => {
            const isPeak = entry.level === peakMax;
            return (
              <div key={entry.hour} className="flex items-center gap-3">
                <span
                  className={`w-8 text-right text-[12px] font-semibold shrink-0 ${
                    isPeak ? "text-accent" : "text-text-muted"
                  }`}
                >
                  {entry.hour}
                </span>

                <div className="flex-1 h-6 rounded-full bg-border/40 overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: isPeak
                        ? "linear-gradient(90deg, #8B5CF6, #00FF88)"
                        : "rgba(139,92,246,0.4)",
                      transformOrigin: "left",
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: entry.level / 100 }}
                    transition={{
                      ...springs.heavy,
                      delay: 0.6 + i * 0.06,
                    }}
                  />
                  {isPeak && (
                    <motion.span
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      Peak
                    </motion.span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ── SECTION 5: TON PROFIL ATTIRE ── */}
      <motion.section
        className="px-5 mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.65 }}
      >
        <h2 className="text-[15px] font-bold text-text mb-3">Ton profil attire</h2>

        <div className="grid grid-cols-3 gap-3">
          {/* Age range */}
          <motion.div
            className="p-4 rounded-2xl border border-accent/20 bg-accent/5 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.elastic, delay: 0.75 }}
          >
            <p className="text-[20px] mb-1" aria-hidden="true">
              {"\uD83C\uDFAF"}
            </p>
            <p className="text-[16px] font-black text-text leading-tight">{PROFILE_ATTRACT.ageRange}</p>
            <p className="text-[9px] text-text-muted mt-1">Tranche d'age</p>
          </motion.div>

          {/* Top mode */}
          <motion.div
            className="p-4 rounded-2xl border border-accent/20 bg-accent/5 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.elastic, delay: 0.85 }}
          >
            <p className="text-[20px] mb-1" aria-hidden="true">
              {"\uD83C\uDF7D\uFE0F"}
            </p>
            <p className="text-[14px] font-black text-text leading-tight">{PROFILE_ATTRACT.topMode}</p>
            <p className="text-[9px] text-text-muted mt-1">Mode prefere</p>
          </motion.div>

          {/* Rating */}
          <motion.div
            className="p-4 rounded-2xl border border-accent/20 bg-accent/5 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.elastic, delay: 0.95 }}
          >
            <p className="text-[20px] mb-1" aria-hidden="true">
              {"\u2B50"}
            </p>
            <p className="text-[22px] font-black gradient-text leading-tight">{PROFILE_ATTRACT.avgRating}</p>
            <p className="text-[9px] text-text-muted mt-1">Note moyenne</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Bottom spacer for nav */}
      <div className="h-4" />
    </div>
  );
}
