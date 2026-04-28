"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "motion/react";
import { springs } from "@/lib/motion-design";
import { X, Lock } from "@/components/ui/lucide";
import type { PromptQuestion } from "@/lib/prompts";

// Re-export for backwards compatibility with imports that used to live here.
export { getMockGradients } from "@/lib/photo-gallery-gradients";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

/**
 * A single resolved prompt to render as an overlay card inside the carousel.
 * Provided by SwipeCard from the candidate's `useProfilePrompts` (or mock
 * data). The viewer-visible mode color tint is forwarded so the card can
 * match the candidate's mode without PhotoGallery re-importing mode helpers.
 */
export interface InterleavedPrompt {
  /** Catalogue question (id, text, emoji, category). */
  question: PromptQuestion;
  /** User-typed answer. Already trimmed; rendered verbatim. */
  answer: string;
  /** Hex tint for the prompt card border + emoji halo. Defaults if omitted. */
  modeTint?: string;
}

/**
 * Discriminated union describing one slide in the unified carousel.
 * The gallery materialises this list and walks it for navigation; consumers
 * never reason about indices manually.
 */
type CarouselSlot =
  | { kind: "photo"; photoIndex: number }
  | { kind: "prompt"; prompt: InterleavedPrompt; promptIndex: number };

interface PhotoGalleryProps {
  /** Array of photo URLs (1-6) */
  photos: string[];
  /** Whether the viewer is matched with this profile */
  isMatched?: boolean;
  /** Profile name for alt text */
  name: string;
  /** Optional: use gradient mocks instead of real images */
  gradients?: string[];
  /** Called when gallery is swiped (prevents parent card drag conflict) */
  onGallerySwipe?: () => void;
  /**
   * WAVE 17 — Hinge-style profile prompts. When provided, the gallery
   * interleaves one prompt card every 2 photos (after photo[1], photo[3],
   * photo[5]) until the prompts list is exhausted. Tap navigation, swipe
   * gestures, and the position-bar count all account for the merged slot
   * sequence; nothing else in SwipeCard needs to change.
   */
  interleavedPrompts?: InterleavedPrompt[];
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function PhotoGallery({
  photos,
  isMatched = false,
  name,
  gradients,
  onGallerySwipe,
  interleavedPrompts,
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenOrigin, setFullscreenOrigin] = useState({ x: 0, y: 0 });
  const galleryRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const dragX = useMotionValue(0);

  // ── Build the unified slot sequence (photos + interleaved prompts) ──
  // Pattern: photo, photo, prompt, photo, photo, prompt, … so every 2
  // photos gets followed by one prompt card. We deliberately insert AFTER
  // pairs (not before) so the candidate's hero photo + photo 2 land side
  // by side on the deck, then the prompt acts as a "personality break"
  // before more photos.
  const slots = useMemo<CarouselSlot[]>(() => {
    const out: CarouselSlot[] = [];
    let promptIdx = 0;
    photos.forEach((_, i) => {
      out.push({ kind: "photo", photoIndex: i });
      const isPairEnd = (i + 1) % 2 === 0;
      if (
        isPairEnd &&
        interleavedPrompts &&
        promptIdx < interleavedPrompts.length
      ) {
        out.push({
          kind: "prompt",
          prompt: interleavedPrompts[promptIdx],
          promptIndex: promptIdx,
        });
        promptIdx += 1;
      }
    });
    // Append any leftover prompts at the end so they're never silently
    // dropped (e.g. profile with 1 photo + 3 prompts).
    if (interleavedPrompts) {
      while (promptIdx < interleavedPrompts.length) {
        out.push({
          kind: "prompt",
          prompt: interleavedPrompts[promptIdx],
          promptIndex: promptIdx,
        });
        promptIdx += 1;
      }
    }
    return out;
  }, [photos, interleavedPrompts]);

  const total = slots.length;
  const currentSlot = slots[currentIndex];

  // Photos 2..N stay blurred until matched. Prompt cards never blur — they
  // are short text, intended as the "social proof" surface even pre-match.
  const isBlurred = useCallback(
    (index: number) => {
      const slot = slots[index];
      if (!slot || slot.kind !== "photo") return false;
      return !isMatched && slot.photoIndex > 0;
    },
    [isMatched, slots],
  );

  // ── Navigation ──

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < total) {
        setCurrentIndex(index);
      }
    },
    [total]
  );

  const goNext = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      e?.stopPropagation();
      if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
    },
    [currentIndex, total]
  );

  const goPrev = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      e?.stopPropagation();
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    },
    [currentIndex]
  );

  // ── Swipe handling ──

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const threshold = 50;
      const velocity = info.velocity.x;
      const offset = info.offset.x;

      if (offset < -threshold || velocity < -500) {
        goNext();
        onGallerySwipe?.();
      } else if (offset > threshold || velocity > 500) {
        goPrev();
        onGallerySwipe?.();
      }
    },
    [goNext, goPrev, onGallerySwipe]
  );

  // ── Tap handling ──

  const handleTap = useCallback(
    (e: React.MouseEvent) => {
      if (isBlurred(currentIndex)) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const cardWidth = rect.width;
      const slot = slots[currentIndex];
      const isPromptSlot = slot?.kind === "prompt";

      // Left third = prev, right third = next, center = fullscreen.
      // Prompt slots never enter fullscreen (the text is the content;
      // there's nothing to zoom into) — center taps fall through to next
      // so the user always advances the deck.
      if (clickX < cardWidth * 0.3) {
        goPrev(e);
      } else if (clickX > cardWidth * 0.7 || isPromptSlot) {
        goNext(e);
      } else {
        // Open fullscreen from tap position
        setFullscreenOrigin({ x: e.clientX, y: e.clientY });
        setFullscreen(true);
      }
    },
    [currentIndex, isBlurred, goNext, goPrev, slots],
  );

  // ── Fullscreen a11y: Escape close + focus trap + focus restore ──

  useEffect(() => {
    if (!fullscreen) return;

    // Save the element that opened the overlay so we can restore focus on close.
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    // Move focus into the overlay (close button is the safest landing spot).
    // Defer one frame so the overlay is mounted + button ref attached.
    const focusFrame = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setFullscreen(false);
        return;
      }

      // Focus trap: only one focusable element (close button), so Tab/Shift+Tab
      // both keep focus on it. This guarantees focus cannot escape the modal.
      if (e.key === "Tab") {
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to whatever opened the overlay (e.g. the photo card).
      previouslyFocusedRef.current?.focus?.();
    };
  }, [fullscreen]);

  // ── Render photo or gradient ──

  const renderPhoto = (photoIndex: number, className?: string) => {
    const gradient = gradients?.[photoIndex];
    if (gradient && !photos[photoIndex]?.startsWith("http")) {
      return (
        <div
          className={`absolute inset-0 ${className || ""}`}
          style={{ background: gradient }}
        />
      );
    }
    // 2026-04-27 (round-3 perf polish): swap raw <img> for next/image so the
    // gallery participates in AVIF/WebP negotiation + size-hinted responsive
    // delivery. Hero (index 0) gets `priority` so it's a real LCP candidate
    // on /profile, the rest stay lazy. `sizes` is `100vw` because the gallery
    // fills the card width on every breakpoint.
    return (
      <Image
        src={photos[photoIndex]}
        alt={`Photo ${photoIndex + 1} de ${name}`}
        fill
        sizes="(max-width: 640px) 100vw, 600px"
        className={`object-cover ${className || ""}`}
        priority={photoIndex === 0}
      />
    );
  };

  // ── Render a prompt card slot (Wave 17) ──
  // Background is a gradient using the candidate's mode tint so the card
  // blends with the deck's mode-coded identity. We deliberately do NOT
  // photograph or glass-morph here — the goal is high-contrast readable
  // copy that pops between photos.
  const renderPromptSlot = (slot: { prompt: InterleavedPrompt }) => {
    const tint = slot.prompt.modeTint ?? "#8B5CF6";
    return (
      <div
        className="absolute inset-0 flex items-center justify-center px-8"
        style={{
          background: `linear-gradient(155deg, ${tint}26 0%, ${tint}12 50%, #00000040 100%), #0A0A0D`,
        }}
        role="group"
        aria-label={`Prompt : ${slot.prompt.question.question}`}
      >
        <div
          className="w-full max-w-[88%] rounded-[28px] p-7 backdrop-blur-md"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${tint}55`,
            boxShadow: `0 18px 60px ${tint}33`,
          }}
        >
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-4"
            style={{ background: `${tint}22`, color: tint }}
          >
            <span aria-hidden="true">{slot.prompt.question.emoji}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
              {slot.prompt.question.category}
            </span>
          </div>
          <p className="text-[15px] font-bold tracking-tight text-white/85 leading-snug mb-3">
            {slot.prompt.question.question}
          </p>
          <p className="text-[20px] italic font-medium text-white leading-snug">
            “{slot.prompt.answer}”
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Gallery container */}
      <div
        ref={galleryRef}
        className="absolute inset-0 overflow-hidden"
        role="region"
        aria-label={`Photos de ${name}`}
        aria-roledescription="carousel"
      >
        {/* Photo slides */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentIndex}
            className="absolute inset-0"
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={springs.rubber}
            style={{ x: dragX }}
            onClick={handleTap}
          >
            {/* Slot content — either a photo or a prompt card */}
            {currentSlot?.kind === "prompt"
              ? renderPromptSlot(currentSlot)
              : currentSlot
                ? renderPhoto(currentSlot.photoIndex)
                : null}

            {/* Blur overlay for non-matched photos 2-6 */}
            {isBlurred(currentIndex) && (
              <motion.div
                className="absolute inset-0 backdrop-blur-[20px] bg-black/20 flex flex-col items-center justify-center z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 border border-white/20">
                  <Lock size={24} strokeWidth={2} color="white" aria-hidden="true" />
                </div>
                <p className="text-[14px] font-bold text-white">
                  Match pour voir
                </p>
                <p className="text-[11px] text-white/60 mt-1">
                  Les autres photos sont deverrouillees apres un match
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Photo position bars (Instagram/Tinder pattern) — top of card,
            always visible. Replaces dots-at-bottom which were hidden by
            the info panel. Each bar fills as the photo slot is "active".
            Visual = 3px bar; hit area = 44x44 (WCAG 2.5.5 AAA) via
            transparent ::before pseudo-element extending the click target
            without changing layout. */}
        {total > 1 && (
          <div className="absolute top-2.5 left-3 right-3 z-20 flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
                className="relative h-[3px] flex-1 rounded-full bg-white/25 before:absolute before:inset-x-0 before:-top-5 before:-bottom-5 before:content-[''] before:min-h-11"
                aria-label={
                  slots[i]?.kind === "prompt"
                    ? `Prompt ${i + 1} sur ${total}`
                    : `Photo ${i + 1} sur ${total}`
                }
                aria-current={i === currentIndex ? "true" : undefined}
              >
                <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-white/95 block"
                    initial={false}
                    animate={{
                      width: i === currentIndex ? "100%" : i < currentIndex ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Photo counter top-right */}
        {total > 1 && (
          <div className="absolute top-3 right-3 z-20 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1">
            <span className="text-[11px] text-white/80 font-semibold tabular-nums">
              {currentIndex + 1}/{total}
            </span>
          </div>
        )}
      </div>

      {/* Fullscreen overlay — only opens for photo slots, never for prompt
          slots (prompts are text content; nothing to zoom into). */}
      <AnimatePresence>
        {fullscreen && currentSlot?.kind === "photo" && !isBlurred(currentIndex) && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setFullscreen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Photo en plein écran"
          >
            {/* Close button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setFullscreen(false)}
              className="absolute top-12 right-5 z-10 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
              aria-label="Fermer la photo en plein écran"
            >
              <X size={20} strokeWidth={2} color="white" aria-hidden="true" />
            </button>

            {/* Fullscreen photo with zoom */}
            <motion.div
              className="w-full h-full flex items-center justify-center"
              initial={{
                scale: 0.5,
                originX: `${(fullscreenOrigin.x / window.innerWidth) * 100}%`,
                originY: `${(fullscreenOrigin.y / window.innerHeight) * 100}%`,
              }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={springs.heavy}
              onClick={(e) => e.stopPropagation()}
            >
              <FullscreenPhoto
                src={photos[currentSlot.photoIndex]}
                gradient={gradients?.[currentSlot.photoIndex]}
                alt={`Photo ${currentSlot.photoIndex + 1} de ${name}`}
                onClose={() => setFullscreen(false)}
              />
            </motion.div>

            {/* Fullscreen counter */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center">
              <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <span className="text-[13px] text-white/80 font-semibold tabular-nums">
                  {currentIndex + 1} / {total}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────
// Fullscreen photo with pinch-to-zoom
// ─────────────────────────────────────────

function FullscreenPhoto({
  src,
  gradient,
  alt,
  onClose,
}: {
  src: string;
  gradient?: string;
  alt: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const lastTap = useRef(0);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setScale((s) => (s > 1 ? 1 : 2.5));
    }
    lastTap.current = now;
  }, []);

  if (gradient && !src?.startsWith("http")) {
    return (
      <motion.div
        className="w-full h-full"
        style={{ background: gradient }}
        animate={{ scale }}
        transition={springs.heavy}
        onClick={handleDoubleTap}
      />
    );
  }

  return (
    <motion.img
      src={src}
      alt={alt}
      className="max-w-full max-h-full object-contain select-none"
      animate={{ scale }}
      transition={springs.heavy}
      onClick={handleDoubleTap}
      draggable={false}
    />
  );
}

// ─────────────────────────────────────────
// Blur reveal animation (used when match happens)
// ─────────────────────────────────────────

export function BlurRevealOverlay({
  revealing,
  onComplete,
}: {
  revealing: boolean;
  onComplete?: () => void;
}) {
  return (
    <AnimatePresence>
      {revealing && (
        <motion.div
          className="absolute inset-0 z-30 pointer-events-none"
          initial={{ backdropFilter: "blur(20px)" }}
          animate={{ backdropFilter: "blur(0px)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          onAnimationComplete={onComplete}
        />
      )}
    </AnimatePresence>
  );
}
