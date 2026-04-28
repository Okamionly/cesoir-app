"use client";

/**
 * CrystalBallCard — Wave 17 daily blind match reveal.
 *
 * Three visual states driven entirely by the `match` prop:
 *
 *   1. PROMPT (peer not revealed, window open)
 *      Full-bleed blurred photo + age + 1 prompt + two buttons
 *      "Pas pour moi" / "Je tente". Name is hidden until reveal.
 *
 *   2. WAITING (caller liked, peer hasn't yet)
 *      Same blurred photo, but the buttons are replaced by a glowing
 *      "En attente de leur réponse..." pill that pulses gently.
 *      The countdown to expires_at is visible.
 *
 *   3. REVEALED (revealed_at non-null)
 *      Cinematic deblur: photo `filter: blur(28px) → blur(0)` over
 *      1200ms, name + age scale-in, an accent halo pulses, and a
 *      CTA "Ouvrir le chat" appears. This is the moment we ship.
 *
 * The component is purely presentational — all DB writes go through
 * the parent's `onLike`/`onPass` callbacks (which come from
 * `useCrystalBall`).
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { m, AnimatePresence, type Transition } from "motion/react";
import { Sparkles, X, Heart } from "@/components/ui/lucide";
import { springs, easings } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";
import type { CrystalBallMatch } from "@/lib/useCrystalBall";

// ────────────────────────────────────────────────────────────────
// Public surface
// ────────────────────────────────────────────────────────────────

export interface CrystalBallCardProps {
  match: CrystalBallMatch;
  /** Caller hits "Je tente" */
  onLike: () => void | Promise<void>;
  /** Caller hits "Pas pour moi" */
  onPass: () => void;
  /**
   * Optional CTA href shown on the revealed state — typically points
   * at the conversation between the two users. The page that mounts
   * this card knows whether the chat row already exists and can pass
   * the right href; if undefined we just hide the CTA.
   */
  chatHref?: string;
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/** Pretty mm:ss countdown from now to ISO expiry. */
function useCountdown(iso: string): string {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const remaining = Math.max(0, new Date(iso).getTime() - now);
    const totalSec = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
    }
    return `${minutes}m`;
  }, [iso, now]);
}

/** Cycling 1-prompt teaser — picks a deterministic prompt per match id. */
function usePrompt(matchId: string): string {
  const prompts = [
    "Quelqu'un a tapé dans l'œil de l'algo. À toi de voir si l'instinct suit.",
    "Pile cette personne. Pile ce soir. La boule de cristal a parlé.",
    "On t'a réservé un visage flou. Ouvre — ou laisse passer.",
    "Match du jour. Une seule chance. 24h pour décider.",
    "Le profil qui maximise le score. Sans filtre, sans nom, sans photo nette.",
  ] as const;
  return useMemo(() => {
    let h = 0;
    for (let i = 0; i < matchId.length; i++) h = (h + matchId.charCodeAt(i)) % prompts.length;
    return prompts[h];
  }, [matchId]);
}

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

interface PhotoLayerProps {
  src: string | null;
  /** True once revealed_at is set — drives the deblur tween */
  revealed: boolean;
  altLabel: string;
}

/**
 * Full-bleed photo with a CSS blur that animates from 28px → 0 the
 * moment `revealed` flips. Falls back to a violet gradient placeholder
 * when no avatar exists.
 */
