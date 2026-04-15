// ---------- Sound Effects (Web Audio API) ----------
// Generates simple tones programmatically — no external audio files needed.

export type SoundType =
  | "notification"
  | "match"
  | "message"
  | "like"
  | "error"
  | "success"
  | "tap";

const MUTE_KEY = "cesoir_sound_muted";

// ---------- Lazy AudioContext ----------

let _ctx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  try {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return _ctx;
  } catch {
    return null;
  }
}

// ---------- Mute preference ----------

export function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    // localStorage unavailable
  }
}

export function toggleMute(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

// ---------- Tone primitives ----------

function playTone(
  ctx: AudioContext,
  frequency: number,
  durationMs: number,
  volume: number = 0.3,
  startOffset: number = 0,
  fadeOut: boolean = false,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startOffset);
  gain.gain.setValueAtTime(volume, ctx.currentTime + startOffset);

  if (fadeOut) {
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + startOffset + durationMs / 1000,
    );
  } else {
    gain.gain.setValueAtTime(volume, ctx.currentTime + startOffset + durationMs / 1000 - 0.005);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startOffset + durationMs / 1000);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + durationMs / 1000 + 0.01);
}

function playChord(
  ctx: AudioContext,
  frequencies: number[],
  durationMs: number,
  volume: number = 0.15,
): void {
  for (const freq of frequencies) {
    playTone(ctx, freq, durationMs, volume, 0, false);
  }
}

// ---------- Sound definitions ----------

const SOUNDS: Record<SoundType, (ctx: AudioContext) => void> = {
  // Two-tone chime: 440Hz then 880Hz, 100ms each
  notification(ctx) {
    playTone(ctx, 440, 100, 0.25, 0);
    playTone(ctx, 880, 100, 0.25, 0.12);
  },

  // Ascending three-tone: 440, 660, 880Hz, 80ms each
  match(ctx) {
    playTone(ctx, 440, 80, 0.3, 0);
    playTone(ctx, 660, 80, 0.3, 0.1);
    playTone(ctx, 880, 80, 0.3, 0.2);
  },

  // Single soft ping: 660Hz, 60ms
  message(ctx) {
    playTone(ctx, 660, 60, 0.2, 0);
  },

  // Warm tone: 523Hz, 150ms, fade out
  like(ctx) {
    playTone(ctx, 523, 150, 0.25, 0, true);
  },

  // Chord: 440+554+659Hz together, 200ms
  success(ctx) {
    playChord(ctx, [440, 554, 659], 200, 0.15);
  },

  // Very short click: 1000Hz, 20ms, low volume
  tap(ctx) {
    playTone(ctx, 1000, 20, 0.08, 0);
  },

  // Error: descending two-tone
  error(ctx) {
    playTone(ctx, 400, 120, 0.25, 0);
    playTone(ctx, 300, 120, 0.25, 0.14);
  },
};

// ---------- Public API ----------

export function playSound(type: SoundType): void {
  if (isMuted()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume suspended context (browser autoplay policy)
  if (ctx.state === "suspended") {
    ctx.resume().then(() => SOUNDS[type](ctx)).catch(() => {});
    return;
  }

  SOUNDS[type](ctx);
}
