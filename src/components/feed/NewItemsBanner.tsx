"use client";

/**
 * NewItemsBanner — Twitter/Instagram style "N new items" banner.
 *
 * Props:
 *   count    — how many new items arrived since the user last scrolled-to-top
 *   onClick  — callback: reveal new items + scroll to top
 *
 * Auto-dismisses after 10s of no interaction. Accessible: role=status,
 * polite live region. Respects prefers-reduced-motion.
 */

import { useEffect } from "react";
import { m, AnimatePresence } from "motion/react";
import { useAccessibility } from "@/components/ui/ReducedMotion";
import { springs } from "@/lib/motion-design";

interface NewItemsBannerProps {
  count: number;
  onClick: () => void;
  onDismiss: () => void;
}

export function NewItemsBanner({ count, onClick, onDismiss }: NewItemsBannerProps) {
  const { reducedMotion } = useAccessibility();

  useEffect(() => {
    if (count === 0) return;
    const t = setTimeout(() => onDismiss(), 10_000);
    return () => clearTimeout(t);
  }, [count, onDismiss]);

  return (
    <AnimatePresence initial={false}>
      {count > 0 && (
        <m.div
          role="status"
          aria-live="polite"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.96 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
          transition={reducedMotion ? { duration: 0.15 } : { ...springs.gentle }}
          className="sticky top-2 z-20 mx-auto w-max max-w-[90%] px-4"
        >
          <button
            type="button"
            onClick={onClick}
            className={[
              "group inline-flex items-center gap-2 rounded-full",
              "bg-accent text-white px-4 py-2",
              "shadow-[0_8px_24px_-8px_rgba(139,92,246,0.4)]",
              "text-[12px] font-semibold",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
              "hover:brightness-110 active:brightness-95 transition",
            ].join(" ")}
            aria-label={`${count} ${count > 1 ? "nouvelles activités" : "nouvelle activité"} — voir maintenant`}
          >
            <span aria-hidden="true">🎉</span>
            <span>
              {count > 1 ? `${count} nouvelles` : "1 nouvelle"} activité{count > 1 ? "s" : ""}
            </span>
            <span
              aria-hidden="true"
              className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-white/20 text-[10px]"
            >
              ↑
            </span>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
