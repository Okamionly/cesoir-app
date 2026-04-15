"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface PhotoSlot {
  id: string;
  url: string | null;
  file?: File;
}

interface PhotoUploadGridProps {
  /** Current photos (URLs). First is mandatory main photo. */
  initialPhotos?: string[];
  /** Called when photos change (reorder, add, remove) */
  onPhotosChange?: (photos: string[]) => void;
  /** User ID for Supabase upload path (mock for now) */
  userId?: string;
  /** Max number of photo slots */
  maxSlots?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function PhotoUploadGrid({
  initialPhotos = [],
  onPhotosChange,
  userId,
  maxSlots = 6,
}: PhotoUploadGridProps) {
  // Initialize slots: fill existing photos, pad with empty slots
  const [slots, setSlots] = useState<PhotoSlot[]>(() => {
    const filled: PhotoSlot[] = initialPhotos.map((url, i) => ({
      id: `photo-${i}`,
      url,
    }));
    const empty: PhotoSlot[] = Array.from(
      { length: maxSlots - filled.length },
      (_, i) => ({
        id: `empty-${i}`,
        url: null,
      })
    );
    return [...filled, ...empty];
  });

  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [longPressSlot, setLongPressSlot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Notify parent ──

  const notifyChange = useCallback(
    (newSlots: PhotoSlot[]) => {
      const urls = newSlots
        .filter((s) => s.url !== null)
        .map((s) => s.url as string);
      onPhotosChange?.(urls);
    },
    [onPhotosChange]
  );

  // ── Add photo ──

  const handleAddClick = useCallback((slotId: string) => {
    activeSlotRef.current = slotId;
    setError(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeSlotRef.current) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Format accepte : JPG, PNG ou WebP");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`Taille max : ${MAX_SIZE_MB} Mo`);
        return;
      }

      const slotId = activeSlotRef.current;
      const objectUrl = URL.createObjectURL(file);

      // Mock upload: use local preview URL immediately
      setUploading(slotId);
      setTimeout(() => {
        setSlots((prev) => {
          const next = prev.map((s) =>
            s.id === slotId ? { ...s, url: objectUrl, file } : s
          );
          notifyChange(next);
          return next;
        });
        setUploading(null);
      }, 600);

      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [notifyChange]
  );

  // ── Remove photo ──

  const handleRemove = useCallback(
    (slotId: string) => {
      setSlots((prev) => {
        // Remove photo from slot, shift filled photos up, pad with empty at end
        const filled = prev
          .filter((s) => s.url !== null && s.id !== slotId)
          .map((s, i) => ({ ...s, id: `photo-${i}` }));
        const emptyCount = maxSlots - filled.length;
        const empty: PhotoSlot[] = Array.from(
          { length: emptyCount },
          (_, i) => ({
            id: `empty-${i}`,
            url: null,
          })
        );
        const next = [...filled, ...empty];
        notifyChange(next);
        return next;
      });
      setLongPressSlot(null);
    },
    [maxSlots, notifyChange]
  );

  // ── Long-press to swap ──

  const handleLongPressStart = useCallback(
    (slotId: string) => {
      if (!slots.find((s) => s.id === slotId)?.url) return;
      longPressTimer.current = setTimeout(() => {
        setLongPressSlot(slotId);
        setSwapTarget(null);
      }, 500);
    },
    [slots]
  );

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleSwapSelect = useCallback(
    (targetId: string) => {
      if (!longPressSlot || longPressSlot === targetId) {
        setLongPressSlot(null);
        return;
      }

      setSlots((prev) => {
        const next = [...prev];
        const sourceIdx = next.findIndex((s) => s.id === longPressSlot);
        const targetIdx = next.findIndex((s) => s.id === targetId);
        if (sourceIdx === -1 || targetIdx === -1) return prev;

        // Swap URLs
        const tempUrl = next[sourceIdx].url;
        const tempFile = next[sourceIdx].file;
        next[sourceIdx] = {
          ...next[sourceIdx],
          url: next[targetIdx].url,
          file: next[targetIdx].file,
        };
        next[targetIdx] = {
          ...next[targetIdx],
          url: tempUrl,
          file: tempFile,
        };

        notifyChange(next);
        return next;
      });
      setLongPressSlot(null);
    },
    [longPressSlot, notifyChange]
  );

  // ── Render ──

  const filledCount = slots.filter((s) => s.url !== null).length;

  return (
    <div className="w-full">
      {/* Grid: 2 columns, 3 rows */}
      <div
        className="grid grid-cols-3 gap-2"
        role="list"
        aria-label="Grille de photos"
      >
        {slots.map((slot, index) => (
          <motion.div
            key={slot.id}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: {
                ...springs.elastic,
                delay: index * 0.06,
              },
            }}
            role="listitem"
            aria-label={
              slot.url
                ? `Photo ${index + 1}${index === 0 ? " (principale)" : ""}`
                : `Emplacement ${index + 1}${index === 0 ? " (obligatoire)" : ""}`
            }
          >
            {slot.url ? (
              /* ── Filled slot ── */
              <motion.div
                className={`w-full h-full relative ${
                  longPressSlot === slot.id
                    ? "ring-2 ring-accent ring-offset-2 ring-offset-bg"
                    : longPressSlot
                    ? "opacity-60"
                    : ""
                }`}
                whileTap={{ scale: longPressSlot ? 1 : 0.95 }}
                transition={springs.micro}
                onPointerDown={() => handleLongPressStart(slot.id)}
                onPointerUp={handleLongPressEnd}
                onPointerLeave={handleLongPressEnd}
                onClick={() => {
                  if (longPressSlot) {
                    handleSwapSelect(slot.id);
                  }
                }}
              >
                <img
                  src={slot.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />

                {/* Main photo badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-accent/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                      Principale
                    </span>
                  </div>
                )}

                {/* Remove button */}
                {!longPressSlot && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(slot.id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                    aria-label={`Supprimer photo ${index + 1}`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}

                {/* Swap indicator during long-press mode */}
                {longPressSlot && longPressSlot !== slot.id && (
                  <motion.div
                    className="absolute inset-0 bg-accent/20 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="7 16 3 12 7 8" />
                        <polyline points="17 8 21 12 17 16" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                      </svg>
                    </div>
                  </motion.div>
                )}

                {/* Upload progress overlay */}
                {uploading === slot.id && (
                  <motion.div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        ease: "linear",
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* ── Empty slot (+ placeholder) ── */
              <motion.button
                className={`w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  index === 0 && filledCount === 0
                    ? "border-accent/40 bg-accent/5"
                    : "border-border bg-bg hover:border-text-muted/30 hover:bg-border/20"
                } ${
                  longPressSlot
                    ? "opacity-40 pointer-events-none"
                    : ""
                }`}
                onClick={() => handleAddClick(slot.id)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                transition={springs.micro}
                aria-label={`Ajouter photo${index === 0 ? " principale" : ""}`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={
                    index === 0 && filledCount === 0
                      ? "text-accent"
                      : "text-text-muted"
                  }
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {index === 0 && filledCount === 0 && (
                  <span className="text-[9px] font-bold text-accent uppercase tracking-wider">
                    Obligatoire
                  </span>
                )}
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Long press hint */}
      {filledCount >= 2 && !longPressSlot && (
        <p className="text-[11px] text-text-muted text-center mt-3">
          Appui long pour reorganiser
        </p>
      )}

      {/* Swap mode indicator */}
      <AnimatePresence>
        {longPressSlot && (
          <motion.div
            className="mt-3 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springs.snap}
          >
            <p className="text-[12px] text-accent font-semibold">
              Touche une autre photo pour echanger
            </p>
            <button
              onClick={() => setLongPressSlot(null)}
              className="text-[11px] text-text-muted mt-1 underline"
            >
              Annuler
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-[12px] text-danger font-medium text-center mt-2"
            role="alert"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
