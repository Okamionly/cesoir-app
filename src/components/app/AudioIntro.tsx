"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function AudioIntro() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      const start = Date.now();
      const duration = 15000;
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const pct = Math.min(elapsed / duration, 1);
        setProgress(pct);
        if (pct >= 1) {
          setPlaying(false);
          setProgress(0);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  const bars = [0.4, 0.7, 0.5, 0.9, 0.3, 0.6, 0.8];

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4" role="region" aria-label="Introduction audio">
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => { setPlaying(!playing); if (!playing) setProgress(0); }}
          className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center shrink-0 shadow-glow"
          whileTap={{ scale: 0.9 }}
          aria-label={playing ? "Mettre en pause" : "Ecouter l'intro"}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[13px] font-semibold text-text">Ecoute mon intro</span>
            <span className="text-[11px] text-text-muted ml-auto">0:{Math.floor(progress * 15).toString().padStart(2, "0")} / 0:15</span>
          </div>

          <div className="flex items-end gap-[3px] h-5">
            {bars.map((height, i) => (
              <motion.div
                key={i}
                className="w-[4px] rounded-full"
                style={{
                  background: progress > (i / bars.length) ? "linear-gradient(135deg, #8B5CF6, #00FF88)" : "#EBEBEB",
                }}
                animate={
                  playing
                    ? { height: [`${height * 100}%`, `${(1 - height) * 100}%`, `${height * 100}%`] }
                    : { height: `${height * 60}%` }
                }
                transition={
                  playing
                    ? { repeat: Infinity, duration: 0.4 + i * 0.1, ease: "easeInOut" }
                    : { duration: 0.3 }
                }
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-[2px] bg-border rounded-full mt-1.5 overflow-hidden">
            <motion.div
              className="h-full gradient-bg rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
