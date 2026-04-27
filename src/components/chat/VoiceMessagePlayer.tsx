"use client";

/**
 * VoiceMessagePlayer — compact bubble for received/sent voice clips.
 *
 * Features
 *   - Lazy signed URL: minted on first mount via `getVoiceMessageSignedUrl`
 *     (1h TTL) — callers don't have to pre-resolve URLs at the page level.
 *   - Tap-to-seek waveform with 32 bars; the bar grid is also a click
 *     target (delegated, no per-bar handler).
 *   - Speed toggle: 1x → 1.5x → 2x cycle, persisted to `playbackRate`.
 *   - Mark-as-read: when the listener reaches the end of the clip, calls
 *     `onPlaybackComplete(messageId)` once. The page wires that to a
 *     `messages.read_at` patch — same shape as the read-receipt for text.
 *   - Errors (signing failed, audio stream error) surface inline so the
 *     bubble never appears "dead" — there's always a status the user
 *     can act on (retry).
 *
 * iOS Safari note
 *   Audio playback after a signed URL fetch sometimes drops the first
 *   ~80ms because Safari pre-buffers slowly. We `audio.preload = 'metadata'`
 *   to side-step the worst of it without forcing a full preload (which
 *   would burn data on a thread the user might never play).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { m } from "motion/react";
import { Play, Pause } from "@/components/ui/lucide";
import { getVoiceMessageSignedUrl } from "@/lib/storage";
import {
  CHAT_VOICE_DARK_FILL,
  CHAT_VOICE_WAVEFORM_ACCENT,
  CHAT_VOICE_NEUTRAL_BG,
} from "@/lib/chat-content-colors";

const SPEED_CYCLE: Array<1 | 1.5 | 2> = [1, 1.5, 2];
const BAR_COUNT = 32;

interface VoiceMessagePlayerProps {
  /** Storage path inside `voice-messages` bucket, e.g. `<uid>/<conv>/<uuid>.webm`. */
  voicePath: string;
  /** Authoritative duration from the DB (ms). Used pre-load + as fallback. */
  durationMs: number;
  /** True for the sender's own bubble — flips colors to gradient/white. */
  isOwn: boolean;
  /** Sent-at timestamp string already formatted by the parent. */
  time: string;
  /**
   * Message id — passed back to `onPlaybackComplete` when the listener
   * fully plays the clip. Required for the mark-as-read patch.
   */
  messageId: string;
  /**
   * Fired once per mount when playback reaches the end. The page wires
   * this to a `messages.read_at` UPDATE (only meaningful for received
   * messages — own messages can short-circuit).
   */
  onPlaybackComplete?: (messageId: string) => void;
  /** Optional className for the outer wrapper. */
  className?: string;
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Deterministic pseudo-waveform — without WebAudio analysis we can't
 * extract real amplitudes, so we generate a stable bar pattern keyed
 * off the path. Same path = same waveform across renders + reloads,
 * which makes the bubble feel "alive" without flicker.
 */
function generateBars(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    // 4..18 px range, biased toward middle values for a natural-looking
    // envelope (silence at the edges, peaks in the middle thirds).
    const env = 0.5 + 0.5 * Math.sin((i / BAR_COUNT) * Math.PI);
    const noise = (h % 14) + 4;
    bars.push(4 + Math.round(noise * env));
  }
  return bars;
}

