"use client";

// ========================================
// WeMetFeedback — Post-date feedback bottom sheet
// ========================================
//
// Appears 24h after a check-in to collect feedback.
// "Vous vous etes vus?" -> If yes, rate 1-5 stars + tags.
// Feedback feeds back into the matching weight algorithm.
//
// Animation signature: Gravity drop
// Sheet rises from bottom with heavy spring, stars cascade
// with elastic delay, tags bounce in with snap.

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────
// Springs — unique to this component
// ─────────────────────────────────────────

const weMetSprings = {
  /** Sheet entrance — heavy with slight overshoot */
  sheetRise: { type: "spring" as const, stiffness: 220, damping: 26, mass: 1.4 },
  /** Stars cascade — elastic with bounce */
  starPop: { type: "spring" as const, stiffness: 400, damping: 12, mass: 0.7 },
  /** Tags bounce — snappy entry */
  tagBounce: { type: "spring" as const, stiffness: 500, damping: 22, mass: 0.6 },
  /** Confirmation — smooth settle */
  confirm: { type: "spring" as const, stiffness: 150, damping: 20, mass: 1.2 },
};

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type FeedbackTag = "fun" | "genant" | "revoir" | "pas-de-feeling";

interface FeedbackData {
  met: boolean;
  rating?: number;
  tags?: FeedbackTag[];
}

const TAG_OPTIONS: { id: FeedbackTag; label: string; emoji: string }[] = [
  { id: "fun", label: "Fun", emoji: "\uD83C\uDF89" },
  { id: "genant", label: "Genant", emoji: "\uD83D\uDE33" },
  { id: "revoir", label: "Envie de revoir", emoji: "\uD83D\uDC96" },
  { id: "pas-de-feeling", label: "Pas de feeling", emoji: "\uD83E\uDD37" },
];

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

interface WeMetFeedbackProps {
  /** Name of the person you had a date with */
  peerName: string;
  /** ID of the peer profile */
  peerId: string;
  /** ID of the check-in that triggered this */
  checkinId: string;
  /** Whether to show the sheet */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
}

type Phase = "question" | "rating" | "thanks" | "declined";

