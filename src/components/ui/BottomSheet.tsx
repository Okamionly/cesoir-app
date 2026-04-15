"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";

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
}: BottomSheetProps) {
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Body scroll lock
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
            className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm"
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
            className="fixed inset-x-0 bottom-0 z-[901] flex flex-col rounded-t-3xl bg-bg shadow-2xl"
            style={{ height: snapHeight, touchAction: "none" }}
          >
            {/* Drag handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex shrink-0 cursor-grab items-center justify-center py-3 active:cursor-grabbing"
            >
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            {title && (
              <h2 className="px-6 pb-2 font-display text-lg font-bold text-text">
                {title}
              </h2>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
