"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface FeedbackWidgetProps {
  userId?: string;
}

export default function FeedbackWidget({ userId }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleScreenshot = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;
    setSending(true);

    try {
      await supabase.from("feedback").insert({
        user_id: userId ?? null,
        rating,
        comment: comment.trim() || null,
        screenshot_base64: screenshot,
        page: typeof window !== "undefined" ? window.location.pathname : null,
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[Feedback] Submit failed:", err);
    }

    setSending(false);
    setSubmitted(true);

    // Auto-close after 2s
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setRating(0);
      setComment("");
      setScreenshot(null);
    }, 2000);
  }, [rating, comment, screenshot, userId]);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <motion.button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-40 w-11 h-11 rounded-full bg-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/25 flex items-center justify-center text-white active:scale-90 transition-transform"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          aria-label="Donner un avis"
        >
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </motion.button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-t-3xl p-6"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {submitted ? (
                <div className="text-center py-8">
                  <span className="text-[40px] block mb-3">{"\uD83D\uDE4F"}</span>
                  <p className="text-[16px] text-white font-semibold">Merci !</p>
                  <p className="text-[13px] text-white/50 mt-1">
                    Ton avis nous aide a ameliorer CeSoir
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[16px] text-white font-bold">
                      Donner un avis
                    </h3>
                    <button
                      onClick={() => setOpen(false)}
                      className="text-white/40 hover:text-white/70 transition-colors"
                      aria-label="Fermer"
                    >
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {/* Rating */}
                  <p className="text-[12px] text-white/40 uppercase tracking-widest font-bold mb-2">
                    Note
                  </p>
                  <div className="flex gap-2 mb-5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        className={`w-10 h-10 rounded-xl text-[18px] transition-all ${
                          rating >= n
                            ? "bg-[#8B5CF6] scale-110"
                            : "bg-white/5 hover:bg-white/10"
                        }`}
                        aria-label={`${n} etoile${n > 1 ? "s" : ""}`}
                      >
                        {rating >= n ? "\u2B50" : "\u2606"}
                      </button>
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-[12px] text-white/40 uppercase tracking-widest font-bold mb-2">
                    Commentaire
                  </p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Dis-nous ce que tu penses..."
                    className="w-full h-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-white/25 resize-none focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] mb-4"
                    maxLength={500}
                  />

                  {/* Screenshot */}
                  <div className="flex items-center gap-3 mb-5">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2}>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[11px] text-white/50">Screenshot</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleScreenshot}
                      />
                    </label>
                    {screenshot && (
                      <span className="text-[11px] text-[#00FF88]">Image ajoutee</span>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || sending}
                    className="w-full py-3 rounded-xl bg-[#8B5CF6] text-white font-semibold text-[14px] transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#7c3aed] active:scale-[0.98]"
                  >
                    {sending ? "Envoi..." : "Envoyer"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
