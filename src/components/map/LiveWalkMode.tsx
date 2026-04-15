"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type WalkStatus = "en-route" | "almost" | "arrived";

interface LiveWalkModeProps {
  /** Distance remaining in meters */
  initialDistance?: number;
  /** ETA in minutes */
  initialEta?: number;
  /** Destination name */
  destination?: string;
  /** Called when user taps "Je suis arrive(e)" */
  onArrived?: () => void;
  /** Called when user taps "Annuler" */
  onCancel?: () => void;
  /** Whether to show the component */
  visible?: boolean;
}

function getStatus(distance: number): WalkStatus {
  if (distance <= 0) return "arrived";
  if (distance < 200) return "almost";
  return "en-route";
}

function getStatusLabel(status: WalkStatus): string {
  switch (status) {
    case "en-route":
      return "En route...";
    case "almost":
      return "Presque la !";
    case "arrived":
      return "Arrive(e) !";
  }
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(meters)}m`;
}

export default function LiveWalkMode({
  initialDistance = 650,
  initialEta = 8,
  destination = "Le rendez-vous",
  onArrived,
  onCancel,
  visible = true,
}: LiveWalkModeProps) {
  const [distance, setDistance] = useState(initialDistance);
  const [eta, setEta] = useState(initialEta);
  const [status, setStatus] = useState<WalkStatus>(getStatus(initialDistance));

  // Simulate walking progress
  useEffect(() => {
    if (!visible || status === "arrived") return;

    const interval = setInterval(() => {
      setDistance((prev) => {
        const next = Math.max(0, prev - Math.random() * 30 - 10);
        setStatus(getStatus(next));
        return next;
      });
      setEta((prev) => Math.max(0, prev - 0.5));
    }, 3000);

    return () => clearInterval(interval);
  }, [visible, status]);

  const handleArrived = useCallback(() => {
    setStatus("arrived");
    setDistance(0);
    setEta(0);
    onArrived?.();
  }, [onArrived]);

  const isClose = status === "almost" || status === "arrived";
  const accentColor = isClose ? "#00FF88" : "#8B5CF6";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pointer-events-none"
        >
          <div
            className="pointer-events-auto mx-auto max-w-md rounded-2xl border p-4 shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: "rgba(20, 20, 20, 0.95)",
              borderColor: `${accentColor}33`,
            }}
            role="status"
            aria-live="polite"
            aria-label={`Navigation vers ${destination}`}
          >
            {/* Status header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Pulsing walking dot */}
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div
                    className="absolute inset-0 h-3 w-3 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>

                {/* Walking icon */}
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-lg"
                  aria-hidden="true"
                >
                  {status === "arrived" ? "\u2705" : "\u{1F6B6}"}
                </motion.span>

                <span
                  className="text-sm font-semibold"
                  style={{ color: accentColor }}
                >
                  {getStatusLabel(status)}
                </span>
              </div>

              <span className="text-xs text-white/50">{destination}</span>
            </div>

            {/* ETA and distance */}
            {status !== "arrived" && (
              <div className="mb-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-white/40">Arrivee dans</p>
                  <p className="text-xl font-black text-white">
                    ~{Math.ceil(eta)} min
                  </p>
                </div>
                <div
                  className="h-8 w-px"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                />
                <div className="flex-1">
                  <p className="text-xs text-white/40">Distance</p>
                  <p className="text-xl font-black text-white">
                    {formatDistance(distance)}
                  </p>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {status !== "arrived" && (
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}, ${isClose ? "#00FF88" : "#8B5CF6"})`,
                  }}
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.max(5, ((initialDistance - distance) / initialDistance) * 100)}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}

            {/* Arrived confirmation */}
            {status === "arrived" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4 text-center"
              >
                <p className="text-2xl font-black text-white">
                  Vous etes arrive(e) !
                </p>
                <p className="text-sm text-white/50">
                  Profitez bien de votre soiree
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {status !== "arrived" && (
                <button
                  onClick={handleArrived}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  }}
                  aria-label="Confirmer votre arrivee"
                >
                  Je suis arrive(e)
                </button>
              )}

              {status !== "arrived" && (
                <button
                  onClick={onCancel}
                  className="w-full py-2 text-xs text-white/40 transition-colors hover:text-white/60"
                  aria-label="Annuler la navigation"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
