"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "motion/react";
import { springs } from "@/lib/motion-design";
import { X, Lock } from "@/components/ui/lucide";

// Re-export for backwards compatibility with imports that used to live here.
export { getMockGradients } from "@/lib/photo-gallery-gradients";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

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
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenOrigin, setFullscreenOrigin] = useState({ x: 0, y: 0 });
  const galleryRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const dragX = useMotionValue(0);

  const total = photos.length;
  const isBlurred = useCallback(
    (index: number) => !isMatched && index > 0,
    [isMatched]
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

      // Left third = prev, right third = next, center = fullscreen
      if (clickX < cardWidth * 0.3) {
        goPrev(e);
      } else if (clickX > cardWidth * 0.7) {
        goNext(e);
      } else {
        // Open fullscreen from tap position
        setFullscreenOrigin({ x: e.clientX, y: e.clientY });
        setFullscreen(true);
      }
    },
    [currentIndex, isBlurred, goNext, goPrev]
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

  const renderPhoto = (index: number, className?: string) => {
    const gradient = gradients?.[index];
    if (gradient && !photos[index]?.startsWith("http")) {
      return (
        <div
          className={`absolute inset-0 ${className || ""}`}
          style={{ background: gradient }}
        />
      );
    }
    return (
      <img
        src={photos[index]}
        alt={`Photo ${index + 1} de ${name}`}
        className={`absolute inset-0 w-full h-full object-cover ${className || ""}`}
        loading={index === 0 ? "eager" : "lazy"}
        decoding="async"
      />
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
            {/* The photo */}
            {renderPhoto(currentIndex)}

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
                aria-label={`Photo ${i + 1} sur ${total}`}
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

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {fullscreen && !isBlurred(currentIndex) && (
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
                src={photos[currentIndex]}
                gradient={gradients?.[currentIndex]}
                alt={`Photo ${currentIndex + 1} de ${name}`}
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
