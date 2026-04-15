"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/lib/haptics";

const CHECK_IN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const NO_RESPONSE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

type CheckInState = "idle" | "active" | "prompted" | "fake-call" | "alert-sent";

export default function LiveCheckIn() {
  const [state, setState] = useState<CheckInState>("idle");
  const [remainingMs, setRemainingMs] = useState(CHECK_IN_INTERVAL_MS);
  const [showPanel, setShowPanel] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noResponseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (noResponseRef.current) {
      clearTimeout(noResponseRef.current);
      noResponseRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimers();
    setRemainingMs(CHECK_IN_INTERVAL_MS);
    setState("active");

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = CHECK_IN_INTERVAL_MS - elapsed;
      if (left <= 0) {
        setRemainingMs(0);
        setState("prompted");
        haptics.heavy();
        if (timerRef.current) clearInterval(timerRef.current);

        // Start no-response countdown
        noResponseRef.current = setTimeout(() => {
          setState("alert-sent");
          haptics.error();
        }, NO_RESPONSE_TIMEOUT_MS);
      } else {
        setRemainingMs(left);
      }
    }, 1000);
  }, [clearTimers]);

  const handleAllGood = useCallback(() => {
    haptics.success();
    if (noResponseRef.current) clearTimeout(noResponseRef.current);
    startTimer(); // Reset for another 30min
  }, [startTimer]);

  const handleFakeCall = useCallback(() => {
    haptics.match();
    if (noResponseRef.current) clearTimeout(noResponseRef.current);
    setState("fake-call");
  }, []);

  const deactivate = useCallback(() => {
    clearTimers();
    setState("idle");
    setShowPanel(false);
    setRemainingMs(CHECK_IN_INTERVAL_MS);
  }, [clearTimers]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const formatTime = (ms: number): string => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

  // Idle: nothing shown
  if (state === "idle") {
    return (
      <motion.button
        type="button"
        onClick={() => {
          haptics.medium();
          startTimer();
        }}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        style={{ backgroundColor: "#22c55e" }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        aria-label="Activer le check-in de securite"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Check-in
      </motion.button>
    );
  }

  // Fake call overlay
  if (state === "fake-call") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
        style={{ backgroundColor: "#0A0A0A" }}
        role="dialog"
        aria-label="Appel entrant simule"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(34,197,94,0.2)" }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </motion.div>
        <p className="mb-2 text-xl font-semibold text-white">Appel entrant...</p>
        <p className="mb-10 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
          Maman
        </p>
        <div className="flex gap-8">
          <button
            type="button"
            onClick={deactivate}
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "#ef4444" }}
            aria-label="Refuser l'appel"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: "rotate(135deg)" }}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={deactivate}
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "#22c55e" }}
            aria-label="Accepter l'appel"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
        </div>
      </motion.div>
    );
  }

  // Alert sent
  if (state === "alert-sent") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-24 right-4 z-40 w-72 rounded-2xl p-4 shadow-xl"
        style={{ backgroundColor: "#ef4444" }}
        role="alert"
        aria-live="assertive"
      >
        <p className="mb-2 text-sm font-semibold text-white">
          Alerte envoyee a tes contacts de confiance
        </p>
        <p className="mb-3 text-xs text-white/80">
          Ils ont recu ta position et un message d&apos;alerte.
        </p>
        <button
          type="button"
          onClick={deactivate}
          className="w-full rounded-xl bg-white/20 py-2 text-sm font-medium text-white"
        >
          Tout va bien, annuler
        </button>
      </motion.div>
    );
  }

  // Prompted: check-in notification
  if (state === "prompted") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 right-4 z-40 w-72 rounded-2xl p-4 shadow-xl"
          style={{ backgroundColor: "#FFFFFF", border: "2px solid #8B5CF6" }}
          role="alertdialog"
          aria-label="Check-in de securite"
        >
          <p className="mb-1 text-sm font-semibold" style={{ color: "#111111" }}>
            Tout va bien ?
          </p>
          <p className="mb-3 text-xs" style={{ color: "#666666" }}>
            Pas de reponse dans 5 min = alerte envoyee
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAllGood}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: "#22c55e" }}
            >
              Oui, super !
            </button>
            <button
              type="button"
              onClick={handleFakeCall}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: "#ef4444" }}
            >
              Non, appelle-moi
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Active: floating button with timer
  return (
    <>
      <motion.button
        type="button"
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        style={{ backgroundColor: "#22c55e" }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Check-in actif, prochain dans ${formatTime(remainingMs)}`}
      >
        <motion.span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "#FFFFFF" }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          aria-hidden="true"
        />
        {formatTime(remainingMs)}
      </motion.button>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-40 right-4 z-40 w-64 rounded-2xl p-4 shadow-xl"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <p className="mb-1 text-sm font-semibold" style={{ color: "#111111" }}>
              Check-in actif
            </p>
            <p className="mb-3 text-xs" style={{ color: "#666666" }}>
              Prochain check-in dans {formatTime(remainingMs)}
            </p>
            <button
              type="button"
              onClick={deactivate}
              className="w-full rounded-xl py-2 text-sm font-medium transition-colors"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
            >
              Desactiver
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
