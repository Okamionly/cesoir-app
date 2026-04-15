"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ProximityAlertProps {
  name: string;
  distance: string;
  photo: string;
  onPropose?: () => void;
  onDismiss?: () => void;
}

export default function ProximityAlert({ name, distance, photo, onPropose, onDismiss }: ProximityAlertProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const duration = 10000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        setVisible(false);
        onDismiss?.();
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [visible, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-50"
          role="alert"
          aria-live="polite"
        >
          <div className="bg-bg border-2 border-accent/30 rounded-2xl p-4 shadow-glow overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={photo}
                alt={name}
                className="w-12 h-12 rounded-full object-cover border-2 border-accent"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-text">
                  {name} est a {distance} de toi
                </p>
                <p className="text-[11px] text-text-muted flex items-center gap-1">
                  <span aria-hidden="true">📍</span> A proximite maintenant
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <motion.button
                onClick={() => { onPropose?.(); handleDismiss(); }}
                className="flex-1 gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold tap-target"
                whileTap={{ scale: 0.95 }}
              >
                Proposer un plan
              </motion.button>
              <motion.button
                onClick={handleDismiss}
                className="px-4 py-2.5 border border-border rounded-full text-[12px] font-medium text-text-muted tap-target"
                whileTap={{ scale: 0.95 }}
              >
                Plus tard
              </motion.button>
            </div>

            {/* Progress bar */}
            <div className="h-[3px] bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-bg rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
