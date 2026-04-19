"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { springs, easings } from "@/lib/motion-design";
import PageHeader from "@/components/ui/PageHeader";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type Phase = "lobby" | "round" | "vote" | "results";

interface SpeedPartner {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  starters: string[];
}

interface RoundResult {
  partnerId: string;
  liked: boolean;
}

// ─────────────────────────────────────────
// Mock partners
// ─────────────────────────────────────────

function photo(gender: "women" | "men", id: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

const MOCK_PARTNERS: SpeedPartner[] = [
  {
    id: "sp1",
    name: "Camille",
    age: 26,
    photo: photo("women", 55),
    bio: "Designer freelance, adore les brunchs et le street art.",
    starters: [
      "Quel est le dernier endroit qui t'a surpris a Paris ?",
      "Cafe ou matcha ?",
      "Si tu pouvais diner avec n'importe qui ce soir ?",
    ],
  },
  {
    id: "sp2",
    name: "Lucas",
    age: 30,
    photo: photo("men", 22),
    bio: "Chef cuisinier, amateur de vins naturels et de randonnee.",
    starters: [
      "Quel plat te rend nostalgique ?",
      "Montagne ou mer pour un weekend ?",
      "Ton restaurant prefere a Paris ?",
    ],
  },
  {
    id: "sp3",
    name: "Lea",
    age: 28,
    photo: photo("women", 33),
    bio: "Journaliste culture, cinephile, toujours un livre dans le sac.",
    starters: [
      "Le dernier film qui t'a marque ?",
      "Quel livre tu recommanderais ce soir ?",
      "Festival ou soiree intime ?",
    ],
  },
  {
    id: "sp4",
    name: "Maxime",
    age: 32,
    photo: photo("men", 45),
    bio: "Architecte, passionne de jazz et de voyages slow.",
    starters: [
      "Quelle ville t'a le plus inspire ?",
      "Jazz ou electro ?",
      "Ton coin secret a Paris ?",
    ],
  },
  {
    id: "sp5",
    name: "Sofia",
    age: 25,
    photo: photo("women", 18),
    bio: "Danseuse contemporaine, fan de marches aux puces et de thes rares.",
    starters: [
      "Quelle est ta derniere trouvaille aux puces ?",
      "Tu danses ou tu regardes ?",
      "The vert ou the noir ?",
    ],
  },
];

// Simulate mutual likes: sp1, sp3 like you back
const MUTUAL_LIKE_IDS = new Set(["sp1", "sp3"]);

const ROUND_DURATION = 300; // 5 minutes in seconds
const LOBBY_COUNTDOWN = 10; // 10 seconds for demo

// ─────────────────────────────────────────
// Variants
// ─────────────────────────────────────────

const partnerCardVariants: Variants = {
  enter: { opacity: 0, scale: 0.8, rotateY: 15 },
  center: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { ...springs.heavy, stiffness: 150 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    rotateY: -15,
    transition: { duration: 0.35, ease: easings.dramatic },
  },
};

const starterVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { ...springs.snap, delay: 0.5 + i * 0.1 },
  }),
};

const resultVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...springs.elastic, delay: i * 0.15 },
  }),
};

