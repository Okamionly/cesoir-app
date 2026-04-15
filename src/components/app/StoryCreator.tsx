"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─── Types ───────────────────────────────────────

interface StoryCreatorProps {
  open: boolean;
  onClose: () => void;
  onPublish?: (story: StoryData) => void;
}

export interface StoryData {
  text: string;
  gradient: string;
  mood: string;
  location: string;
}

// ─── Gradient presets ────────────────────────────

const GRADIENT_PRESETS = [
  { name: "Violet", value: "linear-gradient(135deg, #8B5CF6, #6D28D9)", from: "#8B5CF6", to: "#6D28D9" },
  { name: "Vert", value: "linear-gradient(135deg, #00FF88, #059669)", from: "#00FF88", to: "#059669" },
  { name: "Bleu", value: "linear-gradient(135deg, #3B82F6, #1D4ED8)", from: "#3B82F6", to: "#1D4ED8" },
  { name: "Rose", value: "linear-gradient(135deg, #EC4899, #DB2777)", from: "#EC4899", to: "#DB2777" },
  { name: "Ambre", value: "linear-gradient(135deg, #F59E0B, #D97706)", from: "#F59E0B", to: "#D97706" },
  { name: "Teal", value: "linear-gradient(135deg, #06B6D4, #0891B2)", from: "#06B6D4", to: "#0891B2" },
];

const MOOD_EMOJIS = ["😎", "🔥", "🎉", "💜", "🌙", "✨", "🍽️", "🎬", "💃", "🥂", "💪", "🎮"];

const LOCATION_SUGGESTIONS = [
  "Le Marais",
  "Bastille",
  "Chatelet",
  "Oberkampf",
  "Republique",
  "Canal Saint-Martin",
  "Montmartre",
  "Saint-Germain",
];

// ─── Component ───────────────────────────────────

