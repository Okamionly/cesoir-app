"use client";

import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// 8 curated prompt questions
// ─────────────────────────────────────────

export const PROMPT_QUESTIONS = [
  "Mon dimanche ideal...",
  "Le trait que j'admire le plus...",
  "Ma plus grande aventure...",
  "Ce qui me fait rire a coup sur...",
  "Mon guilty pleasure...",
  "Si je pouvais diner avec une personne...",
  "La chose la plus spontanee que j'ai faite...",
  "Mon signe astrologique et j'y crois...",
] as const;

export type PromptQuestion = (typeof PROMPT_QUESTIONS)[number];

export interface PromptAnswer {
  question: PromptQuestion;
  answer: string;
}

// ─────────────────────────────────────────
// Single prompt card
// ─────────────────────────────────────────

interface PromptCardProps {
  prompt: PromptAnswer;
  index: number;
  /** Optional: show reaction button */
  onReact?: (question: PromptQuestion) => void;
}

export function PromptCard({ prompt, index, onReact }: PromptCardProps) {
  return (
    <motion.div
      className="bg-black border border-white/10 rounded-2xl p-5 relative"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...springs.elastic, delay: index * 0.06 }}
    >
      {/* Question */}
      <p className="text-[12px] text-white/40 font-medium mb-2 leading-relaxed">
        {prompt.question}
      </p>

      {/* Answer */}
      <p className="text-[15px] text-white font-bold leading-relaxed">
        {prompt.answer}
      </p>

      {/* Reaction bubble */}
      {onReact && (
        <motion.button
          onClick={() => onReact(prompt.question)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30 transition-colors"
          whileTap={{ scale: 0.85 }}
          transition={springs.micro}
          aria-label={`Reagir a: ${prompt.question}`}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </motion.button>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Interleaved prompts + photos view
// ─────────────────────────────────────────

interface ProfilePromptsProps {
  prompts: PromptAnswer[];
  /** Photo URLs to interleave between prompts */
  photos?: string[];
  /** Show reaction buttons */
  onReactToPrompt?: (question: PromptQuestion) => void;
  onReactToPhoto?: (photoIndex: number) => void;
  className?: string;
}

export default function ProfilePrompts({
  prompts,
  photos = [],
  onReactToPrompt,
  onReactToPhoto,
  className = "",
}: ProfilePromptsProps) {
  // Interleave: prompt, photo, prompt, photo...
  const interleaved: Array<
    | { type: "prompt"; data: PromptAnswer; index: number }
    | { type: "photo"; src: string; photoIndex: number; index: number }
  > = [];

  let photoIdx = 0;
  prompts.forEach((prompt, i) => {
    interleaved.push({ type: "prompt", data: prompt, index: interleaved.length });

    // Insert a photo after every 2 prompts (if available)
    if ((i + 1) % 2 === 0 && photoIdx < photos.length) {
      interleaved.push({
        type: "photo",
        src: photos[photoIdx],
        photoIndex: photoIdx,
        index: interleaved.length,
      });
      photoIdx++;
    }
  });

  if (interleaved.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {interleaved.map((item) => {
        if (item.type === "prompt") {
          return (
            <PromptCard
              key={`prompt-${item.index}`}
              prompt={item.data}
              index={item.index}
              onReact={onReactToPrompt}
            />
          );
        }

        // Photo card
        return (
          <motion.div
            key={`photo-${item.photoIndex}`}
            className="relative rounded-2xl overflow-hidden aspect-[4/5]"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.heavy, delay: item.index * 0.06 }}
          >
            <img
              src={item.src}
              alt={`Photo ${item.photoIndex + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />

            {/* Photo reaction button */}
            {onReactToPhoto && (
              <motion.button
                onClick={() => onReactToPhoto(item.photoIndex)}
                className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/60 hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30 transition-colors"
                whileTap={{ scale: 0.85 }}
                transition={springs.micro}
                aria-label={`Reagir a la photo ${item.photoIndex + 1}`}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </motion.button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
