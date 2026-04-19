"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { challengeVariants, springs } from "@/lib/motion-design";
import Link from "next/link";
import { Magnetic } from "@/components/motion/Magnetic";
import { RackFocus } from "@/components/motion/RackFocus";
import { useChallenges } from "@/lib/useChallenges";

interface DailyChallenge {
  id: string;
  title: string;
  type: "progress" | "checkbox";
  current: number;
  target: number;
  xp: number;
  done: boolean;
}

interface WeeklyChallenge {
  title: string;
  current: number;
  target: number;
  xp: number;
}

const DAILY_CHALLENGES: DailyChallenge[] = [
  { id: "d1", title: "Dis oui a 3 plans", type: "progress", current: 1, target: 3, xp: 30, done: false },
  { id: "d2", title: "Envoie le premier message", type: "checkbox", current: 0, target: 1, xp: 20, done: false },
  { id: "d3", title: "Explore un nouveau mode", type: "checkbox", current: 0, target: 1, xp: 25, done: false },
];

const WEEKLY_CHALLENGE: WeeklyChallenge = {
  title: "5 soirees cette semaine",
  current: 2,
  target: 5,
  xp: 100,
};

/* Animation variants imported from @/lib/motion-design (challengeVariants) */

function useCountdown(): string {
  const [label, setLabel] = useState("...");

  useEffect(() => {
    function compute() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = Math.max(0, tomorrow.getTime() - now.getTime());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setLabel(`${h}h${m.toString().padStart(2, "0")}`);
    }
    compute();
    const interval = setInterval(compute, 60_000);
    return () => clearInterval(interval);
  }, []);

  return label;
}

