"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import { Mic, MicOff, Play, Pause, RotateCcw } from "@/components/ui/lucide";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type RecorderPhase =
  | "idle"
  | "permission-denied"
  | "recording"
  | "preview";

interface Props {
  /** Called when the user clicks "Sauvegarder". Receives the recorded Blob. */
  onSave?: (blob: Blob) => void;
}

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const MAX_SECONDS = 10;
const BAR_COUNT = 28;

// Deterministic waveform heights so SSR matches client on first paint.
function seedBars(count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = ((i * 13) % 17) + 3; // 3-19
    return seed;
  });
}

const STATIC_BARS = seedBars(BAR_COUNT);

// ─────────────────────────────────────────────────────────────────
// Ring countdown SVG
// ─────────────────────────────────────────────────────────────────

interface CountdownRingProps {
  elapsed: number; // 0-10
}

function CountdownRing({ elapsed }: CountdownRingProps) {
  const r = 44; // radius — fits the 80px button (40 + 4px stroke)
  const circumference = 2 * Math.PI * r;
  // Progress goes from full ring (idle) → shrinking as time runs out
  const remaining = Math.max(0, MAX_SECONDS - elapsed);
  const progress = remaining / MAX_SECONDS;
  const dashoffset = circumference * (1 - progress);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 96 96"
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={48}
        cy={48}
        r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={4}
      />
      {/* Progress — rotated so it starts at the top */}
      <circle
        cx={48}
        cy={48}
        r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "center",
          transition: "stroke-dashoffset 1s linear",
        }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Animated waveform bars (recording state)
// ─────────────────────────────────────────────────────────────────

interface WaveformLiveProps {
  active: boolean;
}

