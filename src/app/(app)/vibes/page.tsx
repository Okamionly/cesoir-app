"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import MusicEqualizer from "@/components/app/MusicEqualizer";
import VibeCard from "@/components/app/VibeCard";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface MoodDef {
  id: string;
  name: string;
  emoji: string;
  genre: string;
  gradient: string;
  color: string;
  songs: { artist: string; title: string }[];
}

interface MockMatch {
  name: string;
  vibePercent: number;
}

// ─────────────────────────────────────────
// Data
// ─────────────────────────────────────────

const MOODS: MoodDef[] = [
  {
    id: "chill",
    name: "Chill",
    emoji: "\uD83C\uDFA7",
    genre: "Lo-fi, Ambient, Downtempo",
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#667eea",
    songs: [
      { artist: "Khruangbin", title: "Time (You and I)" },
      { artist: "Tame Impala", title: "Let It Happen" },
      { artist: "Mac DeMarco", title: "Chamber of Reflection" },
      { artist: "FKJ", title: "Vibin' Out" },
    ],
  },
  {
    id: "energique",
    name: "Energique",
    emoji: "\u26A1",
    genre: "EDM, House, Pop energique",
    gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
    color: "#f5576c",
    songs: [
      { artist: "Daft Punk", title: "One More Time" },
      { artist: "Disclosure", title: "Latch" },
      { artist: "Calvin Harris", title: "Feel So Close" },
      { artist: "Rihanna", title: "We Found Love" },
    ],
  },
  {
    id: "romantique",
    name: "Romantique",
    emoji: "\uD83D\uDC95",
    genre: "R&B, Soul, Ballades",
    gradient: "linear-gradient(135deg, #f6d365, #fda085)",
    color: "#fda085",
    songs: [
      { artist: "Frank Ocean", title: "Thinkin Bout You" },
      { artist: "Sade", title: "No Ordinary Love" },
      { artist: "Daniel Caesar", title: "Best Part" },
      { artist: "Alicia Keys", title: "If I Ain't Got You" },
    ],
  },
  {
    id: "festif",
    name: "Festif",
    emoji: "\uD83C\uDF89",
    genre: "Pop, Dance, Hits du moment",
    gradient: "linear-gradient(135deg, #a18cd1, #fbc2eb)",
    color: "#a18cd1",
    songs: [
      { artist: "Beyonce", title: "Crazy in Love" },
      { artist: "Dua Lipa", title: "Levitating" },
      { artist: "Bruno Mars", title: "24K Magic" },
      { artist: "Lizzo", title: "Good as Hell" },
    ],
  },
  {
    id: "melancolique",
    name: "Melancolique",
    emoji: "\uD83C\uDF27\uFE0F",
    genre: "Indie, Folk, Post-rock",
    gradient: "linear-gradient(135deg, #89ABE3, #536976)",
    color: "#89ABE3",
    songs: [
      { artist: "Radiohead", title: "Exit Music" },
      { artist: "Bon Iver", title: "Skinny Love" },
      { artist: "Lana Del Rey", title: "Video Games" },
      { artist: "Elliott Smith", title: "Between the Bars" },
    ],
  },
  {
    id: "underground",
    name: "Underground",
    emoji: "\uD83D\uDD2E",
    genre: "Techno, Minimal, Experimental",
    gradient: "linear-gradient(135deg, #0f0c29, #302b63)",
    color: "#302b63",
    songs: [
      { artist: "Aphex Twin", title: "Windowlicker" },
      { artist: "Burial", title: "Archangel" },
      { artist: "Arca", title: "Nonbinary" },
      { artist: "SOPHIE", title: "Immaterial" },
    ],
  },
  {
    id: "latino",
    name: "Latino",
    emoji: "\uD83D\uDC83",
    genre: "Reggaeton, Salsa, Bachata",
    gradient: "linear-gradient(135deg, #f12711, #f5af19)",
    color: "#f5af19",
    songs: [
      { artist: "Bad Bunny", title: "Dakiti" },
      { artist: "Rosalia", title: "Malamente" },
      { artist: "J Balvin", title: "Mi Gente" },
      { artist: "Shakira", title: "Hips Don't Lie" },
    ],
  },
  {
    id: "classique",
    name: "Classique",
    emoji: "\uD83C\uDFBB",
    genre: "Classique, Jazz, Piano",
    gradient: "linear-gradient(135deg, #3a1c71, #d76d77)",
    color: "#d76d77",
    songs: [
      { artist: "Debussy", title: "Clair de Lune" },
      { artist: "Chopin", title: "Nocturne Op. 9" },
      { artist: "Miles Davis", title: "So What" },
      { artist: "Nina Simone", title: "Feeling Good" },
    ],
  },
];

