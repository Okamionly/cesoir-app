"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { springs, micro, ambient } from "@/lib/motion-design";
import { RackFocus } from "@/components/motion/RackFocus";

interface FlashPlan {
  id: string;
  emoji: string;
  title: string;
  venue: string;
  /** Deadline as minutes remaining from "now" */
  deadlineMin: number;
  interested: number;
  category: string;
  avatars: string[];
}

const AVATAR_COLORS = [
  "#8B5CF6", "#00FF88", "#F59E0B", "#EF4444", "#3B82F6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#10B981",
];

const PLANS: FlashPlan[] = [
  { id: "1", emoji: "\u{1F378}", title: "Happy Hour 2-pour-1", venue: "Le Comptoir", deadlineMin: 82, interested: 12, category: "Food", avatars: ["A", "B", "C", "D", "E"] },
  { id: "2", emoji: "\u{1F3B5}", title: "Concert jazz gratuit", venue: "Le Baiser Sale", deadlineMin: 145, interested: 8, category: "Musique", avatars: ["F", "G", "H"] },
  { id: "3", emoji: "\u{1F483}", title: "Cours de salsa debutant", venue: "Studio Bleu", deadlineMin: 22, interested: 5, category: "Sport", avatars: ["I", "J", "K", "L", "M"] },
  { id: "4", emoji: "\u{1F3B2}", title: "Soiree jeux de societe", venue: "Le Dernier Bar", deadlineMin: 55, interested: 15, category: "Jeux", avatars: ["N", "O", "P", "Q"] },
  { id: "5", emoji: "\u{1F3A8}", title: "Vernissage + cocktails", venue: "Galerie Perrotin", deadlineMin: 10, interested: 9, category: "Culture", avatars: ["R", "S", "T", "U", "V", "W"] },
  { id: "6", emoji: "\u{1F355}", title: "Pizza party rooftop", venue: "Le Perchoir", deadlineMin: 120, interested: 22, category: "Food", avatars: ["X", "Y", "Z", "A", "B", "C", "D"] },
  { id: "7", emoji: "\u{1F3B8}", title: "Open mic acoustique", venue: "L'International", deadlineMin: 180, interested: 7, category: "Musique", avatars: ["E", "F"] },
  { id: "8", emoji: "\u{1F3C3}", title: "Running nocturne 5km", venue: "Canal Saint-Martin", deadlineMin: 28, interested: 11, category: "Sport", avatars: ["G", "H", "I", "J"] },
  { id: "9", emoji: "\u{1F3AD}", title: "Impro theatre gratuit", venue: "Theatre de Belleville", deadlineMin: 95, interested: 6, category: "Culture", avatars: ["K", "L"] },
  { id: "10", emoji: "\u{1F3AE}", title: "Tournoi Mario Kart", venue: "Meltdown Bar", deadlineMin: 45, interested: 18, category: "Jeux", avatars: ["M", "N", "O", "P", "Q", "R"] },
];

const MAX_ATTENDEES = 30;

const CATEGORIES = ["Tous", "Food", "Musique", "Sport", "Culture", "Jeux"];

// --- Variants ---

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.elastic,
  },
  exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.25 } },
};

const newPlanVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.rubber,
  },
};

// --- Helpers ---

function formatCountdown(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// --- Components ---

/** A single digit that animates when its value changes via key-based spring */
function CountdownDigit({ value, urgent }: { value: string; urgent: boolean }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -12, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springs.snap}
      className={`inline-block tabular-nums font-mono font-bold text-[13px] ${urgent ? "text-red-400" : "text-accent"}`}
    >
      {value}
    </motion.span>
  );
}

