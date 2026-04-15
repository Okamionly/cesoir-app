"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/lib/haptics";

const DEFAULT_PROMPTS = [
  "La chose la plus spontanee que j'ai faite...",
  "Mon endroit prefere a Paris...",
  "Si on se voit ce soir, on...",
] as const;

const PROMPT_POOL = [
  "La chose la plus spontanee que j'ai faite...",
  "Mon endroit prefere a Paris...",
  "Si on se voit ce soir, on...",
  "Mon guilty pleasure...",
  "Un talent cache...",
  "Je suis imbattable a...",
  "Le plat que je cuisine le mieux...",
  "Ma serie du moment...",
  "Un reve un peu fou...",
  "Le dernier truc qui m'a fait rire...",
  "Mon spot secret a Paris...",
  "La musique que j'ecoute en boucle...",
  "Si je pouvais diner avec quelqu'un...",
] as const;

const MAX_CHARS = 150;

interface StarterCard {
  prompt: string;
  answer: string;
}

export default function ConversationStarters() {
  const [cards, setCards] = useState<StarterCard[]>(() =>
    DEFAULT_PROMPTS.map((p) => ({ prompt: p, answer: "" })),
  );
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const cyclePrompt = useCallback(
    (idx: number) => {
      haptics.light();
      const usedPrompts = cards.map((c) => c.prompt);
      const available = PROMPT_POOL.filter((p) => !usedPrompts.includes(p));
      if (available.length === 0) return;

      const currentInPool = PROMPT_POOL.indexOf(cards[idx].prompt as typeof PROMPT_POOL[number]);
      let nextPrompt = available[0];
      for (const p of PROMPT_POOL) {
        if (
          PROMPT_POOL.indexOf(p) > currentInPool &&
          available.includes(p)
        ) {
          nextPrompt = p;
          break;
        }
      }

      setCards((prev) => {
        const next = [...prev];
        next[idx] = { prompt: nextPrompt, answer: prev[idx].answer };
        return next;
      });
    },
    [cards],
  );

  const updateAnswer = useCallback((idx: number, value: string) => {
    if (value.length > MAX_CHARS) return;
    setCards((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], answer: value };
      return next;
    });
  }, []);

  return (
    <div className="w-full space-y-3" role="group" aria-label="Phrases d'accroche">
      <h3 className="text-sm font-semibold px-1" style={{ color: "#111111" }}>
        Phrases d&apos;accroche
      </h3>

      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          className="relative rounded-2xl p-4 backdrop-blur-md"
          style={{
            backgroundColor: "rgba(139,92,246,0.06)",
            border: "1px solid rgba(139,92,246,0.12)",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          {/* Prompt text */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <AnimatePresence mode="wait">
              <motion.p
                key={card.prompt}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-sm font-medium italic"
                style={{ color: "#8B5CF6" }}
              >
                &ldquo;{card.prompt}&rdquo;
              </motion.p>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => cyclePrompt(idx)}
              className="shrink-0 rounded-full p-1.5 transition-colors"
              style={{ backgroundColor: "rgba(139,92,246,0.1)" }}
              aria-label="Changer le prompt"
              title="Changer le prompt"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>

          {/* Answer area */}
          {editingIdx === idx ? (
            <div>
              <textarea
                value={card.answer}
                onChange={(e) => updateAnswer(idx, e.target.value)}
                onBlur={() => setEditingIdx(null)}
                placeholder="Ta reponse..."
                maxLength={MAX_CHARS}
                rows={2}
                autoFocus
                className="w-full resize-none rounded-xl border bg-white/80 p-3 text-sm outline-none transition-colors focus:border-[#8B5CF6]"
                style={{ borderColor: "rgba(139,92,246,0.2)", color: "#111111" }}
                aria-label={`Reponse pour : ${card.prompt}`}
              />
              <p className="mt-1 text-right text-xs" style={{ color: "#999999" }}>
                {card.answer.length}/{MAX_CHARS}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                haptics.light();
                setEditingIdx(idx);
              }}
              className="w-full text-left rounded-xl p-3 text-sm transition-colors"
              style={{
                backgroundColor: card.answer ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.02)",
                color: card.answer ? "#111111" : "#999999",
                border: "1px dashed rgba(0,0,0,0.08)",
              }}
              aria-label={`Modifier la reponse pour : ${card.prompt}`}
            >
              {card.answer || "Tape ici pour repondre..."}
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}
