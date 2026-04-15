"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

function getTimeUntilMidnight(): { hours: number; minutes: number; totalMs: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes, totalMs: diff };
}

export default function MidnightReset() {
  const [time, setTime] = useState(getTimeUntilMidnight);
  const [resetMessage, setResetMessage] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTimeUntilMidnight();
      if (t.totalMs <= 0) {
        setResetMessage(true);
        setTimeout(() => {
          setResetMessage(false);
        }, 5000);
      }
      setTime(t);
    }, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const isUrgent = time.hours === 0 && time.minutes < 60;

  return (
    <div className="shrink-0 px-4 pt-2 pb-1" role="status" aria-label="Compte a rebours minuit">
      <AnimatePresence mode="wait">
        {resetMessage ? (
          <motion.p
            key="reset"
            className="text-center text-[10px] font-medium text-accent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            🌅 Nouveau soir, nouvelles rencontres !
          </motion.p>
        ) : (
          <motion.p
            key="countdown"
            className={`text-center text-[10px] font-medium ${
              isUrgent ? "text-[#EF4444]" : "text-text-muted"
            }`}
            initial={{ opacity: 0 }}
            animate={
              isUrgent
                ? { opacity: [0.6, 1, 0.6] }
                : { opacity: 1 }
            }
            transition={
              isUrgent
                ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.4 }
            }
          >
            ⏰ Reset dans {time.hours}h {String(time.minutes).padStart(2, "0")}m
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