/** Countdown timer for a plan card */
function CountdownTimer({ deadlineSeconds }: { deadlineSeconds: number }) {
  const [remaining, setRemaining] = useState(deadlineSeconds);

  useEffect(() => {
    setRemaining(deadlineSeconds);
  }, [deadlineSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const { h, m, s } = formatCountdown(remaining);
  const urgent = remaining < 30 * 60; // < 30 min

  return (
    <div className="flex items-center gap-0.5">
      <span className={`text-[10px] mr-1 ${urgent ? "text-red-400" : "text-text-muted"}`}>
        {urgent ? "\u{26A1}" : "\u{23F3}"}
      </span>
      {h > 0 && (
        <>
          <CountdownDigit value={pad(h)} urgent={urgent} />
          <span className={`text-[11px] ${urgent ? "text-red-400/60" : "text-text-muted"}`}>:</span>
        </>
      )}
      <CountdownDigit value={pad(m)} urgent={urgent} />
      <span className={`text-[11px] ${urgent ? "text-red-400/60" : "text-text-muted"}`}>:</span>
      <CountdownDigit value={pad(s)} urgent={urgent} />
    </div>
  );
}

/** Overlapping avatar stack */
function AvatarStack({ avatars, max = 4 }: { avatars: string[]; max?: number }) {
  const shown = avatars.slice(0, max);
  const extra = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((letter, i) => (
        <div
          key={`${letter}-${i}`}
          className="w-6 h-6 rounded-full border-2 border-bg-card flex items-center justify-center text-[9px] font-bold text-white shrink-0"
          style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length], zIndex: max - i }}
        >
          {letter}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="w-6 h-6 rounded-full border-2 border-bg-card flex items-center justify-center text-[9px] font-semibold text-text-muted bg-bg shrink-0"
          style={{ zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/** Populaire badge with pulse */
function PopulaireBadge() {
  return (
    <motion.span
      animate={micro.pulse}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent/15 text-accent border border-accent/20"
    >
      <span>{"\uD83D\uDD25"}</span> Populaire
    </motion.span>
  );
}

/** Progress bar for attendee fill level */
function AttendeeProgressBar({ count, max }: { count: number; max: number }) {
  const pct = Math.min(count / max, 1);
  return (
    <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden mt-2">
      <motion.div
        className="h-full rounded-full gradient-bg"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct }}
        transition={springs.heavy}
        style={{ originX: 0 }}
      />
    </div>
  );
}

// --- Main Page ---

export default function FlashPlansPage() {
  const [filter, setFilter] = useState("Tous");
  const [interested, setInterested] = useState<Set<string>>(new Set());
  const [plans, setPlans] = useState(PLANS);

  const filtered = filter === "Tous" ? plans : plans.filter(p => p.category === filter);

  const toggleInterest = useCallback((id: string) => {
    setInterested(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCreatePlan = useCallback(() => {
    const newPlan: FlashPlan = {
      id: `new-${Date.now()}`,
      emoji: "\u{2728}",
      title: "Nouveau plan flash !",
      venue: "A definir",
      deadlineMin: 60,
      interested: 1,
      category: CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1)) + 1],
      avatars: ["?"],
    };
    setPlans(prev => [newPlan, ...prev]);
  }, []);

  return (
    <div className="min-h-screen bg-bg relative">
      {/* Header — moon pulse + hairline */}
      <header className="relative sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <RackFocus duration={0.5}>
          <div className="flex items-center gap-2 mb-0.5">
            <motion.span
              className="text-lg text-accent"
              aria-hidden="true"
              animate={{ rotate: [0, 5, -3, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {"\u263E"}
            </motion.span>
            <span className="text-base font-bold">Flash Plans</span>
            <motion.span
              animate={ambient.breathe(3)}
              className="ml-auto text-[10px] text-accent/70 font-medium"
            >
              {plans.length} plans actifs
            </motion.span>
          </div>
          <p className="text-[11px] text-text-muted">Ce soir pres de toi — le temps presse</p>
        </RackFocus>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(236,72,153,0.4), rgba(139,92,246,0.4), transparent)",
          }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Filter chips */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat}
              onClick={() => setFilter(cat)}
              whileTap={{ scale: 0.92 }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold border tap-target transition-all ${
                filter === cat
                  ? "border-accent gradient-bg text-white"
                  : "border-border text-text-muted"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </header>

      {/* Plan cards */}
      <motion.main
        className="px-4 pb-32 pt-4 space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-label="Liste des plans flash"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map(plan => {
            const isInterested = interested.has(plan.id);
            const attendeeCount = isInterested ? plan.interested + 1 : plan.interested;
            const isUrgent = plan.deadlineMin < 30;
            const isPopular = attendeeCount >= 5;
            const isNew = plan.id.startsWith("new-");

            return (
              <motion.div
                key={plan.id}
                variants={isNew ? newPlanVariants : cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                {/* Urgent border pulse wrapper */}
                <motion.div
                  animate={
                    isUrgent
                      ? { borderColor: ["rgba(239,68,68,0.5)", "rgba(239,68,68,1)", "rgba(239,68,68,0.5)"] }
                      : {}
                  }
                  transition={
                    isUrgent
                      ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                      : undefined
                  }
                  className={`bg-bg-card border rounded-2xl p-4 transition-colors ${
                    isUrgent ? "border-red-500/50" : "border-border hover:border-accent/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Emoji icon */}
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-[20px] shrink-0"
                      animate={isUrgent ? { scale: [1, 1.08, 1], transition: { duration: 1.2, repeat: Infinity } } : {}}
                    >
                      {plan.emoji}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[14px] font-bold text-text">{plan.title}</h3>
                        {isPopular && <PopulaireBadge />}
                      </div>
                      <p className="text-[12px] text-text-muted mt-0.5">
                        {plan.venue}
                      </p>

                      {/* Countdown + category */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] text-text-muted bg-bg border border-border px-2 py-0.5 rounded-full">
                          {plan.category}
                        </span>
                        <CountdownTimer deadlineSeconds={plan.deadlineMin * 60} />
                      </div>

                      {/* Avatar stack + attendee count */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <AvatarStack avatars={plan.avatars} max={4} />
                        <span className="text-[10px] text-accent font-semibold">
                          {attendeeCount} interesses
                        </span>
                      </div>

                      {/* Progress bar */}
                      <AttendeeProgressBar count={attendeeCount} max={MAX_ATTENDEES} />
                    </div>

                    {/* CTA button */}
                    <motion.button
                      onClick={() => toggleInterest(plan.id)}
                      className={`shrink-0 px-3 py-2 rounded-full text-[11px] font-semibold transition-all tap-target ${
                        isInterested
                          ? "gradient-bg text-white shadow-glow"
                          : "border border-border text-text-muted"
                      }`}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: isInterested
                          ? "0 0 20px rgba(139,92,246,0.5)"
                          : "0 0 15px rgba(139,92,246,0.3)",
                      }}
                      whileTap={{ scale: 0.92 }}
                    >
                      {isInterested ? "Inscrit \u2713" : "J'y vais"}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.main>

      {/* Floating "Creer un plan flash" button */}
      <motion.button
        onClick={handleCreatePlan}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...springs.elastic }}
        whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(139,92,246,0.4)" }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 gradient-bg text-white text-[13px] font-bold px-6 py-3 rounded-full shadow-glow flex items-center gap-2"
      >
        <span className="text-base">{"\u26A1"}</span>
        Creer un plan flash
      </motion.button>
    </div>
  );
}
