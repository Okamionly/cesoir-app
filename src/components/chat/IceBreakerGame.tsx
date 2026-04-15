"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";

// ==========================================================================
// TYPES
// ==========================================================================

export type GameType =
  | "2v1m"
  | "preferes"
  | "question"
  | "preferes-multi"
  | "top3"
  | "emoji-story";

export interface GameData {
  type: GameType;
  payload:
    | TwoTruthsPayload
    | PreferesPayload
    | QuestionPayload
    | PreferesMultiPayload
    | Top3Payload
    | EmojiStoryPayload;
  answered?: boolean;
  result?: string;
}

interface TwoTruthsPayload {
  statements: [string, string, string];
  lieIndex?: number;
  guessIndex?: number;
}

interface PreferesPayload {
  optionA: string;
  optionB: string;
  myChoice?: "A" | "B";
  theirChoice?: "A" | "B";
}

interface QuestionPayload {
  question: string;
  myAnswer?: string;
  theirAnswer?: string;
}

// -- Game 1: "Tu preferes?" multi-round --
interface PreferesMultiPayload {
  questions: { optionA: string; optionB: string }[];
  currentRound: number;
  totalRounds: number;
  myChoices: ("A" | "B")[];
  theirChoices: ("A" | "B")[];
  score: number;
  phase: "playing" | "reveal" | "results";
}

// -- Game 2: "Devine mon top 3" --
type Top3Category = "films" | "chansons" | "plats" | "villes" | "hobbies";
interface Top3Payload {
  category: Top3Category;
  entries: string[];
  guesses: string[];
  currentRound: number;
  totalRounds: number;
  phase: "input" | "guess" | "reveal" | "results";
  rounds: {
    category: Top3Category;
    entries: string[];
    guesses: string[];
  }[];
}

// -- Game 4: "Emoji Story" --
interface EmojiStoryPayload {
  emojis: string[];
  guess: string;
  phase: "compose" | "guess" | "reveal";
}

// ==========================================================================
// DATA
// ==========================================================================

const PREFERES_QUESTIONS: { optionA: string; optionB: string }[] = [
  { optionA: "Voyager dans le passe", optionB: "Voyager dans le futur" },
  { optionA: "Pizza a vie", optionB: "Sushi a vie" },
  { optionA: "Superpouvoir : voler", optionB: "Superpouvoir : etre invisible" },
  { optionA: "Vivre a la montagne", optionB: "Vivre au bord de la mer" },
  { optionA: "Ne plus jamais dormir", optionB: "Ne plus jamais manger" },
  { optionA: "Etre celebre", optionB: "Etre richissime anonymement" },
  { optionA: "Parler toutes les langues", optionB: "Jouer de tous les instruments" },
  { optionA: "Netflix & chill", optionB: "Sortir danser" },
  { optionA: "Plage au coucher de soleil", optionB: "Rando en montagne" },
  { optionA: "Cuisiner ensemble", optionB: "Commander et mater un film" },
  { optionA: "Petit-dej au lit", optionB: "Brunch en ville" },
  { optionA: "Voyager en Europe", optionB: "Voyager en Asie" },
  { optionA: "Etre un chat", optionB: "Etre un dauphin" },
  { optionA: "Toujours avoir chaud", optionB: "Toujours avoir froid" },
  { optionA: "Premier rdv en terrasse", optionB: "Premier rdv au musee" },
];

const TOP3_CATEGORIES: { key: Top3Category; label: string; emoji: string }[] = [
  { key: "films", label: "Films", emoji: "🎬" },
  { key: "chansons", label: "Chansons", emoji: "🎵" },
  { key: "plats", label: "Plats", emoji: "🍝" },
  { key: "villes", label: "Villes", emoji: "🏙" },
  { key: "hobbies", label: "Hobbies", emoji: "🎯" },
];

const EMOJI_PALETTE = [
  "😂", "😍", "🥺", "🔥", "💀", "🎉", "😱", "🤔",
  "💃", "🕺", "🌙", "☀️", "🌊", "🏖", "🍕", "🍷",
  "✈️", "🚗", "🎸", "📱", "💐", "🐶", "🐱", "🦋",
  "💎", "🎭", "🎪", "🏠", "🌈", "⭐", "❤️", "💔",
  "🤝", "👀", "🙈", "💤", "🎮", "📚", "🎬", "🎵",
];

const RANDOM_QUESTIONS = [
  "Quel est ton plus beau souvenir de vacances ?",
  "Si tu pouvais diner avec une personne, qui ce serait ?",
  "Quel est ton guilty pleasure musical ?",
  "Tu preferes le matin ou le soir ?",
  "Quel est le truc le plus spontane que tu aies fait ?",
  "Si tu devais vivre dans un film, lequel ?",
  "Quel est ton plat signature en cuisine ?",
  "Le dernier truc qui t'a fait rire aux larmes ?",
];

// ==========================================================================
// HELPERS
// ==========================================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function simulateTheirChoice(): "A" | "B" {
  return Math.random() > 0.5 ? "A" : "B";
}

