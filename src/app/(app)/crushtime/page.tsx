"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro, easings } from "@/lib/motion-design";
import { playSound } from "@/lib/sounds";

// ─── Types ───────────────────────────────────────
type GameState = "intro" | "playing" | "correct" | "wrong" | "cooldown";

interface CrushProfile {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  distance: number;
}

// ─── Mock profiles ──────────────────────────────
const CRUSH_PROFILES: CrushProfile[] = [
  {
    id: "ct-1",
    name: "Camille",
    age: 24,
    photo: "https://randomuser.me/api/portraits/women/12.jpg",
    bio: "Passionnee de yoga et de brunch",
    distance: 1.3,
  },
  {
    id: "ct-2",
    name: "Lea",
    age: 26,
    photo: "https://randomuser.me/api/portraits/women/22.jpg",
    bio: "Amoureuse des chats et du cinema",
    distance: 0.8,
  },
  {
    id: "ct-3",
    name: "Manon",
    age: 23,
    photo: "https://randomuser.me/api/portraits/women/33.jpg",
    bio: "Voyageuse, photographe amateur",
    distance: 2.1,
  },
  {
    id: "ct-4",
    name: "Ines",
    age: 25,
    photo: "https://randomuser.me/api/portraits/women/45.jpg",
    bio: "Danseuse de salsa, fan de mojitos",
    distance: 1.7,
  },
];

// The correct answer is always index 1 (Lea)
const CORRECT_INDEX = 1;
const TIMER_DURATION = 10;

// ─── Variants ────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, scale: 0.7, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...springs.elastic, delay: 0.1 + i * 0.1 },
  }),
  tap: { scale: 0.94, transition: springs.micro },
  correct: {
    scale: [1, 1.08, 1],
    borderColor: "#00FF88",
    transition: { duration: 0.4 },
  },
  wrong: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    borderColor: "#EF4444",
    transition: { duration: 0.5 },
  },
};

const timerVariants = {
  full: { scaleX: 1 },
  empty: {
    scaleX: 0,
    transition: { duration: TIMER_DURATION, ease: "linear" as const },
  },
};

const confettiVariants = (i: number) => ({
  initial: { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 },
  animate: {
    x: (Math.random() - 0.5) * 200,
    y: -100 - Math.random() * 150,
    opacity: 0,
    scale: 0,
    rotate: Math.random() * 360,
  },
  transition: { duration: 0.8, delay: i * 0.03 },
});

// ─── Storage ─────────────────────────────────────
function getLastPlayed(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cesoir_crushtime_last");
}

function setLastPlayed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("cesoir_crushtime_last", new Date().toDateString());
}

function canPlayToday(): boolean {
  const last = getLastPlayed();
  if (!last) return true;
  return last !== new Date().toDateString();
}

