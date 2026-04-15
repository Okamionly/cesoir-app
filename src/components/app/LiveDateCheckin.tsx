"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";

// ─── Constants ───────────────────────────────────
const CHECKIN_INTERVAL_MS = 30 * 60 * 1000; // 30 min
const ALERT_TIMEOUT_MS = 15 * 60 * 1000; // 15 min after missed = alert (45 min total)

type DateState = "idle" | "active" | "checkin-prompt" | "alert-sent" | "ended";

interface TrustedContact {
  id: string;
  name: string;
  initial: string;
  watching: boolean;
}

const MOCK_CONTACTS: TrustedContact[] = [
  { id: "tc-1", name: "Maman", initial: "M", watching: true },
  { id: "tc-2", name: "Juliette", initial: "J", watching: true },
  { id: "tc-3", name: "Lucas", initial: "L", watching: false },
];

// ─── Variants ────────────────────────────────────
const sheetVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.heavy,
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const markerVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springs.elastic,
  },
};

const pulseRing = {
  hidden: { scale: 1, opacity: 0.6 },
  visible: {
    scale: 2.5,
    opacity: 0,
    transition: { duration: 2, repeat: Infinity, ease: "easeOut" as const },
  },
};

const contactVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { ...springs.snap, delay: 0.2 + i * 0.08 },
  }),
};

