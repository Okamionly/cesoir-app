"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { springs, achievementVariants } from "@/lib/motion-design";
import { suggestVenuesByActivity, formatPrice } from "@/lib/venues";
import type { Venue } from "@/lib/venues";
import VenuePicker from "@/components/app/VenuePicker";
import { usePlans } from "@/lib/useMatchPlan";

// ─────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1 as const, label: "Quand" },
  { num: 2 as const, label: "Quoi" },
  { num: 3 as const, label: "Ou" },
  { num: 4 as const, label: "Confirmer" },
];

const TIME_SLOTS = [
  { value: "19h", label: "19h", emoji: "\uD83C\uDF05" },
  { value: "20h", label: "20h", emoji: "\uD83C\uDF06" },
  { value: "21h", label: "21h", emoji: "\uD83C\uDF03" },
  { value: "22h", label: "22h", emoji: "\uD83C\uDF19" },
  { value: "23h", label: "23h", emoji: "\uD83C\uDF1A" },
  { value: "flexible", label: "Flexible", emoji: "\u2728" },
];

const ACTIVITIES = [
  { key: "diner", label: "Diner", emoji: "\uD83C\uDF7D\uFE0F" },
  { key: "verre", label: "Verre", emoji: "\uD83C\uDF78" },
  { key: "concert", label: "Concert", emoji: "\uD83C\uDFB5" },
  { key: "balade", label: "Balade", emoji: "\uD83C\uDF3F" },
  { key: "cinema", label: "Cinema", emoji: "\uD83C\uDFAC" },
  { key: "cafe", label: "Cafe", emoji: "\u2615" },
  { key: "musee", label: "Musee", emoji: "\uD83C\uDFDB\uFE0F" },
  { key: "sport", label: "Sport", emoji: "\uD83C\uDFCB\uFE0F" },
];

// Mock match data (in a real app, fetched from Supabase by matchId)
const MOCK_MATCH = {
  name: "Camille",
  avatar: null as string | null,
  mode: "plus-one" as const,
};

// Default user location (central Paris — Chatelet)
const USER_LAT = 48.8606;
const USER_LNG = 2.3476;

// ─────────────────────────────────────────
// Step animation variants
// ─────────────────────────────────────────

const stepVariants = {
  enter: { opacity: 0, x: 80, scale: 0.96 },
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    x: -80,
    scale: 0.96,
    transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
  },
};

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { ...springs.elastic, delay: i * 0.06 },
  }),
};

const activityVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { ...springs.snap, delay: i * 0.05 },
  }),
};

const confirmVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...springs.cinematic },
  },
};

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function ProgressDots({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {STEPS.map((step) => (
        <motion.div
          key={step.num}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...springs.snap, delay: step.num * 0.05 }}
          className={`h-2 rounded-full transition-all duration-300 ${
            step.num === current
              ? "w-6 bg-accent"
              : step.num < current
                ? "w-2 bg-accent/50"
                : "w-2 bg-border"
          }`}
          aria-label={`Etape ${step.num}: ${step.label}`}
        />
      ))}
    </div>
  );
}

