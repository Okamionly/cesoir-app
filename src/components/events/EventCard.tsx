"use client";

/**
 * EventCard — Shotgun-inspired event tile for /events listing.
 *
 * Layout:
 *   ┌─────────────────────────────────┐
 *   │ [Flyer 16/9 rounded-xl]         │  ← next/image, lazy
 *   │                                 │
 *   │  JEU 24 OCT · 22H               │  ← date badge
 *   │  Techno Revolution w/ DJ XYZ    │  ← title (2-line clamp)
 *   │  📍 Rockstore · Ecusson         │
 *   │                                 │
 *   │  [Techno] [Gratuit] (+N)        │  ← chips (max 2 + overflow)
 *   │                                 │
 *   │  👤👤👤 +12 y vont    [Rejoindre] │  ← avatars + CTA
 *   └─────────────────────────────────┘
 *
 * Hover (pointer:fine) : cinematic lift + glow + flyer parallax zoom.
 * Touch : scale-down tap feedback only.
 */

import Link from "next/link";
import Image from "next/image";
import {
  m,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
  type Transition,
} from "motion/react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { MapPin, Check } from "@/components/ui/lucide";
import { springs } from "@/lib/motion-design";
import { usePointerFine } from "@/lib/hooks/usePointerFine";
import type { CesoirEvent } from "@/lib/events-types";
import { EVENT_CATEGORY_LABELS } from "@/lib/events-types";
import { app } from "@/lib/design-tokens";
import { haptics } from "@/lib/haptics";

// ─────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────

const DAY_SHORT = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
const MONTH_SHORT = [
  "JAN", "FEV", "MARS", "AVR", "MAI", "JUIN",
  "JUIL", "AOUT", "SEPT", "OCT", "NOV", "DEC",
];

function formatDateBadge(iso: string): string {
  const d = new Date(iso);
  const day = DAY_SHORT[d.getDay()];
  const num = d.getDate();
  const month = MONTH_SHORT[d.getMonth()];
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const timeStr =
    minutes === 0
      ? `${hours}H`
      : `${hours}H${String(minutes).padStart(2, "0")}`;
  return `${day} ${num} ${month} · ${timeStr}`;
}

// ─────────────────────────────────────────────────────────────
// Avatar stack
// ─────────────────────────────────────────────────────────────

