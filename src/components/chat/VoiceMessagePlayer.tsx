"use client";

/**
 * VoiceMessagePlayer — compact bubble for received/sent voice clips.
 *
 * Features
 *   - Lazy signed URL: minted on first mount via `getVoiceMessageSignedUrl`
 *     (1h TTL) — callers don't have to pre-resolve URLs at the page level.
 *   - Tap-to-seek waveform with 32 bars; the bar grid is also a drag
 *     target — pointermove while pressed continuously updates currentTime
 *     so the user can scrub like a YouTube progress bar.
 *   - Speed toggle: 1x → 1.5x → 2x cycle, persisted to `playbackRate`.
 *   - Total duration label: "0:12 / 0:30" — the second half is the
 *     authoritative DB duration so the user can see how much remains
 *     before pressing play.
 *   - Mark-as-read: when the listener reaches the end of the clip, calls
 *     `onPlaybackComplete(messageId)` once. The page wires that to a
 *     `messages.read_at` patch — same shape as the read-receipt for text.
 *   - Coordinator: registers with `voice-player-coordinator` so the
 *     surrounding chat shell can (a) auto-pause on scroll, (b) take over
 *     to display a tiny floating mini-player while the user types, and
 *     (c) ensure only one bubble plays at a time.
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

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { m } from "motion/react";
import { Play, Pause } from "@/components/ui/lucide";
import { getVoiceMessageSignedUrl } from "@/lib/storage";
import {
  CHAT_VOICE_DARK_FILL,
  CHAT_VOICE_WAVEFORM_ACCENT,
  CHAT_VOICE_NEUTRAL_BG,
} from "@/lib/chat-content-colors";
import {
  clearActiveController,
  pingActive,
  registerController,
  setActiveController,
  type VoicePlayerController,
  type VoicePlayerSnapshot,
} from "./voice-player-coordinator";

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
   * Display label shown next to the mini-player while playing
   * (e.g. "▶ 0:23 · Marie"). Defaults to null — the chip then shows
   * just the clock.
   */
  peerName?: string | null;
  /**
   * Fired once per mount when playback reaches the end. The page wires
   * this to a `messages.read_at` UPDATE (only meaningful for received
   * messages — own messages can short-circuit).
   */
  onPlaybackComplete?: (messageId: string) => void;
  /** Optional className for the outer wrapper. */
  className?: string;
  /**
   * When true, the player renders as a thin strip (~24px) — no waveform,
   * no time labels. The chat page sets this when the user is typing AND
   * a clip is playing; the floating mini-player chip handles full UX.
   */
  collapsed?: boolean;
}

