"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { MODES, MODE_KEYS, type ModeKey } from "@/lib/modes";
import {
  PARIS_ARRONDISSEMENTS,
  TIME_SLOTS,
  MAX_ATTENDEES_OPTIONS,
  getMaxAttendeesLabel,
} from "@/lib/popup-events";
import { useEvents } from "@/lib/useEvents";
import { Confetti } from "@/components/ui/Confetti";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Convert a "21h" style slot to ISO datetime (today) ---
function slotToIso(slot: string | null): string {
  if (!slot) return new Date().toISOString();
  const match = slot.match(/(\d{1,2})h/);
  if (!match) return new Date().toISOString();
  const hour = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  // If that time already passed today, roll to tomorrow
  if (d.getTime() < Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

// --- Steps ---

type Step = "title" | "mode" | "time" | "location" | "capacity" | "description" | "preview";

const STEPS: Step[] = ["title", "mode", "time", "location", "capacity", "description", "preview"];

const STEP_LABELS: Record<Step, string> = {
  title: "Titre",
  mode: "Mode",
  time: "Heure",
  location: "Lieu",
  capacity: "Participants",
  description: "Description",
  preview: "Apercu",
};

// --- Variants ---

const pageVariants: Variants = {
  enter: { opacity: 0, x: 80, scale: 0.96 },
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: -80,
    scale: 0.96,
    transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] },
  },
};

// --- Location suggestions ---

function getArrondissementSuggestions(query: string): string[] {
  if (!query) return PARIS_ARRONDISSEMENTS.slice(0, 6);
  const lower = query.toLowerCase();
  return PARIS_ARRONDISSEMENTS.filter((a) =>
    a.toLowerCase().includes(lower)
  ).slice(0, 6);
}

