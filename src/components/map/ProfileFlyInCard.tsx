"use client";

/**
 * ProfileFlyInCard — The glassmorphic card that springs in from a pin's
 * coordinates when a user clicks it on the /map. This is the "Apple Maps
 * × Find My" moment — a premium reveal that feels alive.
 *
 * Features:
 * - Spring-in from the pin's screen position (scale 0 → 1, opacity 0 → 1)
 *   using a cinematic cubic-bezier(0.34, 1.56, 0.64, 1) overshoot.
 * - Subtle mouse-follow 3D tilt on pointer-fine devices (no tilt on touch).
 * - Click-outside or close button triggers a spring-out reverse.
 * - Gated by `useReducedMotion()` — reduced-motion users get a fade only.
 * - On mobile, the card docks to the bottom center; on desktop, it floats
 *   anchored near the pin.
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
import { springs, micro } from "@/lib/motion-design";
import { MODES } from "@/lib/modes";
import { MODE_COLORS } from "@/lib/mode-colors";
import { usePointerFine } from "@/lib/hooks/usePointerFine";
import useIsMobile from "@/lib/hooks/useIsMobile";
import type { Profile } from "@/lib/mock-profiles";

interface ProfileFlyInCardProps {
  profile: Profile & { online?: boolean };
  /** Anchor in screen coordinates (x,y in px relative to viewport). */
  anchor?: { x: number; y: number } | null;
  onClose: () => void;
  onInvite?: (profile: Profile) => void;
  onProfile?: (profile: Profile) => void;
}

export default function ProfileFlyInCard({
  profile,
  anchor,
  onClose,
  onInvite,
  onProfile,
}: ProfileFlyInCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const pointerFine = usePointerFine();
  const isMobile = useIsMobile();

  // 3D tilt values — only on pointer-fine desktop.
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

  // Escape key closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Click-outside support — we attach to document so clicks on the map
  // itself still close the card.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const node = ref.current;
      if (!node) return;
      if (node.contains(e.target as Node)) return;
      // Allow clicks on other pins — those call the parent selector which
      // will swap state. We only close on bare-map clicks, and we trust
      // the parent to swap selected state on pin-click.
      const target = e.target as HTMLElement | null;
      if (target?.closest(".cesoir-pin-root")) return;
      onClose();
    };
    // Use a microtask delay so the opening click doesn't immediately close.
    const t = window.setTimeout(() => {
      window.addEventListener("pointerdown", onDown);
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [onClose]);

  const mode = MODES[profile.mode];
  const color = MODE_COLORS[profile.mode] || "var(--color-accent)";

  // Compute initial origin from anchor (so the scale-in originates from
  // the pin) — desktop floating mode only. On mobile we always dock bottom.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Defer one frame so the initial transform sticks before animating.
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const floatingStyle = (() => {
    if (isMobile || !anchor) return null;
    // Clamp so the card never goes off-screen.
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 720;
    const CARD_W = 320;
    const CARD_H = 220;
    const MARGIN = 16;
    let left = anchor.x - CARD_W / 2;
    let top = anchor.y - CARD_H - 24; // above the pin
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
          duration: 0.42,
          ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
        },
      };

  return (
    <m.div
      ref={ref}
      onMouseMove={handleMouseMove}
      role="dialog"
      aria-modal="true"
      aria-label={`Profil de ${profile.name}`}
      className={
        floatingStyle
          ? "absolute z-[1000] rounded-2xl"
          : "absolute bottom-24 left-3 right-3 z-[1000] rounded-2xl"
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
        className="relative bg-bg/92 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl"
        style={{
          borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
          boxShadow: `0 20px 40px -12px color-mix(in srgb, ${color} 35%, transparent), 0 0 0 1px color-mix(in srgb, ${color} 10%, transparent) inset`,
        }}
      >
        <m.button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-xs text-text-muted tap-target"
          aria-label="Fermer"
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          transition={springs.micro}
        >
          ✕
        </m.button>

        <div className="flex items-center gap-3 mb-3">
          <div
            className="relative w-14 h-14 rounded-full overflow-hidden border-2 shrink-0"
            style={{ borderColor: color }}
          >
            <Image
              src={profile.photo}
              alt={profile.name}
              fill
              sizes="56px"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-text truncate">
              {profile.name}, {profile.age}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-text-muted flex-wrap">
              <span>📍 {profile.distance} km</span>
              <span className="text-accent font-semibold">{profile.time}</span>
              {profile.online && (
                <span className="flex items-center gap-1 text-safe">
                  <span className="w-1.5 h-1.5 rounded-full bg-safe inline-block animate-pulse" />
                  Actif
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {mode && (
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                background: `color-mix(in srgb, ${color} 14%, transparent)`,
                border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
                color,
              }}
            >
              {mode.icon} {mode.name}
            </span>
          )}
          {profile.cuisine && (
            <span className="bg-bg-card border border-border px-2 py-0.5 rounded-full text-[10px] text-text-muted">
              🍽️ {profile.cuisine}
            </span>
          )}
          {profile.dog && (
            <span className="bg-bg-card border border-border px-2 py-0.5 rounded-full text-[10px] text-text-muted">
              🐶 {profile.dog}
            </span>
          )}
        </div>

        <p className="text-[12px] text-text-muted leading-relaxed line-clamp-2 mb-3">
          {profile.bio}
        </p>

        <div className="flex gap-2">
          <m.button
            onClick={() => onInvite?.(profile)}
            className="flex-1 gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold tap-target shadow-glow"
            whileTap={micro.tapScale}
            whileHover={pointerFine ? { y: -1 } : undefined}
          >
            Inviter ce soir
          </m.button>
          <m.button
            onClick={() => onProfile?.(profile)}
            className="px-4 py-2.5 border border-border rounded-full text-[12px] font-medium text-text-muted tap-target"
            whileTap={micro.tapScale}
            whileHover={pointerFine ? { y: -1 } : undefined}
          >
            Profil
          </m.button>
        </div>
      </div>
    </m.div>
  );
}
