"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { leaderboardVariants, springs, micro } from "@/lib/motion-design";
import { supabase } from "@/lib/supabase";
import { Magnetic } from "@/components/motion/Magnetic";
import { RackFocus } from "@/components/motion/RackFocus";

interface LeaderEntry {
  rank: number;
  name: string;
  photo: string;
  meetups: number;
  karma: number;
}

interface LeaderboardRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  total_meetups: number | null;
  reliability_score: number | null;
  likes_received: number;
  conversations: number;
  karma: number;
}

function photo(gender: "women" | "men", id: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

const FALLBACK_LEADERBOARD: LeaderEntry[] = [
  { rank: 1, name: "Claire", photo: photo("women", 25), meetups: 42, karma: 4.9 },
  { rank: 2, name: "Thomas", photo: photo("men", 75), meetups: 38, karma: 4.8 },
  { rank: 3, name: "Priya", photo: photo("women", 64), meetups: 35, karma: 4.9 },
  { rank: 4, name: "Hugo", photo: photo("men", 41), meetups: 31, karma: 4.7 },
  { rank: 5, name: "Sarah", photo: photo("women", 44), meetups: 28, karma: 4.8 },
  { rank: 6, name: "Bastien", photo: photo("men", 47), meetups: 26, karma: 4.6 },
  { rank: 7, name: "Zoe", photo: photo("women", 19), meetups: 24, karma: 4.7 },
  { rank: 8, name: "Karim", photo: photo("men", 37), meetups: 22, karma: 4.9 },
  { rank: 9, name: "Lea", photo: photo("women", 42), meetups: 20, karma: 4.5 },
  { rank: 10, name: "Gabriel", photo: photo("men", 73), meetups: 19, karma: 4.6 },
  { rank: 11, name: "Ines", photo: photo("women", 52), meetups: 18, karma: 4.4 },
  { rank: 12, name: "Damien", photo: photo("men", 58), meetups: 17, karma: 4.5 },
  { rank: 13, name: "Manon", photo: photo("women", 57), meetups: 16, karma: 4.7 },
  { rank: 14, name: "Lucas", photo: photo("men", 24), meetups: 15, karma: 4.3 },
  { rank: 15, name: "Amandine", photo: photo("women", 47), meetups: 14, karma: 4.6 },
  { rank: 16, name: "Romain", photo: photo("men", 22), meetups: 13, karma: 4.4 },
  { rank: 17, name: "Elise", photo: photo("women", 31), meetups: 12, karma: 4.5 },
  { rank: 18, name: "Kevin", photo: photo("men", 29), meetups: 11, karma: 4.2 },
  { rank: 19, name: "Nina", photo: photo("women", 83), meetups: 10, karma: 4.3 },
  { rank: 20, name: "Axel", photo: photo("men", 39), meetups: 9, karma: 4.1 },
];

const MEDAL_COLORS: Record<number, string> = {
  1: "#F59E0B",
  2: "#C0C0C0",
  3: "#CD7F32",
};

const GLOW_SHADOWS: Record<number, string> = {
  1: "0 0 24px rgba(245,158,11,0.45)",
  2: "0 0 18px rgba(192,192,192,0.35)",
  3: "0 0 18px rgba(205,127,50,0.35)",
};

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"month" | "week" | "all">("month");
  const [entries, setEntries] = useState<LeaderEntry[]>(FALLBACK_LEADERBOARD);
  const [isReal, setIsReal] = useState(false);

  // Fetch live leaderboard rows; keep MOCK fallback when DB returns empty.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("leaderboard_view")
        .select("id, name, avatar_url, is_verified, total_meetups, reliability_score, likes_received, conversations, karma");
      if (cancelled || error || !data || data.length === 0) return;
      const rows = (data as LeaderboardRow[]).map((row, i) => ({
        rank: i + 1,
        name: row.name ?? "Anonyme",
        photo: row.avatar_url ?? photo(i % 2 === 0 ? "women" : "men", (i * 7) % 99),
        meetups: row.total_meetups ?? 0,
        karma: row.karma,
      }));
      setEntries(rows);
      setIsReal(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Tab is currently a UI affordance; same dataset for now (view is global).
  void tab;
  void isReal;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Defensive: avoid crashes when DB returns <3 rows.
  if (top3.length < 3) {
    while (top3.length < 3) {
      top3.push({
        rank: top3.length + 1,
        name: "—",
        photo: photo(top3.length % 2 === 0 ? "women" : "men", 30 + top3.length),
        meetups: 0,
        karma: 0,
      });
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="relative sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <RackFocus duration={0.5}>
          <div className="flex items-center gap-2 mb-0.5">
            <motion.span
              className="text-lg text-accent"
              aria-hidden="true"
              animate={{ rotate: [0, 5, -3, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              ☾
            </motion.span>
            <span className="text-base font-bold">Top CeSoir</span>
          </div>
          <p className="text-[11px] text-text-muted">Les rencontres reelles comptent</p>
        </RackFocus>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(245,158,11,0.4), rgba(139,92,246,0.4), transparent)",
          }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Tabs */}
        <div className="flex gap-1.5 mt-3" role="tablist" aria-label="Periode">
          {([
            { key: "month" as const, label: "Ce mois" },
            { key: "week" as const, label: "Cette semaine" },
            { key: "all" as const, label: "Tout temps" },
          ]).map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-full text-[11px] font-semibold transition-all tap-target ${
                tab === t.key
                  ? "gradient-bg text-white"
                  : "border border-border text-text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Podium */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-end justify-center gap-3">
          {/* 2nd place */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0, boxShadow: GLOW_SHADOWS[2] }}
            transition={{ ...springs.heavy, delay: 2 * 0.06 }}
          >
            <img src={top3[1].photo} alt={top3[1].name} loading="lazy" decoding="async" className="w-16 h-16 rounded-full object-cover border-3" style={{ borderColor: MEDAL_COLORS[2], borderWidth: 3 }} />
            <p className="text-[12px] font-bold text-text mt-1.5">{top3[1].name}</p>
            <motion.p
              key={`meetups-2-${top3[1].meetups}`}
              className="text-[10px] text-text-muted"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springs.snap}
            >{top3[1].meetups} meetups</motion.p>
            <div className="w-16 h-16 rounded-t-lg mt-2 flex items-center justify-center" style={{ background: `${MEDAL_COLORS[2]}20` }}>
              <span className="text-[20px] font-black" style={{ color: MEDAL_COLORS[2] }}>2</span>
            </div>
          </motion.div>

          {/* 1st place */}
          <motion.div
            className="flex flex-col items-center -mt-4"
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1, boxShadow: GLOW_SHADOWS[1] }}
            transition={{ ...springs.heavy, delay: 1 * 0.06 }}
          >
            <div className="relative">
              <img src={top3[0].photo} alt={top3[0].name} loading="lazy" decoding="async" className="w-20 h-20 rounded-full object-cover border-3" style={{ borderColor: MEDAL_COLORS[1], borderWidth: 3 }} />
              <motion.span
                className="absolute -top-2 -right-2 text-[18px]"
                animate={leaderboardVariants.crown.idle}
                aria-hidden="true"
              >
                👑
              </motion.span>
            </div>
            <p className="text-[13px] font-bold text-text mt-1.5">{top3[0].name}</p>
            <motion.p
              key={`meetups-1-${top3[0].meetups}`}
              className="text-[10px] text-accent font-semibold"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springs.snap}
            >{top3[0].meetups} meetups</motion.p>
            <div className="w-20 h-20 rounded-t-lg mt-2 flex items-center justify-center" style={{ background: `${MEDAL_COLORS[1]}20` }}>
              <span className="text-[24px] font-black" style={{ color: MEDAL_COLORS[1] }}>1</span>
            </div>
          </motion.div>

          {/* 3rd place */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0, boxShadow: GLOW_SHADOWS[3] }}
            transition={{ ...springs.heavy, delay: 3 * 0.06 }}
          >
            <img src={top3[2].photo} alt={top3[2].name} loading="lazy" decoding="async" className="w-16 h-16 rounded-full object-cover border-3" style={{ borderColor: MEDAL_COLORS[3], borderWidth: 3 }} />
            <p className="text-[12px] font-bold text-text mt-1.5">{top3[2].name}</p>
            <motion.p
              key={`meetups-3-${top3[2].meetups}`}
              className="text-[10px] text-text-muted"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springs.snap}
            >{top3[2].meetups} meetups</motion.p>
            <div className="w-16 h-12 rounded-t-lg mt-2 flex items-center justify-center" style={{ background: `${MEDAL_COLORS[3]}20` }}>
              <span className="text-[20px] font-black" style={{ color: MEDAL_COLORS[3] }}>3</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rest of list */}
      <motion.div
        className="px-4 pb-8"
        initial="hidden"
        animate="visible"
      >
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {rest.map(entry => (
            <motion.div
              key={entry.rank}
              variants={leaderboardVariants.row}
              custom={entry.rank}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -2, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", transition: springs.gentle }}
              whileTap={{ scale: 0.98, transition: springs.micro }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
            >
              <span className="w-6 text-[13px] font-bold text-text-muted text-center shrink-0">
                {entry.rank}
              </span>
              <img src={entry.photo} alt={entry.name} loading="lazy" decoding="async" className="w-9 h-9 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text truncate">{entry.name}</p>
                <p className="text-[10px] text-text-muted">{entry.meetups} rencontres</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[12px]" style={{ color: "#F59E0B" }} aria-hidden="true">★</span>
                <motion.span
                  key={`karma-${entry.rank}-${entry.karma}`}
                  className="text-[12px] font-semibold text-text-muted"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springs.snap}
                >
                  {entry.karma}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Your position */}
      <div className="fixed bottom-[76px] left-0 right-0 z-30 px-4 pb-2">
        <motion.div
          className="bg-bg border border-accent/20 rounded-2xl p-3 shadow-glow"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ ...springs.heavy, delay: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <span className="w-6 text-[13px] font-bold text-accent text-center">#47</span>
            <div className="w-9 h-9 rounded-full gradient-bg p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-[12px] font-bold text-accent">Y</div>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-text">Ta position</p>
              <p className="text-[10px] text-text-muted">3 rencontres ce mois</p>
            </div>
            <Link href="/browse" className="gradient-bg text-white px-3 py-1.5 rounded-full text-[10px] font-semibold tap-target">
              Monter
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