export default function VoiceMessagePlayer({
  voicePath,
  durationMs,
  isOwn,
  time,
  messageId,
  onPlaybackComplete,
  className = "",
}: VoiceMessagePlayerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signingError, setSigningError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const completedFiredRef = useRef(false);

  const bars = useMemo(() => generateBars(voicePath), [voicePath]);

  // Resolve the signed URL on mount + whenever the path changes. We
  // could lazy-resolve on first play, but pre-resolving on mount means
  // the bubble shows a working play button immediately — better UX, and
  // the cost is one signing round trip per visible bubble (cheap).
  useEffect(() => {
    let cancelled = false;
    setSigningError(null);
    setSignedUrl(null);
    (async () => {
      const url = await getVoiceMessageSignedUrl(voicePath, 3600);
      if (cancelled) return;
      if (!url) {
        setSigningError("Lecture indisponible.");
        return;
      }
      setSignedUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [voicePath]);

  // Reset completion marker if the message id changes (rare — but if
  // the parent reuses the same player instance for a different row,
  // we want a fresh "mark-as-read" trigger).
  useEffect(() => {
    completedFiredRef.current = false;
  }, [messageId]);

  // Wire <audio> events. We use a single element rather than HTMLMediaElement
  // listeners on a ref to keep React in charge of mount/unmount order.
  const handleTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentMs(a.currentTime * 1000);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentMs(durationMs);
    if (!completedFiredRef.current) {
      completedFiredRef.current = true;
      onPlaybackComplete?.(messageId);
    }
  }, [durationMs, messageId, onPlaybackComplete]);

  const handleError = useCallback(() => {
    setIsPlaying(false);
    setSigningError("Lecture echouee.");
  }, []);

  // Apply speed changes to the live audio element.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a || !signedUrl) return;

    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
      return;
    }

    try {
      a.playbackRate = speed;
      await a.play();
      setIsPlaying(true);
    } catch {
      // iOS sometimes rejects play() if the gesture chain is broken
      // (e.g. user tapped during a layout shift). Surface a soft hint.
      setIsPlaying(false);
      setSigningError("Touche encore pour lire.");
    }
  }, [isPlaying, signedUrl, speed]);

  const handleSeek = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const a = audioRef.current;
      const grid = waveformRef.current;
      if (!a || !grid) return;
      const rect = grid.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const target = ratio * (durationMs / 1000);
      a.currentTime = target;
      setCurrentMs(target * 1000);
      // If we seek backwards past the end, allow a fresh mark-as-read.
      if (ratio < 1) completedFiredRef.current = false;
    },
    [durationMs],
  );

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEED_CYCLE.indexOf(prev);
      return SPEED_CYCLE[(idx + 1) % SPEED_CYCLE.length];
    });
  }, []);

  // Progress 0..1 — clamp to the authoritative duration since the
  // <audio> element occasionally reports a tiny overshoot at the end.
  const progress = Math.max(
    0,
    Math.min(1, currentMs / Math.max(1, durationMs)),
  );

  const bubbleColors = isOwn
    ? "gradient-bg rounded-br-md"
    : "rounded-bl-md";
  const bubbleStyle = !isOwn
    ? { backgroundColor: CHAT_VOICE_NEUTRAL_BG }
    : undefined;

  return (
    <m.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-2 ${className}`}
    >
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl max-w-[78%] ${bubbleColors}`}
        style={bubbleStyle}
      >
        {/* Hidden <audio> — controlled via ref */}
        {signedUrl && (
          <audio
            ref={audioRef}
            src={signedUrl}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleError}
          />
        )}

        {/* Play / pause */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={!signedUrl}
          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isOwn ? "bg-white/20 hover:bg-white/30" : "bg-black/10 hover:bg-black/15"
          } ${!signedUrl ? "opacity-60" : ""}`}
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isPlaying ? (
            <Pause
              size={14}
              strokeWidth={2}
              fill={isOwn ? "white" : CHAT_VOICE_DARK_FILL}
              color={isOwn ? "white" : CHAT_VOICE_DARK_FILL}
              aria-hidden="true"
            />
          ) : (
            <Play
              size={14}
              strokeWidth={2}
              fill={isOwn ? "white" : CHAT_VOICE_DARK_FILL}
              color={isOwn ? "white" : CHAT_VOICE_DARK_FILL}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Waveform — tappable for seek */}
        <div
          ref={waveformRef}
          role="slider"
          tabIndex={0}
          aria-label="Position de lecture"
          aria-valuemin={0}
          aria-valuemax={Math.round(durationMs / 1000)}
          aria-valuenow={Math.round(currentMs / 1000)}
          onPointerDown={handleSeek}
          className="flex items-center gap-[2px] h-7 flex-1 cursor-pointer touch-none select-none"
        >
          {bars.map((h, i) => {
            const barProgress = (i + 0.5) / bars.length;
            const isActive = barProgress <= progress;
            return (
              <m.span
                key={i}
                className="rounded-full"
                style={{
                  width: 2,
                  height: h,
                  background: isOwn
                    ? isActive
                      ? "rgba(255,255,255,1)"
                      : "rgba(255,255,255,0.35)"
                    : isActive
                      ? CHAT_VOICE_WAVEFORM_ACCENT
                      : "rgba(0,0,0,0.18)",
                }}
                animate={isPlaying && isActive ? { scaleY: [1, 1.25, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            );
          })}
        </div>

        {/* Speed toggle */}
        <button
          type="button"
          onClick={cycleSpeed}
          className={`shrink-0 px-1.5 h-6 rounded-full text-[10px] font-bold tabular-nums leading-none flex items-center justify-center transition-colors ${
            isOwn
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-black/10 text-text hover:bg-black/15"
          }`}
          aria-label={`Vitesse de lecture, actuelle ${speed}x — toucher pour changer`}
        >
          {speed}x
        </button>

        {/* Duration / current */}
        <div className="flex flex-col items-end shrink-0 gap-0.5">
          <span
            className={`text-[10px] font-medium tabular-nums ${
              isOwn ? "text-white/70" : "text-text-muted"
            }`}
          >
            {formatDuration(isPlaying || currentMs > 0 ? currentMs : durationMs)}
          </span>
          <span
            className={`text-[9px] tabular-nums ${
              isOwn ? "text-white/50" : "text-text-muted/70"
            }`}
          >
            {time}
          </span>
        </div>
      </div>

      {/* Inline error toast — discreet, attaches under the bubble */}
      {signingError && (
        <div className="ml-2 self-end">
          <span
            className="text-[10px] text-danger px-2 py-1 rounded-full bg-danger/10 border border-danger/30"
            role="status"
          >
            {signingError}
          </span>
        </div>
      )}
    </m.div>
  );
}