// --- Main Component ---

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useEvents();

  // Form state
  const [title, setTitle] = useState("");
  const [selectedMode, setSelectedMode] = useState<ModeKey | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [arrondissement, setArrondissement] = useState("");
  const [maxAttendees, setMaxAttendees] = useState<number>(6);
  const [description, setDescription] = useState("");

  // UI state
  const [currentStep, setCurrentStep] = useState<Step>("title");
  const [direction, setDirection] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showArrSuggestions, setShowArrSuggestions] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);
  const isFirst = stepIndex === 0;
  const isLast = currentStep === "preview";

  const arrSuggestions = useMemo(
    () => getArrondissementSuggestions(arrondissement),
    [arrondissement]
  );

  // Validation per step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case "title":
        return title.trim().length >= 3;
      case "mode":
        return selectedMode !== null;
      case "time":
        return selectedTime !== null;
      case "location":
        return location.trim().length >= 2;
      case "capacity":
        return true;
      case "description":
        return true;
      case "preview":
        return true;
      default:
        return false;
    }
  }, [currentStep, title, selectedMode, selectedTime, location]);

  const goNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(STEPS[stepIndex + 1]);
    }
  }, [stepIndex]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setDirection(-1);
      setCurrentStep(STEPS[stepIndex - 1]);
    }
  }, [stepIndex]);

  const handlePublish = useCallback(async () => {
    if (!selectedMode || !selectedTime || publishing) return;
    setPublishing(true);

    const venueText = arrondissement
      ? `${location}${location ? ", " : ""}${arrondissement}`
      : location;

    const id = await createEvent({
      title: title.trim() || "Event ce soir",
      description: description.trim(),
      mode: selectedMode,
      venue: venueText,
      event_time: slotToIso(selectedTime),
      max_attendees: maxAttendees,
      tags: [],
    });

    setPublishing(false);
    setShowConfetti(true);
    setPublished(true);
    setTimeout(() => {
      router.push(id ? `/events/${id}` : "/events");
    }, 1800);
  }, [
    selectedMode,
    selectedTime,
    publishing,
    arrondissement,
    location,
    title,
    description,
    maxAttendees,
    createEvent,
    router,
  ]);

  const mode = selectedMode ? MODES[selectedMode] : null;

  // Progress bar
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;

  if (published) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={micro.successPop}
          className="text-center"
        >
          <motion.div
            className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4"
            animate={{ boxShadow: ["0 0 0px rgba(139,92,246,0)", "0 0 40px rgba(139,92,246,0.6)", "0 0 0px rgba(139,92,246,0)"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
          <h2 className="text-xl font-display font-bold text-text">Event publie!</h2>
          <p className="text-sm text-text-muted mt-2">Les gens peuvent maintenant te rejoindre</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <div className="flex items-center justify-between">
          {isFirst ? (
            <Link href="/events">
              <motion.span
                whileTap={{ scale: 0.9 }}
                className="text-text-muted text-sm font-medium"
              >
                Annuler
              </motion.span>
            </Link>
          ) : (
            <motion.button
              onClick={goBack}
              whileTap={{ scale: 0.9 }}
              className="text-text-muted text-sm font-medium flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Retour
            </motion.button>
          )}
          <span className="text-[11px] font-semibold text-text-muted">
            {stepIndex + 1} / {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-border/50 mt-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-bg"
            animate={{ width: `${progressPct}%` }}
            transition={springs.snap}
          />
        </div>
      </header>

      {/* Step content */}
      <div className="flex-1 px-5 pt-6 pb-32 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {/* --- TITLE STEP --- */}
            {currentStep === "title" && (
              <div>
                <h2 className="text-xl font-display font-bold text-text mb-2">Quel est ton event?</h2>
                <p className="text-sm text-text-muted mb-6">Un titre court et accrocheur</p>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                  placeholder="Soiree karaoke ce soir 21h!"
                  autoFocus
                  className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
                />
                <p className="text-[10px] text-text-muted text-right mt-1.5">{title.length}/60</p>
              </div>
            )}

            {/* --- MODE STEP --- */}
            {currentStep === "mode" && (
              <div>
                <h2 className="text-xl font-display font-bold text-text mb-2">Quel mode?</h2>
                <p className="text-sm text-text-muted mb-4">Choisis l&apos;ambiance de la soiree</p>
                <div className="grid grid-cols-2 gap-2">
                  {MODE_KEYS.map((key, i) => {
                    const m = MODES[key];
                    const isSelected = selectedMode === key;
                    return (
                      <motion.button
                        key={key}
                        onClick={() => setSelectedMode(key)}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ ...springs.elastic, delay: i * 0.03 }}
                        whileTap={{ scale: 0.92 }}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-border bg-card hover:border-accent/20"
                        }`}
                      >
                        <span className="text-lg shrink-0">{m.icon}</span>
                        <span className={`text-[12px] font-semibold truncate ${isSelected ? "text-accent" : "text-text"}`}>
                          {m.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- TIME STEP --- */}
            {currentStep === "time" && (
              <div>
                <h2 className="text-xl font-display font-bold text-text mb-2">A quelle heure?</h2>
                <p className="text-sm text-text-muted mb-4">Ce soir, evidemment</p>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <motion.button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        whileTap={{ scale: 0.92 }}
                        className={`py-3 rounded-xl border text-[13px] font-semibold transition-all ${
                          isSelected
                            ? "border-accent gradient-bg text-white"
                            : "border-border text-text-muted bg-card hover:border-accent/20"
                        }`}
                      >
                        {slot}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- LOCATION STEP --- */}
            {currentStep === "location" && (
              <div>
                <h2 className="text-xl font-display font-bold text-text mb-2">Ou?</h2>
                <p className="text-sm text-text-muted mb-4">Nom du lieu + arrondissement</p>

                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Le Comptoir, Cafe de Flore..."
                  className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
                />

                <div className="mt-3 relative">
                  <input
                    type="text"
                    value={arrondissement}
                    onChange={(e) => {
                      setArrondissement(e.target.value);
                      setShowArrSuggestions(true);
                    }}
                    onFocus={() => setShowArrSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowArrSuggestions(false), 200)}
                    placeholder="Arrondissement (ex: 11e)"
                    className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
                  />

                  {/* Suggestions */}
                  <AnimatePresence>
                    {showArrSuggestions && arrSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-xl overflow-hidden z-10 shadow-lg"
                      >
                        {arrSuggestions.map((s) => (
                          <button
                            key={s}
                            onMouseDown={() => {
                              setArrondissement(s);
                              setShowArrSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-accent/10 transition-colors border-b border-border/50 last:border-0"
                          >
                            Paris {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* --- CAPACITY STEP --- */}
            {currentStep === "capacity" && (
              <div>
                <h2 className="text-xl font-display font-bold text-text mb-2">Combien de personnes?</h2>
                <p className="text-sm text-text-muted mb-4">Taille du groupe</p>
                <div className="grid grid-cols-3 gap-2">
                  {MAX_ATTENDEES_OPTIONS.map((n) => {
                    const isSelected = maxAttendees === n;
                    return (
                      <motion.button
                        key={n}
                        onClick={() => setMaxAttendees(n)}
                        whileTap={{ scale: 0.92 }}
                        className={`py-3.5 rounded-xl border text-[13px] font-semibold transition-all ${
                          isSelected
                            ? "border-accent gradient-bg text-white"
                            : "border-border text-text-muted bg-card hover:border-accent/20"
                        }`}
                      >
                        {getMaxAttendeesLabel(n)}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- DESCRIPTION STEP --- */}
            {currentStep === "description" && (
              <div>
                <h2 className="text-xl font-display font-bold text-text mb-2">Un petit mot?</h2>
                <p className="text-sm text-text-muted mb-4">Optionnel, mais ca aide</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  placeholder="On chante faux mais on s'amuse bien..."
                  rows={4}
                  className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                />
                <p className="text-[10px] text-text-muted text-right mt-1.5">{description.length}/200</p>
              </div>
            )}

            {/* --- PREVIEW STEP --- */}
            {currentStep === "preview" && (
              <div>
                <h2 className="text-xl font-display font-bold text-text mb-4">Apercu de ton event</h2>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={springs.elastic}
                  className="bg-card border border-border rounded-2xl p-4"
                >
                  {/* Preview card content */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
                      style={{ background: mode ? `linear-gradient(135deg, ${mode.color}, #8B5CF6)` : "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                    >
                      {mode?.icon ?? "\u263E"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-text leading-tight">
                        {title || "Titre de l'event"}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-text-muted">{selectedTime ?? "??h??"}</span>
                        <span className="text-text-muted/40">·</span>
                        <span className="text-[11px] text-text-muted">{location || "Lieu"}{arrondissement ? `, ${arrondissement}` : ""}</span>
                      </div>
                      {description && (
                        <p className="text-[12px] text-text-muted mt-2 leading-relaxed">{description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        {mode && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: mode.color }}
                          >
                            {mode.icon} {mode.name}
                          </span>
                        )}
                        <span className="text-[10px] text-text-muted">
                          {getMaxAttendeesLabel(maxAttendees)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-md border-t border-border px-5 py-4 pb-safe">
        {isLast ? (
          <motion.button
            onClick={handlePublish}
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(139,92,246,0.5)" }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3.5 rounded-2xl gradient-bg text-white text-sm font-bold shadow-glow flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Publier
          </motion.button>
        ) : (
          <motion.button
            onClick={goNext}
            disabled={!canProceed}
            whileHover={canProceed ? { scale: 1.02 } : {}}
            whileTap={canProceed ? { scale: 0.95 } : {}}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
              canProceed
                ? "gradient-bg text-white shadow-glow"
                : "bg-border text-text-muted/50 cursor-not-allowed"
            }`}
          >
            Continuer
          </motion.button>
        )}
      </div>
    </div>
  );
}
