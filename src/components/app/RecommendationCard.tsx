"use client";

import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface RecommendationCardProps {
  /** Photo URL or empty for gradient fallback */
  photo?: string;
  /** Main title (name, event title, venue name) */
  title: string;
  /** Subtitle (age, time, vibe) */
  subtitle?: string;
  /** Recommendation reason text */
  reason: string;
  /** Emoji icon for the reason tag */
  reasonIcon?: string;
  /** Compatibility percentage (optional) */
  compatibility?: number;
  /** CTA button label */
  ctaLabel?: string;
  /** CTA callback */
  onCta?: () => void;
  /** Card click callback */
  onClick?: () => void;
  /** Gradient fallback color */
  accentColor?: string;
  /** Card size variant */
  variant?: "compact" | "standard" | "wide";
  /** Animation delay for staggered lists */
  index?: number;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function RecommendationCard({
  photo,
  title,
  subtitle,
  reason,
  reasonIcon,
  compatibility,
  ctaLabel = "Voir",
  onCta,
  onClick,
  accentColor = "#8B5CF6",
  variant = "standard",
  index = 0,
}: RecommendationCardProps) {
  const isCompact = variant === "compact";
  const isWide = variant === "wide";

  const cardWidth = isCompact ? "w-[160px]" : isWide ? "w-full" : "w-[200px]";
  const cardHeight = isCompact ? "h-[220px]" : isWide ? "h-[180px]" : "h-[280px]";
  const photoHeight = isCompact ? "h-[100px]" : isWide ? "h-full" : "h-[140px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...springs.gentle, delay: index * 0.08 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        ${isWide ? "flex flex-row" : "flex flex-col"}
        ${cardWidth} ${isWide ? "h-auto min-h-[120px]" : cardHeight}
        bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden
        cursor-pointer shrink-0 relative group
        hover:border-white/[0.15] transition-colors duration-300
      `}
    >
      {/* Photo / Gradient Area */}
      <div
        className={`
          ${isWide ? "w-[120px] shrink-0" : "w-full"} ${photoHeight}
          relative overflow-hidden
        `}
      >
        {photo ? (
          <img
            src={photo}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)`,
            }}
          />
        )}

        {/* Compatibility Badge */}
        {compatibility != null && compatibility > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
            <span className="text-[10px] text-[#8B5CF6] font-bold">
              {compatibility}%
            </span>
          </div>
        )}

        {/* Subtle gradient overlay at bottom */}
        {!isWide && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
        )}
      </div>

      {/* Content Area */}
      <div className={`flex-1 p-3 flex flex-col ${isWide ? "justify-center" : "justify-between"}`}>
        <div>
          {/* Recommended label */}
          <p className="text-[9px] uppercase tracking-wider text-[#8B5CF6]/60 font-medium mb-1">
            Recommande pour toi
          </p>

          {/* Title */}
          <h3 className={`text-white font-semibold leading-tight ${isCompact ? "text-xs" : "text-sm"} line-clamp-1`}>
            {title}
          </h3>

          {/* Subtitle */}
          {subtitle && (
            <p className={`text-white/50 mt-0.5 line-clamp-1 ${isCompact ? "text-[10px]" : "text-xs"}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Reason Tag */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-white/[0.06] rounded-full px-2 py-1 min-w-0">
            {reasonIcon && (
              <span className="text-[10px] shrink-0">{reasonIcon}</span>
            )}
            <span className="text-[10px] text-white/60 truncate">
              {reason}
            </span>
          </div>

          {/* CTA */}
          {ctaLabel && onCta && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCta();
              }}
              className="text-[10px] font-semibold text-[#8B5CF6] hover:text-[#A78BFA] transition-colors shrink-0"
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
