"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useReputation } from "@/lib/useReputation";

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const REVIEW_TAGS = [
  "Fun",
  "Respectueux",
  "Ponctuel",
  "Bonne conversation",
  "Genereux",
];

const DISMISS_STORAGE_KEY = "cesoir-review-dismissed";

/** Time in ms after a date ends before showing prompt (2 hours) */
const PROMPT_DELAY_MS = 2 * 60 * 60 * 1000;

/** Time in ms to dismiss for (24 hours) */
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface PendingReview {
  conversationId: string;
  partnerId: string;
  partnerName: string;
  endedAt: string;
}

interface ReviewPromptProps {
  /** Optional: override automatic detection with a specific pending review */
  pendingReview?: PendingReview;
  /** Called after submit or final dismiss */
  onComplete?: () => void;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function ReviewPrompt({ pendingReview: propReview, onComplete }: ReviewPromptProps) {
  const { user } = useAuth();
  const { submitReview } = useReputation();

  const [pending, setPending] = useState<PendingReview | null>(propReview || null);
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ─── Check for ended dates needing review ───
  useEffect(() => {
    if (propReview || !user?.id) return;

    async function checkPendingReviews() {
      // Check if dismissed recently
      if (typeof window !== "undefined") {
        const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
        if (dismissed && Date.now() - parseInt(dismissed, 10) < DISMISS_DURATION_MS) {
          return;
        }
      }

      // Find checkins that ended (status = 'safe') more than 2 hours ago
      const twoHoursAgo = new Date(Date.now() - PROMPT_DELAY_MS).toISOString();

      const { data: checkins } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "safe")
        .lt("last_checkin_at", twoHoursAgo)
        .order("last_checkin_at", { ascending: false })
        .limit(1);

      if (!checkins || checkins.length === 0) return;

      const checkin = checkins[0];
      if (!checkin.conversation_id) return;

      // Check if already reviewed this conversation
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_id", user!.id)
        .eq("conversation_id", checkin.conversation_id)
        .limit(1);

      if (existingReview && existingReview.length > 0) return;

      // Get conversation to find partner
      const { data: conversation } = await supabase
        .from("conversations")
        .select("user_a, user_b")
        .eq("id", checkin.conversation_id)
        .single();

      if (!conversation) return;

      const partnerId =
        conversation.user_a === user!.id
          ? conversation.user_b
          : conversation.user_a;

      // Get partner name
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", partnerId)
        .single();

      setPending({
        conversationId: checkin.conversation_id,
        partnerId,
        partnerName: partnerProfile?.name || "cette personne",
        endedAt: checkin.last_checkin_at,
      });
      setVisible(true);
    }

    checkPendingReviews();
  }, [user?.id, propReview]);

  // Show when propReview is provided
  useEffect(() => {
    if (propReview) {
      setPending(propReview);
      setVisible(true);
    }
  }, [propReview]);

  // ─── Handlers ───
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    if (!pending || rating === 0) return;

    await submitReview(
      pending.partnerId,
      rating,
      Array.from(selectedTags),
      comment,
      anonymous,
    );

    setSubmitted(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 2000);
  };

  const handleDismiss = () => {
    // Save dismiss timestamp for 24h suppression
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    }
    setVisible(false);
    onComplete?.();
  };

  if (!pending) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleDismiss}
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springs.heavy}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-w-lg mx-auto"
            role="dialog"
            aria-label={`Donner ton avis sur ${pending.partnerName}`}
            aria-modal="true"
          >
            <div className="p-5 pb-safe">
              {/* Drag handle */}
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" aria-hidden="true" />

              {submitted ? (
                /* ─── Success state ─── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springs.elastic}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...springs.elastic, delay: 0.1 }}
                    className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </motion.div>
                  <p className="text-base font-display font-bold text-text">Merci pour ton avis !</p>
                  <p className="text-xs text-text-muted mt-1">+20 XP gagnes</p>
                </motion.div>
              ) : (
                /* ─── Review form ─── */
                <>
                  {/* Header */}
                  <h3 className="text-base font-display font-bold text-text mb-1">
                    Comment c&apos;etait avec {pending.partnerName} ?
                  </h3>
                  <p className="text-xs text-text-muted mb-5">
                    Ton retour aide la communaute
                  </p>

                  {/* Star rating */}
                  <div className="flex items-center justify-center gap-3 mb-5" role="radiogroup" aria-label="Note de 1 a 5 etoiles">
                    {[1, 2, 3, 4, 5].map((star, i) => {
                      const filled = star <= rating;
                      return (
                        <motion.button
                          key={star}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ ...springs.elastic, delay: i * 0.06 }}
                          whileTap={{ scale: 1.4 }}
                          onClick={() => setRating(star)}
                          role="radio"
                          aria-checked={star === rating}
                          aria-label={`${star} etoile${star > 1 ? "s" : ""}`}
                          className="p-1 tap-target"
                        >
                          <motion.svg
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill={filled ? "#8B5CF6" : "none"}
                            stroke="#8B5CF6"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            animate={{ scale: filled ? 1.15 : 1 }}
                            transition={springs.elastic}
                            aria-hidden="true"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </motion.svg>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Tag chips */}
                  <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Tags">
                    {REVIEW_TAGS.map((tag, i) => {
                      const active = selectedTags.has(tag);
                      return (
                        <motion.button
                          key={tag}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ ...springs.snap, delay: 0.2 + i * 0.05 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => toggleTag(tag)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                            active
                              ? "bg-accent/15 border-accent text-accent"
                              : "bg-bg border-border text-text-muted"
                          }`}
                          aria-pressed={active}
                        >
                          {tag}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Comment */}
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 200))}
                    placeholder="Un mot ? (optionnel)"
                    maxLength={200}
                    rows={2}
                    className="w-full px-3.5 py-3 bg-bg border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none mb-4"
                    aria-label="Commentaire optionnel"
                  />

                  {/* Anonymous toggle */}
                  <button
                    onClick={() => setAnonymous(!anonymous)}
                    className="flex items-center gap-2 mb-5"
                    role="switch"
                    aria-checked={anonymous}
                    aria-label="Avis anonyme"
                  >
                    <div
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        anonymous ? "bg-accent" : "bg-border"
                      }`}
                    >
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                        animate={{ left: anonymous ? 18 : 2 }}
                        transition={springs.snap}
                      />
                    </div>
                    <span className="text-xs text-text-muted">Anonyme</span>
                  </button>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleDismiss}
                      className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-text-muted border border-border hover:border-text-muted transition-colors"
                    >
                      Plus tard
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={rating === 0}
                      className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                    >
                      Envoyer
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
