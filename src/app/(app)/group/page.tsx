"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { MODES } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";

interface GroupActivity {
  id: string;
  title: string;
  spots: number;
  filled: number;
  location: string;
  time: string;
  mode: string;
  emoji: string;
}

const ACTIVITIES: GroupActivity[] = [
  { id: "1", title: "Escape Game ce soir", spots: 4, filled: 2, location: "Bastille", time: "20h", mode: "gamer-night", emoji: "🔐" },
  { id: "2", title: "Bar crawl Marais", spots: 5, filled: 3, location: "Le Marais", time: "21h", mode: "night-owl", emoji: "🍻" },
  { id: "3", title: "Diner japonais", spots: 6, filled: 4, location: "Belleville", time: "19h30", mode: "solo-diner", emoji: "🍣" },
  { id: "4", title: "Course a pied 8km", spots: 8, filled: 5, location: "Luxembourg", time: "19h", mode: "fit-date", emoji: "🏃" },
  { id: "5", title: "Soiree board games", spots: 6, filled: 2, location: "Oberkampf", time: "20h30", mode: "gamer-night", emoji: "🎲" },
  { id: "6", title: "Expo + verre apres", spots: 4, filled: 3, location: "Chatelet", time: "18h30", mode: "culture-club", emoji: "🎨" },
  { id: "7", title: "Cours de cuisine thai", spots: 8, filled: 6, location: "11e", time: "19h", mode: "foodie-quest", emoji: "🍜" },
  { id: "8", title: "Karaoke night", spots: 10, filled: 4, location: "Grands Boulevards", time: "21h30", mode: "night-owl", emoji: "🎤" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

export default function GroupPage() {
  const [joined, setJoined] = useState<Set<string>>(new Set());

  const toggleJoin = (id: string) => {
    setJoined(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg text-accent" aria-hidden="true">☾</span>
            <span className="text-base font-bold">Sorties de groupe</span>
          </div>
          <p className="text-[11px] text-text-muted">Rejoins une sortie ou cree la tienne</p>
        </motion.div>
      </header>

      <motion.main
        className="px-4 pb-32 pt-4 space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-label="Liste des sorties de groupe"
      >
        {ACTIVITIES.map(activity => {
          const isJoined = joined.has(activity.id);
          const fillPct = (activity.filled / activity.spots) * 100;
          const remaining = activity.spots - activity.filled;
          const modeData = MODES[activity.mode as keyof typeof MODES];
          const ModeIcon = MODE_ICONS[activity.mode];

          return (
            <motion.div key={activity.id} variants={cardVariants}>
              <div className="bg-bg-card border border-border rounded-2xl p-4 hover:border-accent/20 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-[20px] shrink-0">
                    {activity.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-text">{activity.title}</h3>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      {activity.location} · {activity.time}
                    </p>
                  </div>
                  {modeData && (
                    <span className="flex items-center gap-1 bg-accent/10 border border-accent/15 px-2 py-0.5 rounded-full shrink-0">
                      {ModeIcon && <ModeIcon size={10} className="text-accent" />}
                      <span className="text-[9px] text-accent font-semibold">{modeData.name}</span>
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-text-muted">
                      {activity.filled}/{activity.spots} places
                    </span>
                    <span className="text-[10px] text-accent font-semibold">
                      {remaining} restante{remaining > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <motion.button
                  onClick={() => toggleJoin(activity.id)}
                  className={`w-full py-2.5 rounded-full text-[12px] font-semibold transition-all tap-target ${
                    isJoined
                      ? "gradient-bg text-white shadow-glow"
                      : "border border-accent text-accent hover:bg-accent/5"
                  }`}
                  whileTap={{ scale: 0.96 }}
                >
                  {isJoined ? "Rejoint ✓" : "Rejoindre"}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </motion.main>

      {/* Floating action button */}
      <motion.div
        className="fixed bottom-24 right-4 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
      >
        <button
          className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center shadow-glow tap-target"
          aria-label="Creer une sortie"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <span className="absolute -top-8 right-0 text-[10px] text-text-muted font-semibold bg-bg-card border border-border px-2 py-1 rounded-full whitespace-nowrap">
          Creer une sortie
        </span>
      </motion.div>
    </div>
  );
}