function WaveformLive({ active }: WaveformLiveProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      className="flex items-center justify-center gap-[3px] h-10"
      aria-hidden="true"
    >
      {STATIC_BARS.map((baseH, i) => (
        <m.span
          key={i}
          className="rounded-full inline-block"
          style={{
            width: 3,
            background: "var(--color-accent)",
            originY: 0.5,
          }}
          animate={
            active && !prefersReduced
              ? {
                  height: [
                    baseH,
                    baseH + 14 + ((i * 7) % 12),
                    baseH + 4,
                    baseH + 18 + ((i * 3) % 10),
                    baseH,
                  ],
                }
              : { height: baseH }
          }
          transition={
            active
              ? {
                  duration: 0.45 + (i % 5) * 0.07,
                  repeat: Infinity,
                  delay: i * 0.04,
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Static waveform bars (preview state — represents the recording)
// ─────────────────────────────────────────────────────────────────

interface WaveformPreviewProps {
  progress: number; // 0-1
}

function WaveformPreview({ progress }: WaveformPreviewProps) {
  return (
    <div
      className="flex items-center justify-center gap-[3px] h-10 flex-1"
      aria-hidden="true"
    >
      {STATIC_BARS.map((h, i) => {
        const barFraction = i / (BAR_COUNT - 1);
        const played = barFraction <= progress;
        return (
          <span
            key={i}
            className="rounded-full inline-block transition-colors duration-75"
            style={{
              width: 3,
              height: h,
              background: played
                ? "var(--color-accent)"
                : "var(--color-border)",
            }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function VoiceIntroRecorder({ onSave }: Props) {
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopTimers();
      stopStream();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  function stopTimers() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // ── Start recording ─────────────────────────────────────────────
  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;

        // Create audio element for playback (handles iOS gesture requirement —
        // we create the element synchronously inside the user-gesture handler
        // chain that triggered mr.stop(), so Safari allows it).
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.onended = () => {
          setIsPlaying(false);
          setPlayProgress(0);
          stopTimers();
        };
        audioRef.current = audio;

        setPhase("preview");
        stopStream();
      };

      mr.start();
      setElapsed(0);
      setPhase("recording");

      // Countdown timer — hard-cut at MAX_SECONDS
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_SECONDS) {
            handleStopRecording();
          }
          return next;
        });
      }, 1000);
    } catch {
      setPhase("permission-denied");
    }
  }, []);

  // ── Stop recording ──────────────────────────────────────────────
  const handleStopRecording = useCallback(() => {
    stopTimers();
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Main button tap ─────────────────────────────────────────────
  const handleMainTap = useCallback(() => {
    if (phase === "idle" || phase === "permission-denied") {
      handleStartRecording();
    } else if (phase === "recording") {
      handleStopRecording();
    }
  }, [phase, handleStartRecording, handleStopRecording]);

  // ── Play / pause preview ────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !blobRef.current) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      stopTimers();
      return;
    }

    // iOS Safari requires play() to be called directly inside a user gesture.
    // We're inside onClick so this is compliant.
    audio.currentTime = 0;
    setPlayProgress(0);
    setIsPlaying(true);

    audio.play().catch(() => {
      // Fallback: browser still blocked — show nothing, don't crash.
      setIsPlaying(false);
    });

    const totalDuration = MAX_SECONDS;
    const step = 1 / (totalDuration * 20); // 50ms ticks
    playTimerRef.current = setInterval(() => {
      setPlayProgress((prev) => {
        const next = prev + step;
        if (next >= 1) {
          stopTimers();
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, 50);
  }, [isPlaying]);

  // ── Re-record ───────────────────────────────────────────────────
  const handleReRecord = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    blobRef.current = null;
    setIsPlaying(false);
    setPlayProgress(0);
    setElapsed(0);
    setPhase("idle");
  }, []);

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!blobRef.current) return;

    // TODO: upload to Supabase Storage at:
    //   storage/v1/object/voice-intros/{user.id}/intro.webm
    // Replace this console.log with:
    //   const { data, error } = await supabase.storage
    //     .from("voice-intros")
    //     .upload(`${user.id}/intro.webm`, blob, { upsert: true });
    console.log("[VoiceIntroRecorder] blob ready for upload:", blobRef.current);

    onSave?.(blobRef.current);
  }, [onSave]);

  // ─────────────────────────────────────────────────────────────────
  // Derived display values
  // ─────────────────────────────────────────────────────────────────

  const remaining = MAX_SECONDS - elapsed;
  const isRecording = phase === "recording";
  const isPreview = phase === "preview";
  const isDenied = phase === "permission-denied";

  const mainAriaLabel = isRecording
    ? "Appuyer pour arrêter l'enregistrement"
    : "Appuyer pour commencer l'enregistrement";

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  return (
    <section
      className="flex flex-col items-center gap-6 py-2"
      aria-label="Intro vocale"
    >
      {/* ── Record button (80px circle) ─────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!isPreview && (
          <m.div
            key="record-stage"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={springs.elastic}
            className="flex flex-col items-center gap-4"
          >
            {/* Button + ring wrapper */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Countdown ring — only visible while recording */}
              {isRecording && <CountdownRing elapsed={elapsed} />}

              {/* Gradient halo (idle breathing) */}
              {!isRecording && (
                <m.div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                    filter: "blur(16px)",
                    opacity: 0.3,
                  }}
                  animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.06, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              <m.button
                type="button"
                onClick={handleMainTap}
                aria-label={mainAriaLabel}
                aria-pressed={isRecording}
                whileTap={{ scale: 0.92, transition: springs.micro }}
                className={[
                  "relative w-20 h-20 rounded-full flex items-center justify-center",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/50",
                  "tap-target transition-all duration-200",
                  isRecording
                    ? "bg-danger"
                    : "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)]",
                ].join(" ")}
                style={isRecording ? {} : {}}
              >
                {isDenied ? (
                  <MicOff size={28} strokeWidth={1.5} className="text-white" aria-hidden="true" />
                ) : isRecording ? (
                  /* Square "stop" icon */
                  <span
                    className="block w-5 h-5 rounded-[4px] bg-white"
                    aria-hidden="true"
                  />
                ) : (
                  <Mic size={28} strokeWidth={1.5} className="text-white" aria-hidden="true" />
                )}
              </m.button>
            </div>

            {/* Countdown label */}
            <AnimatePresence mode="wait">
              {isRecording ? (
                <m.div
                  key="countdown"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <WaveformLive active />
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ color: remaining <= 3 ? "var(--color-danger)" : "var(--color-accent)" }}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {remaining}s
                  </span>
                </m.div>
              ) : isDenied ? (
                <m.p
                  key="denied"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[12px] text-text-muted text-center max-w-[220px] leading-relaxed"
                  role="alert"
                >
                  Active le micro dans ton navigateur puis réessaie.
                </m.p>
              ) : (
                <m.p
                  key="cta-hint"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[12px] text-text-muted text-center"
                >
                  Appuie pour enregistrer · 10s max
                </m.p>
              )}
            </AnimatePresence>
          </m.div>
        )}

        {/* ── Preview stage ──────────────────────────────────────────── */}
        {isPreview && (
          <m.div
            key="preview-stage"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={springs.heavy}
            className="w-full flex flex-col items-center gap-4"
          >
            {/* Player row */}
            <div className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayPause}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? "Pause" : "Lire l'enregistrement"}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-accent/10 hover:bg-accent/20 transition-colors tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{ color: "var(--color-accent)" }}
              >
                {isPlaying ? (
                  <Pause size={16} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Play size={16} strokeWidth={2} aria-hidden="true" />
                )}
              </button>

              <WaveformPreview progress={playProgress} />

              <span className="shrink-0 text-[11px] font-medium text-text-muted tabular-nums">
                {MAX_SECONDS}s
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={handleReRecord}
                aria-label="Réenregistrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-bg-card border border-border text-[14px] font-medium text-text-muted hover:text-text hover:border-text/20 transition-all tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
                Réenregistrer
              </button>

              <m.button
                type="button"
                onClick={handleSave}
                aria-label="Sauvegarder l'intro vocale"
                whileTap={{ scale: 0.96, transition: springs.micro }}
                className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-white tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                }}
              >
                Sauvegarder
              </m.button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