// ─── Component ───────────────────────────────────
export default function CrushTimePage() {
  const [state, setState] = useState<GameState>(() =>
    canPlayToday() ? "intro" : "cooldown"
  );
  const [timer, setTimer] = useState(TIMER_DURATION);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer countdown
  useEffect(() => {
    if (state !== "playing") return;
    setTimer(TIMER_DURATION);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Time's up = wrong answer
          setState("wrong");
          setSelectedIndex(-1);
          setLastPlayed();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const handleGuess = useCallback(
    (index: number) => {
      if (state !== "playing" || selectedIndex !== null) return;
      setSelectedIndex(index);
      if (timerRef.current) clearInterval(timerRef.current);

      if (index === CORRECT_INDEX) {
        playSound("success");
        setXpEarned(50);
        setState("correct");
      } else {
        playSound("error");
        setState("wrong");
      }
      setLastPlayed();
    },
    [state, selectedIndex]
  );

  const startGame = () => {
    setSelectedIndex(null);
    setXpEarned(0);
    setState("playing");
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/discover"
            className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center tap-target"
            aria-label="Retour"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-bold text-text">CrushTime</h1>
            <p className="text-[11px] text-text-muted">Qui t&apos;a like ?</p>
          </div>
          {/* Daily badge */}
          <div className="ml-auto">
            <span className="text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              1x / jour
            </span>
          </div>
        </div>
      </header>

      <div className="px-5 pt-6 pb-24">
        <AnimatePresence mode="wait">
          {/* ─── INTRO ─── */}
          {state === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.heavy}
              className="flex flex-col items-center text-center pt-8"
            >
              <motion.div
                className="w-24 h-24 rounded-3xl gradient-bg flex items-center justify-center shadow-glow mb-6"
                animate={{ rotate: [0, -5, 5, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-[44px]">💘</span>
              </motion.div>

              <h2 className="text-[22px] font-black text-text mb-2">
                Devine qui t&apos;a like
              </h2>
              <p className="text-[14px] text-text-muted leading-relaxed mb-2 max-w-[280px]">
                4 profils, 1 seul t&apos;a like. Tu as <span className="font-bold text-accent">10 secondes</span> pour deviner !
              </p>
              <p className="text-[12px] text-text-muted mb-8">
                Bonne reponse = match instantane + <span className="font-bold text-safe">50 XP</span>
              </p>

              <motion.button
                onClick={startGame}
                className="w-full max-w-[280px] gradient-bg text-white py-4 rounded-full text-[16px] font-bold shadow-glow tap-target"
                whileTap={micro.tapScale}
              >
                Jouer
              </motion.button>
            </motion.div>
          )}

          {/* ─── PLAYING ─── */}
          {state === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Timer bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold text-text">Temps restant</span>
                  <motion.span
                    className={`text-[14px] font-black ${timer <= 3 ? "text-[#EF4444]" : "text-accent"}`}
                    animate={timer <= 3 ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {timer}s
                  </motion.span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full origin-left"
                    style={{ background: timer <= 3 ? "#EF4444" : "linear-gradient(90deg, #8B5CF6, #00FF88)" }}
                    initial="full"
                    animate="empty"
                    variants={timerVariants}
                  />
                </div>
              </div>

              <p className="text-center text-[15px] font-bold text-text mb-5">
                Qui t&apos;a like ?
              </p>

              {/* Profile grid */}
              <div className="grid grid-cols-2 gap-3">
                {CRUSH_PROFILES.map((profile, i) => (
                  <motion.button
                    key={profile.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileTap="tap"
                    custom={i}
                    onClick={() => handleGuess(i)}
                    className="relative bg-bg-card border-2 border-border rounded-2xl overflow-hidden text-left tap-target"
                  >
                    {/* Photo */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={profile.photo}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-[14px] font-bold">
                          {profile.name}, {profile.age}
                        </p>
                        <p className="text-white/70 text-[10px]">
                          {profile.distance} km
                        </p>
                      </div>
                    </div>
                    {/* Bio */}
                    <div className="p-2.5">
                      <p className="text-[11px] text-text-muted line-clamp-2">{profile.bio}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── CORRECT ─── */}
          {state === "correct" && (
            <motion.div
              key="correct"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={springs.elastic}
              className="flex flex-col items-center text-center pt-8"
            >
              {/* Celebration */}
              <div className="relative">
                <motion.div
                  className="w-28 h-28 rounded-full gradient-bg flex items-center justify-center shadow-glow mb-5"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 0.9, 1.1, 1] }}
                  transition={{ duration: 0.7, times: [0, 0.3, 0.5, 0.7, 1] }}
                >
                  <span className="text-[48px]">🎉</span>
                </motion.div>

                {/* Confetti */}
                {[...Array(12)].map((_, i) => {
                  const cv = confettiVariants(i);
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: ["#8B5CF6", "#00FF88", "#f59e0b", "#EC4899"][i % 4],
                        top: "50%",
                        left: "50%",
                      }}
                      initial={cv.initial}
                      animate={cv.animate}
                      transition={cv.transition}
                    />
                  );
                })}
              </div>

              <motion.h2
                className="text-[22px] font-black text-text mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Bien joue !
              </motion.h2>
              <motion.p
                className="text-[14px] text-text-muted mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                C&apos;etait bien <span className="font-bold text-text">{CRUSH_PROFILES[CORRECT_INDEX].name}</span> !
              </motion.p>

              {/* XP Badge */}
              <motion.div
                className="inline-flex items-center gap-2 bg-safe/10 border border-safe/20 rounded-full px-4 py-2 mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...springs.elastic, delay: 0.6 }}
              >
                <span className="text-[14px]">⚡</span>
                <span className="text-[14px] font-black text-safe">+{xpEarned} XP</span>
              </motion.div>

              <motion.p
                className="text-[13px] text-accent font-semibold mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                Match instantane avec {CRUSH_PROFILES[CORRECT_INDEX].name} !
              </motion.p>

              <motion.div
                className="w-full max-w-[280px] space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Link
                  href="/chat"
                  className="block w-full gradient-bg text-white py-3.5 rounded-full text-[14px] font-semibold text-center shadow-glow tap-target"
                >
                  Envoyer un message
                </Link>
                <Link
                  href="/discover"
                  className="block w-full text-center text-[13px] text-text-muted font-medium py-2 tap-target"
                >
                  Retour a l&apos;exploration
                </Link>
              </motion.div>
            </motion.div>
          )}

          {/* ─── WRONG ─── */}
          {state === "wrong" && (
            <motion.div
              key="wrong"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={springs.heavy}
              className="flex flex-col items-center text-center pt-8"
            >
              <motion.div
                className="w-24 h-24 rounded-full bg-[#EF4444]/10 border-2 border-[#EF4444]/20 flex items-center justify-center mb-5"
                animate={micro.shake}
              >
                <span className="text-[40px]">😅</span>
              </motion.div>

              <h2 className="text-[20px] font-black text-text mb-2">
                {selectedIndex === -1 ? "Temps ecoule !" : "Rate !"}
              </h2>
              <p className="text-[14px] text-text-muted mb-4">
                C&apos;etait <span className="font-bold text-text">{CRUSH_PROFILES[CORRECT_INDEX].name}</span> qui t&apos;avait like
              </p>

              {/* Reveal the correct profile */}
              <motion.div
                className="w-full max-w-[220px] bg-bg-card border-2 border-accent/30 rounded-2xl overflow-hidden mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={CRUSH_PROFILES[CORRECT_INDEX].photo}
                    alt={CRUSH_PROFILES[CORRECT_INDEX].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <p className="text-white text-[16px] font-bold">
                      {CRUSH_PROFILES[CORRECT_INDEX].name}, {CRUSH_PROFILES[CORRECT_INDEX].age}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="w-full max-w-[280px] space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  className="w-full gradient-bg text-white py-3.5 rounded-full text-[14px] font-semibold shadow-glow tap-target"
                >
                  Envoyer un like quand meme ?
                </button>
                <Link
                  href="/discover"
                  className="block w-full text-center text-[13px] text-text-muted font-medium py-2 tap-target"
                >
                  Retour a l&apos;exploration
                </Link>
              </motion.div>
            </motion.div>
          )}

          {/* ─── COOLDOWN ─── */}
          {state === "cooldown" && (
            <motion.div
              key="cooldown"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.heavy}
              className="flex flex-col items-center text-center pt-12"
            >
              <div className="w-20 h-20 rounded-full bg-border flex items-center justify-center mb-5">
                <span className="text-[36px] opacity-50">💘</span>
              </div>
              <h2 className="text-[18px] font-bold text-text mb-2">
                Tu as deja joue aujourd&apos;hui
              </h2>
              <p className="text-[13px] text-text-muted mb-8 max-w-[260px]">
                Reviens demain pour une nouvelle partie ! 1 jeu gratuit par jour.
              </p>
              <Link
                href="/discover"
                className="gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold shadow-glow tap-target"
              >
                Retour
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
