"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

interface PostDateReviewProps {
  /** Name of the person being reviewed */
  partnerName: string;
  /** Called when review is submitted or skipped */
  onComplete?: () => void;
}

const QUICK_TAGS = [
  "Ponctuel",
  "Sympa",
  "Bonne conversation",
  "A revoir",
  "Respectueux",
];

// --- Confetti Particle ---

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

function generateParticles(count: number): Particle[] {
  const colors = ["#8B5CF6", "#00FF88", "#FFFFFF", "#ec4899", "#f59e0b"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 200 - 100,
    y: -(Math.random() * 300 + 100),
    rotation: Math.random() * 720 - 360,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 6 + 3,
    delay: Math.random() * 0.3,
  }));
}

// --- Component ---

export default function PostDateReview({ partnerName, onComplete }: PostDateReviewProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [particles] = useState(() => generateParticles(20));

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitted(true);
    setTimeout(() => {
      onComplete?.();
    }, 2500);
  };

  const handleSkip = () => {
    onComplete?.();
  };

  // Success state
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border border-border rounded-2xl p-8 text-center relative overflow-hidden"
        role="status"
        aria-label="Avis envoye"
      >
        {/* Confetti particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
              }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: 0,
                rotate: p.rotation,
              }}
              transition={{
                duration: 1.5,
                delay: p.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </motion.div>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-base font-display font-bold text-text"
        >
          Merci pour ton avis !
        </motion.p>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-text-muted mt-1"
        >
          Ton retour est 100% anonyme
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5"
      aria-label={`Donner ton avis sur ta soiree avec ${partnerName}`}
    >
      {/* Header */}
      <h3 className="text-base font-display font-bold text-text mb-1">
        Comment s&apos;est passee ta soiree ?
      </h3>
      <p className="text-xs text-text-muted mb-5">
        Ton avis sur {partnerName} est anonyme
      </p>

      {/* Star rating */}
      <div className="flex items-center justify-center gap-2 mb-5" role="radiogroup" aria-label="Note de 1 a 5 etoiles">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hoveredStar || rating);
          return (
            <motion.button
              key={star}
              whileTap={{ scale: 1.3 }}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(star)}
              role="radio"
              aria-checked={star === rating}
              aria-label={`${star} etoile${star > 1 ? "s" : ""}`}
              className="p-1 tap-target"
            >
              <motion.svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill={filled ? "#8B5CF6" : "none"}
                stroke="#8B5CF6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ scale: filled ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400 }}
                aria-hidden="true"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </motion.svg>
            </motion.button>
          );
        })}
      </div>

      {/* Quick tags */}
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Tags rapides">
        {QUICK_TAGS.map((tag) => {
          const active = selectedTags.has(tag);
          return (
            <motion.button
              key={tag}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleTag(tag)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                active
                  ? "bg-accent/15 border-accent text-accent"
                  : "bg-bg border-border text-text-muted hover:text-text hover:border-text-muted"
              }`}
              aria-pressed={active}
            >
              {tag}
            </motion.button>
          );
        })}
      </div>

      {/* Optional text review */}
      <div className="mb-5">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 200))}
          placeholder="Un mot sur ta soiree ? (optionnel)"
          maxLength={200}
          rows={3}
          className="w-full px-3.5 py-3 bg-bg border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
          aria-label="Commentaire optionnel"
        />
        <p className="text-[10px] text-text-muted text-right mt-1">{comment.length}/200</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSkip}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-text-muted border border-border hover:border-text-muted transition-colors"
          aria-label="Passer l'avis"
        >
          Passer
        </button>
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
          aria-label="Envoyer l'avis"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
