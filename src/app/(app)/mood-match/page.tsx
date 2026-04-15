"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { moodMatchVariants, springs, micro } from "@/lib/motion-design";
import { playSound } from "@/lib/sounds";
import RadarAnimation from "@/components/app/RadarAnimation";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type MoodKey =
  | "aventureux"
  | "social"
  | "romantique"
  | "chill"
  | "festif"
  | "curieux";

interface MoodDef {
  key: MoodKey;
  label: string;
  emoji: string;
  description: string;
  color: string;
  compatWith: MoodKey[];
}

interface FakeProfile {
  id: string;
  name: string;
  age: number;
  photo: string;
  mood: MoodKey;
  bio: string;
}

type Step = "select" | "searching" | "result";

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const MOODS: MoodDef[] = [
  {
    key: "aventureux",
    label: "Aventureux",
    emoji: "\uD83D\uDE80",
    description: "Envie d'excitation",
    color: "#F59E0B",
    compatWith: ["aventureux", "social"],
  },
  {
    key: "social",
    label: "Social",
    emoji: "\uD83E\uDD42",
    description: "Envie de parler",
    color: "#3B82F6",
    compatWith: ["social", "romantique"],
  },
  {
    key: "romantique",
    label: "Romantique",
    emoji: "\uD83D\uDC95",
    description: "Ambiance date",
    color: "#EC4899",
    compatWith: ["romantique", "chill"],
  },
  {
    key: "chill",
    label: "Chill",
    emoji: "\uD83D\uDE0C",
    description: "Soiree relax",
    color: "#10B981",
    compatWith: ["chill", "social"],
  },
  {
    key: "festif",
    label: "Festif",
    emoji: "\uD83C\uDF89",
    description: "Mode fete",
    color: "#8B5CF6",
    compatWith: ["festif", "aventureux"],
  },
  {
    key: "curieux",
    label: "Curieux",
    emoji: "\uD83D\uDD0D",
    description: "Decouvrir du neuf",
    color: "#06B6D4",
    compatWith: [
      "aventureux",
      "social",
      "romantique",
      "chill",
      "festif",
      "curieux",
    ],
  },
];

const FAKE_PROFILES: FakeProfile[] = [
  {
    id: "m1",
    name: "Camille",
    age: 26,
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    mood: "social",
    bio: "Fan de terrasses et de longues discussions",
  },
  {
    id: "m2",
    name: "Lucas",
    age: 29,
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    mood: "aventureux",
    bio: "Toujours pret pour l'improvisation",
  },
  {
    id: "m3",
    name: "Ines",
    age: 24,
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
    mood: "romantique",
    bio: "Un verre de vin, une belle vue, c'est tout",
  },
  {
    id: "m4",
    name: "Hugo",
    age: 27,
    photo: "https://randomuser.me/api/portraits/men/18.jpg",
    mood: "chill",
    bio: "Netflix et sushi, la combo parfaite",
  },
  {
    id: "m5",
    name: "Lea",
    age: 25,
    photo: "https://randomuser.me/api/portraits/women/12.jpg",
    mood: "festif",
    bio: "La soiree commence ou je suis",
  },
  {
    id: "m6",
    name: "Rayan",
    age: 28,
    photo: "https://randomuser.me/api/portraits/men/55.jpg",
    mood: "curieux",
    bio: "J'adore decouvrir de nouveaux endroits",
  },
  {
    id: "m7",
    name: "Jade",
    age: 23,
    photo: "https://randomuser.me/api/portraits/women/75.jpg",
    mood: "social",
    bio: "Apero spontane, qui vient ?",
  },
  {
    id: "m8",
    name: "Nathan",
    age: 30,
    photo: "https://randomuser.me/api/portraits/men/41.jpg",
    mood: "romantique",
    bio: "Diner aux chandelles > club bruyant",
  },
  {
    id: "m9",
    name: "Emma",
    age: 22,
    photo: "https://randomuser.me/api/portraits/women/33.jpg",
    mood: "aventureux",
    bio: "Let's do something crazy ce soir",
  },
  {
    id: "m10",
    name: "Theo",
    age: 26,
    photo: "https://randomuser.me/api/portraits/men/64.jpg",
    mood: "festif",
    bio: "DJ amateur, toujours un son en tete",
  },
];

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function getMoodDef(key: MoodKey): MoodDef {
  return MOODS.find((m) => m.key === key)!;
}