const MOCK_MATCHES: MockMatch[] = [
  { name: "Lea", vibePercent: 87 },
  { name: "Thomas", vibePercent: 72 },
  { name: "Camille", vibePercent: 65 },
  { name: "Hugo", vibePercent: 91 },
];

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function formatSong(s: { artist: string; title: string }): string {
  return `${s.artist} — ${s.title}`;
}

// ─────────────────────────────────────────
// Animated count-up hook
// ─────────────────────────────────────────

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    setValue(0);
    startRef.current = null;
    let raf: number;

    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function VibesPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);

  const currentMood = MOODS.find((m) => m.id === selectedMood) ?? null;

  // Pick a random match for compatibility display
  const currentMatch = selectedMood
    ? MOCK_MATCHES[
        selectedMood.charCodeAt(0) % MOCK_MATCHES.length
      ]
    : null;

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          <IconMusic size={20} />
          <div>
            <h1 className="text-[20px] font-black tracking-tight text-text">
              Mon Vibe Musical
            </h1>
            <p className="text-[11px] text-text-muted">
              Partage ta playlist du soir
            </p>
          </div>
          {currentMood && (
            <div className="ml-auto">
              <MusicEqualizer bars={3} size="sm" color={currentMood.color} />
            </div>
          )}
        </div>
      </header>

      {/* Selected mood banner */}
      <AnimatePresence mode="wait">
        {currentMood && (
          <motion.div
            key={currentMood.id}
            className="mx-4 mt-4 rounded-2xl px-4 py-3 border border-white/10"
            style={{ background: currentMood.gradient }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={springs.snap}
          >
            <div className="flex items-center gap-3">
              <span className="text-[28px]">{currentMood.emoji}</span>
              <div>
                <p className="text-[13px] font-bold text-white">
                  Ce soir je suis... {currentMood.name}
                </p>
                <p className="text-[10px] text-white/60">{currentMood.genre}</p>
              </div>
              <div className="ml-auto">
                <MusicEqualizer bars={4} size="sm" color="rgba(255,255,255,0.7)" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood grid */}
      <section className="px-4 pt-5">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
          Choisis ton vibe
        </p>
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05, delayChildren: 0.1 },
            },
          }}
        >
          {MOODS.map((mood, i) => (
            <MoodCard
              key={mood.id}
              mood={mood}
              index={i}
              isSelected={selectedMood === mood.id}
              onSelect={() => setSelectedMood(mood.id)}
            />
          ))}
        </motion.div>
      </section>

      {/* Playlist section */}
      <AnimatePresence mode="wait">
        {currentMood && (
          <motion.section
            key={`playlist-${currentMood.id}`}
            className="px-4 pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={springs.heavy}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                Playlist {currentMood.name}
              </p>
              <MusicEqualizer bars={3} size="sm" color={currentMood.color} />
            </div>

            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
              {currentMood.songs.map((song, i) => (
                <motion.div
                  key={`${song.artist}-${song.title}`}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < currentMood.songs.length - 1 ? "border-b border-border/50" : ""
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springs.heavy, delay: i * 0.08 }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${currentMood.color}15` }}
                  >
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: currentMood.color }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text truncate">
                      {song.title}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {song.artist}
                    </p>
                  </div>
                  <MusicEqualizer bars={3} size="sm" color={currentMood.color} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Vibe compatibility */}
      <AnimatePresence>
        {currentMatch && currentMood && (
          <motion.section
            className="px-4 pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={springs.heavy}
          >
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
              Compatibilite musicale
            </p>
            <VibeCompatibility
              name={currentMatch.name}
              percent={currentMatch.vibePercent}
              color={currentMood.color}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Share button */}
      <AnimatePresence>
        {currentMood && (
          <motion.div
            className="px-4 pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ ...springs.heavy, delay: 0.2 }}
          >
            <motion.button
              onClick={() => setShowShareCard(true)}
              className="w-full py-3.5 rounded-2xl gradient-bg text-white text-[14px] font-bold shadow-glow"
              whileTap={micro.tapScale}
            >
              Partager mon vibe
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share card overlay */}
      <AnimatePresence>
        {showShareCard && currentMood && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowShareCard(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Card */}
            <motion.div
              className="relative w-full max-w-[320px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={springs.elastic}
            >
              <VibeCard
                emoji={currentMood.emoji}
                moodName={currentMood.name}
                gradient={currentMood.gradient}
                songs={currentMood.songs.slice(0, 3).map(formatSong)}
                onShare={() => setShowShareCard(false)}
              />

              {/* Close */}
              <motion.button
                onClick={() => setShowShareCard(false)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted shadow-lg"
                whileTap={micro.tapScale}
                aria-label="Fermer"
              >
                <IconClose size={14} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function MoodCard({
  mood,
  index,
  isSelected,
  onSelect,
}: {
  mood: MoodDef;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      className={`relative rounded-2xl p-4 text-left transition-all overflow-hidden ${
        isSelected
          ? "border-2 ring-2 ring-accent/30"
          : "border border-border hover:border-border"
      }`}
      style={{
        borderColor: isSelected ? mood.color : undefined,
      }}
      variants={{
        hidden: { opacity: 0, scale: 0.7 },
        visible: (i: number) => ({
          opacity: 1,
          scale: 1,
          transition: { ...springs.elastic, delay: i * 0.05 },
        }),
      }}
      custom={index}
      animate={
        isSelected
          ? {
              scale: 1.02,
              boxShadow: `0 0 24px ${mood.color}30`,
            }
          : { scale: 1, boxShadow: "0 0 0px transparent" }
      }
      whileTap={micro.tapScale}
      aria-pressed={isSelected}
      aria-label={`${mood.name} — ${mood.genre}`}
    >
      {/* Subtle gradient bg when selected */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 opacity-10 rounded-2xl"
          style={{ background: mood.gradient }}
          layoutId="mood-bg"
          transition={springs.snap}
        />
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[28px] leading-none">{mood.emoji}</span>
          {isSelected && (
            <MusicEqualizer bars={3} size="sm" color={mood.color} />
          )}
        </div>
        <p className="text-[14px] font-bold text-text mb-0.5">{mood.name}</p>
        <p className="text-[10px] text-text-muted leading-snug">{mood.genre}</p>
      </div>
    </motion.button>
  );
}

function VibeCompatibility({
  name,
  percent,
  color,
}: {
  name: string;
  percent: number;
  color: string;
}) {
  const displayPercent = useCountUp(percent, 1200);

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar placeholder */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white"
          style={{ background: color }}
        >
          {name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-text">{name}</p>
          <p className="text-[11px] text-text-muted">Vibe en commun</p>
        </div>
        <motion.span
          className="text-[24px] font-black"
          style={{ color }}
          key={percent}
        >
          {displayPercent}%
        </motion.span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-border/30 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{
            type: "spring" as const,
            stiffness: 100,
            damping: 20,
            mass: 1.5,
            delay: 0.3,
          }}
        />
      </div>

      <p className="text-[11px] text-text-muted mt-2">
        {displayPercent}% de vibe en commun avec {name}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────
// Inline icons
// ─────────────────────────────────────────

function IconMusic({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="M9 18V5l12-2v13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconClose({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