export default function StoryCreator({ open, onClose, onPublish }: StoryCreatorProps) {
  const [text, setText] = useState("");
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [step, setStep] = useState<"edit" | "preview">("edit");

  const currentGradient = GRADIENT_PRESETS[selectedGradient];
  const canPublish = text.trim().length > 0;

  const reset = useCallback(() => {
    setText("");
    setSelectedGradient(0);
    setSelectedMood(null);
    setLocation("");
    setShowLocationPicker(false);
    setIsPublishing(false);
    setStep("edit");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handlePublish = useCallback(async () => {
    if (!canPublish) return;
    setIsPublishing(true);

    const storyData: StoryData = {
      text: text.trim(),
      gradient: currentGradient.value,
      mood: selectedMood ?? "",
      location,
    };

    // Simulate Supabase insert to feed_activities with type "story"
    await new Promise((resolve) => setTimeout(resolve, 800));

    onPublish?.(storyData);
    setIsPublishing(false);
    handleClose();
  }, [canPublish, text, currentGradient, selectedMood, location, onPublish, handleClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[61] bg-bg rounded-t-[24px] max-h-[92vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springs.heavy}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <button
                onClick={step === "preview" ? () => setStep("edit") : handleClose}
                className="text-[14px] text-text-muted font-medium tap-target"
              >
                {step === "preview" ? "Modifier" : "Annuler"}
              </button>
              <h3 className="text-[16px] font-bold text-text">
                {step === "edit" ? "Creer une story" : "Apercu"}
              </h3>
              {step === "edit" ? (
                <button
                  onClick={() => canPublish && setStep("preview")}
                  className={`text-[14px] font-semibold tap-target ${
                    canPublish ? "text-accent" : "text-text-muted"
                  }`}
                  disabled={!canPublish}
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="text-[14px] font-semibold text-accent tap-target disabled:opacity-50"
                >
                  {isPublishing ? "..." : "Publier"}
                </button>
              )}
            </div>

            {step === "edit" ? (
              <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
                {/* Live preview card */}
                <div
                  className="relative w-full aspect-[9/14] rounded-2xl overflow-hidden mb-5 flex items-center justify-center"
                  style={{ background: currentGradient.value }}
                >
                  {selectedMood && (
                    <span className="absolute top-4 right-4 text-[32px]">{selectedMood}</span>
                  )}
                  <p className="text-[20px] font-bold text-white text-center px-6 leading-snug drop-shadow-lg">
                    {text || "Votre texte ici..."}
                  </p>
                  {location && (
                    <div className="absolute bottom-4 left-4 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5">
                      <span className="text-[11px] text-white/80 font-medium">
                        📍 {location}
                      </span>
                    </div>
                  )}
                </div>

                {/* Text input */}
                <div className="mb-5">
                  <label className="text-[12px] text-text-muted font-semibold uppercase tracking-wider mb-2 block">
                    Texte
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 100))}
                    placeholder="Qu'est-ce que tu fais ce soir ?"
                    className="w-full h-[72px] bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[15px] text-text placeholder:text-text-muted resize-none focus:outline-none focus:border-accent"
                    maxLength={100}
                  />
                  <p className="text-[11px] text-text-muted text-right mt-1">
                    {text.length}/100
                  </p>
                </div>

                {/* Gradient picker */}
                <div className="mb-5">
                  <label className="text-[12px] text-text-muted font-semibold uppercase tracking-wider mb-2 block">
                    Fond
                  </label>
                  <div className="flex gap-2.5">
                    {GRADIENT_PRESETS.map((grad, i) => (
                      <motion.button
                        key={grad.name}
                        onClick={() => setSelectedGradient(i)}
                        className={`w-10 h-10 rounded-full tap-target border-2 ${
                          i === selectedGradient
                            ? "border-accent scale-110"
                            : "border-transparent"
                        }`}
                        style={{ background: grad.value }}
                        whileTap={{ scale: 0.85 }}
                        transition={springs.snap}
                        aria-label={`Fond ${grad.name}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Mood picker */}
                <div className="mb-5">
                  <label className="text-[12px] text-text-muted font-semibold uppercase tracking-wider mb-2 block">
                    Humeur
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_EMOJIS.map((emoji) => (
                      <motion.button
                        key={emoji}
                        onClick={() =>
                          setSelectedMood((prev) => (prev === emoji ? null : emoji))
                        }
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[20px] tap-target border-2 ${
                          selectedMood === emoji
                            ? "border-accent bg-accent/10"
                            : "border-border bg-bg-card"
                        }`}
                        whileTap={{ scale: 0.85 }}
                        transition={springs.snap}
                        aria-label={`Humeur ${emoji}`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="mb-5">
                  <label className="text-[12px] text-text-muted font-semibold uppercase tracking-wider mb-2 block">
                    Lieu
                  </label>
                  {location ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] text-text">
                        📍 {location}
                      </div>
                      <button
                        onClick={() => setLocation("")}
                        className="text-text-muted text-[12px] tap-target"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLocationPicker((v) => !v)}
                      className="w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] text-text-muted text-left tap-target"
                    >
                      + Ajouter un lieu
                    </button>
                  )}

                  <AnimatePresence>
                    {showLocationPicker && !location && (
                      <motion.div
                        className="flex flex-wrap gap-2 mt-2"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={springs.snap}
                      >
                        {LOCATION_SUGGESTIONS.map((loc) => (
                          <button
                            key={loc}
                            onClick={() => {
                              setLocation(loc);
                              setShowLocationPicker(false);
                            }}
                            className="bg-bg-card border border-border rounded-full px-3 py-1.5 text-[12px] text-text font-medium tap-target hover:border-accent transition-colors"
                          >
                            📍 {loc}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* ─── Preview step ─────────────────────── */
              <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
                <motion.div
                  className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden flex items-center justify-center mx-auto max-w-[300px]"
                  style={{ background: currentGradient.value }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={springs.elastic}
                >
                  {selectedMood && (
                    <motion.span
                      className="absolute top-5 right-5 text-[40px]"
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ ...springs.elastic, delay: 0.2 }}
                    >
                      {selectedMood}
                    </motion.span>
                  )}
                  <motion.p
                    className="text-[22px] font-bold text-white text-center px-8 leading-snug drop-shadow-lg"
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ ...springs.heavy, delay: 0.1 }}
                  >
                    {text}
                  </motion.p>
                  {location && (
                    <motion.div
                      className="absolute bottom-5 left-5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ ...springs.snap, delay: 0.25 }}
                    >
                      <span className="text-[12px] text-white/80 font-medium">
                        📍 {location}
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                <motion.p
                  className="text-center text-[12px] text-text-muted mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Ta story sera visible par tout le monde jusqu&apos;a minuit
                </motion.p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
