"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { MODES } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";
import { squadVariants, springs, micro, ambient } from "@/lib/motion-design";

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

      {/* Container: staggerChildren 0.1, delayChildren 0.2 */}
      <motion.main
        className="px-4 pb-32 pt-4 space-y-3"
        variants={squadVariants.container}
        initial="hidden"
        animate="visible"
        aria-label="Liste des sorties de groupe"
      >
        {ACTIVITIES.map((activity, index) => {
          const isJoined = joined.has(activity.id);
          const fillPct = (activity.filled / activity.spots) * 100;
          const remaining = activity.spots - activity.filled;
          const modeData = MODES[activity.mode as keyof typeof MODES];
          const ModeIcon = MODE_ICONS[activity.mode];

          return (
            /* Squad member avatars: enter from random directions based on index */
            <motion.div
              key={activity.id}
              variants={squadVariants.member}
              custom={index}
            >
              {/* Group card: initial with springs.heavy */}
              <motion.div
                className="bg-bg-card border border-border rounded-2xl p-4 hover:border-accent/20 transition-colors"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={springs.heavy}
              >
                <div className="flex items-start gap-3 mb-3">
                  {/* Empty state illustration / emoji: ambient.float(5) gentle bobbing */}
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-[20px] shrink-0"
                    animate={ambient.float(5)}
                  >
                    {activity.emoji}
                  </motion.div>
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
                    {/* Member count badge: key-based animation so number springs when it changes */}
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={isJoined ? `${activity.id}-joined` : `${activity.id}-remaining`}
                        className="text-[10px] text-accent font-semibold"
                        initial={{ opacity: 0, y: -8, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.8 }}
                        transition={springs.snap}
                      >
                        {remaining} restante{remaining > 1 ? "s" : ""}
                      </motion.span>
                    </AnimatePresence>
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
                  {/* Activity indicators: ambient.breathe(3) for online dots */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {Array.from({ length: activity.filled }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-green-400"
                        animate={ambient.breathe(3)}
                      />
                    ))}
                    {Array.from({ length: remaining }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-2 h-2 rounded-full bg-border" />
                    ))}
                  </div>
                </div>

                {/* "Inviter" / Join button: whileHover scale:1.05 y:-2 with shadow, whileTap scale:0.92 springs.micro */}
                <motion.button
                  onClick={() => toggleJoin(activity.id)}
                  className={`w-full py-2.5 rounded-full text-[12px] font-semibold transition-all tap-target ${
                    isJoined
                      ? "gradient-bg text-white shadow-glow"
                      : "border border-accent text-accent hover:bg-accent/5"
                  }`}
                  whileHover={{
                    scale: 1.05,
                    y: -2,
                    boxShadow: "0 8px 25px rgba(139,92,246,0.25)",
                    transition: springs.gentle,
                  }}
                  whileTap={{ scale: 0.92, transition: springs.micro }}
                >
                  {isJoined ? "Rejoint ✓" : "Rejoindre"}
                </motion.button>
              </motion.div>
            </motion.div>
          );
        })}

        {/* Empty state illustration when no activities */}
        {ACTIVITIES.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            animate={ambient.float(5)}
          >
            <div className="text-6xl mb-4">🌙</div>
            <p className="text-text-muted text-sm">Aucune sortie pour le moment</p>
            <p className="text-text-muted text-xs mt-1">Cree la premiere !</p>
          </motion.div>
        )}
      </motion.main>

      {/* Floating action button — "Inviter" / Create */}
      <motion.div
        className="fixed bottom-24 right-4 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
      >
        <motion.button
          className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center shadow-glow tap-target"
          aria-label="Creer une sortie"
          whileHover={{
            scale: 1.05,
            y: -2,
            boxShadow: "0 8px 25px rgba(139,92,246,0.4)",
            transition: springs.gentle,
          }}
          whileTap={{ scale: 0.92, transition: springs.micro }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </motion.button>
        <span className="absolute -top-8 right-0 text-[10px] text-text-muted font-semibold bg-bg-card border border-border px-2 py-1 rounded-full whitespace-nowrap">
          Creer une sortie
        </span>
      </motion.div>
    </div>
  );
}
