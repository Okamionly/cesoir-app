"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

function getTodayKey(): string {
  return `cesoir-dispo-${new Date().toISOString().split("T")[0]}`;
}

export default function ConfirmDispo() {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const key = getTodayKey();
    const stored = localStorage.getItem(key);
    if (stored === "true") {
      setConfirmed(true);
    } else if (stored === "false") {
      setConfirmed(false);
    }
  }, []);

  const handleConfirm = (dispo: boolean) => {
    setConfirmed(dispo);
    localStorage.setItem(getTodayKey(), String(dispo));
  };

  if (!mounted) return null;

  // Already declined
  if (confirmed === false) return null;

  return (
    <div className="shrink-0 px-4 pb-2">
      <AnimatePresence mode="wait">
        {confirmed === true ? (
          <motion.div
            key="confirmed"
            className="bg-bg-card border border-[#00FF88]/20 rounded-2xl px-4 py-3 flex items-center gap-3"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00FF88]" />
            </span>
            <p className="text-[13px] font-semibold text-text">
              Dispo ce soir{" "}
              <span className="text-[#00FF88]">&#10003;</span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="ask"
            className="bg-bg-card border border-border rounded-2xl px-4 py-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-[13px] font-semibold text-text mb-2.5">
              Tu es dispo ce soir ?
            </p>
            <div className="flex gap-2">
              <motion.button
                onClick={() => handleConfirm(true)}
                className="flex-1 gradient-bg text-white text-[12px] font-bold py-2 px-4 rounded-full"
                whileTap={{ scale: 0.93 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                Oui, je suis dispo !
              </motion.button>
              <motion.button
                onClick={() => handleConfirm(false)}
                className="flex-1 border-2 border-border text-text-muted text-[12px] font-bold py-2 px-4 rounded-full hover:border-text-muted transition-colors"
                whileTap={{ scale: 0.93 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                Pas ce soir
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
