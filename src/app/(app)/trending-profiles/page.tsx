"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useToast } from "@/components/ui/Toast";
import { useRoses } from "@/lib/useRoses";
import Link from "next/link";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface TrendingProfile {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  likes: number;
  mode: string;
  modeIcon: string;
  neighborhood: string;
}

// ─────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────

function photo(gender: "women" | "men", id: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

const MOCK_TRENDING: TrendingProfile[] = [
  { id: "tp1", name: "Marie", age: 26, photo: photo("women", 12), bio: "Photographe passionnee, cherche une ame creative pour explorer la nuit parisienne.", likes: 142, mode: "Night Owl", modeIcon: "\uD83E\uDD89", neighborhood: "Le Marais" },
  { id: "tp2", name: "Julien", age: 31, photo: photo("men", 55), bio: "Chef cuisinier, je fais les meilleures pates de Paris. A prouver ce soir.", likes: 128, mode: "Solo Diner", modeIcon: "\uD83C\uDF7D\uFE0F", neighborhood: "Bastille" },
  { id: "tp3", name: "Ines", age: 24, photo: photo("women", 77), bio: "Danseuse et DJ le weekend. La musique c'est la vie.", likes: 115, mode: "Night Owl", modeIcon: "\uD83E\uDD89", neighborhood: "Oberkampf" },
  { id: "tp4", name: "Antoine", age: 28, photo: photo("men", 33), bio: "Architecte le jour, musicien la nuit. Guitare acoustique dans les parcs.", likes: 98, mode: "Plus One", modeIcon: "\uD83C\uDFAB", neighborhood: "Canal Saint-Martin" },
  { id: "tp5", name: "Camille", age: 27, photo: photo("women", 48), bio: "Libraire au Quartier Latin. Un bon livre et un bon vin, c'est tout.", likes: 87, mode: "Solo Diner", modeIcon: "\uD83C\uDF7D\uFE0F", neighborhood: "Saint-Germain" },
  { id: "tp6", name: "Romain", age: 30, photo: photo("men", 18), bio: "Startup founder, mais ce soir je debranche. Qui veut un verre ?", likes: 76, mode: "Night Owl", modeIcon: "\uD83E\uDD89", neighborhood: "Pigalle" },
  { id: "tp7", name: "Lea", age: 25, photo: photo("women", 90), bio: "Comedienne au theatre. La vie est trop courte pour etre serieuse.", likes: 71, mode: "Plus One", modeIcon: "\uD83C\uDFAB", neighborhood: "Montmartre" },
  { id: "tp8", name: "Theo", age: 29, photo: photo("men", 42), bio: "Sommelier, je connais les meilleurs bars caches de Paris.", likes: 65, mode: "Solo Diner", modeIcon: "\uD83C\uDF7D\uFE0F", neighborhood: "Chatelet" },
  { id: "tp9", name: "Clara", age: 23, photo: photo("women", 62), bio: "Etudiante en art, toujours a la recherche d'inspiration nocturne.", likes: 58, mode: "Night Owl", modeIcon: "\uD83E\uDD89", neighborhood: "Belleville" },
  { id: "tp10", name: "Maxime", age: 32, photo: photo("men", 67), bio: "Pilote de ligne, en escale a Paris ce soir. Montrez-moi vos spots.", likes: 52, mode: "Traveler", modeIcon: "\u2708\uFE0F", neighborhood: "Opera" },
];

// ─────────────────────────────────────────
// Variants
// ─────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: (rank: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      ...springs.heavy,
      delay: rank * 0.06,
    },
  }),
};

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function TrendingProfilesPage() {
  const [roseSent, setRoseSent] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { roses, useRose, canAfford } = useRoses();

  const handleSendRose = (profile: TrendingProfile) => {
    if (roseSent.has(profile.id)) return;
    if (!canAfford(1)) {
      toast("Pas assez de Roses ! Visite la boutique.", "error");
      return;
    }
    const success = useRose(1, `Rose envoyee a ${profile.name}`);
    if (success) {
      setRoseSent((prev) => new Set(prev).add(profile.id));
      toast(`Rose envoyee a ${profile.name} !`, "success");
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-lg"
                aria-hidden="true"
              >
                {"\uD83D\uDD25"}
              </motion.span>
              <h1 className="text-base font-display font-bold text-text">Profils populaires ce soir</h1>
            </div>
            <Link href="/shop">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-[11px] font-semibold text-pink-400"
              >
                {"\uD83C\uDF39"} {roses}
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </header>

      {/* Top 3 podium */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-end justify-center gap-3">
          {MOCK_TRENDING.slice(0, 3).map((profile, i) => {
            const order = [1, 0, 2]; // center first (rank #1)
            const rank = order[i];
            const actual = MOCK_TRENDING[rank];
            const heights = [160, 130, 110];
            const sizes = [72, 60, 56];

            return (
              <motion.div
                key={actual.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.elastic, delay: i * 0.15 }}
                className="flex flex-col items-center"
                style={{ order: i }}
              >
                {/* Rank badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...springs.elastic, delay: 0.3 + i * 0.1 }}
                  className={`mb-2 ${rank === 0 ? "text-lg" : "text-sm"}`}
                >
                  {rank < 3 && (
                    <span className="text-lg" aria-hidden="true">{"\uD83D\uDD25"}</span>
                  )}
                </motion.div>

                {/* Avatar */}
                <div
                  className="relative rounded-full p-[3px]"
                  style={{
                    width: sizes[rank],
                    height: sizes[rank],
                    background:
                      rank === 0
                        ? "linear-gradient(135deg, #F59E0B, #EF4444, #8B5CF6)"
                        : rank === 1
                          ? "linear-gradient(135deg, #9CA3AF, #D1D5DB)"
                          : "linear-gradient(135deg, #CD7F32, #B87333)",
                  }}
                >
                  <img
                    src={actual.photo}
                    alt={actual.name}
                    className="w-full h-full rounded-full object-cover border-2 border-card"
                  />
                  {/* Rank number */}
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      background:
                        rank === 0 ? "#F59E0B" : rank === 1 ? "#9CA3AF" : "#CD7F32",
                    }}
                  >
                    {rank + 1}
                  </div>
                </div>

                {/* Name & likes */}
                <p className="text-xs font-bold text-text mt-2">{actual.name}</p>
                <p className="text-[10px] text-text-muted">
                  {actual.likes} likes
                </p>

                {/* Podium bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: heights[rank] - 80 }}
                  transition={{ ...springs.heavy, delay: 0.5 + i * 0.1 }}
                  className="w-16 rounded-t-xl mt-2"
                  style={{
                    background:
                      rank === 0
                        ? "linear-gradient(180deg, rgba(245,158,11,0.3), rgba(245,158,11,0.05))"
                        : rank === 1
                          ? "linear-gradient(180deg, rgba(156,163,175,0.2), rgba(156,163,175,0.05))"
                          : "linear-gradient(180deg, rgba(205,127,50,0.2), rgba(205,127,50,0.05))",
                    borderTop: `2px solid ${rank === 0 ? "#F59E0B" : rank === 1 ? "#9CA3AF" : "#CD7F32"}`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Ranked list */}
      <motion.div
        className="px-4 pt-4 space-y-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {MOCK_TRENDING.map((profile, i) => {
          const rank = i + 1;
          const isTop3 = rank <= 3;
          const isSent = roseSent.has(profile.id);

          return (
            <motion.div
              key={profile.id}
              custom={i}
              variants={rowVariants}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl hover:border-accent/20 transition-colors"
            >
              {/* Rank */}
              <div className="w-7 text-center shrink-0">
                {isTop3 ? (
                  <motion.span
                    animate={{
                      scale: [1, 1.15, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    className="text-sm"
                    aria-hidden="true"
                  >
                    {"\uD83D\uDD25"}
                  </motion.span>
                ) : (
                  <span className="text-sm font-bold text-text-muted">#{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                {isTop3 && (
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{
                      background: rank === 1 ? "#F59E0B" : rank === 2 ? "#9CA3AF" : "#CD7F32",
                    }}
                  >
                    {rank}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[13px] font-bold text-text truncate">
                    {profile.name}, {profile.age}
                  </h3>
                  <span className="text-[10px] text-text-muted shrink-0">{profile.modeIcon}</span>
                </div>
                <p className="text-[10px] text-text-muted truncate mt-0.5">{profile.bio}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-accent font-medium">{profile.likes} likes</span>
                  <span className="text-text-muted/40">{"\u00B7"}</span>
                  <span className="text-[10px] text-text-muted">{profile.neighborhood}</span>
                </div>
              </div>

              {/* Send Rose button */}
              <motion.button
                onClick={() => handleSendRose(profile)}
                disabled={isSent}
                whileHover={!isSent ? { scale: 1.1, boxShadow: "0 0 15px rgba(236,72,153,0.4)" } : {}}
                whileTap={!isSent ? { scale: 0.88 } : {}}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  isSent
                    ? "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                    : "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20"
                }`}
                aria-label={isSent ? "Rose envoyee" : `Envoyer une Rose a ${profile.name}`}
              >
                {isSent ? (
                  <span>{"\uD83C\uDF39"} Envoyee</span>
                ) : (
                  <span>{"\uD83C\uDF39"} Rose</span>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
