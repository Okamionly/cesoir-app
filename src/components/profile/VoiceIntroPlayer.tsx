"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause } from "@/components/ui/lucide";

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const BAR_COUNT = 24;
const MAX_DURATION = 10; // seconds

// Deterministic bar heights seeded from index — matches recorder's static bars.
function buildBars(count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = ((i * 11) % 15) + 3; // 3-17
    return seed;
  });
}

const BARS = buildBars(BAR_COUNT);

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────

interface Props {
  /** Public URL for the audio file (Supabase Storage signed URL or CDN). */
  audioUrl: string;
  /** Duration of the clip in seconds (used for display before audio loads). */
  durationSeconds?: number;
  /** Compact = horizontal strip. Full = centred player. Defaults to compact. */
  variant?: "compact" | "full";
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

export function VoiceIntroPlayer({
  audioUrl,
  durationSeconds = MAX_DURATION,
  variant = "compact",
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [duration, setDuration] = useState(durationSeconds);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // ── Build audio element once ────────────────────────────────────
  // We intentionally do NOT create it in JSX (<audio>) because we need to
  // imperatively call .play() inside a click handler to satisfy iOS Safari's
  // user-gesture requirement for audio playback.
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      cancelRaf();
    };

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      cancelRaf();
    };
    // audioUrl changes = rebuild; isPlaying is NOT in deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  function cancelRaf() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function tick() {
    const audio = audioRef.current;
    if (!audio) return;
    const p = audio.duration > 0 ? audio.currentTime / audio.duration : 0;
    setProgress(p);
    if (!audio.paused && !audio.ended) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }

  // ── Play / pause — must be called directly inside onClick ──────
  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      cancelRaf();
      return;
    }

    // iOS Safari: .play() must be called synchronously within user gesture.
    audio.currentTime = 0;
    setProgress(0);

    audio.play().then(() => {
      setIsPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    }).catch(() => {
      // Browser blocked despite user gesture (e.g. low-power mode on iOS).
      // Silently fail — do not crash, do not show error (it's ambient UX).
      setIsPlaying(false);
    });
  }, [isPlaying]);

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  const playLabel = isPlaying ? "Pause" : "Lire l'intro vocale";

  if (variant === "full") {
    return (
      <div
        className="flex flex-col items-center gap-4 py-2"
        role="region"
        aria-label="Intro vocale"
      >
        <button
          type="button"
          onClick={handlePlayPause}
          aria-pressed={isPlaying}
          aria-label={playLabel}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all tap-target focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/50"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
          }}
        >
          {isPlaying ? (
            <Pause size={22} strokeWidth={2} className="text-white" aria-hidden="true" />
          ) : (
            <Play size={22} strokeWidth={2} className="text-white" aria-hidden="true" />
          )}
        </button>

        <div className="flex items-center gap-[3px] h-10" aria-hidden="true">
          {BARS.map((h, i) => {
            const barFraction = i / (BAR_COUNT - 1);
            const played = barFraction <= progress;
            return (
              <span
                key={i}
                className="rounded-full inline-block transition-colors duration-100"
                style={{
                  width: 3,
                  height: isPlaying && played ? h + 6 : h,
                  background: played
                    ? "var(--color-accent)"
                    : "var(--color-border)",
                  transition: "height 0.1s ease, background-color 0.1s ease",
                }}
              />
            );
          })}
        </div>

        <span className="text-[12px] text-text-muted font-medium tabular-nums">
          {formatDuration(duration)}
        </span>
      </div>
    );
  }

  // ── Compact (default) — used in browse cards + profile row ──────
  return (
    <div
      className="flex items-center gap-3 w-full bg-bg-card border border-border rounded-2xl px-4 py-3"
      role="region"
      aria-label="Intro vocale"
    >
      {/* Play/Pause */}
      <button
        type="button"
        onClick={handlePlayPause}
        aria-pressed={isPlaying}
        aria-label={playLabel}
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{
          background: isPlaying
            ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))"
            : "var(--color-bg)",
          border: isPlaying ? "none" : "1px solid var(--color-border)",
          color: isPlaying ? "#fff" : "var(--color-accent)",
        }}
      >
        {isPlaying ? (
          <Pause size={15} strokeWidth={2.2} aria-hidden="true" />
        ) : (
          <Play size={15} strokeWidth={2.2} aria-hidden="true" />
        )}
      </button>

      {/* Waveform bars */}
      <div
        className="flex items-center gap-[2px] h-8 flex-1"
        aria-hidden="true"
      >
        {BARS.map((h, i) => {
          const barFraction = i / (BAR_COUNT - 1);
          const played = barFraction <= progress;
          return (
            <span
              key={i}
              className="rounded-full inline-block"
              style={{
                width: 2,
                height: h,
                background: played
                  ? "var(--color-accent)"
                  : "var(--color-border)",
                transition: "background-color 0.08s ease",
              }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span className="shrink-0 text-[11px] font-medium text-text-muted tabular-nums">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