function MatchHeader({ name, avatar }: { name: string; avatar: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full gradient-bg p-[2px] shadow-glow shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-[16px] font-black text-accent">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <h1 className="text-[18px] font-bold text-text">
          Planifier avec {name}
        </h1>
        <p className="text-[11px] text-text-muted">Organisez votre soiree</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main page
// ─────────────────────────────────────────

export default function DatePlannerPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const { proposePlan } = usePlans();

  // State
  const [step, setStep] = useState<Step>(1);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [sent, setSent] = useState(false);

  // Venue suggestions based on selected activity
  const venues = useMemo(() => {
    if (!selectedActivity) return [];
    return suggestVenuesByActivity(selectedActivity, USER_LAT, USER_LNG, 4);
  }, [selectedActivity]);

  // Navigation
  const canAdvance =
    (step === 1 && selectedTime) ||
    (step === 2 && selectedActivity) ||
    (step === 3 && selectedVenue) ||
    step === 4;

  const goNext = useCallback(() => {
    if (step < 4) setStep((s) => (s + 1) as Step);
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }, [step]);

  const handleSelectVenue = useCallback((venue: Venue) => {
    setSelectedVenueId(venue.id);
    setSelectedVenue(venue);
  }, []);

  const handleProposeVenue = useCallback(
    (venue: Venue) => {
      setSelectedVenue(venue);
      setSelectedVenueId(venue.id);
      goNext();
    },
    [goNext],
  );

  const handleSend = useCallback(async () => {
    setSent(true);

    // Map selectedTime ("19h", "flexible", etc.) to an ISO datetime
    const when = (() => {
      const d = new Date();
      if (selectedTime && selectedTime !== "flexible") {
        const match = selectedTime.match(/(\d{1,2})h/);
        if (match) {
          d.setHours(parseInt(match[1], 10), 0, 0, 0);
          if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
        }
      } else {
        d.setHours(20, 0, 0, 0);
      }
      return d.toISOString();
    })();

    const whereText = selectedVenue ? `${selectedVenue.name} - ${selectedVenue.address}` : "";

    // Fire-and-forget persistence; UI proceeds regardless to preserve UX.
    void proposePlan({
      partnerId: matchId,
      whenDate: when,
      what: selectedActivity ?? "",
      whereText,
    });

    setTimeout(() => {
      router.push(`/chat/${matchId}`);
    }, 2000);
  }, [matchId, router, proposePlan, selectedTime, selectedActivity, selectedVenue]);

  // Activity label lookup
  const activityLabel =
    ACTIVITIES.find((a) => a.key === selectedActivity)?.label ?? "";
  const activityEmoji =
    ACTIVITIES.find((a) => a.key === selectedActivity)?.emoji ?? "";

  return (
    <div className="min-h-screen bg-bg relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-4 pb-3 space-y-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={step > 1 ? goBack : () => router.back()}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted shrink-0"
            aria-label="Retour"
          >
            {"\u2190"}
          </motion.button>
          <MatchHeader name={MOCK_MATCH.name} avatar={MOCK_MATCH.avatar} />
        </div>
        <ProgressDots current={step} />
      </header>

      {/* Step content */}
      <main className="px-5 pb-32 pt-6">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Quand? ── */}
          {step === 1 && (
            <motion.div
              key="step-1"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h2 className="text-[22px] font-bold text-text mb-1">
                {"\u{1F552}"} Quand ?
              </h2>
              <p className="text-[13px] text-text-muted mb-6">
                Choisissez l&apos;heure pour ce soir
              </p>

              <div className="grid grid-cols-3 gap-3">
                {TIME_SLOTS.map((slot, i) => {
                  const isActive = selectedTime === slot.value;
                  return (
                    <motion.button
                      key={slot.value}
                      custom={i}
                      variants={gridItemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => setSelectedTime(slot.value)}
                      whileTap={{ scale: 0.92 }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                        isActive
                          ? "border-accent bg-accent/10 shadow-glow"
                          : "border-border bg-bg-card hover:border-accent/30"
                      }`}
                    >
                      <span className="text-[24px]">{slot.emoji}</span>
                      <span
                        className={`text-[14px] font-semibold ${
                          isActive ? "text-accent" : "text-text"
                        }`}
                      >
                        {slot.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="time-check"
                          className="w-4 h-4 rounded-full gradient-bg flex items-center justify-center"
                          transition={springs.elastic}
                        >
                          <span className="text-white text-[8px] font-bold">
                            {"\u2713"}
                          </span>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Quoi? ── */}
          {step === 2 && (
            <motion.div
              key="step-2"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h2 className="text-[22px] font-bold text-text mb-1">
                {"\uD83C\uDFAF"} Quoi ?
              </h2>
              <p className="text-[13px] text-text-muted mb-6">
                Qu&apos;est-ce qui vous ferait plaisir ?
              </p>

              <div className="grid grid-cols-2 gap-3">
                {ACTIVITIES.map((act, i) => {
                  const isActive = selectedActivity === act.key;
                  return (
                    <motion.button
                      key={act.key}
                      custom={i}
                      variants={activityVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => {
                        setSelectedActivity(act.key);
                        setSelectedVenueId(null);
                        setSelectedVenue(null);
                      }}
                      whileTap={{ scale: 0.92 }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                        isActive
                          ? "border-accent bg-accent/10 shadow-glow"
                          : "border-border bg-bg-card hover:border-accent/30"
                      }`}
                    >
                      <span className="text-[28px]">{act.emoji}</span>
                      <span
                        className={`text-[14px] font-semibold ${
                          isActive ? "text-accent" : "text-text"
                        }`}
                      >
                        {act.label}
                      </span>
                      {isActive && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={springs.elastic}
                          className="ml-auto w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        >
                          {"\u2713"}
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Ou? ── */}
          {step === 3 && (
            <motion.div
              key="step-3"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h2 className="text-[22px] font-bold text-text mb-1">
                {"\uD83D\uDCCD"} Ou ?
              </h2>
              <p className="text-[13px] text-text-muted mb-6">
                Suggestions {activityLabel.toLowerCase()} pres de vous
              </p>

              {venues.length > 0 ? (
                <VenuePicker
                  venues={venues}
                  selectedId={selectedVenueId}
                  onSelect={handleSelectVenue}
                  onPropose={handleProposeVenue}
                />
              ) : (
                <div className="text-center py-12 text-text-muted text-[13px]">
                  Aucun lieu trouve pour cette activite.
                </div>
              )}
            </motion.div>
          )}

          {/* ── Step 4: Confirmation ── */}
          {step === 4 && (
            <motion.div
              key="step-4"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col items-center"
            >
              <h2 className="text-[22px] font-bold text-text mb-1 text-center">
                {"\u2728"} Confirmation
              </h2>
              <p className="text-[13px] text-text-muted mb-6 text-center">
                Verifiez les details avant d&apos;envoyer
              </p>

              {/* Summary card */}
              <motion.div
                variants={confirmVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-sm rounded-2xl border border-accent/30 bg-bg-card p-6 relative overflow-hidden"
                style={{
                  boxShadow:
                    "0 0 40px rgba(139,92,246,0.15), 0 0 80px rgba(139,92,246,0.05)",
                }}
              >
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  animate={achievementVariants.glow.pulse}
                />

                <div className="relative z-10 space-y-4">
                  {/* Match header in card */}
                  <div className="flex items-center gap-3 pb-4 border-b border-border">
                    <div className="w-12 h-12 rounded-full gradient-bg p-[2px]">
                      <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-[18px] font-black text-accent">
                        {MOCK_MATCH.name.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-text">
                        Soiree avec {MOCK_MATCH.name}
                      </p>
                      <p className="text-[11px] text-text-muted">Ce soir</p>
                    </div>
                  </div>

                  {/* Details rows */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-[16px]">
                        {"\u{1F552}"}
                      </span>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold">
                          Heure
                        </p>
                        <p className="text-[14px] font-bold text-text">
                          {selectedTime === "flexible"
                            ? "Flexible"
                            : selectedTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-[16px]">
                        {activityEmoji}
                      </span>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold">
                          Activite
                        </p>
                        <p className="text-[14px] font-bold text-text">
                          {activityLabel}
                        </p>
                      </div>
                    </div>

                    {selectedVenue && (
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-[16px]">
                          {"\uD83D\uDCCD"}
                        </span>
                        <div>
                          <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold">
                            Lieu
                          </p>
                          <p className="text-[14px] font-bold text-text">
                            {selectedVenue.name}
                          </p>
                          <p className="text-[11px] text-text-muted">
                            {selectedVenue.address} &middot;{" "}
                            {formatPrice(selectedVenue.priceRange)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Send button */}
              <motion.button
                onClick={handleSend}
                disabled={sent}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.elastic, delay: 0.4 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`mt-6 w-full max-w-sm py-4 rounded-2xl text-center text-[15px] font-bold shadow-glow transition-all ${
                  sent
                    ? "bg-safe text-white"
                    : "gradient-bg text-white"
                }`}
              >
                {sent ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springs.elastic}
                    className="inline-flex items-center gap-2"
                  >
                    {"\u2713"} Envoye a {MOCK_MATCH.name} !
                  </motion.span>
                ) : (
                  <>Envoyer a {MOCK_MATCH.name}</>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom navigation — Next/Back */}
      {step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-md border-t border-border px-5 py-4 safe-area-bottom">
          <div className="flex gap-3 max-w-sm mx-auto">
            {step > 1 && (
              <motion.button
                onClick={goBack}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3.5 rounded-2xl border border-border text-[14px] font-semibold text-text bg-bg-card"
              >
                Retour
              </motion.button>
            )}
            <motion.button
              onClick={goNext}
              disabled={!canAdvance}
              whileHover={canAdvance ? { y: -2 } : undefined}
              whileTap={canAdvance ? { scale: 0.95 } : undefined}
              transition={springs.snap}
              className={`flex-1 py-3.5 rounded-2xl text-[14px] font-bold transition-all ${
                canAdvance
                  ? "gradient-bg text-white shadow-glow"
                  : "bg-border text-text-muted cursor-not-allowed"
              }`}
            >
              Suivant
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