// ==========================================================================
// IceBreakerButton  -- game selector bottom sheet
// ==========================================================================

interface IceBreakerButtonProps {
  onStartGame: (game: GameData) => void;
}

export function IceBreakerButton({ onStartGame }: IceBreakerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [statements, setStatements] = useState(["", "", ""]);

  const handleStart = useCallback(() => {
    if (selectedGame === "2v1m") {
      if (statements.some((s) => !s.trim())) return;
      const lieIndex = Math.floor(Math.random() * 3);
      onStartGame({
        type: "2v1m",
        payload: {
          statements: statements.map((s) => s.trim()) as [string, string, string],
          lieIndex,
        },
      });
    } else if (selectedGame === "preferes") {
      const pair = PREFERES_QUESTIONS[Math.floor(Math.random() * PREFERES_QUESTIONS.length)];
      onStartGame({
        type: "preferes",
        payload: { optionA: pair.optionA, optionB: pair.optionB },
      });
    } else if (selectedGame === "question") {
      const q = RANDOM_QUESTIONS[Math.floor(Math.random() * RANDOM_QUESTIONS.length)];
      onStartGame({
        type: "question",
        payload: { question: q },
      });
    } else if (selectedGame === "preferes-multi") {
      const questions = pickRandom(PREFERES_QUESTIONS, 5);
      onStartGame({
        type: "preferes-multi",
        payload: {
          questions,
          currentRound: 0,
          totalRounds: 5,
          myChoices: [],
          theirChoices: [],
          score: 0,
          phase: "playing",
        },
      });
    } else if (selectedGame === "top3") {
      const cats = pickRandom(TOP3_CATEGORIES, 3);
      onStartGame({
        type: "top3",
        payload: {
          category: cats[0].key,
          entries: [],
          guesses: [],
          currentRound: 0,
          totalRounds: 3,
          phase: "input",
          rounds: cats.map((c) => ({
            category: c.key,
            entries: [],
            guesses: [],
          })),
        },
      });
    } else if (selectedGame === "emoji-story") {
      onStartGame({
        type: "emoji-story",
        payload: {
          emojis: [],
          guess: "",
          phase: "compose",
        },
      });
    }
    setIsOpen(false);
    setSelectedGame(null);
    setStatements(["", "", ""]);
  }, [selectedGame, statements, onStartGame]);

  const games: {
    type: GameType;
    emoji: string;
    title: string;
    desc: string;
    auto?: boolean;
  }[] = [
    {
      type: "preferes-multi",
      emoji: "⚡",
      title: "Tu preferes ?",
      desc: "5 rounds, devine ce que l'autre choisit",
    },
    {
      type: "top3",
      emoji: "🏆",
      title: "Devine mon top 3",
      desc: "Films, chansons, plats... devine le top 3",
    },
    {
      type: "2v1m",
      emoji: "🤥",
      title: "2 Verites 1 Mensonge",
      desc: "Ecris 3 affirmations, l'autre devine",
    },
    {
      type: "emoji-story",
      emoji: "📖",
      title: "Emoji Story",
      desc: "Raconte une histoire en 5 emojis",
    },
    {
      type: "preferes",
      emoji: "🎲",
      title: "Ce soir tu preferes...",
      desc: "Un duel rapide, chacun choisit",
      auto: true,
    },
    {
      type: "question",
      emoji: "💬",
      title: "Question Random",
      desc: "Une question fun au hasard",
      auto: true,
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="tap-target shrink-0 w-11 h-11 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-colors active:scale-95"
        aria-label="Jeu brise-glace"
      >
        <span className="text-lg">🎮</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => {
                setIsOpen(false);
                setSelectedGame(null);
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-bg rounded-t-2xl border-t border-border"
              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
              role="dialog"
              aria-label="Choisir un jeu"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="px-5 pb-4 max-h-[70vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-text mb-4">Brise-glace</h3>

                {/* ---------- Game list ---------- */}
                {!selectedGame && (
                  <div className="flex flex-col gap-2">
                    {games.map((g) => (
                      <button
                        key={g.type}
                        onClick={() => {
                          if (g.auto) {
                            setSelectedGame(g.type);
                            // auto-launch after a tick so the user sees the confirmation
                          } else {
                            setSelectedGame(g.type);
                          }
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border hover:border-accent/30 transition-colors text-left"
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <div>
                          <p className="font-semibold text-[14px] text-text">{g.title}</p>
                          <p className="text-[12px] text-text-muted">{g.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* ---------- 2 Verites 1 Mensonge input ---------- */}
                {selectedGame === "2v1m" && (
                  <div>
                    <p className="text-[13px] text-text-muted mb-3">
                      Ecris 2 verites et 1 mensonge :
                    </p>
                    {statements.map((s, i) => (
                      <input
                        key={i}
                        type="text"
                        value={s}
                        onChange={(e) => {
                          const next = [...statements];
                          next[i] = e.target.value;
                          setStatements(next);
                        }}
                        placeholder={`Affirmation ${i + 1}`}
                        className="w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 mb-2"
                      />
                    ))}
                    <button
                      onClick={handleStart}
                      disabled={statements.some((s) => !s.trim())}
                      className="w-full py-3 rounded-2xl gradient-bg text-white font-bold text-[15px] mt-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
                    >
                      Envoyer
                    </button>
                  </div>
                )}

                {/* ---------- Quick-launch confirmations ---------- */}
                {selectedGame === "preferes" && (
                  <div>
                    <p className="text-[13px] text-text-muted mb-3">
                      Un duel aleatoire va etre envoye !
                    </p>
                    <button
                      onClick={handleStart}
                      className="w-full py-3 rounded-2xl gradient-bg text-white font-bold text-[15px] active:scale-[0.98] transition-transform"
                    >
                      Lancer le duel
                    </button>
                  </div>
                )}

                {selectedGame === "question" && (
                  <div>
                    <p className="text-[13px] text-text-muted mb-3">
                      Une question fun va etre envoyee !
                    </p>
                    <button
                      onClick={handleStart}
                      className="w-full py-3 rounded-2xl gradient-bg text-white font-bold text-[15px] active:scale-[0.98] transition-transform"
                    >
                      Poser la question
                    </button>
                  </div>
                )}

                {selectedGame === "preferes-multi" && (
                  <div>
                    <p className="text-[13px] text-text-muted mb-3">
                      5 rounds de &laquo; Tu preferes ? &raquo; -- reponds et decouvre si vous
                      pensez pareil !
                    </p>
                    <button
                      onClick={handleStart}
                      className="w-full py-3 rounded-2xl gradient-bg text-white font-bold text-[15px] active:scale-[0.98] transition-transform"
                    >
                      Jouer
                    </button>
                  </div>
                )}

                {selectedGame === "top3" && (
                  <div>
                    <p className="text-[13px] text-text-muted mb-3">
                      3 categories au hasard -- entre ton top 3, l'autre doit deviner !
                    </p>
                    <button
                      onClick={handleStart}
                      className="w-full py-3 rounded-2xl gradient-bg text-white font-bold text-[15px] active:scale-[0.98] transition-transform"
                    >
                      C'est parti
                    </button>
                  </div>
                )}

                {selectedGame === "emoji-story" && (
                  <div>
                    <p className="text-[13px] text-text-muted mb-3">
                      Compose une histoire avec 5 emojis -- l'autre devine ce que tu racontes !
                    </p>
                    <button
                      onClick={handleStart}
                      className="w-full py-3 rounded-2xl gradient-bg text-white font-bold text-[15px] active:scale-[0.98] transition-transform"
                    >
                      Composer
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ==========================================================================
// GAME CARD -- renders the right sub-game in chat
// ==========================================================================

interface GameCardProps {
  game: GameData;
  isOwn: boolean;
  time: string;
  onInteract?: (answer: string) => void;
}

export function GameCard({ game, isOwn, time, onInteract }: GameCardProps) {
  switch (game.type) {
    case "preferes-multi":
      return (
        <PreferesMultiCard
          payload={game.payload as PreferesMultiPayload}
          isOwn={isOwn}
          time={time}
          onInteract={onInteract}
        />
      );
    case "top3":
      return (
        <Top3Card
          payload={game.payload as Top3Payload}
          isOwn={isOwn}
          time={time}
          onInteract={onInteract}
        />
      );
    case "2v1m":
      return (
        <TwoTruthsCard
          payload={game.payload as TwoTruthsPayload}
          isOwn={isOwn}
          time={time}
          onInteract={onInteract}
        />
      );
    case "emoji-story":
      return (
        <EmojiStoryCard
          payload={game.payload as EmojiStoryPayload}
          isOwn={isOwn}
          time={time}
          onInteract={onInteract}
        />
      );
    case "preferes":
      return (
        <SinglePreferesCard
          payload={game.payload as PreferesPayload}
          isOwn={isOwn}
          time={time}
          onInteract={onInteract}
        />
      );
    case "question":
      return (
        <QuestionCardInner
          question={(game.payload as QuestionPayload).question}
          isOwn={isOwn}
          time={time}
          onInteract={onInteract}
        />
      );
    default:
      return null;
  }
}

// ==========================================================================
// GAME 1: "Tu preferes ?" -- 5 rounds
// ==========================================================================

function PreferesMultiCard({
  payload: initial,
  isOwn,
  time,
  onInteract,
}: {
  payload: PreferesMultiPayload;
  isOwn: boolean;
  time: string;
  onInteract?: (answer: string) => void;
}) {
  const [state, setState] = useState<PreferesMultiPayload>(initial);
  const [animateReveal, setAnimateReveal] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [glowRight, setGlowRight] = useState(false);

  const q = state.questions[state.currentRound];

  const handleChoice = (choice: "A" | "B") => {
    if (state.phase !== "playing") return;
    const theirChoice = simulateTheirChoice();
    const match = choice === theirChoice;
    const newMyChoices = [...state.myChoices, choice];
    const newTheirChoices = [...state.theirChoices, theirChoice];
    const newScore = state.score + (match ? 1 : 0);

    setState((s) => ({
      ...s,
      myChoices: newMyChoices,
      theirChoices: newTheirChoices,
      score: newScore,
      phase: "reveal",
    }));

    setAnimateReveal(true);
    if (match) {
      setGlowRight(true);
      setTimeout(() => setGlowRight(false), 1200);
    } else {
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 600);
    }

    onInteract?.(choice);

    // Auto-advance after reveal
    setTimeout(() => {
      setAnimateReveal(false);
      const nextRound = state.currentRound + 1;
      if (nextRound >= state.totalRounds) {
        setState((s) => ({ ...s, phase: "results" }));
      } else {
        setState((s) => ({
          ...s,
          currentRound: nextRound,
          phase: "playing",
        }));
      }
    }, 2200);
  };

  const handleReplay = () => {
    const questions = pickRandom(PREFERES_QUESTIONS, 5);
    setState({
      questions,
      currentRound: 0,
      totalRounds: 5,
      myChoices: [],
      theirChoices: [],
      score: 0,
      phase: "playing",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.cinematic}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
    >
      <div className="max-w-[85%] w-full rounded-2xl bg-bg-card border border-border p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] text-accent font-semibold">
            ⚡ Tu preferes ?
          </p>
          {state.phase !== "results" && (
            <motion.span
              key={state.score}
              initial={{ scale: 1.6 }}
              animate={{ scale: 1 }}
              transition={springs.snap}
              className="text-[12px] font-bold text-accent"
            >
              {state.score} pt{state.score !== 1 ? "s" : ""}
            </motion.span>
          )}
        </div>

        {/* Intro screen */}
        {state.phase === "playing" && !animateReveal && q && (
          <motion.div
            key={`round-${state.currentRound}`}
            initial={{ opacity: 0, x: 40, rotateY: 15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={springs.elastic}
          >
            <p className="text-[12px] text-text-muted mb-2">
              Round {state.currentRound + 1}/{state.totalRounds}
            </p>
            <p className="text-[14px] font-semibold text-text mb-3">
              Tu preferes...
            </p>
            <div className="flex flex-col gap-2">
              {(["A", "B"] as const).map((c) => {
                const label = c === "A" ? q.optionA : q.optionB;
                return (
                  <motion.button
                    key={c}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChoice(c)}
                    className="text-left px-4 py-3 rounded-xl text-[13px] border border-border bg-bg text-text hover:border-accent/30 transition-colors"
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Reveal phase */}
        {state.phase === "reveal" && animateReveal && q && (
          <motion.div
            animate={shakeWrong ? micro.shake : {}}
            className="relative"
          >
            <p className="text-[12px] text-text-muted mb-2">
              Round {state.currentRound + 1}/{state.totalRounds}
            </p>
            <div className="flex flex-col gap-2">
              {(["A", "B"] as const).map((c) => {
                const label = c === "A" ? q.optionA : q.optionB;
                const isMine = state.myChoices[state.myChoices.length - 1] === c;
                const isTheirs = state.theirChoices[state.theirChoices.length - 1] === c;
                const match = isMine && isTheirs;
                return (
                  <motion.div
                    key={c}
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    transition={springs.elastic}
                    className={`relative px-4 py-3 rounded-xl text-[13px] border transition-all ${
                      match
                        ? "bg-safe/10 border-safe/40 text-safe"
                        : isMine
                          ? "gradient-bg text-white border-transparent"
                          : isTheirs
                            ? "bg-accent/10 border-accent/30 text-accent"
                            : "bg-bg border-border text-text-muted"
                    }`}
                    style={
                      glowRight && match
                        ? {
                            boxShadow: "0 0 20px rgba(0,255,136,0.4)",
                          }
                        : undefined
                    }
                  >
                    {label}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold">
                      {isMine && isTheirs
                        ? "Vous deux !"
                        : isMine
                          ? "Toi"
                          : isTheirs
                            ? "L'autre"
                            : ""}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-[13px] font-bold mt-3 text-center ${
                state.myChoices[state.myChoices.length - 1] ===
                state.theirChoices[state.theirChoices.length - 1]
                  ? "text-safe"
                  : "text-danger"
              }`}
            >
              {state.myChoices[state.myChoices.length - 1] ===
              state.theirChoices[state.theirChoices.length - 1]
                ? "Match ! +1 pt"
                : "Pas pareil !"}
            </motion.p>
          </motion.div>
        )}

        {/* Results */}
        {state.phase === "results" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.elastic}
            className="text-center py-2"
          >
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springs.elastic}
              className="text-4xl mb-2"
            >
              {state.score >= 4 ? "🔥" : state.score >= 2 ? "✨" : "😅"}
            </motion.p>
            <p className="text-[18px] font-bold text-text">
              {state.score}/{state.totalRounds}
            </p>
            <p className="text-[13px] text-text-muted mt-1">
              {state.score >= 4
                ? "Vous pensez pareil !"
                : state.score >= 2
                  ? "Pas mal, y'a du potentiel"
                  : "Les opposes s'attirent..."}
            </p>
            {/* Round recap */}
            <div className="mt-3 flex flex-col gap-1">
              {state.questions.slice(0, state.totalRounds).map((rq, i) => {
                const mine = state.myChoices[i];
                const theirs = state.theirChoices[i];
                const match = mine === theirs;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-2 text-[11px] px-2 py-1 rounded-lg ${
                      match ? "bg-safe/10 text-safe" : "bg-danger/10 text-danger"
                    }`}
                  >
                    <span>{match ? "✓" : "✗"}</span>
                    <span className="truncate">
                      {mine === "A" ? rq.optionA : rq.optionB}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReplay}
              className="mt-4 px-6 py-2.5 rounded-2xl gradient-bg text-white font-bold text-[13px] active:scale-[0.98] transition-transform"
            >
              Rejouer
            </motion.button>
          </motion.div>
        )}

        <span className="block text-[10px] text-text-muted mt-3 text-right">{time}</span>
      </div>
    </motion.div>
  );
}

// ==========================================================================
// GAME 2: "Devine mon top 3"
// ==========================================================================

function Top3Card({
  payload: initial,
  isOwn,
  time,
  onInteract,
}: {
  payload: Top3Payload;
  isOwn: boolean;
  time: string;
  onInteract?: (answer: string) => void;
}) {
  const [state, setState] = useState<Top3Payload>(initial);
  const [inputs, setInputs] = useState(["", "", ""]);
  const [guessInputs, setGuessInputs] = useState(["", "", ""]);

  const currentRoundData = state.rounds[state.currentRound];
  const catInfo = TOP3_CATEGORIES.find((c) => c.key === currentRoundData?.category);

  const handleSubmitEntries = () => {
    if (inputs.some((i) => !i.trim())) return;
    const updated = [...state.rounds];
    updated[state.currentRound] = {
      ...updated[state.currentRound],
      entries: inputs.map((i) => i.trim()),
    };
    setState((s) => ({ ...s, rounds: updated, phase: "guess" }));
    setInputs(["", "", ""]);
    onInteract?.(JSON.stringify(inputs));
  };

  const handleSubmitGuesses = () => {
    if (guessInputs.some((g) => !g.trim())) return;
    const updated = [...state.rounds];
    updated[state.currentRound] = {
      ...updated[state.currentRound],
      guesses: guessInputs.map((g) => g.trim()),
    };
    setState((s) => ({ ...s, rounds: updated, phase: "reveal" }));
    setGuessInputs(["", "", ""]);
    onInteract?.(JSON.stringify(guessInputs));
  };

  const handleNext = () => {
    const nextRound = state.currentRound + 1;
    if (nextRound >= state.totalRounds) {
      setState((s) => ({ ...s, phase: "results" }));
    } else {
      setState((s) => ({
        ...s,
        currentRound: nextRound,
        phase: "input",
      }));
    }
  };

  const handleReplay = () => {
    const cats = pickRandom(TOP3_CATEGORIES, 3);
    setState({
      category: cats[0].key,
      entries: [],
      guesses: [],
      currentRound: 0,
      totalRounds: 3,
      phase: "input",
      rounds: cats.map((c) => ({
        category: c.key,
        entries: [],
        guesses: [],
      })),
    });
  };

  // Simulate the other person's top 3 for demo
  const simulatedEntries = useMemo(
    () =>
      currentRoundData?.entries.length > 0
        ? currentRoundData.entries
        : ["Surprise 1", "Surprise 2", "Surprise 3"],
    [currentRoundData],
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.cinematic}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
    >
      <div className="max-w-[85%] w-full rounded-2xl bg-bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] text-accent font-semibold">
            🏆 Devine mon top 3
          </p>
          <span className="text-[12px] text-text-muted">
            {state.currentRound + 1}/{state.totalRounds}
          </span>
        </div>

        {/* Input phase */}
        {state.phase === "input" && catInfo && (
          <motion.div
            key={`input-${state.currentRound}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.cinematic}
          >
            <p className="text-[14px] font-semibold text-text mb-1">
              {catInfo.emoji} Top 3 {catInfo.label}
            </p>
            <p className="text-[12px] text-text-muted mb-3">
              Entre ton top 3, l'autre va deviner !
            </p>
            {inputs.map((v, i) => (
              <input
                key={i}
                type="text"
                value={v}
                onChange={(e) => {
                  const next = [...inputs];
                  next[i] = e.target.value;
                  setInputs(next);
                }}
                placeholder={`#${i + 1}`}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 mb-2"
              />
            ))}
            <button
              onClick={handleSubmitEntries}
              disabled={inputs.some((i) => !i.trim())}
              className="w-full py-2.5 rounded-2xl gradient-bg text-white font-bold text-[13px] mt-1 disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Valider
            </button>
          </motion.div>
        )}

        {/* Guess phase */}
        {state.phase === "guess" && catInfo && (
          <motion.div
            key={`guess-${state.currentRound}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.elastic}
          >
            <p className="text-[14px] font-semibold text-text mb-1">
              {catInfo.emoji} Devine son top 3 {catInfo.label}
            </p>
            <p className="text-[12px] text-text-muted mb-3">
              A toi de deviner !
            </p>
            {guessInputs.map((v, i) => (
              <input
                key={i}
                type="text"
                value={v}
                onChange={(e) => {
                  const next = [...guessInputs];
                  next[i] = e.target.value;
                  setGuessInputs(next);
                }}
                placeholder={`Guess #${i + 1}`}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 mb-2"
              />
            ))}
            <button
              onClick={handleSubmitGuesses}
              disabled={guessInputs.some((g) => !g.trim())}
              className="w-full py-2.5 rounded-2xl gradient-bg text-white font-bold text-[13px] mt-1 disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Deviner
            </button>
          </motion.div>
        )}

        {/* Reveal phase */}
        {state.phase === "reveal" && catInfo && (
          <motion.div
            key={`reveal-${state.currentRound}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-[14px] font-semibold text-text mb-3">
              {catInfo.emoji} Resultats {catInfo.label}
            </p>
            <div className="flex flex-col gap-2">
              {simulatedEntries.map((entry, i) => {
                const guess = currentRoundData?.guesses[i] ?? "";
                const isMatch =
                  guess.toLowerCase().trim() === entry.toLowerCase().trim();
                return (
                  <motion.div
                    key={i}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ ...springs.elastic, delay: i * 0.25 }}
                    style={{ perspective: "600px" }}
                  >
                    <div
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                        isMatch
                          ? "bg-safe/10 border-safe/30"
                          : "bg-bg border-border"
                      }`}
                    >
                      <div>
                        <p className="text-[12px] text-text-muted">
                          #{i + 1}
                        </p>
                        <p className="text-[13px] font-semibold text-text">
                          {entry}
                        </p>
                        {guess && (
                          <p className="text-[11px] text-text-muted">
                            Ta reponse : {guess}
                          </p>
                        )}
                      </div>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          ...springs.elastic,
                          delay: i * 0.25 + 0.3,
                        }}
                        className="text-xl"
                      >
                        {isMatch ? "✅" : "❌"}
                      </motion.span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="w-full mt-3 py-2.5 rounded-2xl gradient-bg text-white font-bold text-[13px] active:scale-[0.98] transition-transform"
            >
              {state.currentRound + 1 >= state.totalRounds
                ? "Voir les resultats"
                : "Categorie suivante"}
            </motion.button>
          </motion.div>
        )}

        {/* Final results */}
        {state.phase === "results" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.elastic}
            className="text-center py-2"
          >
            <motion.p
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={springs.elastic}
              className="text-4xl mb-2"
            >
              🏆
            </motion.p>
            <p className="text-[16px] font-bold text-text mb-1">
              Partie terminee !
            </p>
            <div className="mt-3 flex flex-col gap-1">
              {state.rounds.map((r, i) => {
                const cat = TOP3_CATEGORIES.find((c) => c.key === r.category);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-center gap-2 text-[12px] px-2 py-1.5 rounded-lg bg-bg border border-border"
                  >
                    <span>{cat?.emoji}</span>
                    <span className="font-semibold text-text">
                      {cat?.label}
                    </span>
                    <span className="ml-auto text-text-muted">
                      {r.entries.join(", ")}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReplay}
              className="mt-4 px-6 py-2.5 rounded-2xl gradient-bg text-white font-bold text-[13px] active:scale-[0.98] transition-transform"
            >
              Rejouer
            </motion.button>
          </motion.div>
        )}

        <span className="block text-[10px] text-text-muted mt-3 text-right">
          {time}
        </span>
      </div>
    </motion.div>
  );
}

// ==========================================================================
// GAME 3: "2 Verites 1 Mensonge" -- improved with animations
// ==========================================================================

function TwoTruthsCard({
  payload,
  isOwn,
  time,
  onInteract,
}: {
  payload: TwoTruthsPayload;
  isOwn: boolean;
  time: string;
  onInteract?: (answer: string) => void;
}) {
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (localAnswer && !showResult) {
      const timer = setTimeout(() => {
        setShowResult(true);
        if (localAnswer !== String(payload.lieIndex)) {
          setShaking(true);
          setTimeout(() => setShaking(false), 500);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [localAnswer, showResult, payload.lieIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.cinematic}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
    >
      <motion.div
        animate={shaking ? micro.shake : {}}
        className="max-w-[85%] rounded-2xl bg-bg-card border border-border p-3.5"
      >
        <p className="text-[11px] text-accent font-semibold mb-2">
          🤥 2 Verites 1 Mensonge
        </p>
        <div className="flex flex-col gap-1.5">
          {payload.statements.map((s, i) => {
            const isGuessed = localAnswer === String(i);
            const isLie = showResult && i === payload.lieIndex;
            const isTruth = showResult && i !== payload.lieIndex;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.elastic, delay: i * 0.1 }}
                whileTap={!localAnswer && !isOwn ? { scale: 0.95 } : undefined}
                onClick={() => {
                  if (!localAnswer && !isOwn) {
                    setLocalAnswer(String(i));
                    onInteract?.(String(i));
                  }
                }}
                disabled={!!localAnswer || isOwn}
                className={`text-left px-3 py-2.5 rounded-xl text-[13px] border transition-all ${
                  isLie
                    ? "bg-danger/10 border-danger/30 text-danger font-semibold"
                    : isTruth
                      ? "bg-safe/10 border-safe/30 text-safe"
                      : isGuessed
                        ? "gradient-bg text-white border-transparent"
                        : "bg-bg border-border text-text hover:border-accent/30"
                } ${localAnswer || isOwn ? "cursor-default" : ""}`}
                style={
                  isLie
                    ? { boxShadow: "0 0 15px rgba(239,68,68,0.3)" }
                    : glowStyle(isTruth)
                }
              >
                <span className="flex items-center gap-2">
                  {showResult && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={springs.elastic}
                    >
                      {isLie ? "❌" : "✅"}
                    </motion.span>
                  )}
                  {s}
                  {isLie && " -- Mensonge !"}
                </span>
              </motion.button>
            );
          })}
        </div>
        {showResult && localAnswer && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.elastic}
            className={`text-[12px] font-semibold mt-2 text-center ${
              localAnswer === String(payload.lieIndex)
                ? "text-safe"
                : "text-danger"
            }`}
          >
            {localAnswer === String(payload.lieIndex)
              ? "Bien joue ! Tu as trouve !"
              : "Rate ! C'etait l'autre..."}
          </motion.p>
        )}
        <span className="block text-[10px] text-text-muted mt-2 text-right">
          {time}
        </span>
      </motion.div>
    </motion.div>
  );
}

function glowStyle(show: boolean): React.CSSProperties | undefined {
  return show ? { boxShadow: "0 0 12px rgba(0,255,136,0.25)" } : undefined;
}

// ==========================================================================
// GAME 4: "Emoji Story"
// ==========================================================================

function EmojiStoryCard({
  payload: initial,
  isOwn,
  time,
  onInteract,
}: {
  payload: EmojiStoryPayload;
  isOwn: boolean;
  time: string;
  onInteract?: (answer: string) => void;
}) {
  const [state, setState] = useState<EmojiStoryPayload>(initial);
  const [selected, setSelected] = useState<string[]>([]);
  const [guessText, setGuessText] = useState("");

  const handleSelectEmoji = (emoji: string) => {
    if (selected.length >= 5) return;
    setSelected((prev) => [...prev, emoji]);
  };

  const handleRemoveEmoji = (index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendStory = () => {
    if (selected.length !== 5) return;
    setState((s) => ({ ...s, emojis: selected, phase: "guess" }));
    onInteract?.(selected.join(""));
  };

  const handleGuess = () => {
    if (!guessText.trim()) return;
    setState((s) => ({ ...s, guess: guessText.trim(), phase: "reveal" }));
    onInteract?.(guessText.trim());
  };

  const handleReplay = () => {
    setSelected([]);
    setGuessText("");
    setState({ emojis: [], guess: "", phase: "compose" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.cinematic}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
    >
      <div className="max-w-[85%] w-full rounded-2xl bg-bg-card border border-border p-4">
        <p className="text-[11px] text-accent font-semibold mb-3">
          📖 Emoji Story
        </p>

        {/* Compose phase */}
        {state.phase === "compose" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.elastic}
          >
            <p className="text-[13px] text-text mb-2">
              Raconte une histoire en 5 emojis :
            </p>

            {/* Selected emojis display */}
            <div className="flex gap-2 mb-3 min-h-[48px] items-center justify-center bg-bg rounded-xl border border-border px-3 py-2">
              {selected.length === 0 && (
                <span className="text-[12px] text-text-muted">
                  Choisis 5 emojis...
                </span>
              )}
              <AnimatePresence mode="popLayout">
                {selected.map((emoji, i) => (
                  <motion.button
                    key={`${emoji}-${i}`}
                    layout
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={springs.elastic}
                    onClick={() => handleRemoveEmoji(i)}
                    className="text-2xl hover:opacity-60 transition-opacity"
                    title="Cliquer pour retirer"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Emoji palette */}
            <div className="grid grid-cols-8 gap-1 mb-3">
              {EMOJI_PALETTE.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => handleSelectEmoji(emoji)}
                  disabled={selected.length >= 5}
                  className="text-xl p-1 rounded-lg hover:bg-bg transition-colors disabled:opacity-30"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>

            <button
              onClick={handleSendStory}
              disabled={selected.length !== 5}
              className="w-full py-2.5 rounded-2xl gradient-bg text-white font-bold text-[13px] disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Envoyer l'histoire ({selected.length}/5)
            </button>
          </motion.div>
        )}

        {/* Guess phase */}
        {state.phase === "guess" && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.elastic}
          >
            <p className="text-[13px] text-text-muted mb-3">
              Devine l'histoire :
            </p>
            <div className="flex gap-3 justify-center mb-4">
              {state.emojis.map((emoji, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...springs.elastic, delay: i * 0.15 }}
                  className="text-3xl"
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={guessText}
                onChange={(e) => setGuessText(e.target.value)}
                placeholder="C'est l'histoire de..."
                className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <button
                onClick={handleGuess}
                disabled={!guessText.trim()}
                className="px-4 py-2 rounded-xl gradient-bg text-white text-[13px] font-semibold disabled:opacity-40 active:scale-95 transition-transform"
              >
                OK
              </button>
            </div>
          </motion.div>
        )}

        {/* Reveal phase */}
        {state.phase === "reveal" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="flex gap-3 justify-center mb-3">
              {state.emojis.map((emoji, i) => (
                <motion.span
                  key={i}
                  initial={{ rotateY: 180, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ ...springs.elastic, delay: i * 0.12 }}
                  className="text-3xl"
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-accent/5 border border-accent/15 rounded-xl px-4 py-3 mb-3"
            >
              <p className="text-[11px] text-accent font-semibold mb-1">
                Son interpretation :
              </p>
              <p className="text-[14px] text-text font-medium">
                &laquo; {state.guess} &raquo;
              </p>
            </motion.div>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springs.elastic, delay: 0.9 }}
              className="text-2xl mb-2"
            >
              😂
            </motion.p>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReplay}
              className="mt-2 px-6 py-2.5 rounded-2xl gradient-bg text-white font-bold text-[13px] active:scale-[0.98] transition-transform"
            >
              Rejouer
            </motion.button>
          </motion.div>
        )}

        <span className="block text-[10px] text-text-muted mt-3 text-right">
          {time}
        </span>
      </div>
    </motion.div>
  );
}

// ==========================================================================
// LEGACY: Single "Ce soir tu preferes" card
// ==========================================================================

function SinglePreferesCard({
  payload,
  isOwn,
  time,
  onInteract,
}: {
  payload: PreferesPayload;
  isOwn: boolean;
  time: string;
  onInteract?: (answer: string) => void;
}) {
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (localAnswer && !showResult) {
      const timer = setTimeout(() => setShowResult(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [localAnswer, showResult]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
    >
      <div className="max-w-[85%] rounded-2xl bg-bg-card border border-border p-3.5">
        <p className="text-[11px] text-accent font-semibold mb-2">
          ⚡ Ce soir tu preferes...
        </p>
        <div className="flex flex-col gap-1.5">
          {(["A", "B"] as const).map((choice) => {
            const label =
              choice === "A" ? payload.optionA : payload.optionB;
            const isSelected = localAnswer === choice;
            return (
              <button
                key={choice}
                onClick={() => {
                  if (!localAnswer) {
                    setLocalAnswer(choice);
                    onInteract?.(choice);
                  }
                }}
                disabled={!!localAnswer}
                className={`text-left px-3 py-2.5 rounded-xl text-[13px] border transition-all ${
                  isSelected
                    ? "gradient-bg text-white border-transparent"
                    : showResult
                      ? "bg-accent/5 border-accent/20 text-text"
                      : "bg-bg border-border text-text hover:border-accent/30"
                } ${localAnswer ? "cursor-default" : ""}`}
              >
                {label}
                {showResult && isSelected && " -- Ton choix"}
              </button>
            );
          })}
        </div>
        {showResult && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[12px] text-accent font-semibold mt-2"
          >
            Reponse envoyee !
          </motion.p>
        )}
        <span className="block text-[10px] text-text-muted mt-2 text-right">
          {time}
        </span>
      </div>
    </motion.div>
  );
}

// ==========================================================================
// LEGACY: Question Random card
// ==========================================================================

function QuestionCardInner({
  question,
  isOwn,
  time,
  onInteract,
}: {
  question: string;
  isOwn: boolean;
  time: string;
  onInteract?: (answer: string) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (localAnswer && !showResult) {
      const timer = setTimeout(() => setShowResult(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [localAnswer, showResult]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
    >
      <div className="max-w-[85%] rounded-2xl bg-bg-card border border-border p-3.5">
        <p className="text-[11px] text-accent font-semibold mb-2">
          🎲 Question Random
        </p>
        <p className="text-[14px] font-semibold text-text mb-3">{question}</p>
        {!localAnswer ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ta reponse..."
              className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
            <button
              onClick={() => {
                if (inputVal.trim()) {
                  setLocalAnswer(inputVal.trim());
                  onInteract?.(inputVal.trim());
                }
              }}
              disabled={!inputVal.trim()}
              className="px-3 py-2 rounded-xl gradient-bg text-white text-[13px] font-semibold disabled:opacity-40 active:scale-95 transition-transform"
            >
              OK
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-accent/5 border border-accent/15 rounded-xl px-3 py-2 mb-1.5">
              <p className="text-[11px] text-accent font-semibold">Toi</p>
              <p className="text-[13px] text-text">{localAnswer}</p>
            </div>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg border border-border rounded-xl px-3 py-2"
              >
                <p className="text-[11px] text-text-muted font-semibold">
                  L'autre
                </p>
                <p className="text-[13px] text-text">
                  Bonne question ! Je dirais pareil
                </p>
              </motion.div>
            )}
          </div>
        )}
        <span className="block text-[10px] text-text-muted mt-2 text-right">
          {time}
        </span>
      </div>
    </motion.div>
  );
}
