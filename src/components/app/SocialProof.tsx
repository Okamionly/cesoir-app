"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

// --- Types ---

interface SocialProofProps {
  type: "friends" | "evenings" | "member";
  count: number;
  verified?: boolean;
  /** Friend avatar URLs (only for type="friends") */
  avatars?: string[];
  /** Member since text (only for type="member"), e.g. "mars 2026" */
  since?: string;
}

// --- Animated counter ---

function useCountUp(target: number, duration: number = 1200, trigger: boolean = true): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);
      setCurrent(value);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [target, duration, trigger]);

  return current;
}

// --- Component ---

export default function SocialProof({ type, count, verified = false, avatars = [], since }: SocialProofProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const animatedCount = useCountUp(count, 1200, isInView);

  const renderContent = () => {
    switch (type) {
      case "friends":
        return (
          <div className="flex items-center gap-2">
            {/* Friend avatars */}
            {avatars.length > 0 && (
              <div className="flex -space-x-2" aria-hidden="true">
                {avatars.slice(0, 3).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-6 h-6 rounded-full border-2 border-card object-cover"
                    style={{ zIndex: avatars.length - i }}
                  />
                ))}
              </div>
            )}
            <span className="text-xs font-semibold text-text">
              Verifie par {animatedCount} ami{animatedCount > 1 ? "s" : ""}
            </span>
          </div>
        );

      case "evenings":
        return (
          <div className="flex items-center gap-2">
            {/* Star rating */}
            <div className="flex gap-0.5" aria-label={`${Math.min(5, Math.round(count / 2))} etoiles sur 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill={i < Math.min(5, Math.round(count / 2)) ? "#8B5CF6" : "none"}
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ))}
            </div>
            <span className="text-xs font-semibold text-text">
              {animatedCount} soiree{animatedCount > 1 ? "s" : ""} reussie{animatedCount > 1 ? "s" : ""}
            </span>
          </div>
        );

      case "member":
        return (
          <div className="flex items-center gap-2">
            {/* Calendar icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs font-semibold text-text">
              Membre depuis {since ?? `${animatedCount} mois`}
            </span>
          </div>
        );
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border"
      role="status"
      aria-label={
        type === "friends"
          ? `Verifie par ${count} amis`
          : type === "evenings"
          ? `${count} soirees reussies`
          : `Membre depuis ${since ?? count + " mois"}`
      }
    >
      {renderContent()}

      {/* Verified checkmark */}
      {verified && (
        <motion.span
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
          className="flex-shrink-0 w-5 h-5 rounded-full bg-[#00FF88] flex items-center justify-center"
          aria-label="Verifie"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </motion.span>
      )}
    </motion.div>
  );
}
