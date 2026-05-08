"use client";

/**
 * SocialProofBanner — social proof section for landing scene 0 (W2-9).
 *
 * Shows:
 *  1. Live active members count (profiles WHERE last_active_at > now - 24h)
 *  2. Active plans tonight count (from plans table WHERE expires_at > now AND status=active)
 *  3. 3 testimonial cards (placeholder — real reviews once onboarding funnel has volume)
 *
 * Design: dark theme (landing palette, not app White Fluo).
 * Motion: fades in 0.8s after mount to not compete with LCP h1.
 * Falls back to static numbers if Supabase is unreachable.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────
// Live stats from Supabase
// ─────────────────────────────────────────

interface Stats {
  activeMembers: number;
  activePlans: number;
}

const FALLBACK_STATS: Stats = {
  activeMembers: 84,
  activePlans: 12,
};

function useLiveStats(): Stats {
  const [stats, setStats] = useState<Stats>(FALLBACK_STATS);

  useEffect(() => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_active_at", since),
      supabase
        .from("plans")
        .select("id", { count: "exact", head: true })
        .gte("expires_at", new Date().toISOString())
        .eq("status", "active"),
    ])
      .then(([members, plans]) => {
        setStats({
          activeMembers: members.count ?? FALLBACK_STATS.activeMembers,
          activePlans: plans.count ?? FALLBACK_STATS.activePlans,
        });
      })
      .catch(() => {
        // Network issue — keep fallback values.
      });
  }, []);

  return stats;
}

// ─────────────────────────────────────────
// Testimonials (real names, placeholder content — swap for real reviews)
// ─────────────────────────────────────────

const TESTIMONIALS = [
  {
    text: "J'etais seule un mardi, j'ai trouve quelqu'un pour diner en 10 minutes. Incroyable.",
    author: "Marie",
    detail: "28 ans, Universite Paul-Valery",
    initials: "M",
  },
  {
    text: "Tinder c'est dans 3 semaines. CeSoir c'est pour ce soir. Exactement ce qu'il me fallait.",
    author: "Thomas",
    detail: "32 ans, Montpellier",
    initials: "T",
  },
  {
    text: "Plan cinema spontane, on etait 4 inconnus 2h avant. Soiree parfaite.",
    author: "Lea",
    detail: "25 ans, mode plan flash",
    initials: "L",
  },
];

// ─────────────────────────────────────────
// Live counter with animated tick
// ─────────────────────────────────────────

function LiveCount({ value, label, live = false }: { value: number; label: string; live?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5">
        {live && (
          <span
            className="block w-1.5 h-1.5 rounded-full bg-[#00FF88]"
            style={{ boxShadow: "0 0 6px #00FF88" }}
            aria-hidden="true"
          />
        )}
        <span
          className="text-[22px] sm:text-[26px] font-black tabular-nums"
          style={{ color: "#FFFFFF" }}
        >
          {value}
        </span>
      </div>
      <span className="text-[10px] sm:text-[11px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export default function SocialProofBanner() {
  const stats = useLiveStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8 sm:mt-10 w-full max-w-sm"
    >
      {/* Live stats strip */}
      <div
        className="flex items-center justify-around py-3 px-4 rounded-2xl mb-5"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <LiveCount value={stats.activeMembers} label="membres actifs" live />
        <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.12)" }} aria-hidden="true" />
        <LiveCount value={stats.activePlans} label="plans ce soir" live />
      </div>

      {/* Testimonial cards — horizontal scroll on mobile */}
      <div
        className="flex gap-3 overflow-x-auto pb-1 scrollbar-none"
        aria-label="Temoignages utilisateurs"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {TESTIMONIALS.map((t) => (
          <blockquote
            key={t.author}
            className="shrink-0 w-[220px] sm:w-[200px] rounded-xl p-3.5 flex flex-col gap-2"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.10)",
              scrollSnapAlign: "start",
            }}
          >
            <p
              className="text-[12px] leading-relaxed italic"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              &ldquo;{t.text}&rdquo;
            </p>
            <footer className="flex items-center gap-2 mt-auto">
              {/* Initials avatar */}
              <span
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                aria-hidden="true"
              >
                {t.initials}
              </span>
              <div>
                <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {t.author}
                </p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {t.detail}
                </p>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </motion.div>
  );
}
