"use client";

/**
 * VoiceMessageRecorder — WhatsApp-style hold-to-record mic.
 *
 * Interaction model:
 *   1. Press and hold the mic button → start recording (after a short
 *      "intent" delay so a tap doesn't trigger a 0ms clip).
 *   2. While holding, drag the finger LEFT past `CANCEL_THRESHOLD_PX`
 *      → arms cancel-on-release. The visual flips to red "Glisser pour
 *      annuler" copy and the slide indicator follows the finger.
 *   3. Release:
 *        - if cancel armed   → discard, no upload, no message.
 *        - if too-short (<400ms) → discard with "Maintenir pour parler" toast.
 *        - else              → upload, then call `onSent(messageInsertResult)`.
 *
 * Hard cutoff at 60s — the timer auto-stops + sends.
 *
 * Permissions:
 *   - MediaRecorder requires a USER GESTURE on iOS Safari. The pointerdown
 *     handler IS that gesture; we do not pre-warm `getUserMedia` because
 *     iOS treats a pre-warm as a permission grant that needs a user
 *     gesture too, and we'd lose the "press to record" UX.
 *   - On permission denial we surface a French inline microcopy + a
 *     "Reglages" hint. We do NOT spam-prompt; once denied, the user
 *     must re-grant in the OS/browser settings.
 *
 * Codec choice:
 *   - We try `audio/webm;codecs=opus` first (Chrome/Edge/Firefox, smallest
 *     file size). If the browser rejects it we fall back to plain
 *     `audio/webm`, then `audio/mp4` (iOS Safari 14.1+), and finally let
 *     the browser pick. The bucket's `allowed_mime_types` list accepts
 *     all of these (migration 031).
 *
 * Why not lift the recording state into the page:
 *   The page already juggles 12+ chat features. Encapsulating the
 *   stream / recorder / cancel-state lifecycle here keeps the parent
 *   coupling to a single async `onSend(blob, durationMs)` callback.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { Mic, MicOff, X, Send } from "@/components/ui/lucide";
import { haptics } from "@/lib/haptics";
import { uploadVoiceMessage, VOICE_MAX_DURATION_MS } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

const MIN_DURATION_MS = 400;
const CANCEL_THRESHOLD_PX = 80;
const HARD_CUTOFF_MS = VOICE_MAX_DURATION_MS;

interface VoiceMessageRecorderProps {
  /** Conversation id — used to namespace the storage path + the DB insert. */
  conversationId: string;
  /** Authenticated user id — sender + storage folder owner. */
  userId: string | undefined;
  /**
   * Called after the message row has been inserted in `messages`.
   * The page uses this to refresh local state / play a haptic /
   * track an analytics event. The row is also delivered via the
   * existing realtime subscription — this callback is best-effort.
   */
  onSent?: (row: {
    id: string;
    voice_url: string;
    voice_duration_ms: number;
  }) => void;
  /** Optional className passthrough for the root container. */
  className?: string;
}

