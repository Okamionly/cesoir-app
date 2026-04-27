"use client";

/**
 * EventFlyInCard — Shotgun-style card that springs in from an event pin's
 * screen position when clicked on /map. Sibling of ProfileFlyInCard (Wave 8)
 * but tuned for event data: flyer, date, venue, categories, RSVP counts.
 *
 * Features:
 * - Cinematic spring-in from the pin's coords (or dock-to-bottom on mobile).
 * - 3D tilt on pointer-fine desktops.
 * - Quick "Aller détails" → /events/[id], or "RSVP rapide" → optimistic
 *   toggle handled by parent via `onRsvp` callback.
 * - Click-outside or Escape closes.
 * - Fully reduced-motion friendly.
 */

import {
  m,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { springs, micro } from "@/lib/motion-design";
import { usePointerFine } from "@/lib/hooks/usePointerFine";
import useIsMobile from "@/lib/hooks/useIsMobile";
import {
  EVENT_CATEGORY_LABELS,
  type CesoirEvent,
  type RsvpStatus,
} from "@/lib/events-types";
import { Calendar, MapPin, Users, Zap } from "@/components/ui/lucide";

interface EventFlyInCardProps {
  event: CesoirEvent;
  /** Screen coords (x,y px) where the pin lives — anchors card on desktop. */
  anchor?: { x: number; y: number } | null;
  onClose: () => void;
  /** Optimistic RSVP toggle — parent handles the Supabase write. */
  onRsvp?: (event: CesoirEvent, status: RsvpStatus | null) => void;
}

function formatEventDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Ce soir · ${time}`;
  if (isTomorrow) return `Demain · ${time}`;
  const date = d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${date} · ${time}`;
}

