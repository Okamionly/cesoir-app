"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AudioPlayerProps {
  src: string;
  duration?: number; // seconds, displayed before loading
}

// Generate pseudo-random waveform bars from URL hash
function generateBars(src: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = (hash << 5) - hash + src.charCodeAt(i);
    hash |= 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    hash = ((hash * 16807) % 2147483647 + 2147483647) % 2147483647;
    bars.push(0.15 + (hash % 100) / 120); // 0.15 - 0.98
  }
  return bars;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src, duration: initialDuration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [duration, setDuration] = useState(initialDuration ?? 0);
  const [currentTime, setCurrentTime] = useState(0);

  const barCount = 32;
  const bars = generateBars(src, barCount);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener("timeupdate", () => {
      if (audio.duration && isFinite(audio.duration)) {
        setProgress(audio.currentTime / audio.duration);
        setCurrentTime(audio.currentTime);
      }
    });

    audio.addEventListener("ended", () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", () => {});
      audio.removeEventListener("timeupdate", () => {});
      audio.removeEventListener("ended", () => {});
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setPlaying(!playing);
  }, [playing]);

  const handleBarClick = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const seekTo = (index / barCount) * audio.duration;
    audio.currentTime = seekTo;
    setProgress(index / barCount);
    setCurrentTime(seekTo);
  }, [barCount]);

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-[#8B5CF6]/20 to-[#00FF88]/20 rounded-2xl px-4 py-3 max-w-[300px]">
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#00FF88] flex items-center justify-center transition-transform active:scale-90"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg width={14} height={14} viewBox="0 0 14 14" fill="white">
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg width={14} height={14} viewBox="0 0 14 14" fill="white">
            <path d="M3 1.5v11l9-5.5L3 1.5z" />
          </svg>
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 flex items-center gap-[2px] h-8">
        {bars.map((height, i) => {
          const filled = i / barCount <= progress;
          return (
            <button
              key={i}
              onClick={() => handleBarClick(i)}
              className="flex-1 flex items-center justify-center h-full"
              style={{ minWidth: 2 }}
              aria-hidden="true"
              tabIndex={-1}
            >
              <div
                className="w-full rounded-full transition-all duration-100"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: filled
                    ? "#8B5CF6"
                    : "rgba(255,255,255,0.15)",
                  ...(playing && filled
                    ? { animation: "pulse-bar 0.6s ease-in-out infinite" }
                    : {}),
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Duration */}
      <span className="text-[11px] text-white/50 font-mono flex-shrink-0 w-9 text-right tabular-nums">
        {playing || currentTime > 0
          ? formatTime(currentTime)
          : duration > 0
            ? formatTime(duration)
            : "--:--"}
      </span>

      {/* Keyframe animation for pulsing bars */}
      <style jsx>{`
        @keyframes pulse-bar {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
