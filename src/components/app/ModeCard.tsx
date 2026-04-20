"use client";

import {
  m,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import type { ModeDefinition } from "@/lib/modes";
import type { Profile } from "@/lib/mock-profiles";
import { springs } from "@/lib/motion-design";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IconProps {
  size?: number;
  className?: string;
}

interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface ModeCardProps {
  mode: ModeDefinition;
  count: number;
  Icon?: ComponentType<IconProps>;
  isHovered: boolean;
  isAnyHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  topUsers: Profile[];
  children?: ReactNode;
}

// ---------------------------------------------------------------------------
// Hook — detect cursor (pointer: fine) vs touch device
// ---------------------------------------------------------------------------

function usePointerFine(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return fine;
}

// ---------------------------------------------------------------------------
// Avatar stack — shown on hover
// ---------------------------------------------------------------------------

function AvatarStack({ users, max = 3 }: { users: Profile[]; max?: number }) {
  const visible = users.slice(0, max);
  if (visible.length === 0) return null;
  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((u, i) => (
        <div
          key={u.id}
          className="relative w-5 h-5 rounded-full overflow-hidden border border-bg-card"
          style={{ zIndex: visible.length - i }}
        >
          <Image
            src={u.photo}
            alt=""
            fill
            sizes="20px"
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModeCard({
  mode,
  count,
  Icon,
  isHovered,
  isAnyHovered,
  onHoverStart,
  onHoverEnd,
  topUsers,
}: ModeCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const pointerFine = usePointerFine();

  // 3D tilt values — only active on pointer-fine devices
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateXRaw = useTransform(mouseY, [0, 1], [8, -8]);
  const rotateYRaw = useTransform(mouseX, [0, 1], [-8, 8]);
  const rotateX = useSpring(rotateXRaw, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 200, damping: 20 });

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

  // Focus state management (keyboard a11y)
  const [isFocused, setIsFocused] = useState(false);
  const active = isHovered || isFocused;

  // Scale / opacity / blur based on hover focus pattern
  // Only apply shrink-others on pointer-fine; on touch, just keep defaults.
  const applyFocusEffect = pointerFine && !reducedMotion;
  const scale = applyFocusEffect
    ? active
      ? 1.05
      : isAnyHovered
        ? 0.97
        : 1
    : 1;
  const opacity = applyFocusEffect && isAnyHovered && !active ? 0.55 : 1;
  const filter =
    applyFocusEffect && isAnyHovered && !active ? "blur(1px)" : "blur(0px)";

  // Ripple on click
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const handleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.2;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y, size }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 700);
  }, []);

  return (
    <m.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onClick={handleClick}
      onFocus={() => {
        setIsFocused(true);
        onHoverStart();
      }}
      onBlur={() => {
        setIsFocused(false);
        onHoverEnd();
      }}
      style={{
        rotateX: applyFocusEffect && active ? rotateX : 0,
        rotateY: applyFocusEffect && active ? rotateY : 0,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }}
      animate={
        reducedMotion
          ? undefined
          : {
              scale,
              opacity,
              filter,
            }
      }
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      whileTap={!pointerFine ? { scale: 0.96, transition: springs.micro } : undefined}
      className="relative block rounded-2xl will-change-transform"
    >
      {/* Glow behind card on hover */}
      {active && applyFocusEffect && (
        <m.div
          aria-hidden
          className="absolute -inset-3 rounded-3xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${mode.color}55, transparent 70%)`,
            filter: "blur(22px)",
            zIndex: -1,
          }}
        />
      )}

      {/* Card content */}
      <Link
        href={`/modes/${mode.key}`}
        tabIndex={0}
        className={`relative block overflow-hidden bg-bg-card border rounded-2xl p-4 transition-colors ${
          active ? "border-accent/50" : "border-border hover:border-accent/30"
        } ${isFocused ? "ring-2 ring-accent/60 outline-none" : ""}`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <m.div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${mode.color}15` }}
              animate={
                reducedMotion
                  ? undefined
                  : active
                    ? { scale: 1.1, rotate: [0, -6, 6, 0] }
                    : { scale: [1, 1.03, 1] }
              }
              transition={
                active
                  ? { duration: 0.5, ease: "easeInOut" }
                  : { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }
            >
              {Icon && <Icon size={20} className="text-accent" />}
            </m.div>
            <div>
              <h2 className="text-[15px] font-bold text-text">{mode.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-safe"
                  aria-hidden="true"
                />
                <span className="text-[10px] text-text-muted">
                  {count * 12 + ((mode.key.length * 7) % 30)} actifs
                </span>
              </div>
            </div>
          </div>
          {mode.badge && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-accent/20 bg-accent/10 text-accent">
              {mode.badge}
            </span>
          )}
        </div>
        <p className="text-[12px] text-text-muted leading-relaxed mb-3">
          {mode.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {mode.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[9px] bg-bg border border-border px-2 py-0.5 rounded text-text-muted"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Stats reveal — avatars + active count */}
        {active && applyFocusEffect && topUsers.length > 0 && (
          <m.div
            key="stats-reveal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-bg/80 backdrop-blur-sm px-2 py-1 rounded-full border border-border"
          >
            <AvatarStack users={topUsers} max={3} />
            <span className="text-[10px] font-medium text-text-muted">
              +{count} actifs
            </span>
          </m.div>
        )}

        {/* Click ripple — violet → green gradient */}
        {ripples.map((r) => (
          <span
            key={r.id}
            aria-hidden
            className="pointer-events-none absolute rounded-full animate-[ripple_700ms_ease-out_forwards]"
            style={{
              left: r.x - r.size / 2,
              top: r.y - r.size / 2,
              width: r.size,
              height: r.size,
              background: `radial-gradient(circle, ${mode.color}40 0%, #00FF8830 50%, transparent 70%)`,
              transform: "scale(0)",
            }}
          />
        ))}
      </Link>
    </m.div>
  );
}

export default ModeCard;
