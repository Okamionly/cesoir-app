"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const POSES = [
  { label: "Souris", emoji: "😊" },
  { label: "Tourne a droite", emoji: "→" },
  { label: "Fais un clin d'oeil", emoji: "😉" },
];

type VerifState = "idle" | "capturing" | "verifying" | "done";

export default function VideoVerification() {
  const [state, setState] = useState<VerifState>("idle");
  const [currentPose, setCurrentPose] = useState(0);

  useEffect(() => {
    if (state === "capturing") {
      const timer = setTimeout(() => {
        if (currentPose < 2) {
          setCurrentPose(currentPose + 1);
        } else {
          setState("verifying");
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
    if (state === "verifying") {
      const timer = setTimeout(() => setState("done"), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, currentPose]);

  const reset = () => {
    setState("idle");
    setCurrentPose(0);
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden" role="region" aria-label="Verification video">
      {/* Camera viewfinder mock */}
      <div className="relative h-64 overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)" }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "33.33% 33.33%" }} />

        {/* Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-2 border-white/30" />
        </div>

        {/* Recording indicator */}
        {(state === "capturing") && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <motion.div
              className="w-3 h-3 rounded-full bg-[#EF4444]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <span className="text-white/80 text-[11px] font-semibold">REC</span>
          </div>
        )}

        {/* Pose instruction */}
        <AnimatePresence mode="wait">
          {state === "capturing" && (
            <motion.div
              key={currentPose}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-6 left-0 right-0 text-center"
            >
              <span className="text-[32px]">{POSES[currentPose].emoji}</span>
              <p className="text-white text-[15px] font-bold mt-1">{POSES[currentPose].label}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verifying state */}
        {state === "verifying" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/40"
          >
            <motion.div
              className="w-12 h-12 rounded-full border-2 border-t-accent border-r-transparent border-b-transparent border-l-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
            <p className="text-white text-[14px] font-semibold mt-3">Verification en cours...</p>
          </motion.div>
        )}

        {/* Done state */}
        {state === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/40"
          >
            <motion.div
              className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center shadow-glow"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <p className="text-white text-[16px] font-bold mt-3">Verifie ✓</p>
            {/* Sparkle particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ background: i % 2 === 0 ? "#8B5CF6" : "#00FF88" }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 120,
                  y: (Math.random() - 0.5) * 120,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Step indicator + buttons */}
      <div className="p-4">
        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-4">
          {POSES.map((pose, i) => (
            <div key={i} className="flex-1 flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  state === "done" || (state === "capturing" && i < currentPose) || (state === "verifying" && true)
                    ? "gradient-bg text-white"
                    : state === "capturing" && i === currentPose
                    ? "border-2 border-accent text-accent"
                    : "border border-border text-text-muted"
                }`}
              >
                {state === "done" || (state !== "idle" && i < currentPose) || (state === "verifying")
                  ? "✓"
                  : i + 1}
              </div>
              <span className="text-[10px] text-text-muted truncate">{pose.label}</span>
            </div>
          ))}
        </div>

        {state === "idle" && (
          <motion.button
            onClick={() => setState("capturing")}
            className="w-full gradient-bg text-white py-3 rounded-full text-[14px] font-semibold shadow-glow tap-target"
            whileTap={{ scale: 0.96 }}
          >
            Lancer la verification
          </motion.button>
        )}

        {state === "done" && (
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex-1 py-3 rounded-full text-[13px] font-medium border border-border text-text-muted tap-target"
            >
              Refaire
            </button>
            <button className="flex-1 gradient-bg text-white py-3 rounded-full text-[13px] font-semibold tap-target">
              Confirmer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