function AvatarStack({
  avatars,
}: {
  avatars: CesoirEvent["attendeePreview"];
}) {
  const visible = avatars.slice(0, 3);
  if (visible.length === 0) return null;
  return (
    <div className="flex items-center -space-x-1.5" aria-hidden="true">
      {visible.map((a, i) => (
        <div
          key={a.userId}
          className="relative w-5 h-5 rounded-full overflow-hidden border border-bg ring-1 ring-border/60"
          style={{ zIndex: visible.length - i }}
        >
          {a.avatarUrl ? (
            <Image
              src={a.avatarUrl}
              alt=""
              fill
              sizes="20px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface EventCardProps {
  event: CesoirEvent;
  /**
   * Optional index so the parent grid can stagger entrances via variants.
   * When provided, the card reads `custom` from motion.
   */
  index?: number;
  /**
   * When true, shows a "Tu y es" check chip instead of the Rejoindre CTA.
   * This is derived from `event.myRsvp === "going"` by default but can be
   * overridden (e.g. "Peut-etre" state).
   */
  variant?: "default" | "compact";
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
  const reducedMotion = useReducedMotion();
  const pointerFine = usePointerFine();
  const cardRef = useRef<HTMLAnchorElement>(null);

  // Hover state — drives glow + flyer parallax
  const [hovered, setHovered] = useState(false);
  const applyCinematic = pointerFine && !reducedMotion;

  // Flyer parallax (subtle zoom on hover)
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateXRaw = useTransform(my, [0, 1], [3, -3]);
  const rotateYRaw = useTransform(mx, [0, 1], [-3, 3]);
  const rotateX = useSpring(rotateXRaw, { stiffness: 220, damping: 25 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 220, damping: 25 });

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (!applyCinematic) return;
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      mx.set((e.clientX - rect.left) / rect.width);
      my.set((e.clientY - rect.top) / rect.height);
    },
    [applyCinematic, mx, my],
  );

  const dateLabel = useMemo(
    () => formatDateBadge(event.startAt),
    [event.startAt],
  );

  const visibleCategories = event.categories.slice(0, 2);
  const overflow = event.categories.length - visibleCategories.length;

  const attendees = event.counts.going + event.attendeePreview.length;
  const isGoing = event.myRsvp === "going";

  // 2026-04-26: highlight events happening tonight (the app's whole pitch).
  // We compare the event start date against the user's local "today".
  const isTonight = useMemo(() => {
    const start = new Date(event.startAt);
    const now = new Date();
    return (
      start.getFullYear() === now.getFullYear() &&
      start.getMonth() === now.getMonth() &&
      start.getDate() === now.getDate()
    );
  }, [event.startAt]);

  const handleTap = useCallback(() => {
    haptics.light();
  }, []);

  const compact = variant === "compact";

  return (
    <m.div
      className="relative"
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={springs.heavy as Transition}
    >
      {/* Glow halo — hover only */}
      {applyCinematic && hovered && (
        <m.div
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.25), transparent 70%)",
            filter: "blur(18px)",
            zIndex: -1,
          }}
        />
      )}

      <m.div
        style={{
          rotateX: applyCinematic && hovered ? rotateX : 0,
          rotateY: applyCinematic && hovered ? rotateY : 0,
          transformPerspective: 1000,
          transformStyle: "preserve-3d",
        }}
        animate={
          applyCinematic && hovered
            ? { y: -4, scale: 1.01 }
            : { y: 0, scale: 1 }
        }
        transition={springs.gentle as Transition}
        whileTap={
          !pointerFine
            ? { scale: 0.98, transition: springs.micro as Transition }
            : undefined
        }
      >
        <Link
          ref={cardRef}
          href={`/events/${event.id}`}
          prefetch={false}
          onClick={handleTap}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onMouseMove={handleMouseMove}
          className={[
            "relative block overflow-hidden rounded-2xl bg-card border-2 transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
            // 2026-04-26: 'ce soir' events get the brand gradient border so
            // the most-relevant cards on the app's whole pitch ('ce soir')
            // are visually obvious in the feed.
            isTonight
              ? "border-accent shadow-[0_8px_28px_-8px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]"
              : hovered
                ? "border-accent/40"
                : "border-border hover:border-accent/25",
          ].join(" ")}
          aria-label={`${event.title}, ${dateLabel}, au ${event.venue.name}${isTonight ? " — ce soir" : ""}`}
        >
          {/* CE SOIR pill — pinned top-left over the flyer when applicable */}
          {isTonight && (
            <div
              className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
                boxShadow: "0 0 12px color-mix(in srgb, var(--color-accent) 50%, transparent)",
              }}
            >
              <span aria-hidden="true">●</span>
              Ce soir
            </div>
          )}
          {/* ─── Flyer ─────────────────────────────────── */}
          <div
            className={[
              "relative w-full overflow-hidden bg-gradient-to-br from-accent/20 via-accent/10 to-transparent",
              compact ? "aspect-[21/9]" : "aspect-[16/9]",
            ].join(" ")}
          >
            {event.flyerUrl ? (
              <m.div
                className="absolute inset-0"
                animate={
                  applyCinematic && hovered ? { scale: 1.05 } : { scale: 1 }
                }
                transition={springs.gentle as Transition}
              >
                <Image
                  src={event.flyerUrl}
                  alt=""
                  fill
                  sizes="(max-width: 440px) 100vw, 440px"
                  className="object-cover"
                  loading="lazy"
                />
              </m.div>
            ) : (
              // Fallback — gradient with initials
              <div
                aria-hidden
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(139,92,246,0.22), rgba(0,255,136,0.16))",
                }}
              >
                <span className="font-display text-3xl font-bold text-accent/60 tracking-wider">
                  {event.title.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {/* Price badge top-right */}
            {event.priceLabel && (
              <div className="absolute top-2 right-2 inline-flex items-center rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                {event.priceLabel}
              </div>
            )}
          </div>

          {/* ─── Content ──────────────────────────────── */}
          <div className="p-4 space-y-2">
            {/* Date badge */}
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-accent">
              <span aria-hidden>🕓</span>
              <span>{dateLabel}</span>
            </div>

            {/* Title */}
            <h3 className="font-display text-[15px] font-bold text-text leading-snug line-clamp-2">
              {event.title}
            </h3>

            {/* Venue line */}
            <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
              <MapPin size={13} strokeWidth={2} aria-hidden className="shrink-0" />
              <span className="truncate">
                {event.venue.name}
                {event.venue.neighborhood ? ` · ${event.venue.neighborhood}` : ""}
              </span>
            </div>

            {/* Category chips */}
            {visibleCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {visibleCategories.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] font-medium text-text-muted"
                  >
                    {EVENT_CATEGORY_LABELS[c]}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="inline-flex items-center rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] font-medium text-text-muted">
                    +{overflow}
                  </span>
                )}
              </div>
            )}

            {/* Footer — avatars + CTA */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 min-w-0">
                <AvatarStack avatars={event.attendeePreview} />
                {attendees > 0 ? (
                  <span className="text-[11px] text-text-muted truncate">
                    {attendees === 1 ? "1 y va" : `${attendees} y vont`}
                  </span>
                ) : (
                  <span className="text-[11px] truncate" style={{ color: "var(--color-accent)" }}>
                    ✨ Lance la soirée
                  </span>
                )}
              </div>

              {isGoing ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border"
                  style={{
                    backgroundColor: `${app.vert}26`, // ~15% alpha
                    color: app.vertDark,
                    borderColor: `${app.vert}66`,
                  }}
                >
                  <Check size={12} strokeWidth={2.5} aria-hidden />
                  Tu y es
                </span>
              ) : (
                <span
                  className="inline-flex items-center rounded-full bg-text px-3 py-1 text-[11px] font-semibold text-bg transition-transform group-active:scale-95"
                  aria-hidden
                >
                  Rejoindre
                </span>
              )}
            </div>
          </div>
        </Link>
      </m.div>
    </m.div>
  );
}

export default EventCard;
