"use client";

import { use, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import { quizVariants, springs } from "@/lib/motion-design";
import Link from "next/link";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface QuizOption {
  label: string;
  icon: string;
  value: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

type CompatLevel = {
  label: string;
  emoji: string;
  color: string;
  description: string;
};

// ─────────────────────────────────────────
// DATA
// ─────────────────────────────────────────

const QUESTIONS: QuizQuestion[] = [
  {
    question: "Vendredi soir parfait ?",
    options: [
      { label: "Restaurant", icon: "\uD83C\uDF7D\uFE0F", value: "restaurant" },
      { label: "Bar", icon: "\uD83C\uDF78", value: "bar" },
      { label: "Cinema", icon: "\uD83C\uDFAC", value: "cinema" },
      { label: "Maison", icon: "\uD83C\uDFE0", value: "maison" },
    ],
  },
  {
    question: "Heure ideale pour sortir ?",
    options: [
      { label: "18h", icon: "\uD83C\uDF05", value: "18h" },
      { label: "20h", icon: "\uD83C\uDF07", value: "20h" },
      { label: "22h", icon: "\uD83C\uDF03", value: "22h" },
      { label: "Minuit", icon: "\uD83C\uDF19", value: "minuit" },
    ],
  },
  {
    question: "Musique du moment ?",
    options: [
      { label: "Pop", icon: "\uD83C\uDFA4", value: "pop" },
      { label: "Rap", icon: "\uD83C\uDFA4", value: "rap" },
      { label: "Electro", icon: "\uD83C\uDFA7", value: "electro" },
      { label: "Rock", icon: "\uD83C\uDFB8", value: "rock" },
    ],
  },
  {
    question: "Plat prefere ?",
    options: [
      { label: "Pizza", icon: "\uD83C\uDF55", value: "pizza" },
      { label: "Sushi", icon: "\uD83C\uDF63", value: "sushi" },
      { label: "Burger", icon: "\uD83C\uDF54", value: "burger" },
      { label: "Tacos", icon: "\uD83C\uDF2E", value: "tacos" },
    ],
  },
  {
    question: "Red flag absolu ?",
    options: [
      { label: "Retard", icon: "\u23F0", value: "retard" },
      { label: "Telephone", icon: "\uD83D\uDCF1", value: "telephone" },
      { label: "Pas d'humour", icon: "\uD83D\uDE10", value: "humour" },
      { label: "Arrogance", icon: "\uD83D\uDE12", value: "arrogance" },
    ],
  },
  {
    question: "Premier rendez-vous ideal ?",
    options: [
      { label: "Cafe", icon: "\u2615", value: "cafe" },
      { label: "Balade", icon: "\uD83D\uDEB6", value: "balade" },
      { label: "Musee", icon: "\uD83C\uDFDB\uFE0F", value: "musee" },
      { label: "Escape game", icon: "\uD83D\uDD10", value: "escape" },
    ],
  },
  {
    question: "En soiree tu es ?",
    options: [
      { label: "DJ", icon: "\uD83C\uDFB6", value: "dj" },
      { label: "Danseur", icon: "\uD83D\uDD7A", value: "danseur" },
      { label: "Bavard", icon: "\uD83D\uDDE3\uFE0F", value: "bavard" },
      { label: "Observateur", icon: "\uD83D\uDC40", value: "observateur" },
    ],
  },
  {
    question: "Weekend ideal ?",
    options: [
      { label: "Voyage", icon: "\u2708\uFE0F", value: "voyage" },
      { label: "Netflix", icon: "\uD83D\uDCFA", value: "netflix" },
      { label: "Sport", icon: "\uD83C\uDFCB\uFE0F", value: "sport" },
      { label: "Brunch", icon: "\uD83E\uDD5E", value: "brunch" },
    ],
  },
];

function getCompatLevel(pct: number): CompatLevel {
  if (pct >= 90)
    return {
      label: "Ames soeurs",
      emoji: "\uD83D\uDD25",
      color: "#8B5CF6",
      description: "Vous etes sur la meme longueur d'onde. C'est cosmique.",
    };
  if (pct >= 70)
    return {
      label: "Tres compatibles",
      emoji: "\u2728",
      color: "#00FF88",
      description: "Vous partagez beaucoup de gouts. Ca promet de belles soirees.",
    };
  if (pct >= 50)
    return {
      label: "Compatibles",
      emoji: "\uD83D\uDE0A",
      color: "#F59E0B",
      description: "Assez de points communs pour se comprendre, assez de differences pour se surprendre.",
    };
  return {
    label: "Differents",
    emoji: "\uD83C\uDF0D",
    color: "#EF4444",
    description: "Les opposes s'attirent, non ? Vous allez vous faire decouvrir des choses.",
  };
}

// Simulate partner answers (in production, fetched from DB)
function getPartnerAnswers(matchId: string): string[] {
  // Seeded pseudo-random based on matchId to be deterministic
  let seed = 0;
  for (let i = 0; i < matchId.length; i++) {
    seed = ((seed << 5) - seed + matchId.charCodeAt(i)) | 0;
  }
  const pseudoRandom = (idx: number) => {
    const x = Math.sin(seed + idx) * 10000;
    return Math.abs(x - Math.floor(x));
  };
  return QUESTIONS.map((q, i) => {
    const optIdx = Math.floor(pseudoRandom(i) * q.options.length);
    return q.options[optIdx].value;
  });
}

// ─────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────

function AnimatedCounter({ target }: { target: number }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, target, {
      ...springs.rubber,
      duration: 2,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, count]);

  return (
    <motion.span
      className="text-[80px] font-black leading-none tabular-nums"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={springs.rubber}
    >
      {display}
      <span className="text-[40px]">%</span>
    </motion.span>
  );
}

// ─────────────────────────────────────────
// BACK ARROW
// ─────────────────────────────────────────

function BackArrow() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────
// CHECKMARK
// ─────────────────────────────────────────

function Checkmark() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M5 13l4 4L19 7"
        stroke="#00FF88"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...springs.elastic, duration: 0.5 }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────