// ─── Component ───────────────────────────────────
export default function LiveDateCheckin() {
  const [state, setState] = useState<DateState>("idle");
  const [showPanel, setShowPanel] = useState(false);
  const [remainingMs, setRemainingMs] = useState(CHECKIN_INTERVAL_MS);
  const [contacts] = useState(MOCK_CONTACTS);
  const [checkinCount, setCheckinCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (alertRef.current) { clearTimeout(alertRef.current); alertRef.current = null; }
  }, []);

  const startCheckinTimer = useCallback(() => {
    clearAllTimers();
    setRemainingMs(CHECKIN_INTERVAL_MS);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = CHECKIN_INTERVAL_MS - elapsed;
      if (left <= 0) {
        setRemainingMs(0);
        setState("checkin-prompt");
        haptics.heavy();
        if (timerRef.current) clearInterval(timerRef.current);

        // Start alert countdown (15 min)
        alertRef.current = setTimeout(() => {
          setState("alert-sent");
          haptics.error();
        }, ALERT_TIMEOUT_MS);
      } else {
        setRemainingMs(left);
      }
    }, 1000);
  }, [clearAllTimers]);

  const handleStartDate = useCallback(() => {
    haptics.success();
    setState("active");
    setShowPanel(true);
    startCheckinTimer();
  }, [startCheckinTimer]);

  const handleCheckin = useCallback(() => {
    haptics.success();
    setCheckinCount((c) => c + 1);
    setState("active");
    startCheckinTimer();
  }, [startCheckinTimer]);

  const handleEndDate = useCallback(() => {
    haptics.medium();
    clearAllTimers();
    setState("ended");
    setTimeout(() => {
      setState("idle");
      setShowPanel(false);
      setCheckinCount(0);
    }, 3000);
  }, [clearAllTimers]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const formatTime = (ms: number): string => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

  // Idle state - show start button
  if (state === "idle") {
    return (
      <motion.button
        type="button"
        onClick={handleStartDate}
        className="w-full bg-bg-card border border-border rounded-2xl p-4 flex items-center gap-3 tap-target"
        whileTap={micro.tapScale}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.heavy}
      >
        <div className="w-11 h-11 rounded-xl bg-safe/10 flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <p className="text-[13px] font-bold text-text">Commencer un date</p>
          <p className="text-[11px] text-text-muted">Partage ta position avec tes proches</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted shrink-0" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </motion.button>
    );
  }

  return (
    <>
      {/* Floating status indicator */}
      <AnimatePresence>
        {(state === "active" || state === "checkin-prompt") && !showPanel && (
          <motion.button
            type="button"
            onClick={() => setShowPanel(true)}
            className="fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg"
            style={{ backgroundColor: state === "checkin-prompt" ? "#EF4444" : "#22c55e" }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            aria-label="Ouvrir le suivi de date"
          >
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-white"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {state === "checkin-prompt" ? "Check-in !" : formatTime(remainingMs)}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main panel */}
      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-bg rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-label="Suivi de date en direct"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="px-5 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-[16px] font-black text-text">Date en cours</h2>
                    <p className="text-[11px] text-text-muted">
                      {checkinCount} check-in{checkinCount > 1 ? "s" : ""} effectue{checkinCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${
                    state === "checkin-prompt"
                      ? "bg-[#EF4444]/10 text-[#EF4444]"
                      : state === "alert-sent"
                      ? "bg-[#EF4444] text-white"
                      : "bg-safe/10 text-safe"
                  }`}>
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: state === "active" ? "#22c55e" : "#EF4444" }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    {state === "alert-sent" ? "ALERTE" : state === "checkin-prompt" ? "CHECK-IN" : "ACTIF"}
                  </div>
                </div>

                {/* Map placeholder */}
                <div
                  className="relative h-44 rounded-2xl overflow-hidden mb-5"
                  style={{ background: "linear-gradient(135deg, #e8e8e8, #d4d4d4)" }}
                >
                  {/* Grid lines simulating map */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: "linear-gradient(#999 1px, transparent 1px), linear-gradient(90deg, #999 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }}
                  />

                  {/* Your position */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {/* Pulse rings */}
                    <motion.div
                      className="absolute inset-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20"
                      variants={pulseRing}
                      initial="hidden"
                      animate="visible"
                    />
                    <motion.div
                      className="relative w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full gradient-bg border-2 border-white shadow-lg flex items-center justify-center"
                      variants={markerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <span className="text-[10px] font-black text-white">Toi</span>
                    </motion.div>
                  </div>

                  {/* Venue dot */}
                  <motion.div
                    className="absolute top-[35%] left-[60%] w-5 h-5 rounded-full bg-[#f59e0b] border-2 border-white shadow flex items-center justify-center"
                    variants={markerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <span className="text-[8px]">📍</span>
                  </motion.div>
                </div>

                {/* Trusted contacts watching */}
                <div className="mb-5">
                  <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">
                    Contacts qui te suivent
                  </p>
                  <div className="space-y-2">
                    {contacts.map((contact, i) => (
                      <motion.div
                        key={contact.id}
                        className="flex items-center gap-3 bg-bg-card border border-border rounded-xl p-3"
                        variants={contactVariants}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                      >
                        <div className="w-9 h-9 rounded-full bg-safe/15 flex items-center justify-center shrink-0">
                          <span className="text-[13px] font-bold text-safe">{contact.initial}</span>
                        </div>
                        <p className="text-[13px] font-semibold text-text flex-1">{contact.name}</p>
                        {contact.watching ? (
                          <div className="flex items-center gap-1">
                            <motion.div
                              className="w-2 h-2 rounded-full bg-safe"
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="text-[10px] text-safe font-semibold">En ligne</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted">Hors ligne</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Alert sent state */}
                <AnimatePresence>
                  {state === "alert-sent" && (
                    <motion.div
                      className="bg-[#EF4444]/8 border border-[#EF4444]/20 rounded-2xl p-4 mb-5"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={springs.elastic}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[18px]">🚨</span>
                        <p className="text-[14px] font-black text-[#EF4444]">Alerte envoyee</p>
                      </div>
                      <p className="text-[12px] text-text-muted leading-relaxed">
                        Tes contacts de confiance ont recu ta position et un message d&apos;alerte automatique.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Check-in prompt */}
                <AnimatePresence>
                  {state === "checkin-prompt" && (
                    <motion.div
                      className="bg-accent/5 border-2 border-accent/20 rounded-2xl p-4 mb-5"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={springs.elastic}
                    >
                      <p className="text-[14px] font-bold text-text mb-1">Tout va bien ?</p>
                      <p className="text-[12px] text-text-muted mb-3">
                        Pas de reponse dans 15 min = alerte automatique a tes contacts
                      </p>
                      <motion.button
                        onClick={handleCheckin}
                        className="w-full gradient-bg text-white py-3 rounded-full text-[14px] font-bold shadow-glow tap-target"
                        whileTap={micro.tapScale}
                      >
                        Je suis en securite
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Timer display when active */}
                {state === "active" && (
                  <div className="bg-bg-card border border-border rounded-2xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-text-muted font-semibold">Prochain check-in</span>
                      <span className="text-[14px] font-black text-accent">{formatTime(remainingMs)}</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full gradient-bg origin-left"
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: remainingMs / CHECKIN_INTERVAL_MS }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                )}

                {/* Ended state */}
                <AnimatePresence>
                  {state === "ended" && (
                    <motion.div
                      className="bg-safe/8 border border-safe/20 rounded-2xl p-5 mb-5 text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={springs.elastic}
                    >
                      <motion.div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-safe/15 mb-3"
                        animate={micro.successPop}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" aria-hidden="true">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                      <p className="text-[15px] font-black text-text mb-1">Date termine</p>
                      <p className="text-[12px] text-text-muted">Tes contacts ont ete notifies. Bonne soiree !</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                {state !== "ended" && (
                  <div className="space-y-3">
                    {state === "active" && (
                      <motion.button
                        onClick={handleCheckin}
                        className="w-full bg-safe text-white py-3.5 rounded-full text-[14px] font-bold tap-target"
                        whileTap={micro.tapScale}
                      >
                        Je suis en securite
                      </motion.button>
                    )}
                    <button
                      onClick={handleEndDate}
                      className="w-full py-3 rounded-full text-[13px] font-medium border border-border text-text-muted tap-target"
                    >
                      Terminer le date
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
