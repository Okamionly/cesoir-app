"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------- Types ----------

export type GameType = "2v1m" | "preferes" | "question";

export interface GameData {
  type: GameType;
  payload: TwoTruthsPayload | PreferesPayload | QuestionPayload;
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

// ---------- Data ----------

const PREFERES_OPTIONS: [string, string][] = [
  ["Netflix & chill", "Sortir danser"],
  ["Plage au coucher de soleil", "Rando en montagne"],
  ["Cuisiner ensemble", "Commander et mater un film"],
  ["Premier rdv en terrasse", "Premier rdv au musee"],
  ["Petit-dej au lit", "Brunch en ville"],
  ["Voyager en Europe", "Voyager en Asie"],
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

// ---------- IceBreakerButton ----------

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
      const pair = PREFERES_OPTIONS[Math.floor(Math.random() * PREFERES_OPTIONS.length)];
      onStartGame({
        type: "preferes",
        payload: { optionA: pair[0], optionB: pair[1] },
      });
    } else if (selectedGame === "question") {
      const q = RANDOM_QUESTIONS[Math.floor(Math.random() * RANDOM_QUESTIONS.length)];
      onStartGame({
        type: "question",
        payload: { question: q },
      });
    }
    setIsOpen(false);
    setSelectedGame(null);
    setStatements(["", "", ""]);
  }, [selectedGame, statements, onStartGame]);

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
              onClick={() => { setIsOpen(false); setSelectedGame(null); }}
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

              <div className="px-5 pb-4">
                <h3 className="text-lg font-bold text-text mb-4">Brise-glace</h3>

                {!selectedGame && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedGame("2v1m")}
                      className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border hover:border-accent/30 transition-colors text-left"
                    >
                      <span className="text-2xl">🤥</span>
                      <div>
                        <p className="font-semibold text-[14px] text-text">2 Verites 1 Mensonge</p>
                        <p className="text-[12px] text-text-muted">Ecris 3 affirmations, l'autre devine</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setSelectedGame("preferes"); }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border hover:border-accent/30 transition-colors text-left"
                    >
                      <span className="text-2xl">⚡</span>
                      <div>
                        <p className="font-semibold text-[14px] text-text">Ce soir tu preferes...</p>
                        <p className="text-[12px] text-text-muted">2 options, chacun choisit</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setSelectedGame("question"); }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border hover:border-accent/30 transition-colors text-left"
                    >
                      <span className="text-2xl">🎲</span>
                      <div>
                        <p className="font-semibold text-[14px] text-text">Question Random</p>
                        <p className="text-[12px] text-text-muted">Une question fun au hasard</p>
                      </div>
                    </button>
                  </div>
                )}

                {selectedGame === "2v1m" && (
                  <div>
                    <p className="text-[13px] text-text-muted mb-3">Ecris 2 verites et 1 mensonge :</p>
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

                {selectedGame === "preferes" && (
                  <div>
                    <p className="text-[13px] text-text-muted mb-3">Un duel aleatoire va etre envoye !</p>
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
                    <p className="text-[13px] text-text-muted mb-3">Une question fun va etre envoyee !</p>
                    <button
                      onClick={handleStart}
                      className="w-full py-3 rounded-2xl gradient-bg text-white font-bold text-[15px] active:scale-[0.98] transition-transform"
                    >
                      Poser la question
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

// ---------- Sub-card: Question Random ----------

interface QuestionCardInnerProps {
  question: string;
  isOwn: boolean;
  time: string;
  onInteract?: (answer: string) => void;
  localAnswer: string | null;
  setLocalAnswer: (val: string) => void;
  showResult: boolean;
}

function QuestionCardInner({ question, isOwn, time, onInteract, localAnswer, setLocalAnswer, showResult }: QuestionCardInnerProps) {
  const [inputVal, setInputVal] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
    >
      <div className="max-w-[85%] rounded-2xl bg-bg-card border border-border p-3.5">
        <p className="text-[11px] text-accent font-semibold mb-2">🎲 Question Random</p>
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
                <p className="text-[11px] text-text-muted font-semibold">L'autre</p>
                <p className="text-[13px] text-text">Bonne question ! Je dirais pareil</p>
              </motion.div>
            )}
          </div>
        )}
        <span className="block text-[10px] text-text-muted mt-2 text-right">{time}</span>
      </div>
    </motion.div>
  );
}

// ---------- GameCard (displayed in chat) ----------

interface GameCardProps {
  game: GameData;
  isOwn: boolean;
  time: string;
  onInteract?: (answer: string) => void;
}

export function GameCard({ game, isOwn, time, onInteract }: GameCardProps) {
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Auto-answer from "other person" after 2s for demo
  useEffect(() => {
    if (localAnswer && !showResult) {
      const timer = setTimeout(() => setShowResult(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [localAnswer, showResult]);

  if (game.type === "2v1m") {
    const payload = game.payload as TwoTruthsPayload;
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
      >
        <div className="max-w-[85%] rounded-2xl bg-bg-card border border-border p-3.5">
          <p className="text-[11px] text-accent font-semibold mb-2">🤥 2 Verites 1 Mensonge</p>
          <div className="flex flex-col gap-1.5">
            {payload.statements.map((s, i) => {
              const isGuessed = localAnswer === String(i);
              const isLie = showResult && i === payload.lieIndex;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (!localAnswer && !isOwn) {
                      setLocalAnswer(String(i));
                      onInteract?.(String(i));
                    }
                  }}
                  disabled={!!localAnswer || isOwn}
                  className={`text-left px-3 py-2 rounded-xl text-[13px] border transition-all ${
                    isLie
                      ? "bg-danger/10 border-danger/30 text-danger font-semibold"
                      : showResult && !isLie
                        ? "bg-safe/10 border-safe/30 text-safe"
                        : isGuessed
                          ? "gradient-bg text-white border-transparent"
                          : "bg-bg border-border text-text hover:border-accent/30"
                  } ${localAnswer || isOwn ? "cursor-default" : ""}`}
                >
                  {s}
                  {isLie && " — Mensonge !"}
                </button>
              );
            })}
          </div>
          {showResult && localAnswer && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-[12px] font-semibold mt-2 ${
                localAnswer === String(payload.lieIndex) ? "text-safe" : "text-danger"
              }`}
            >
              {localAnswer === String(payload.lieIndex) ? "Bien joue ! Tu as trouve !" : "Rate ! Essaie encore la prochaine fois"}
            </motion.p>
          )}
          <span className="block text-[10px] text-text-muted mt-2 text-right">{time}</span>
        </div>
      </motion.div>
    );
  }

  if (game.type === "preferes") {
    const payload = game.payload as PreferesPayload;
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
      >
        <div className="max-w-[85%] rounded-2xl bg-bg-card border border-border p-3.5">
          <p className="text-[11px] text-accent font-semibold mb-2">⚡ Ce soir tu preferes...</p>
          <div className="flex flex-col gap-1.5">
            {(["A", "B"] as const).map((choice) => {
              const label = choice === "A" ? payload.optionA : payload.optionB;
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
                  {showResult && isSelected && " — Ton choix"}
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
          <span className="block text-[10px] text-text-muted mt-2 text-right">{time}</span>
        </div>
      </motion.div>
    );
  }

  if (game.type === "question") {
    const payload = game.payload as QuestionPayload;
    return (
      <QuestionCardInner
        question={payload.question}
        isOwn={isOwn}
        time={time}
        onInteract={onInteract}
        localAnswer={localAnswer}
        setLocalAnswer={setLocalAnswer}
        showResult={showResult}
      />
    );
  }

  return null;
}