// ─────────────────────────────────────────
// Timer display
// ─────────────────────────────────────────

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function SpeedDatingPage() {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [lobbyCount, setLobbyCount] = useState(LOBBY_COUNTDOWN);
  const [currentRound, setCurrentRound] = useState(0);
  const [timer, setTimer] = useState(ROUND_DURATION);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [participantCount, setParticipantCount] = useState(2);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lobby countdown — simulate participants joining
  useEffect(() => {
    if (phase !== "lobby") return;

    const lobbyInterval = setInterval(() => {
      setLobbyCount((prev) => {
        if (prev <= 1) {
          clearInterval(lobbyInterval);
          setPhase("round");
          return 0;
        }
        return prev - 1;
      });

      setParticipantCount((prev) => Math.min(6, prev + (Math.random() > 0.4 ? 1 : 0)));
    }, 1000);

    return () => clearInterval(lobbyInterval);
  }, [phase]);

  // Round timer
  useEffect(() => {
    if (phase !== "round") return;

    setTimer(ROUND_DURATION);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setPhase("vote");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, currentRound]);

  const handleVote = useCallback(
    (liked: boolean) => {
      const partner = MOCK_PARTNERS[currentRound];
      setResults((prev) => [...prev, { partnerId: partner.id, liked }]);

      if (currentRound < MOCK_PARTNERS.length - 1) {
        setCurrentRound((prev) => prev + 1);
        setPhase("round");
      } else {
        setPhase("results");
      }
    },
    [currentRound],
  );

  const skipToVote = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("vote");
  }, []);

  const resetAll = useCallback(() => {
    setPhase("lobby");
    setLobbyCount(LOBBY_COUNTDOWN);
    setCurrentRound(0);
    setTimer(ROUND_DURATION);
    setResults([]);
    setParticipantCount(2);
  }, []);

  const partner = MOCK_PARTNERS[currentRound];
  const timerPct = timer / ROUND_DURATION;
  const timerUrgent = timer <= 60;

  // Compute mutual matches
  const mutualMatches = results
    .filter((r) => r.liked && MUTUAL_LIKE_IDS.has(r.partnerId))
    .map((r) => MOCK_PARTNERS.find((p) => p.id === r.partnerId)!);

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="Speed Dating Virtuel"
        icon={<span className="text-lg" aria-hidden="true">{"\uD83D\uDC95"}</span>}
        actions={
          phase !== "lobby" && phase !== "results" ? (
            <span className="text-[10px] text-accent font-semibold">
              Round {currentRound + 1}/{MOCK_PARTNERS.length}
            </span>
          ) : null
        }
      />

      <AnimatePresence mode="wait">
        {/* ═══ LOBBY ═══ */}
        {phase === "lobby" && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-5 pt-10 flex flex-col items-center"
          >
            {/* Waiting circle */}
            <div className="relative w-40 h-40 mb-8">
              {/* Outer pulse */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-accent/30"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Inner circle */}
              <div className="absolute inset-4 rounded-full bg-card border border-border flex flex-col items-center justify-center">
                <motion.span
                  key={lobbyCount}
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-display font-bold text-accent tabular-nums"
                >
                  {lobbyCount}
                </motion.span>
                <span className="text-[10px] text-text-muted mt-0.5">secondes</span>
              </div>

              {/* Participant dots orbiting */}
              {Array.from({ length: participantCount }).map((_, i) => {
                const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(angle) * 65 + 80;
                const y = Math.sin(angle) * 65 + 80;
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springs.elastic, delay: i * 0.2 }}
                    className="absolute w-8 h-8 rounded-full border-2 border-accent/30 overflow-hidden"
                    style={{ left: x - 16, top: y - 16 }}
                  >
                    <img
                      src={photo(i % 2 === 0 ? "women" : "men", 10 + i * 7)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                );
              })}
            </div>

            <h2 className="text-lg font-display font-bold text-text text-center">
              En attente de participants
            </h2>
            <p className="text-sm text-text-muted text-center mt-2 max-w-xs">
              {participantCount}/6 participants. La session commence dans quelques instants...
            </p>
            <p className="text-xs text-accent mt-3 font-medium">
              5 rounds de 5 minutes chacun
            </p>
          </motion.div>
        )}

        {/* ═══ ROUND ═══ */}
        {phase === "round" && partner && (
          <motion.div
            key={`round-${currentRound}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 pt-6"
          >
            {/* Big timer */}
            <div className="flex flex-col items-center mb-6">
              <motion.div
                className={`text-4xl font-display font-bold tabular-nums ${
                  timerUrgent ? "text-red-400" : "text-text"
                }`}
                animate={timerUrgent ? { scale: [1, 1.05, 1] } : {}}
                transition={timerUrgent ? { duration: 1, repeat: Infinity } : {}}
              >
                {formatTimer(timer)}
              </motion.div>
              {/* Progress bar */}
              <div className="w-full max-w-xs h-1.5 bg-border rounded-full mt-2 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${timerUrgent ? "bg-red-400" : "gradient-bg"}`}
                  style={{ width: `${timerPct * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <button
                onClick={skipToVote}
                className="text-[10px] text-text-muted mt-2 hover:text-accent transition-colors"
              >
                Passer au vote
              </button>
            </div>

            {/* Partner card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={partner.id}
                variants={partnerCardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="bg-card border border-border rounded-3xl overflow-hidden"
              >
                {/* Photo */}
                <div className="relative h-56">
                  <img
                    src={partner.photo}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-display font-bold text-text">
                      {partner.name}, {partner.age}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">{partner.bio}</p>
                  </div>
                  {/* Round badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                    <span className="text-[10px] font-bold text-white">
                      Round {currentRound + 1}
                    </span>
                  </div>
                </div>

                {/* Conversation starters */}
                <div className="p-5">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-3">
                    Sujets de conversation
                  </p>
                  <div className="space-y-2.5">
                    {partner.starters.map((starter, i) => (
                      <motion.div
                        key={i}
                        custom={i}
                        variants={starterVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex items-start gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-text leading-relaxed">{starter}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══ VOTE ═══ */}
        {phase === "vote" && partner && (
          <motion.div
            key={`vote-${currentRound}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.heavy}
            className="px-5 pt-10 flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springs.elastic}
              className="w-20 h-20 rounded-full overflow-hidden border-3 border-accent/30 mb-4"
            >
              <img src={partner.photo} alt={partner.name} className="w-full h-full object-cover" />
            </motion.div>

            <h2 className="text-lg font-display font-bold text-text">
              Qu'as-tu pense de {partner.name} ?
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Ton choix reste secret jusqu'a la fin
            </p>

            <div className="flex gap-4 mt-8">
              {/* Pass */}
              <motion.button
                onClick={() => handleVote(false)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                className="w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center text-2xl shadow-lg"
                aria-label="Passer"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-text-muted" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>

              {/* Like */}
              <motion.button
                onClick={() => handleVote(true)}
                whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(239,68,68,0.4)" }}
                whileTap={{ scale: 0.88 }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/20"
                aria-label="Like"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══ RESULTS ═══ */}
        {phase === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-5 pt-8"
          >
            {/* Summary */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springs.elastic}
                className="text-4xl mb-3"
                aria-hidden="true"
              >
                {mutualMatches.length > 0 ? "\uD83C\uDF89" : "\uD83D\uDC9C"}
              </motion.div>
              <h2 className="text-xl font-display font-bold text-text">
                {mutualMatches.length > 0
                  ? `${mutualMatches.length} match${mutualMatches.length > 1 ? "s" : ""} mutuel${mutualMatches.length > 1 ? "s" : ""} !`
                  : "Session terminee !"}
              </h2>
              <p className="text-sm text-text-muted mt-1">
                {mutualMatches.length > 0
                  ? "Vous vous etes mutuellement likes"
                  : "Aucun match mutuel cette fois, mais ne perds pas espoir !"}
              </p>
            </div>

            {/* Mutual matches */}
            {mutualMatches.length > 0 && (
              <div className="space-y-3 mb-8">
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                  Matchs mutuels
                </p>
                {mutualMatches.map((m, i) => (
                  <motion.div
                    key={m.id}
                    custom={i}
                    variants={resultVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-3 p-3 bg-card border border-accent/30 rounded-2xl"
                  >
                    <div className="relative">
                      <img
                        src={m.photo}
                        alt={m.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <motion.div
                        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full gradient-bg flex items-center justify-center"
                        animate={{
                          scale: [1, 1.2, 1],
                          boxShadow: [
                            "0 0 0px rgba(139,92,246,0)",
                            "0 0 12px rgba(139,92,246,0.6)",
                            "0 0 0px rgba(139,92,246,0)",
                          ],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </motion.div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text">{m.name}, {m.age}</p>
                      <p className="text-xs text-text-muted truncate">{m.bio}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className="px-3 py-1.5 rounded-full gradient-bg text-white text-[11px] font-bold shadow-glow"
                    >
                      Discuter
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* All rounds summary */}
            <div className="space-y-2 mb-8">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                Recap des rounds
              </p>
              {MOCK_PARTNERS.map((p, i) => {
                const result = results.find((r) => r.partnerId === p.id);
                const isMutual = result?.liked && MUTUAL_LIKE_IDS.has(p.id);
                return (
                  <motion.div
                    key={p.id}
                    custom={i + mutualMatches.length}
                    variants={resultVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                  >
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-text flex-1">{p.name}</span>
                    <span className="text-xs">
                      {isMutual ? (
                        <span className="text-[#00FF88] font-bold">Match !</span>
                      ) : result?.liked ? (
                        <span className="text-pink-400">Like</span>
                      ) : (
                        <span className="text-text-muted">Pass</span>
                      )}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Restart */}
            <motion.button
              onClick={resetAll}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-full gradient-bg text-white text-sm font-bold shadow-glow"
            >
              Nouvelle session
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