export default function ChallengesPage() {
  const { challenges: dbChallenges, totalXpToday: dbXp, completeChallenge } = useChallenges();
  const [localChallenges, setLocalChallenges] = useState(DAILY_CHALLENGES);
  const countdown = useCountdown();

  // Map DB rows to UI shape, fallback to static when empty
  const challenges = useMemo(() => {
    if (dbChallenges.length === 0) return localChallenges;
    return dbChallenges.map((c, i) => ({
      id: c.id,
      title: c.challengeType,
      type: (c.total === 1 ? "checkbox" : "progress") as "progress" | "checkbox",
      current: c.progress,
      target: c.total,
      xp: c.xpEarned || 20 + i * 5,
      done: c.completed,
    }));
  }, [dbChallenges, localChallenges]);

  const totalXpToday = dbChallenges.length > 0
    ? dbXp
    : localChallenges.filter((c) => c.done).reduce((sum, c) => sum + c.xp, 0) + 45;

  const toggleChallenge = (id: string) => {
    // DB-backed
    const dbMatch = dbChallenges.find((c) => c.id === id);
    if (dbMatch && !dbMatch.completed) {
      void completeChallenge(id);
      return;
    }
    // Local fallback
    setLocalChallenges((prev) =>
      prev.map((c) =>
        c.id === id && c.type === "checkbox"
          ? { ...c, done: !c.done, current: c.done ? 0 : 1 }
          : c,
      ),
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      {/* Header — flame pulse + Magnetic back */}
      <div className="flex items-center gap-3 mb-6">
        <Magnetic strength={0.2} radius={50}>
          <Link
            href="/feed"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-bg-card hover:border hover:border-accent/40 transition-all"
            aria-label="Retour"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </Link>
        </Magnetic>
        <RackFocus duration={0.5}>
          <div className="flex items-center gap-2">
            <h1
              className="text-white font-bold text-[22px]"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
            >
              Defis du jour
            </h1>
            <motion.div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.2)" }}
              aria-hidden="true"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(239,68,68,0)",
                  "0 0 12px rgba(239,68,68,0.5)",
                  "0 0 0px rgba(239,68,68,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444">
                <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
              </svg>
            </motion.div>
          </div>
        </RackFocus>
      </div>

      {/* XP today */}
      <motion.div
        className="rounded-2xl p-4 mb-6"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,255,136,0.1))",
          border: "1px solid rgba(139,92,246,0.3)",
        }}
        initial={{ opacity: 0, x: -30, skewX: -2 }}
        animate={{ opacity: 1, x: 0, skewX: 0 }}
        transition={springs.heavy}
        role="status"
        aria-label={`XP gagnes aujourd'hui: ${totalXpToday}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-text-muted">
              XP gagnes aujourd&apos;hui
            </p>
            <p
              className="font-bold text-[28px] leading-none mt-1"
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk')",
                background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {totalXpToday}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px]" style={{ color: "#666" }}>
              Renouvellement dans
            </p>
            <p className="text-white font-semibold text-[14px]">{countdown}</p>
          </div>
        </div>
      </motion.div>

      {/* Daily challenges */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="space-y-3 mb-6"
        role="list"
        aria-label="Defis quotidiens"
      >
        {challenges.map((challenge, i) => (
          <motion.div
            key={challenge.id}
            variants={challengeVariants.card}
            custom={i}
            className="rounded-xl p-4"
            style={{
              background: "#141414",
              border: challenge.done ? "1px solid rgba(0,255,136,0.3)" : "1px solid #222",
            }}
            role="listitem"
          >
            <div className="flex items-start gap-3">
              {/* Checkbox or progress indicator */}
              {challenge.type === "checkbox" ? (
                <motion.button
                  onClick={() => toggleChallenge(challenge.id)}
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: challenge.done ? "#00FF88" : "transparent",
                    border: challenge.done ? "none" : "2px solid #444",
                  }}
                  whileTap={{ scale: 0.85, transition: springs.micro }}
                  aria-label={challenge.done ? `${challenge.title} - termine` : `${challenge.title} - a faire`}
                  aria-checked={challenge.done}
                  role="checkbox"
                >
                  {challenge.done && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#111" aria-hidden="true">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </motion.button>
              ) : (
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(139,92,246,0.2)" }}
                  aria-hidden="true"
                >
                  <span className="text-[10px] font-bold" style={{ color: "#8B5CF6" }}>
                    {challenge.current}/{challenge.target}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p
                    className="text-white font-semibold text-[14px]"
                    style={{ textDecoration: challenge.done ? "line-through" : "none", opacity: challenge.done ? 0.6 : 1 }}
                  >
                    {challenge.title}
                  </p>
                  <motion.span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-block"
                    style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}
                    variants={challengeVariants.xpBadge}
                  >
                    +{challenge.xp} XP
                  </motion.span>
                </div>

                {/* Progress bar for progress type */}
                {challenge.type === "progress" && (
                  <div className="mt-2">
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#222" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: "linear-gradient(90deg, #8B5CF6, #00FF88)",
                          transformOrigin: "left",
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: challenge.current / challenge.target }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          damping: 20,
                          mass: 1.5,
                          delay: 0.3,
                        }}
                      />
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: "#666" }}>
                      {challenge.current}/{challenge.target}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Weekly challenge */}
      <h2
        className="text-white font-bold text-[16px] mb-3"
        style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
      >
        Defi de la semaine
      </h2>
      <motion.div
        className="rounded-xl p-4 mb-6"
        style={{
          background: "#141414",
          border: "1px solid #222",
          borderImage: "linear-gradient(135deg, #8B5CF6, #00FF88) 1",
          borderImageSlice: 1,
        }}
        initial={{ opacity: 0, x: -30, skewX: -2 }}
        animate={{ opacity: 1, x: 0, skewX: 0 }}
        transition={{ ...springs.heavy, delay: 0.4 }}
        role="region"
        aria-label="Defi hebdomadaire"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold text-[15px]">{WEEKLY_CHALLENGE.title}</p>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,255,136,0.15)", color: "#00FF88" }}
          >
            +{WEEKLY_CHALLENGE.xp} XP
          </span>
        </div>

        <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "#222" }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #00FF88, #8B5CF6)",
              transformOrigin: "left",
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: WEEKLY_CHALLENGE.current / WEEKLY_CHALLENGE.target }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              mass: 1.5,
              delay: 0.5,
            }}
          />
        </div>
        <p className="text-[12px] text-text-muted">
          {WEEKLY_CHALLENGE.current}/{WEEKLY_CHALLENGE.target} soirees
        </p>
      </motion.div>
    </div>
  );
}