export default function CompatibilityQuizPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [compatPct, setCompatPct] = useState(0);
  const [sharedAnswers, setSharedAnswers] = useState<number[]>([]);
  const [partnerName] = useState("Alex"); // In production, fetched from match data

  // Partner answers (simulated)
  const partnerAnswersRef = useRef(getPartnerAnswers(matchId));

  const handleSelect = (value: string) => {
    setSelectedOption(value);

    // Delay to show the selection glow, then advance
    setTimeout(() => {
      const newAnswers = [...answers, value];
      setAnswers(newAnswers);
      setSelectedOption(null);

      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        // Calculate compatibility
        const partnerAns = partnerAnswersRef.current;
        const matches: number[] = [];
        newAnswers.forEach((a, i) => {
          if (a === partnerAns[i]) matches.push(i);
        });
        const pct = Math.round((matches.length / QUESTIONS.length) * 100);
        setSharedAnswers(matches);
        setCompatPct(pct);
        setShowResult(true);
      }
    }, 350);
  };

  // ─── RESULTS SCREEN ───
  if (showResult) {
    const level = getCompatLevel(compatPct);

    return (
      <div className="min-h-screen bg-bg flex flex-col max-w-lg mx-auto pb-safe">
        {/* Header */}
        <div className="px-5 pt-5 flex items-center gap-3">
          <Link href="/chat" className="p-2 -ml-2 text-text-muted hover:text-text tap-target">
            <BackArrow />
          </Link>
          <span className="text-[14px] font-semibold text-text">Resultats</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          {/* Animated percentage */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springs.rubber}
            className="mb-2"
          >
            <div className="gradient-text">
              <AnimatedCounter target={compatPct} />
            </div>
          </motion.div>

          {/* Compatibility level — blur reveal */}
          <motion.div
            initial={{ filter: "blur(20px)", opacity: 0, y: 10 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ ...springs.cinematic, delay: 0.8 }}
            className="mb-2"
          >
            <span className="text-[40px]">{level.emoji}</span>
          </motion.div>

          <motion.h2
            initial={{ filter: "blur(16px)", opacity: 0 }}
            animate={{ filter: "blur(0px)", opacity: 1 }}
            transition={{ ...springs.cinematic, delay: 1.0 }}
            className="text-[28px] font-black text-text mb-2"
          >
            {level.label}
          </motion.h2>

          <motion.p
            initial={{ filter: "blur(12px)", opacity: 0 }}
            animate={{ filter: "blur(0px)", opacity: 1 }}
            transition={{ ...springs.cinematic, delay: 1.2 }}
            className="text-[14px] text-text-muted leading-relaxed mb-8 max-w-[300px]"
          >
            {level.description}
          </motion.p>

          {/* Shared answers section */}
          {sharedAnswers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.heavy, delay: 1.5 }}
              className="w-full mb-8"
            >
              <p className="text-[12px] uppercase tracking-[0.2em] text-text-muted font-semibold mb-3">
                Reponses en commun
              </p>
              <div className="flex flex-col gap-2">
                {sharedAnswers.map((qIdx, i) => {
                  const q = QUESTIONS[qIdx];
                  const ans = q.options.find((o) => o.value === answers[qIdx]);
                  return (
                    <motion.div
                      key={qIdx}
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ ...springs.elastic, delay: 1.7 + i * 0.1 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-accent-2/30 bg-accent-2/5"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ ...springs.elastic, delay: 1.9 + i * 0.1 }}
                      >
                        <Checkmark />
                      </motion.div>
                      <span className="text-[13px] text-text-muted flex-1 text-left">
                        {q.question}
                      </span>
                      <span className="text-[15px]">{ans?.icon}</span>
                      <span className="text-[13px] font-semibold text-text">
                        {ans?.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Send to chat button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.heavy, delay: 2.0 }}
            className="w-full flex flex-col gap-3"
          >
            <Link
              href={`/chat/${matchId}`}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-[15px] font-semibold text-white gradient-bg shadow-glow w-full"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Envoyer a {partnerName}
            </Link>
            <button
              onClick={() => {
                setStep(0);
                setAnswers([]);
                setSelectedOption(null);
                setShowResult(false);
                setCompatPct(0);
                setSharedAnswers([]);
              }}
              className="text-[13px] text-text-muted hover:text-text py-2"
            >
              Refaire le quiz
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── QUIZ SCREEN ───
  const q = QUESTIONS[step];
  const progress = (step + 1) / QUESTIONS.length;

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-lg mx-auto pb-safe">
      {/* Header */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between mb-3">
          <Link href="/chat" className="p-2 -ml-2 text-text-muted hover:text-text tap-target">
            <BackArrow />
          </Link>
          <span className="text-[13px] font-semibold text-text">
            Quiz Compatibilite
          </span>
          <span className="text-[12px] text-text-muted font-medium tabular-nums">
            {step + 1}/{QUESTIONS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-bg origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={springs.heavy}
            style={{ transformOrigin: "left" }}
          />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={quizVariants.question}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
            style={{ perspective: 800 }}
          >
            {/* Question text */}
            <h2 className="text-[28px] font-black text-text text-center mb-8">
              {q.question}
            </h2>

            {/* Options 2x2 grid */}
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial="hidden"
              animate="visible"
            >
              {q.options.map((opt, i) => {
                const isSelected = selectedOption === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    variants={quizVariants.option}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    whileTap={{ scale: 0.95, transition: springs.micro }}
                    onClick={() => !selectedOption && handleSelect(opt.value)}
                    disabled={!!selectedOption}
                    className={`
                      relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border
                      transition-colors duration-200
                      ${
                        isSelected
                          ? "border-accent bg-accent/10"
                          : "border-border bg-bg-card hover:border-accent/40 hover:bg-accent/5"
                      }
                    `}
                  >
                    {/* Selected glow ring */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          boxShadow: "0 0 20px rgba(139,92,246,0.3), inset 0 0 20px rgba(139,92,246,0.05)",
                        }}
                        transition={springs.snap}
                        style={{ borderRadius: "1rem" }}
                      />
                    )}

                    <motion.span
                      className="text-3xl"
                      animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                      transition={springs.elastic}
                    >
                      {opt.icon}
                    </motion.span>
                    <span className="text-[14px] font-semibold text-text">
                      {opt.label}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <div className="px-6 pb-4 text-center">
        <p className="text-[12px] text-text-muted">
          Quiz avec {partnerName} — Vos reponses restent privees
        </p>
      </div>
    </div>
  );
}