function PhotoLayer({ src, revealed, altLabel }: PhotoLayerProps) {
  if (!src) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6] via-[#5B21B6] to-[#1E1B4B]"
      />
    );
  }

  return (
    <m.div
      className="absolute inset-0"
      // The deblur is the headline animation — keep it slow + emotional.
      // We animate the CSS filter directly because motion/react picks up
      // string filter values cleanly in modern browsers.
      initial={{ filter: "blur(28px) saturate(1.4)" }}
      animate={{
        filter: revealed
          ? "blur(0px) saturate(1)"
          : "blur(28px) saturate(1.4)",
      }}
      transition={{ duration: revealed ? 1.2 : 0, ease: easings.dramatic }}
    >
      <Image
        src={src}
        alt={altLabel}
        fill
        priority
        sizes="(max-width: 440px) 100vw, 440px"
        className="object-cover"
      />
      {/* Soft top→bottom dim so the white text + buttons stay legible
          regardless of photo content. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70"
      />
    </m.div>
  );
}

/** Slow, ambient sparkle ring. Pure decoration — no a11y impact. */
function SparkleHalo() {
  return (
    <m.div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <m.div
        className="w-[260px] h-[260px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0.08) 50%, transparent 75%)",
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </m.div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────

export default function CrystalBallCard({
  match,
  onLike,
  onPass,
  chatHref,
}: CrystalBallCardProps) {
  const revealed = match.revealedAt !== null;
  const waiting = match.iLiked && !revealed;

  const countdown = useCountdown(match.expiresAt);
  const prompt = usePrompt(match.id);

  // Fire haptics on transition into revealed state. Single-shot.
  const [hapticsFired, setHapticsFired] = useState(false);
  useEffect(() => {
    if (revealed && !hapticsFired) {
      haptics.success?.();
      setHapticsFired(true);
    }
  }, [revealed, hapticsFired]);

  return (
    <m.div
      className="relative w-full h-[100dvh] overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Photo (always present — drives the deblur reveal) */}
      <PhotoLayer
        src={match.peer.avatarUrl}
        revealed={revealed}
        altLabel={revealed ? `Photo de ${match.peer.name}` : "Profil mystère"}
      />

      {/* Decorative sparkle halo only while NOT revealed (creates the
          "crystal ball" mood). On reveal we drop it so the photo owns
          the frame. */}
      {!revealed && <SparkleHalo />}

      {/* ───────────────── HEADER ─────────────────
          Wave 17 minimal top bar: a small Sparkles icon + the day
          label so the user knows this is the *daily* moment. */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-5"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
          <Sparkles size={14} className="text-[#8B5CF6]" />
          <span className="text-[11px] font-semibold tracking-wide text-white uppercase">
            Crystal Ball
          </span>
        </div>

        {/* Subtle expiry pill */}
        <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[11px] text-white/80">
          {revealed ? "Révélé" : `${countdown} restant`}
        </div>
      </div>

      {/* ───────────────── CENTER ───────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-[180px] px-6 z-10">
        {/* Name + age block.
            BEFORE reveal: only the age is shown, name placeholder "?".
            AFTER reveal:  scale-in animation on the real name. */}
        <AnimatePresence mode="wait">
          {revealed ? (
            <m.div
              key="revealed-name"
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={springs.elastic as Transition}
              className="text-center"
            >
              <h1 className="text-4xl font-semibold text-white">
                {match.peer.name}
                <span className="text-white/70 font-light">, {match.peer.age}</span>
              </h1>
              {match.peer.bio.length > 0 && (
                <p className="mt-3 text-sm text-white/80 max-w-[280px] mx-auto leading-relaxed">
                  {match.peer.bio.length > 100
                    ? `${match.peer.bio.slice(0, 100)}…`
                    : match.peer.bio}
                </p>
              )}
            </m.div>
          ) : (
            <m.div
              key="hidden-name"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="text-5xl font-semibold text-white/90 tracking-tight">
                ?
                <span className="text-white/50 font-light text-3xl ml-3">
                  {match.peer.age} ans
                </span>
              </div>
              <p className="mt-4 text-[13px] text-white/80 max-w-[300px] mx-auto leading-relaxed">
                {prompt}
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* ───────────────── ACTION BAR (bottom) ───────────────── */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 z-20"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)" }}
      >
        <AnimatePresence mode="wait">
          {/* PROMPT state — two big buttons */}
          {!waiting && !revealed && (
            <m.div
              key="prompt"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  haptics.light?.();
                  onPass();
                }}
                className="flex items-center justify-center gap-2 h-[56px] rounded-2xl bg-white/10 backdrop-blur-md text-white font-medium transition-colors hover:bg-white/20 active:scale-[0.98]"
                aria-label="Refuser le match du jour"
              >
                <X size={18} />
                Pas pour moi
              </button>
              <button
                type="button"
                onClick={async () => {
                  haptics.medium?.();
                  await onLike();
                }}
                className="flex items-center justify-center gap-2 h-[56px] rounded-2xl bg-[#8B5CF6] text-white font-semibold shadow-[0_8px_32px_rgba(139,92,246,0.5)] transition-all hover:bg-[#7C3AED] active:scale-[0.98]"
                aria-label="Tenter ce match"
              >
                <Heart size={18} />
                Je tente
              </button>
            </m.div>
          )}

          {/* WAITING state — single pulse pill */}
          {waiting && (
            <m.div
              key="waiting"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-3"
            >
              <m.div
                className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md flex items-center gap-2 text-white"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles size={16} className="text-[#8B5CF6]" />
                <span className="text-sm font-medium">
                  En attente de leur réponse…
                </span>
              </m.div>
              <p className="text-[12px] text-white/60 text-center max-w-[260px]">
                Si la personne te like avant {countdown}, vous voyez vos profils
                + le chat s&apos;ouvre.
              </p>
            </m.div>
          )}

          {/* REVEALED state — celebration + chat CTA */}
          {revealed && (
            <m.div
              key="revealed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="px-4 py-2 rounded-full bg-[#00FF88]/20 backdrop-blur-md border border-[#00FF88]/40">
                <span className="text-[#00FF88] text-sm font-bold tracking-wide">
                  ✦ MATCH RÉVÉLÉ ✦
                </span>
              </div>
              {chatHref ? (
                <a
                  href={chatHref}
                  className="w-full h-[56px] flex items-center justify-center gap-2 rounded-2xl bg-white text-black font-semibold transition-all hover:bg-white/90 active:scale-[0.98]"
                >
                  Ouvrir le chat
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onPass()}
                  className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md text-white text-sm"
                >
                  Continuer
                </button>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
}