/**
 * Negotiated MIME type for MediaRecorder. Tries opus first; falls back
 * through the browser support pyramid; returns `undefined` to let the
 * browser pick its own default if nothing matches (very rare).
 */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VoiceMessageRecorder({
  conversationId,
  userId,
  onSent,
  className = "",
}: VoiceMessageRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [cancelArmed, setCancelArmed] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---------- mutable refs (no re-render on update) ----------
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelArmedRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const cutoffTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the cancel ref in sync so the `onstop` closure (created at
  // recorder.start()) always sees the latest value rather than the
  // stale boolean it captured on instantiation.
  useEffect(() => {
    cancelArmedRef.current = cancelArmed;
  }, [cancelArmed]);

  // ---------- cleanup ----------
  const teardownStream = useCallback(() => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
    if (cutoffTimeoutRef.current) {
      clearTimeout(cutoffTimeoutRef.current);
      cutoffTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      teardownStream();
    };
  }, [teardownStream]);

  // ---------- upload + DB insert ----------
  const persistVoiceMessage = useCallback(
    async (blob: Blob, durationMs: number) => {
      if (!userId) {
        setErrorMsg("Connecte-toi pour envoyer un message vocal.");
        return;
      }
      setUploading(true);
      setErrorMsg(null);

      const upload = await uploadVoiceMessage(userId, conversationId, blob);
      if (!upload.ok) {
        setUploading(false);
        setErrorMsg(upload.message);
        haptics.error();
        return;
      }

      // Insert messages row. Voice-only message: `content = ''`.
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: "",
          voice_url: upload.path,
          voice_duration_ms: durationMs,
        })
        .select()
        .single();

      setUploading(false);

      if (error || !data) {
        setErrorMsg("Echec de l'envoi du message vocal.");
        haptics.error();
        return;
      }

      // Bump conversation last_message_at so the conversation list reorders.
      await supabase
        .from("conversations")
        .update({ last_message_at: data.created_at })
        .eq("id", conversationId);

      haptics.success();
      onSent?.({
        id: data.id as string,
        voice_url: upload.path,
        voice_duration_ms: durationMs,
      });
    },
    [conversationId, userId, onSent],
  );

  // ---------- recording lifecycle ----------
  const startRecording = useCallback(async () => {
    // Reset visual state
    setCancelArmed(false);
    setDragOffset(0);
    setElapsedMs(0);
    setErrorMsg(null);

    if (!userId) {
      setErrorMsg("Connecte-toi pour enregistrer.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrorMsg("Ton navigateur ne supporte pas l'enregistrement audio.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      // iOS Safari throws NotAllowedError on denial, NotFoundError when
      // no input device is available. Both deserve the same UX.
      const name = (err as { name?: string })?.name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setPermissionDenied(true);
        setErrorMsg(
          "Autorise le micro dans les reglages du navigateur pour envoyer un vocal.",
        );
      } else {
        setErrorMsg("Impossible d'acceder au micro.");
      }
      haptics.error();
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      // Safari sometimes refuses a known-good mime; retry with no opts.
      recorder = new MediaRecorder(stream);
    }
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const durationMs = Date.now() - startTimeRef.current;
      const cancelled = cancelArmedRef.current;
      const tooShort = durationMs < MIN_DURATION_MS;
      const tracks = streamRef.current?.getTracks() ?? [];
      tracks.forEach((t) => t.stop());
      streamRef.current = null;

      if (cancelled || tooShort) {
        if (tooShort && !cancelled) {
          // Wave 17 polish — softer hint that doubles as a retry cue.
          // The previous message ("Maintiens le bouton pour parler.")
          // read as a generic warning; this microcopy explains the
          // *why* (probably accidental tap) without scolding.
          setErrorMsg("Maintiens pour enregistrer plus longtemps.");
          haptics.light();
        }
        chunksRef.current = [];
        setIsRecording(false);
        setElapsedMs(0);
        setDragOffset(0);
        setCancelArmed(false);
        return;
      }

      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || mimeType || "audio/webm",
      });
      chunksRef.current = [];
      setIsRecording(false);
      setElapsedMs(0);
      setDragOffset(0);
      setCancelArmed(false);

      // Capped duration — never persist >60s even if the cutoff timer
      // raced with onstop.
      const cappedDuration = Math.min(durationMs, HARD_CUTOFF_MS);
      void persistVoiceMessage(blob, cappedDuration);
    };

    startTimeRef.current = Date.now();
    setIsRecording(true);
    haptics.medium();

    // Request a chunk every 250ms — keeps memory bounded if the
    // user holds for the full minute, and lets us flush on cancel
    // without losing the tail.
    recorder.start(250);

    // 1Hz ticker for the duration label + waveform amplitude visual.
    tickerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);

    // Hard 60s cutoff — auto-stop and send.
    cutoffTimeoutRef.current = setTimeout(() => {
      if (recorderRef.current?.state === "recording") {
        cancelArmedRef.current = false;
        recorderRef.current.stop();
      }
    }, HARD_CUTOFF_MS);
  }, [userId, persistVoiceMessage]);

  const stopRecording = useCallback((cancel: boolean) => {
    if (!recorderRef.current) return;
    if (recorderRef.current.state !== "recording") return;
    cancelArmedRef.current = cancel;
    recorderRef.current.stop();
    if (cancel) haptics.light();
  }, []);

  // ---------- pointer handlers ----------
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (uploading) return;
      e.preventDefault();
      startXRef.current = e.clientX;
      // capture so leaving the button doesn't drop pointermove events
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      void startRecording();
    },
    [startRecording, uploading],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!isRecording) return;
      const dx = e.clientX - startXRef.current;
      // Slide LEFT to cancel — clamp dx to ≤0 for the visual.
      const offset = Math.min(0, dx);
      setDragOffset(offset);
      const armed = Math.abs(offset) > CANCEL_THRESHOLD_PX;
      if (armed !== cancelArmed) {
        setCancelArmed(armed);
        if (armed) haptics.light();
      }
    },
    [isRecording, cancelArmed],
  );

  const handlePointerUp = useCallback(() => {
    if (!isRecording) return;
    stopRecording(cancelArmedRef.current);
  }, [isRecording, stopRecording]);

  const handleCancelClick = useCallback(() => {
    if (!isRecording) return;
    cancelArmedRef.current = true;
    stopRecording(true);
  }, [isRecording, stopRecording]);

  // Auto-clear the inline error after a few seconds so the composer
  // doesn't carry a stale toast.
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 4500);
    return () => clearTimeout(t);
  }, [errorMsg]);

  // ---------- render ----------
  // Waveform: 16 bars whose amplitudes pulse on a sine wave keyed off
  // the elapsed timer. Cheap (no AudioContext analyser) and visually
  // matches the sibling VoiceNote component already in the codebase.
  const waveformBars = Array.from({ length: 16 }, (_, i) => {
    const phase = (elapsedMs / 80 + i * 0.6) % (Math.PI * 2);
    const amp = 6 + Math.abs(Math.sin(phase)) * 14;
    return amp;
  });

  return (
    <div className={`relative flex items-center ${className}`}>
      <AnimatePresence>
        {isRecording && (
          <m.div
            initial={{ opacity: 0, x: 12, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: 12, width: 0 }}
            className="flex items-center gap-3 mr-2 overflow-hidden"
            aria-live="polite"
          >
            {/* Cancel pill — slides left with the finger */}
            <m.button
              type="button"
              onClick={handleCancelClick}
              animate={{ x: dragOffset * 0.4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`tap-target flex items-center gap-1.5 px-3 h-9 rounded-full text-[12px] font-semibold transition-colors ${
                cancelArmed
                  ? "bg-danger text-white"
                  : "bg-bg-card border border-border text-text-muted"
              }`}
              aria-label="Annuler l'enregistrement"
            >
              <X size={14} strokeWidth={2} aria-hidden="true" />
              {cancelArmed ? "Relacher pour annuler" : "Glisser pour annuler"}
            </m.button>

            {/* Pulsing red dot + waveform + duration */}
            <div className="flex items-center gap-2">
              <m.span
                className="w-2.5 h-2.5 rounded-full bg-danger shrink-0"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                aria-hidden="true"
              />
              <div className="flex items-center gap-[2px] h-6">
                {waveformBars.map((h, i) => (
                  <m.span
                    key={i}
                    className="rounded-full bg-danger"
                    style={{ width: 2, height: h }}
                    animate={{ height: h }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>
              <span className="text-[12px] font-semibold text-danger tabular-nums whitespace-nowrap">
                {formatDuration(elapsedMs)}
              </span>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <button
        ref={buttonRef}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()} // long-press menu kills the gesture on Android
        disabled={uploading || permissionDenied}
        className={`tap-target shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 select-none touch-none ${
          isRecording
            ? cancelArmed
              ? "bg-danger/40 text-white"
              : "bg-danger text-white"
            : permissionDenied
              ? "bg-bg-card border border-border text-text-muted opacity-60"
              : uploading
                ? "bg-bg-card border border-border text-text-muted opacity-70"
                : "bg-bg-card border border-border text-text-muted hover:text-accent hover:border-accent/30"
        }`}
        aria-label={
          permissionDenied
            ? "Micro refuse — autorise dans les reglages"
            : isRecording
              ? "Relacher pour envoyer le message vocal"
              : "Maintenir pour enregistrer un message vocal"
        }
        aria-pressed={isRecording}
      >
        {permissionDenied ? (
          <MicOff size={18} strokeWidth={1.5} aria-hidden="true" />
        ) : uploading ? (
          <Send size={16} strokeWidth={1.8} aria-hidden="true" className="animate-pulse" />
        ) : (
          <Mic size={18} strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>

      {/* Inline error microcopy — auto-dismisses after 4.5s */}
      <AnimatePresence>
        {errorMsg && !isRecording && (
          <m.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-[11px] text-danger max-w-[240px] shadow-lg pointer-events-none"
            role="status"
          >
            {errorMsg}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
