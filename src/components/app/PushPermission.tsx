"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePushNotifications } from "@/lib/usePushNotifications";

// ---------- Constants ----------

const DISMISSED_KEY = "cesoir_push_dismissed";
const APP_OPENS_KEY = "cesoir_app_opens";
const FIRST_MATCH_KEY = "cesoir_has_first_match";
const SHOW_AFTER_OPENS = 3;

// ---------- Helpers ----------

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function persistDismiss(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // localStorage indisponible
  }
}

function getAppOpens(): number {
  try {
    const count =
      parseInt(localStorage.getItem(APP_OPENS_KEY) ?? "0", 10) + 1;
    localStorage.setItem(APP_OPENS_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}

function hasFirstMatch(): boolean {
  try {
    return localStorage.getItem(FIRST_MATCH_KEY) === "1";
  } catch {
    return false;
  }
}

// ---------- Benefit Row ----------

function Benefit({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-white/80">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00FF88]/20 text-[#00FF88] text-xs font-bold">
        &#10003;
      </span>
      {text}
    </li>
  );
}

// ---------- Component ----------

export default function PushPermission() {
  const [visible, setVisible] = useState(false);
  const { isSupported, permission, subscribe, isLoading } =
    usePushNotifications();

  useEffect(() => {
    // Don't show if: unsupported, already granted, already denied, or dismissed
    if (!isSupported) return;
    if (permission === "granted" || permission === "denied") return;
    if (wasDismissed()) return;

    const opens = getAppOpens();
    const matchTrigger = hasFirstMatch();

    // Show after first match OR after 3 app opens
    if (matchTrigger || opens >= SHOW_AFTER_OPENS) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleActivate = useCallback(async () => {
    const ok = await subscribe();
    if (ok) {
      persistDismiss();
      setVisible(false);
    }
  }, [subscribe]);

  const handleDismiss = useCallback(() => {
    persistDismiss();
    setVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="rounded-2xl border border-white/10 bg-black/95 p-5 shadow-2xl backdrop-blur-md">
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6] text-lg text-white">
                &#9790;
              </div>
              <h3 className="text-base font-bold text-white">
                Activer les notifications ?
              </h3>
            </div>

            {/* Benefits */}
            <ul className="mb-5 space-y-2.5">
              <Benefit text="Nouveau match — sois le premier a reagir" />
              <Benefit text="Messages — ne rate aucune conversation" />
              <Benefit text="Plans confirmes — rappels avant le rendez-vous" />
            </ul>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/50 transition-colors hover:text-white/80"
              >
                Plus tard
              </button>
              <button
                onClick={handleActivate}
                disabled={isLoading}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#00FF88] py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? "Activation..." : "Activer"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