/** Imperative handle for the chat page — used to expand on mini-player tap. */
export interface VoiceMessagePlayerHandle {
  scrollIntoView(): void;
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

const VoiceMessagePlayer = forwardRef<VoiceMessagePlayerHandle, VoiceMessagePlayerProps>(
  function VoiceMessagePlayer(
    {
      voicePath,
      durationMs,
      isOwn,
      time,
      messageId,
      peerName = null,
      onPlaybackComplete,
      className = "",
      collapsed = false,
    }: VoiceMessagePlayerProps,
    ref,
  ) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signingError, setSigningError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const completedFiredRef = useRef(false);

  // Mirror state into refs so the imperative coordinator controller (which
  // is created once on mount) always reads fresh values.
  const isPlayingRef = useRef(isPlaying);
  const currentMsRef = useRef(currentMs);
  const speedRef = useRef<1 | 1.5 | 2>(speed);
  const peerNameRef = useRef<string | null>(peerName);
  const durationMsRef = useRef(durationMs);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    currentMsRef.current = currentMs;
  }, [currentMs]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    peerNameRef.current = peerName;
  }, [peerName]);
  useEffect(() => {
    durationMsRef.current = durationMs;
  }, [durationMs]);

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
    const ms = a.currentTime * 1000;
    setCurrentMs(ms);
    currentMsRef.current = ms;
    // Push tick to coordinator so the mini-player updates its label.
    pingActive();
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentMs(durationMs);
    isPlayingRef.current = false;
    currentMsRef.current = durationMs;
    pingActive();
    if (!completedFiredRef.current) {
      completedFiredRef.current = true;
      onPlaybackComplete?.(messageId);
    }
  }, [durationMs, messageId, onPlaybackComplete]);

  const handleError = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setSigningError("Lecture echouee.");
    pingActive();
  }, []);

  // Apply speed changes to the live audio element.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Internal helpers — used by both the UI button and the coordinator.
  const internalPause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    setIsPlaying(false);
    isPlayingRef.current = false;
    pingActive();
  }, []);

  const internalResume = useCallback(async () => {
    const a = audioRef.current;
    if (!a || !signedUrl) return;
    try {
      a.playbackRate = speedRef.current;
      await a.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
      pingActive();
    } catch {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setSigningError("Touche encore pour lire.");
    }
  }, [signedUrl]);

  const togglePlay = useCallback(async () => {
    if (isPlayingRef.current) {
      internalPause();
      return;
    }
    await internalResume();
  }, [internalPause, internalResume]);

  // ---------- coordinator wiring ----------
  // One controller per player instance, registered on mount. We use refs
  // for the mutable values so the controller's getSnapshot always returns
  // the latest snapshot without re-creating the controller on every state
  // change (which would churn `register/unregister` and lose track of the
  // active controller across renders).
  useEffect(() => {
    const controller: VoicePlayerController = {
      getSnapshot(): VoicePlayerSnapshot {
        return {
          messageId,
          peerName: peerNameRef.current,
          durationMs: durationMsRef.current,
          currentMs: currentMsRef.current,
          speed: speedRef.current,
          isPlaying: isPlayingRef.current,
        };
      },
      pause() {
        internalPause();
      },
      async resume() {
        await internalResume();
      },
      expand() {
        wrapperRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      },
    };
    const unregister = registerController(controller);
    // When this player becomes the active one (on play), publish to coord;
    // when it pauses or unmounts, clear if it was active.
    return () => {
      clearActiveController(controller);
      unregister();
    };
    // We intentionally do NOT depend on the internal helpers — they only
    // close over refs, so the controller body always reads fresh values
    // even when this effect runs only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  // Whenever this player transitions to "playing", announce active.
  // We don't run this on every tick — only on the boolean transition,
  // which we model via a tiny tracking ref.
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    if (isPlaying && !wasPlayingRef.current) {
      // Fabricate a controller-shaped object on the fly with stable refs;
      // we share one created above by re-querying via the registry.
      // Simpler: build the same shape inline (controllers Set is internal).
      setActiveController({
        getSnapshot(): VoicePlayerSnapshot {
          return {
            messageId,
            peerName: peerNameRef.current,
            durationMs: durationMsRef.current,
            currentMs: currentMsRef.current,
            speed: speedRef.current,
            isPlaying: isPlayingRef.current,
          };
        },
        pause() {
          internalPause();
        },
        async resume() {
          await internalResume();
        },
        expand() {
          wrapperRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        },
      });
    }
    wasPlayingRef.current = isPlaying;
  }, [isPlaying, messageId, internalPause, internalResume]);

  // Imperative handle for the chat page (mini-player tap → expand bubble).
  useImperativeHandle(
    ref,
    () => ({
      scrollIntoView() {
        wrapperRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      },
    }),
    [],
  );

  // ---------- seek / scrub ----------
  const seekToClientX = useCallback(
    (clientX: number) => {
      const a = audioRef.current;
      const grid = waveformRef.current;
      if (!a || !grid) return;
      const rect = grid.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetSec = ratio * (durationMs / 1000);
      a.currentTime = targetSec;
      const ms = targetSec * 1000;
      setCurrentMs(ms);
      currentMsRef.current = ms;
      // If we seek backwards past the end, allow a fresh mark-as-read.
      if (ratio < 1) completedFiredRef.current = false;
      pingActive();
    },
    [durationMs],
  );

  const handleScrubStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setIsScrubbing(true);
      seekToClientX(e.clientX);
    },
    [seekToClientX],
  );

  const handleScrubMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbing) return;
      e.preventDefault();
      seekToClientX(e.clientX);
    },
    [isScrubbing, seekToClientX],
  );

  const handleScrubEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbing) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setIsScrubbing(false);
    },
    [isScrubbing],
  );

  // Keyboard a11y — left/right arrows nudge by 5%
  const handleSeekKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const a = audioRef.current;
      if (!a) return;
      const delta = e.key === "ArrowLeft" ? -0.05 : e.key === "ArrowRight" ? 0.05 : 0;
      if (delta === 0) return;
      e.preventDefault();
      const newSec = Math.max(
        0,
        Math.min(durationMs / 1000, a.currentTime + delta * (durationMs / 1000)),
      );
      a.currentTime = newSec;
      const ms = newSec * 1000;
      setCurrentMs(ms);
      currentMsRef.current = ms;
      pingActive();
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

  // Collapsed mode — render just a thin strip (the floating mini-player
  // takes over UX while the user is typing).
  if (collapsed) {
    return (
      <m.div
        ref={wrapperRef}
        initial={{ opacity: 0.6, height: 0 }}
        animate={{ opacity: 0.85, height: "auto" }}
        transition={{ duration: 0.18 }}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-2 ${className}`}
      >
        <div
          className={`flex items-center gap-2 px-3 h-6 rounded-full max-w-[60%] ${
            isOwn ? "gradient-bg" : ""
          }`}
          style={!isOwn ? { backgroundColor: CHAT_VOICE_NEUTRAL_BG } : undefined}
        >
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
          <div
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{
              backgroundColor: isOwn ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)",
            }}
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className="h-full"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: isOwn ? "white" : CHAT_VOICE_WAVEFORM_ACCENT,
              }}
            />
          </div>
          <span
            className={`text-[9px] font-medium tabular-nums ${
              isOwn ? "text-white/80" : "text-text-muted"
            }`}
          >
            {formatDuration(currentMs)}
          </span>
        </div>
      </m.div>
    );
  }

  const bubbleColors = isOwn
    ? "gradient-bg rounded-br-md"
    : "rounded-bl-md";
  const bubbleStyle = !isOwn
    ? { backgroundColor: CHAT_VOICE_NEUTRAL_BG }
    : undefined;

  return (
    <m.div
      ref={wrapperRef}
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

        {/* Waveform — tappable + draggable for scrub */}
        <div
          ref={waveformRef}
          role="slider"
          tabIndex={0}
          aria-label="Position de lecture"
          aria-valuemin={0}
          aria-valuemax={Math.round(durationMs / 1000)}
          aria-valuenow={Math.round(currentMs / 1000)}
          onPointerDown={handleScrubStart}
          onPointerMove={handleScrubMove}
          onPointerUp={handleScrubEnd}
          onPointerCancel={handleScrubEnd}
          onKeyDown={handleSeekKey}
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
                animate={
                  isPlaying && isActive && !isScrubbing ? { scaleY: [1, 1.25, 1] } : {}
                }
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

        {/* Duration / current — "0:12 / 0:30" format */}
        <div className="flex flex-col items-end shrink-0 gap-0.5">
          <span
            className={`text-[10px] font-medium tabular-nums ${
              isOwn ? "text-white/70" : "text-text-muted"
            }`}
          >
            {formatDuration(isPlaying || currentMs > 0 ? currentMs : 0)}
            <span className={isOwn ? "text-white/40" : "text-text-muted/50"}> / </span>
            {formatDuration(durationMs)}
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
  },
);

export default VoiceMessagePlayer;
