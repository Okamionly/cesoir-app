"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PopUpEvent } from "@/lib/popup-events";

interface EventCardProps {
  event: PopUpEvent | null;
  onClose?: () => void;
  onJoin?: (event: PopUpEvent) => void;
  onShare?: (event: PopUpEvent) => void;
}

function AttendeeAvatars({
  current,
  max,
  avatarUrl,
}: {
  current: number;
  max: number;
  avatarUrl: string;
}) {
  const displayCount = Math.min(current, 4);
  const remaining = current - displayCount;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {Array.from({ length: displayCount }, (_, i) => (
          <div
            key={i}
            className="h-7 w-7 overflow-hidden rounded-full border-2 border-[#141414]"
          >
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{
                filter: `hue-rotate(${i * 60}deg)`,
              }}
            />
          </div>
        ))}
        {remaining > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#141414] bg-white/10">
            <span className="text-[9px] font-bold text-white/70">
              +{remaining}
            </span>
          </div>
        )}
      </div>
      <span className="ml-2.5 text-sm font-semibold text-white/70">
        {current}/{max}
      </span>
    </div>
  );
}

const MODE_COLORS: Record<string, string> = {
  "Gamer Night": "#6366F1",
  "Fit Date": "#22C55E",
  "Langue Exchange": "#10B981",
  "Foodie Quest": "#F97316",
  "Dog Date": "#D97706",
  "Culture Club": "#8B5CF6",
  "Night Owl": "#8B5CF6",
  "Solo Diner": "#F97316",
  "Sober Tonight": "#14B8A6",
};

function getModeColor(mode: string): string {
  return MODE_COLORS[mode] ?? "#8B5CF6";
}

export default function EventCard({
  event,
  onClose,
  onJoin,
  onShare,
}: EventCardProps) {
  if (!event) return null;

  const modeColor = getModeColor(event.mode);
  const isFull = event.currentAttendees >= event.maxAttendees;

  const handleShare = async () => {
    if (onShare) {
      onShare(event);
      return;
    }

    const shareData = {
      title: event.title,
      text: `${event.title} - ${event.time} @ ${event.venue}. ${event.description}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <AnimatePresence>
      {event && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6"
            role="dialog"
            aria-label={`Evenement ${event.title}`}
          >
            <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
              <div className="p-5">
                {/* Creator + title */}
                <div className="mb-4 flex items-start gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white/10">
                    <img
                      src={event.creatorAvatar}
                      alt={event.creator}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white">
                      {event.title}
                    </h3>
                    <p className="text-xs text-white/40">
                      par {event.creator}
                    </p>
                  </div>
                </div>

                {/* Mode pill */}
                <div className="mb-3">
                  <span
                    className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: `${modeColor}CC` }}
                  >
                    {event.mode}
                  </span>
                </div>

                {/* Time + venue */}
                <div className="mb-4 flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden="true">{"\u{1F552}"}</span>
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden="true">{"\u{1F4CD}"}</span>
                    <span>{event.venue}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-4 text-sm text-white/50">
                  {event.description}
                </p>

                {/* Attendees */}
                <div className="mb-4">
                  <AttendeeAvatars
                    current={event.currentAttendees}
                    max={event.maxAttendees}
                    avatarUrl={event.creatorAvatar}
                  />
                </div>

                {/* Tags */}
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => !isFull && onJoin?.(event)}
                    disabled={isFull}
                    className="flex-1 rounded-xl py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
                    style={{
                      background: isFull
                        ? "rgba(255,255,255,0.1)"
                        : "linear-gradient(135deg, #8B5CF6, #00FF88)",
                    }}
                    aria-label={isFull ? "Evenement complet" : `Rejoindre ${event.title}`}
                  >
                    {isFull ? "Complet" : "Rejoindre"}
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                    aria-label="Partager cet evenement"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/60"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