function findMatch(selectedMood: MoodKey): FakeProfile {
  const moodDef = getMoodDef(selectedMood);
  const compatible = FAKE_PROFILES.filter((p) =>
    moodDef.compatWith.includes(p.mood)
  );
  // Pick a random compatible profile
  return compatible[Math.floor(Math.random() * compatible.length)] ?? FAKE_PROFILES[0];
}

function getCompatMessage(userMood: MoodKey, matchMood: MoodKey): string {
  if (userMood === matchMood) {
    return `Vous etes tous les deux ${getMoodDef(userMood).label} !`;
  }
  return "Vos moods se completent !";
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────

export default function MoodMatchPage() {
  const [step, setStep] = useState<Step>("select");
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<FakeProfile | null>(
    null
  );
  const [foundCount, setFoundCount] = useState(0);

  const handleMoodSelect = useCallback((mood: MoodKey) => {
    setSelectedMood(mood);
    setStep("searching");
    setFoundCount(0);
    setMatchedProfile(null);
  }, []);

  const handleSearchComplete = useCallback(
    (count: number) => {
      if (!selectedMood) return;
      setFoundCount(count);
      const match = findMatch(selectedMood);
      setMatchedProfile(match);
      playSound("match");
      // Small delay before showing result for dramatic effect
      setTimeout(() => {
        setStep("result");
      }, 600);
    },
    [selectedMood]
  );

  const handleRetry = useCallback(() => {
    setStep("select");
    setSelectedMood(null);
    setMatchedProfile(null);
    setFoundCount(0);
  }, []);

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <Link
            href="/browse"
            className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-text-muted"
            aria-label="Retour"
          >
            <IconBack size={18} />
          </Link>
          <h1 className="text-[18px] font-black tracking-tight text-text">
            Mood Match
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <div className="px-5 pt-6">
        <AnimatePresence mode="wait">
          {step === "select" && (
            <MoodSelectStep
              key="select"
              onSelect={handleMoodSelect}
              selectedMood={selectedMood}
            />
          )}
          {step === "searching" && (
            <SearchingStep
              key="searching"
              mood={selectedMood!}
              onComplete={handleSearchComplete}
            />
          )}
          {step === "result" && matchedProfile && selectedMood && (
            <ResultStep
              key="result"
              profile={matchedProfile}
              userMood={selectedMood}
              foundCount={foundCount}
              onRetry={handleRetry}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Step 1 — Mood Selection
// ─────────────────────────────────────────

function MoodSelectStep({
  onSelect,
  selectedMood,
}: {
  onSelect: (mood: MoodKey) => void;
  selectedMood: MoodKey | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springs.gentle}
    >
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-[22px] font-black text-text mb-2">
          Comment tu te sens ce soir ?
        </h2>
        <p className="text-[13px] text-text-muted">
          Choisis ton mood, on trouve quelqu&apos;un qui matche
        </p>
      </div>

      {/* Mood grid — 3x2 */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        variants={moodMatchVariants.moodGrid}
        initial="hidden"
        animate="visible"
      >
        {MOODS.map((mood, i) => (
          <MoodCard
            key={mood.key}
            mood={mood}
            index={i}
            isSelected={selectedMood === mood.key}
            onSelect={() => onSelect(mood.key)}
          />
        ))}
      </motion.div>

      {/* Hint */}
      <motion.p
        className="text-center text-[11px] text-text-muted mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Curieux matche avec tous les moods
      </motion.p>
    </motion.div>
  );
}

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
      variants={moodMatchVariants.moodCard}
      custom={index}
      whileTap="tap"
      onClick={onSelect}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${
        isSelected
          ? "border-accent bg-accent/10"
          : "border-border bg-bg hover:border-border/80"
      }`}
      aria-label={`${mood.label} — ${mood.description}`}
    >
      {/* Glow pulse on selected */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={moodMatchVariants.glowPulse(mood.color)}
        />
      )}

      {/* Emoji */}
      <span className="text-[32px] leading-none" aria-hidden="true">
        {mood.emoji}
      </span>

      {/* Label */}
      <span
        className="text-[13px] font-bold text-text"
        style={isSelected ? { color: mood.color } : undefined}
      >
        {mood.label}
      </span>

      {/* Description */}
      <span className="text-[10px] text-text-muted text-center leading-tight">
        {mood.description}
      </span>
    </motion.button>
  );
}

// ─────────────────────────────────────────
// Step 2 — Searching
// ─────────────────────────────────────────

function SearchingStep({
  mood,
  onComplete,
}: {
  mood: MoodKey;
  onComplete: (count: number) => void;
}) {
  const moodDef = getMoodDef(mood);
  const [completed, setCompleted] = useState(false);

  const handleRadarComplete = useCallback(
    (count: number) => {
      setCompleted(true);
      onComplete(count);
    },
    [onComplete]
  );

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springs.gentle}
    >
      {/* Title */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: 0.2 }}
      >
        <h2 className="text-[20px] font-black text-text mb-1">
          Recherche en cours...
        </h2>
        <p className="text-[13px] text-text-muted">
          On cherche des profils{" "}
          <span style={{ color: moodDef.color }} className="font-semibold">
            {moodDef.label}
          </span>
        </p>
      </motion.div>

      {/* Radar */}
      <RadarAnimation
        active={!completed}
        onComplete={handleRadarComplete}
        duration={4000}
      />

      {/* Selected mood badge */}
      <motion.div
        className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-bg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.snap, delay: 0.5 }}
      >
        <span className="text-[18px]" aria-hidden="true">
          {moodDef.emoji}
        </span>
        <span
          className="text-[12px] font-semibold"
          style={{ color: moodDef.color }}
        >
          {moodDef.label}
        </span>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Step 3 — Result
// ─────────────────────────────────────────

function ResultStep({
  profile,
  userMood,
  foundCount,
  onRetry,
}: {
  profile: FakeProfile;
  userMood: MoodKey;
  foundCount: number;
  onRetry: () => void;
}) {
  const userMoodDef = getMoodDef(userMood);
  const matchMoodDef = getMoodDef(profile.mood);
  const compatMessage = getCompatMessage(userMood, profile.mood);

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springs.gentle}
    >
      {/* Title */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.gentle}
      >
        <h2 className="text-[22px] font-black text-text mb-1">
          <span className="gradient-text">Ton match mood !</span>
        </h2>
        <p className="text-[12px] text-text-muted">
          Parmi {foundCount} profils compatibles
        </p>
      </motion.div>

      {/* Match card */}
      <motion.div
        className="w-full max-w-[320px] rounded-3xl overflow-hidden border border-border/50 bg-bg"
        variants={moodMatchVariants.matchCard}
        initial="hidden"
        animate="visible"
        style={{
          boxShadow: `0 8px 40px ${matchMoodDef.color}20`,
        }}
      >
        {/* Photo */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={profile.photo}
            alt={`${profile.name}, ${profile.age} ans`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Mood badges overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              {/* User mood */}
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: `${userMoodDef.color}CC` }}
              >
                {userMoodDef.emoji} Toi
              </span>
              {/* Match arrow */}
              <span className="text-white/60 text-[12px]">&harr;</span>
              {/* Match mood */}
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: `${matchMoodDef.color}CC` }}
              >
                {matchMoodDef.emoji} {profile.name}
              </span>
            </div>
            <p className="text-[18px] font-black text-white leading-tight">
              {profile.name}, {profile.age}
            </p>
          </div>
        </div>

        {/* Info area */}
        <div className="p-4">
          {/* Bio */}
          <p className="text-[13px] text-text-muted mb-4">{profile.bio}</p>

          {/* Compatibility message */}
          <motion.div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/5 border border-accent/10 mb-4"
            variants={moodMatchVariants.compatText}
            initial="hidden"
            animate="visible"
          >
            <span className="text-[16px]" aria-hidden="true">
              {userMood === profile.mood ? "\u2728" : "\uD83C\uDF1F"}
            </span>
            <p className="text-[12px] font-semibold text-accent">
              {compatMessage}
            </p>
          </motion.div>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <Link
              href={`/chat/mood-${profile.id}`}
              className="flex-1 gradient-bg text-white text-center py-3 rounded-full text-[14px] font-bold"
            >
              Dire bonjour
            </Link>
            <motion.button
              onClick={onRetry}
              className="flex-1 border-2 border-border text-text-muted text-center py-3 rounded-full text-[14px] font-semibold hover:border-text-muted transition-colors"
              whileTap={micro.tapScale}
            >
              Essayer encore
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Inline icon
// ─────────────────────────────────────────

function IconBack({ size = 24 }: { size?: number }) {
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
        d="M15 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