export default function WeMetFeedback({
  peerName,
  peerId,
  checkinId,
  isOpen,
  onClose,
}: WeMetFeedbackProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("question");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [saving, setSaving] = useState(false);

  // Reset when sheet opens
  useEffect(() => {
    if (isOpen) {
      setPhase("question");
      setRating(0);
      setHoveredStar(0);
      setSelectedTags([]);
      setSaving(false);
    }
  }, [isOpen]);

  const toggleTag = useCallback((tag: FeedbackTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user?.id || saving) return;
    setSaving(true);

    const feedback: FeedbackData = {
      met: phase !== "declined",
      rating: rating > 0 ? rating : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    };

    try {
      await supabase.from("we_met_feedback").insert({
        user_id: user.id,
        peer_id: peerId,
        checkin_id: checkinId,
        met: feedback.met,
        rating: feedback.rating ?? null,
        tags: feedback.tags ?? [],
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[WeMetFeedback] save failed:", err);
    }

    setPhase("thanks");
    setTimeout(() => {
      onClose();
    }, 2000);
  }, [user?.id, phase, rating, selectedTags, peerId, checkinId, saving, onClose]);

  const handleNo = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase.from("we_met_feedback").insert({
        user_id: user.id,
        peer_id: peerId,
        checkin_id: checkinId,
        met: false,
        rating: null,
        tags: [],
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[WeMetFeedback] save failed:", err);
    }

    setPhase("declined");
    setTimeout(() => {
      onClose();
    }, 1500);
  }, [user?.id, peerId, checkinId, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-label="Feedback post-rencontre"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative bg-bg rounded-t-3xl border-t border-border w-full max-w-lg pb-8 pt-3 shadow-xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={weMetSprings.sheetRise}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-6">
              {/* Phase: Question */}
              {phase === "question" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={weMetSprings.confirm}
                >
                  <h2 className="text-[18px] font-black text-text text-center mb-2">
                    Vous vous etes vus ?
                  </h2>
                  <p className="text-[13px] text-text-muted text-center mb-6">
                    Vous et {peerName} aviez prevu de sortir
                  </p>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setPhase("rating")}
                      className="flex-1 py-3.5 rounded-2xl bg-accent/10 border border-accent/20 text-accent font-bold text-[15px]"
                      whileTap={{ scale: 0.95, transition: weMetSprings.tagBounce }}
                    >
                      Oui
                    </motion.button>
                    <motion.button
                      onClick={handleNo}
                      className="flex-1 py-3.5 rounded-2xl bg-border/50 border border-border text-text-muted font-bold text-[15px]"
                      whileTap={{ scale: 0.95, transition: weMetSprings.tagBounce }}
                    >
                      Non
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Phase: Rating */}
              {phase === "rating" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={weMetSprings.confirm}
                >
                  <h2 className="text-[18px] font-black text-text text-center mb-1">
                    Comment c&apos;etait ?
                  </h2>
                  <p className="text-[13px] text-text-muted text-center mb-5">
                    Votre soiree avec {peerName}
                  </p>

                  {/* Stars */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="relative p-1"
                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                        }}
                        transition={{
                          ...weMetSprings.starPop,
                          delay: star * 0.08,
                        }}
                        whileTap={{ scale: 0.8, rotate: -15 }}
                        aria-label={`${star} etoile${star > 1 ? "s" : ""}`}
                      >
                        <svg
                          width="36"
                          height="36"
                          viewBox="0 0 24 24"
                          fill={
                            star <= (hoveredStar || rating)
                              ? "#8B5CF6"
                              : "none"
                          }
                          stroke={
                            star <= (hoveredStar || rating)
                              ? "#8B5CF6"
                              : "#555"
                          }
                          strokeWidth="1.5"
                          className="transition-colors duration-150"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>

                        {/* Glow ring on selected */}
                        {star <= rating && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            initial={{ boxShadow: "0 0 0px rgba(139,92,246,0)" }}
                            animate={{
                              boxShadow: [
                                "0 0 0px rgba(139,92,246,0)",
                                "0 0 12px rgba(139,92,246,0.4)",
                                "0 0 0px rgba(139,92,246,0)",
                              ],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: star * 0.1,
                            }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {TAG_OPTIONS.map((tag, i) => (
                      <motion.button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
                          selectedTags.includes(tag.id)
                            ? "bg-accent/15 border-accent/30 text-accent"
                            : "bg-bg border-border text-text-muted hover:text-text-soft"
                        }`}
                        initial={{ opacity: 0, y: 15, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          ...weMetSprings.tagBounce,
                          delay: 0.4 + i * 0.06,
                        }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <span className="mr-1">{tag.emoji}</span>
                        {tag.label}
                      </motion.button>
                    ))}
                  </div>

                  {/* Submit */}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={rating === 0 || saving}
                    className={`w-full py-3.5 rounded-2xl font-bold text-[15px] transition-all ${
                      rating > 0
                        ? "gradient-bg text-white shadow-glow"
                        : "bg-border/50 text-text-muted cursor-not-allowed"
                    }`}
                    whileTap={rating > 0 ? { scale: 0.97 } : {}}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...weMetSprings.confirm, delay: 0.6 }}
                  >
                    {saving ? "Envoi..." : "Envoyer"}
                  </motion.button>
                </motion.div>
              )}

              {/* Phase: Thanks */}
              {phase === "thanks" && (
                <motion.div
                  className="text-center py-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={weMetSprings.starPop}
                >
                  <motion.div
                    className="text-[48px] mb-3"
                    animate={{
                      scale: [1, 1.3, 0.95, 1.1, 1],
                      rotate: [0, -10, 10, -5, 0],
                    }}
                    transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.7, 1] }}
                  >
                    {rating >= 4 ? "\u2728" : rating >= 2 ? "\uD83D\uDE4F" : "\uD83D\uDC99"}
                  </motion.div>
                  <h2 className="text-[17px] font-bold text-text mb-1">Merci !</h2>
                  <p className="text-[13px] text-text-muted">
                    Votre retour aide a ameliorer les suggestions
                  </p>
                </motion.div>
              )}

              {/* Phase: Declined */}
              {phase === "declined" && (
                <motion.div
                  className="text-center py-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={weMetSprings.confirm}
                >
                  <div className="text-[40px] mb-3">{"\uD83D\uDE14"}</div>
                  <h2 className="text-[17px] font-bold text-text mb-1">
                    Pas de souci
                  </h2>
                  <p className="text-[13px] text-text-muted">
                    La prochaine sera la bonne !
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
