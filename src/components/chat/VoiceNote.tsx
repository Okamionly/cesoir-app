"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------- VoiceRecordButton ----------

interface VoiceRecordButtonProps {
  onRecordComplete: (duration: number) => void;
}

export function VoiceRecordButton({ onRecordComplete }: VoiceRecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDuration = 30;

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordTime(0);
    timerRef.current = setInterval(() => {
      setRecordTime((prev) => {
        if (prev >= maxDuration - 1) {
          // Auto-stop at 30s
          stopRecording(prev + 1);
          return maxDuration;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const stopRecording = useCallback(
    (finalTime?: number) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      const duration = finalTime ?? recordTime;
      if (duration > 0) {
        onRecordComplete(duration);
      }
      setRecordTime(0);
    },
    [recordTime, onRecordComplete],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="relative flex items-center">
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, x: 10, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: 10, width: 0 }}
            className="flex items-center gap-2 mr-2 overflow-hidden"
          >
            {/* Waveform bars */}
            <div className="flex items-center gap-0.5 h-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-danger"
                  animate={{
                    height: [6, 14 + Math.random() * 10, 6],
                  }}
                  transition={{
                    duration: 0.4 + Math.random() * 0.3,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
            {/* Countdown */}
            <span className="text-[11px] font-semibold text-danger tabular-nums whitespace-nowrap">
              {maxDuration - recordTime}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onPointerDown={startRecording}
        onPointerUp={() => isRecording && stopRecording()}
        onPointerLeave={() => isRecording && stopRecording()}
        className={`tap-target shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 ${
          isRecording
            ? "bg-danger text-white"
            : "bg-bg-card border border-border text-text-muted hover:text-accent hover:border-accent/30"
        }`}
        aria-label={isRecording ? "Relacher pour envoyer le message vocal" : "Maintenir pour enregistrer un message vocal"}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
            fill="currentColor"
          />
          <path
            d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ---------- VoiceNoteBubble ----------

interface VoiceNoteBubbleProps {
  duration: number; // seconds
  isOwn: boolean;
  time: string;
}

export function VoiceNoteBubble({ duration, isOwn, time }: VoiceNoteBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    setProgress(0);
    const step = 100 / (duration * 20); // 50ms intervals
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPlaying(false);
          return 0;
        }
        return prev + step;
      });
    }, 50);
  }, [isPlaying, duration]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatDuration = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // Generate consistent fake waveform bars
  const bars = Array.from({ length: 24 }, (_, i) => {
    const seed = (i * 7 + 3) % 11;
    return 4 + seed * 2;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-2`}
    >
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl max-w-[75%] ${
          isOwn
            ? "gradient-bg rounded-br-md"
            : "bg-[#F2F2F2] rounded-bl-md"
        }`}
      >
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isOwn ? "bg-white/20" : "bg-black/10"
          }`}
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isPlaying ? (
            <svg width={12} height={12} viewBox="0 0 12 12" fill={isOwn ? "white" : "#111"}>
              <rect x="1" y="1" width="3.5" height="10" rx="1" />
              <rect x="7.5" y="1" width="3.5" height="10" rx="1" />
            </svg>
          ) : (
            <svg width={12} height={12} viewBox="0 0 12 12" fill={isOwn ? "white" : "#111"}>
              <path d="M2 1l9 5-9 5V1z" />
            </svg>
          )}
        </button>

        {/* Waveform */}
        <div className="flex items-center gap-[2px] h-6 flex-1">
          {bars.map((h, i) => {
            const barProgress = (i / bars.length) * 100;
            const isActive = barProgress <= progress;
            return (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 2,
                  height: h,
                  background: isOwn
                    ? isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.35)"
                    : isActive ? "#8B5CF6" : "rgba(0,0,0,0.15)",
                }}
                animate={isPlaying && isActive ? { scaleY: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            );
          })}
        </div>

        {/* Duration */}
        <span className={`text-[10px] font-medium shrink-0 ${isOwn ? "text-white/60" : "text-text-muted"}`}>
          {formatDuration(duration)}
        </span>
      </div>
    </motion.div>
  );
}
