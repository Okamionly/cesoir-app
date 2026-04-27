"use client";

/**
 * ActivityFeed — sliding live-signal widget at the top of /feed.
 *
 * Visual: glass-card row, ~80px tall, single visible event, slides up every
 * 5 s. Tap routes to the most relevant page given the event kind:
 *   - join  → /browse  (go say hi)
 *   - mode  → /modes   (browse the mode that just got fresh activations)
 *   - match → /chat    (someone matched, see your inbox)
 *   - area  → /map     (see who's around)
 *
 * Data: `useActivityFeed` aggregates the last 10 events (≤1 h) from
 * `profiles` + `mode_activations` + `conversations`. PII-safe (first name +
 * age only).
 *
 * A11y:
 *   - `aria-live="polite"` on the marquee region so each new item is
 *     announced by screen readers.
 *   - `prefers-reduced-motion`: collapses to a static "Activité récente : N
 *     événements" pill — no rotating, no slide.
 *
 * Performance: at most 10 items in memory; realtime updates are debounced in
 * the hook.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { m, AnimatePresence } from "motion/react";
import { useActivityFeed, type ActivityItem } from "@/lib/useActivityFeed";
import { MODES, type ModeKey } from "@/lib/modes";
import { useAccessibility } from "@/components/ui/ReducedMotion";
import { Heart, MapPin, Sparkles, UserPlus } from "@/components/ui/lucide";
import { springs } from "@/lib/motion-design";

// ---------- Constants ----------

const SLIDE_INTERVAL_MS = 5_000;

// ---------- Helpers ----------

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `${diffH} h`;
}

function modeLabel(modeKey: string | null): string | null {
  if (!modeKey) return null;
  const def = MODES[modeKey as ModeKey];
  return def?.name ?? null;
}

function destinationFor(item: ActivityItem): string {
  switch (item.kind) {
    case "join":
      return "/browse";
    case "mode":
      return item.mode ? `/modes?active=${encodeURIComponent(item.mode)}` : "/modes";
    case "match":
      return "/chat";
    case "area":
      return "/map";
  }
}

function copyFor(item: ActivityItem): { text: string; emphasis: string } {
  const ageBit = item.age ? `, ${item.age}` : "";
  switch (item.kind) {
    case "join": {
      const where = item.city ? ` près de toi à ${item.city}` : " près de toi";
      return {
        emphasis: `${item.firstName}${ageBit}`,
        text: ` vient de rejoindre CeSoir${where}`,
      };
    }
    case "mode": {
      const mode = modeLabel(item.mode);
      const tail = mode ? ` est en ${mode}` : " active un mode";
      return {
        emphasis: `${item.firstName}${ageBit}`,
        text: `${tail} ce soir`,
      };
    }
    case "match": {
      const mode = modeLabel(item.mode);
      const tail = mode ? ` (${mode})` : "";
      return {
        emphasis: `${item.firstName}${ageBit}`,
        text: ` vient de matcher avec quelqu'un${tail}`,
      };
    }
    case "area": {
      const where = item.city ?? "ta zone";
      return {
        emphasis: `${item.count ?? 0}`,
        text: ` personnes actives à ${where}`,
      };
    }
  }
}

function iconFor(kind: ActivityItem["kind"]) {
  switch (kind) {
    case "join":
      return UserPlus;
    case "mode":
      return Sparkles;
    case "match":
      return Heart;
    case "area":
      return MapPin;
  }
}

// ---------- Component ----------

interface ActivityRowProps {
  item: ActivityItem;
  onClick: () => void;
}

function ActivityRow({ item, onClick }: ActivityRowProps) {
  const Icon = iconFor(item.kind);
  const { emphasis, text } = copyFor(item);
  const ago = timeAgo(item.createdAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-full flex items-center gap-3 px-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
      aria-label={`${emphasis}${text} — il y a ${ago}`}
    >
      {/* Avatar / icon */}
      {item.avatarUrl ? (
        <div className="relative flex-shrink-0">
          <Image
            src={item.avatarUrl}
            alt=""
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover"
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center text-accent"
            aria-hidden="true"
          >
            <Icon size={9} strokeWidth={2.5} />
          </span>
        </div>
      ) : (
        <div
          className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-accent flex-shrink-0"
          aria-hidden="true"
        >
          <Icon size={14} strokeWidth={2} />
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug truncate">
          <span className="font-semibold text-text">{emphasis}</span>
          <span className="text-text-muted">{text}</span>
        </p>
        <p className="text-[11px] text-text-muted mt-0.5">il y a {ago}</p>
      </div>

      {/* Chevron-ish accent */}
      <span
        className="text-text-muted text-xs flex-shrink-0"
        aria-hidden="true"
      >
        ›
      </span>
    </button>
  );
}

export default function ActivityFeed() {
  const router = useRouter();
  const { reducedMotion } = useAccessibility();
  const { items, loading, error } = useActivityFeed();

  const [index, setIndex] = useState(0);

  // Reset / clamp the cursor whenever the items array shrinks or grows.
  useEffect(() => {
    if (items.length === 0) {
      if (index !== 0) setIndex(0);
      return;
    }
    if (index >= items.length) setIndex(0);
  }, [items.length, index]);

  // Auto-rotate every SLIDE_INTERVAL_MS — paused when reduced-motion is on.
  useEffect(() => {
    if (reducedMotion || items.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [items.length, reducedMotion]);

  const current = useMemo<ActivityItem | null>(() => {
    if (items.length === 0) return null;
    return items[index] ?? items[0];
  }, [items, index]);

  // Hide entirely if no recent activity OR a hard error (the page already
  // shows skeletons / error states for the main feed; this widget should
  // never become a noisy second error surface).
  if (loading || error || items.length === 0 || !current) {
    return null;
  }

  // Reduced-motion fallback — static pill, no rotation.
  if (reducedMotion) {
    return (
      <section
        aria-label="Activité récente"
        className="mx-4 mt-3 rounded-2xl border border-border bg-bg/80 backdrop-blur px-4 py-3 text-sm text-text-muted"
      >
        Activité récente : {items.length} événement{items.length > 1 ? "s" : ""}
      </section>
    );
  }

  return (
    <section
      aria-label="Activité en direct"
      aria-live="polite"
      aria-atomic="true"
      className="mx-4 mt-3 h-[80px] rounded-2xl border border-border bg-bg/80 backdrop-blur overflow-hidden relative"
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={current.id}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={springs.gentle}
          className="absolute inset-0"
        >
          <ActivityRow
            item={current}
            onClick={() => router.push(destinationFor(current))}
          />
        </m.div>
      </AnimatePresence>

      {/* Tiny progress indicator (which slot we're on). */}
      {items.length > 1 && (
        <div
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1"
          aria-hidden="true"
        >
          {items.slice(0, Math.min(items.length, 5)).map((_, i) => (
            <span
              key={i}
              className={[
                "h-1 rounded-full transition-all duration-300",
                i === index % Math.min(items.length, 5)
                  ? "w-3 bg-accent"
                  : "w-1 bg-border",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
