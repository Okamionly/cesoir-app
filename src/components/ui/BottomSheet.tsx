"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { X } from "@/components/ui/lucide";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
  title?: string;
  /**
   * a11y round 2: optional aria-label fallback for sheets without a `title`.
   * Required if no title is set, otherwise SR users get "dialog" with no name.
   */
  ariaLabel?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BottomSheet({
  open,
  onClose,
  children,
  snapPoints = [0.25, 0.5, 0.75, 1],
  initialSnap = 1,
  title,
  ariaLabel,
}: BottomSheetProps) {
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  // useId so multiple sheets on the page get distinct heading ids.
  const titleId = useId();

  // Focus trap + restore + Escape — replaces the previous bare body scroll
  // lock effect. Focus moves to the close button (or first focusable child)
  // on open, returns to the trigger on close. (a11y round 2, 2026-04-27.)
  useFocusTrap(sheetRef, open, { onEscape: onClose });

  // Body scroll lock — separate from the focus trap so it survives if a
  // future caller suppresses the trap.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const snapHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const snapValue = snapPoints[initialSnap] !== undefined ? snapPoints[initialSnap] : 0.5;
  const initialY = snapHeight * (1 - snapValue);
  const closeThreshold = snapHeight * 0.6;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[850] bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            key="sheet-content"
            ref={sheetRef}
            initial={{ y: snapHeight }}
            animate={{ y: initialY }}
            exit={{ y: snapHeight }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: snapHeight }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.point.y > closeThreshold || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed inset-x-0 bottom-0 z-[851] flex flex-col rounded-t-3xl bg-bg shadow-2xl"
            style={{ height: snapHeight, touchAction: "none" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={!title ? ariaLabel : undefined}
          >
            {/* Drag handle — decorative, hidden from SR */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex shrink-0 cursor-grab items-center justify-center py-3 active:cursor-grabbing"
              aria-hidden="true"
            >
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            {title && (
              <div className="flex items-center justify-between px-6 pb-2">
                <h2 id={titleId} className="font-display text-lg font-bold text-text">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="tap-target -mr-2 rounded-full p-2 text-text-muted hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  aria-label="Fermer"
                >
                  <X size={18} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
