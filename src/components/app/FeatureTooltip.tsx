"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Feature Tooltip — Contextual "?" helper
// ─────────────────────────────────────────

interface FeatureTooltipProps {
  /** The text to display in the tooltip */
  text: string;
  /** Position relative to the "?" icon */
  position?: "top" | "bottom" | "left" | "right";
  /** Auto-dismiss delay in ms (default 5000, 0 = no auto-dismiss) */
  autoDismissMs?: number;
  /** Size of the "?" button in px (default 18) */
  size?: number;
  /** Additional CSS class for the container */
  className?: string;
}

export default function FeatureTooltip({
  text,
  position = "top",
  autoDismissMs = 5000,
  size = 18,
  className = "",
}: FeatureTooltipProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss
  useEffect(() => {
    if (open && autoDismissMs > 0) {
      timerRef.current = setTimeout(() => {
        setOpen(false);
      }, autoDismissMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, autoDismissMs]);

  // Close on tap outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    // Use a small delay so the opening tap doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Tooltip positioning styles
  const tooltipPositionStyles: Record<string, React.CSSProperties> = {
    top: {
      bottom: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      marginBottom: 8,
    },
    bottom: {
      top: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      marginTop: 8,
    },
    left: {
      right: "100%",
      top: "50%",
      transform: "translateY(-50%)",
      marginRight: 8,
    },
    right: {
      left: "100%",
      top: "50%",
      transform: "translateY(-50%)",
      marginLeft: 8,
    },
  };

  // Arrow styles for each position
  const arrowStyles: Record<string, string> = {
    top: "absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#111] dark:bg-[#222]",
    bottom: "absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#111] dark:bg-[#222]",
    left: "absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#111] dark:bg-[#222]",
    right: "absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#111] dark:bg-[#222]",
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
    >
      {/* "?" trigger button */}
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.85 }}
        transition={springs.micro}
        className="flex items-center justify-center rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] font-bold hover:bg-[#8B5CF6]/25 transition-colors"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.55,
          lineHeight: 1,
        }}
        aria-label="Aide"
        aria-expanded={open}
      >
        ?
      </motion.button>

      {/* Tooltip bubble */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={springs.elastic}
            className="absolute z-50 pointer-events-auto"
            style={{
              ...tooltipPositionStyles[position],
              transformOrigin: position === "top"
                ? "bottom center"
                : position === "bottom"
                  ? "top center"
                  : position === "left"
                    ? "right center"
                    : "left center",
              width: "max-content",
              maxWidth: 220,
            }}
            role="tooltip"
          >
            <div className="relative bg-[#111] dark:bg-[#222] text-white text-[12px] leading-relaxed px-3 py-2 rounded-xl shadow-lg">
              {text}
              {/* Arrow */}
              <div className={arrowStyles[position]} aria-hidden="true" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