export default function EventFlyInCard({
  event,
  anchor,
  onClose,
  onRsvp,
}: EventFlyInCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const pointerFine = usePointerFine();
  const isMobile = useIsMobile();

  // 3D tilt — desktop pointer-fine only.
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateXRaw = useTransform(mouseY, [0, 1], [6, -6]);
  const rotateYRaw = useTransform(mouseX, [0, 1], [-6, 6]);
  const rotateX = useSpring(rotateXRaw, { stiffness: 220, damping: 22 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 220, damping: 22 });

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !pointerFine) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [reducedMotion, pointerFine, mouseX, mouseY],
  );

  // Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Click outside closes (but not on other event/profile pins — those swap
  // selection via parent state).
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const node = ref.current;
      if (!node) return;
      if (node.contains(e.target as Node)) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest(".cesoir-evt-root") || target?.closest(".cesoir-pin-root")) return;
      onClose();
    };
    const t = window.setTimeout(() => {
      window.addEventListener("pointerdown", onDown);
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [onClose]);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const floatingStyle = (() => {
    if (isMobile || !anchor) return null;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 720;
    const CARD_W = 320;
    const CARD_H = 300;
    const MARGIN = 16;
    let left = anchor.x - CARD_W / 2;
    let top = anchor.y - CARD_H - 24;
    left = Math.max(MARGIN, Math.min(left, vw - CARD_W - MARGIN));
    top = Math.max(MARGIN, Math.min(top, vh - CARD_H - MARGIN));
    return { left, top, width: CARD_W };
  })();

  const cardMotion = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: ready ? 1 : 0 },
        exit: { opacity: 0 },
        transition: { duration: 0.18 },
      }
    : {
        initial: { opacity: 0, scale: 0.2, y: floatingStyle ? 12 : 40 },
        animate: { opacity: ready ? 1 : 0, scale: ready ? 1 : 0.2, y: 0 },
        exit: { opacity: 0, scale: 0.2, y: floatingStyle ? 12 : 40 },
        transition: {
          duration: 0.44,
          ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
        },
      };

  const whenLabel = formatEventDateFr(event.startAt);
  const isGoing = event.myRsvp === "going";

  const handleQuickRsvp = useCallback(() => {
    const next: RsvpStatus | null = isGoing ? null : "going";
    onRsvp?.(event, next);
  }, [event, isGoing, onRsvp]);

  return (
    <m.div
      ref={ref}
      onMouseMove={handleMouseMove}
      role="dialog"
      aria-modal="true"
      aria-label={`Soirée: ${event.title}`}
      className={
        floatingStyle
          ? "absolute z-[870] rounded-2xl"
          : "absolute bottom-24 left-3 right-3 z-[870] rounded-2xl"
      }
      style={
        floatingStyle
          ? {
              left: floatingStyle.left,
              top: floatingStyle.top,
              width: floatingStyle.width,
              rotateX: pointerFine && !reducedMotion ? rotateX : 0,
              rotateY: pointerFine && !reducedMotion ? rotateY : 0,
              transformPerspective: 1000,
              transformStyle: "preserve-3d",
            }
          : {
              rotateX: pointerFine && !reducedMotion ? rotateX : 0,
              rotateY: pointerFine && !reducedMotion ? rotateY : 0,
              transformPerspective: 1000,
              transformStyle: "preserve-3d",
            }
      }
      {...cardMotion}
    >
      <div
        className="relative bg-bg/92 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
          boxShadow:
            "0 20px 40px -12px color-mix(in srgb, var(--color-accent) 35%, transparent), 0 0 0 1px color-mix(in srgb, var(--color-accent) 10%, transparent) inset",
        }}
      >
        {/* Flyer header — dark atmospheric backdrop for event-themed feel. */}
        <div
          className="relative w-full aspect-[16/9] overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--color-bg-dark), color-mix(in srgb, var(--color-bg-dark) 80%, var(--color-accent)))",
          }}
        >
          {event.flyerUrl ? (
            <Image
              src={event.flyerUrl}
              alt={`Flyer ${event.title}`}
              fill
              sizes="320px"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Zap
                size={48}
                strokeWidth={1.5}
                className="text-warn"
                aria-hidden="true"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Close button */}
          <m.button
            onClick={onClose}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-xs text-white tap-target"
            aria-label="Fermer"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            transition={springs.micro}
          >
            ✕
          </m.button>

          {/* "Ce soir" overlay badge */}
          <div className="absolute bottom-2 left-2 bg-black/55 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5 border border-white/10">
            <Calendar size={11} strokeWidth={2} className="text-white" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-white">{whenLabel}</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-[15px] font-bold text-text mb-1.5 line-clamp-1">
            {event.title}
          </h3>

          <div className="flex items-center gap-2 text-[11px] text-text-muted mb-2">
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} strokeWidth={2} aria-hidden="true" />
              <span className="truncate max-w-[160px]">
                {event.venue.name}
                {event.venue.neighborhood ? ` · ${event.venue.neighborhood}` : ""}
              </span>
            </span>
            {(event.counts.going > 0 || event.counts.maybe > 0) && (
              <span className="inline-flex items-center gap-1">
                <Users size={11} strokeWidth={2} aria-hidden="true" />
                <span>{event.counts.going} going</span>
              </span>
            )}
          </div>

          {event.categories.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mb-3">
              {event.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide text-accent"
                  style={{
                    background: "color-mix(in srgb, var(--color-accent) 14%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                  }}
                >
                  {EVENT_CATEGORY_LABELS[cat] ?? cat}
                </span>
              ))}
              {event.priceLabel && (
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide border border-border text-text-muted"
                >
                  {event.priceLabel}
                </span>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Link
              href={`/events/${event.id}`}
              className="flex-1 text-center gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold tap-target shadow-glow"
            >
              Voir details
            </Link>
            {onRsvp && (
              <m.button
                onClick={handleQuickRsvp}
                className={`px-4 py-2.5 rounded-full text-[12px] font-semibold tap-target border transition-colors ${
                  isGoing
                    ? "bg-accent-2 border-accent-2 text-white"
                    : "bg-bg-card border-border text-text"
                }`}
                whileTap={micro.tapScale}
                whileHover={pointerFine ? { y: -1 } : undefined}
                aria-pressed={isGoing}
              >
                {isGoing ? "Going" : "RSVP"}
              </m.button>
            )}
          </div>
        </div>
      </div>
    </m.div>
  );
}
