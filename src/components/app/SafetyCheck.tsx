"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { haptics } from "@/lib/haptics";

type SafetyState = "hidden" | "asking" | "safe" | "help" | "snoozed";

const SNOOZE_MS = 30 * 60 * 1000; // 30 min

interface SafetyCheckProps {
  /** Date start time. If provided, auto-shows 2h after. */
  dateStartTime?: Date;
  /** Manual trigger */
  show?: boolean;
  onDismiss?: () => void;
}

export default function SafetyCheck({
  dateStartTime,
  show = false,
  onDismiss,
}: SafetyCheckProps) {
  const [state, setState] = useState<SafetyState>("hidden");
  const snoozeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-show 2h after date start
  useEffect(() => {
    if (!dateStartTime) return;
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const showAt = dateStartTime.getTime() + twoHoursMs;
    const delay = showAt - Date.now();

    if (delay <= 0) {
      setState("asking");
      return;
    }

    const timer = setTimeout(() => {
      setState("asking");
      haptics.heavy();
    }, delay);

    return () => clearTimeout(timer);
  }, [dateStartTime]);

  // Manual trigger
  useEffect(() => {
    if (show) setState("asking");
  }, [show]);

  const handleSafe = useCallback(() => {
    haptics.success();
    setState("safe");
    setTimeout(() => {
      setState("hidden");
      onDismiss?.();
    }, 2500);
  }, [onDismiss]);

  const handleNeedHelp = useCallback(() => {
    haptics.error();
    setState("help");
  }, []);

  const handleSnooze = useCallback(() => {
    haptics.light();
    setState("snoozed");
    snoozeRef.current = setTimeout(() => {
      setState("asking");
      haptics.heavy();
    }, SNOOZE_MS);
  }, []);

  const dismiss = useCallback(() => {
    if (snoozeRef.current) clearTimeout(snoozeRef.current);
    setState("hidden");
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    return () => {
      if (snoozeRef.current) clearTimeout(snoozeRef.current);
    };
  }, []);

  if (state === "hidden") return null;

  // Snoozed state - small notification
  if (state === "snoozed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-24 left-4 z-50 rounded-full px-4 py-2 shadow-lg"
        style={{ backgroundColor: "#fbbf24", color: "#111111" }}
        role="status"
      >
        <p className="text-xs font-medium">Check securite dans 30 min</p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-6"
        style={{ backgroundColor: "rgba(10,10,10,0.95)" }}
        role="alertdialog"
        aria-modal="true"
        aria-label="Verification de securite apres rendez-vous"
      >
        {/* Safe confirmation */}
        {state === "safe" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(34,197,94,0.2)" }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <p className="text-xl font-semibold text-white">Bonne soiree !</p>
          </motion.div>
        )}

        {/* Asking state */}
        {state === "asking" && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm text-center"
          >
            <p
              className="mb-8 text-2xl font-bold leading-tight"
              style={{ color: "#FFFFFF", fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              Tu es bien rentre(e) ?
            </p>

            <div className="space-y-3">
              <motion.button
                type="button"
                onClick={handleSafe}
                className="w-full rounded-2xl py-4 text-base font-semibold text-white"
                style={{ backgroundColor: "#22c55e" }}
                whileTap={{ scale: 0.97 }}
              >
                Oui, tout va bien
              </motion.button>

              <motion.button
                type="button"
                onClick={handleNeedHelp}
                className="w-full rounded-2xl py-4 text-base font-semibold text-white"
                style={{ backgroundColor: "#ef4444" }}
                whileTap={{ scale: 0.97 }}
              >
                J&apos;ai besoin d&apos;aide
              </motion.button>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSnooze}
                  className="flex-1 rounded-xl py-2.5 text-sm"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Dans 30 min
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="flex-1 rounded-xl py-2.5 text-sm"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Help state - emergency options */}
        {state === "help" && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm"
          >
            <p className="mb-6 text-center text-lg font-semibold text-white">
              Comment peut-on t&apos;aider ?
            </p>

            <div className="space-y-3">
              <motion.button
                type="button"
                onClick={() => {
                  haptics.heavy();
                  // Would trigger trusted contact call
                }}
                className="flex w-full items-center gap-3 rounded-2xl p-4 text-left"
                style={{ backgroundColor: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}
                whileTap={{ scale: 0.97 }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#8B5CF6" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Appeler un ami de confiance</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Ton cercle de confiance
                  </p>
                </div>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => haptics.heavy()}
                className="flex w-full items-center gap-3 rounded-2xl p-4 text-left"
                style={{ backgroundColor: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.3)" }}
                whileTap={{ scale: 0.97 }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#22c55e" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Contacter le support CeSoir</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Equipe disponible 24/7
                  </p>
                </div>
              </motion.button>

              <motion.a
                href="tel:3919"
                className="flex w-full items-center gap-3 rounded-2xl p-4 text-left"
                style={{ backgroundColor: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" }}
                whileTap={{ scale: 0.97 }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Appeler le 3919</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Violences Femmes Info (gratuit, anonyme)
                  </p>
                </div>
              </motion.a>
            </div>

            <button
              type="button"
              onClick={() => setState("asking")}
              className="mt-4 w-full py-2 text-center text-sm"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Retour
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
