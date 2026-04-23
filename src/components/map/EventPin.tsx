"use client";

/**
 * EventPin — Imperative factory for MapLibre GL event markers, distinct
 * from `ProfilePin` so events feel unmistakably different on the map.
 *
 * Design goals (U4, Wave 14):
 * - Round pin with violet→vert gradient border matching CeSoir mode palette.
 * - Lightning bolt centerpiece (⚡) — instantly readable as "event".
 * - Pulse ring when `startsInHours < 3` — visually surfaces "happening now".
 * - Featured events get an "FEATURED" orange badge tethered to the pin.
 * - Reduced-motion safe — no animations when `reduced=true`.
 * - Pool-friendly — callers can reuse pins via `update()` without rebuilding.
 *
 * Usage:
 *   const pin = createEventPin({ startsAt, featured, ... });
 *   const marker = new maplibregl.Marker({ element: pin.element })
 *     .setLngLat([lng, lat]).addTo(map);
 *
 * Keyboard accessibility:
 * - Pin root is focusable (tabIndex=0) with ARIA label so keyboard users can
 *   activate it via Enter/Space. This matches the ProfilePin affordances.
 */

export interface EventPinOptions {
  /** Event title — used for ARIA label. */
  title: string;
  /** ISO date — computes whether to show the "imminent" pulse ring. */
  startsAt: string;
  /** Top-level featured events get an orange accent badge. */
  featured?: boolean;
  /** Whether OS prefers-reduced-motion is active. */
  reduced: boolean;
  /** Whether cursor is a fine pointer (desktop). Hover gated on this. */
  pointerFine: boolean;
  onClick?: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
  /** Seconds — radial-burst cascade delay. */
  animationDelay?: number;
}

export interface EventPinState {
  focused?: boolean;
  dimmed?: boolean;
  hovered?: boolean;
}

export interface EventPinHandle {
  element: HTMLDivElement;
  update: (state: EventPinState) => void;
  destroy: () => void;
}

/** Injects EventPin-specific keyframes + base styles once per document. */
function ensureEventPinStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("cesoir-event-pin-styles")) return;
  const style = document.createElement("style");
  style.id = "cesoir-event-pin-styles";
  style.textContent = `
    @keyframes cesoir-evt-burst {
      0%   { transform: scale(0) rotate(-12deg); opacity: 0; }
      60%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes cesoir-evt-pulse {
      0%   { transform: scale(1);   opacity: 0.7; }
      70%  { transform: scale(2.2); opacity: 0;   }
      100% { transform: scale(2.2); opacity: 0;   }
    }
    @keyframes cesoir-evt-bolt {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.12); }
    }
    .cesoir-evt-root {
      position: relative;
      width: 46px; height: 46px;
      cursor: pointer;
      will-change: transform, opacity, filter;
      transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
                  opacity 200ms ease-out,
                  filter 200ms ease-out;
    }
    .cesoir-evt-root:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 60%, transparent);
      border-radius: 50%;
    }
    .cesoir-evt-gradient {
      position: absolute; inset: 0;
      border-radius: 50%;
      padding: 2px;
      box-sizing: border-box;
      background: linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 50%, var(--color-accent-2)), var(--color-accent-2));
      box-shadow: 0 2px 12px color-mix(in srgb, var(--color-accent) 35%, transparent);
    }
    .cesoir-evt-inner {
      position: absolute; inset: 2px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--color-bg-dark), color-mix(in srgb, var(--color-bg-dark) 85%, var(--color-accent)));
      color: var(--color-warn);
      font-size: 22px; font-weight: 700;
      border: 2px solid white;
    }
    .cesoir-evt-bolt {
      display: inline-flex;
      filter: drop-shadow(0 0 4px color-mix(in srgb, var(--color-warn) 65%, transparent));
    }
    .cesoir-evt-root .cesoir-evt-bolt.animated {
      animation: cesoir-evt-bolt 1.6s ease-in-out infinite;
    }
    .cesoir-evt-ring {
      position: absolute; inset: -6px;
      border-radius: 50%;
      border: 2px solid var(--color-warn);
      pointer-events: none;
      opacity: 0;
    }
    .cesoir-evt-ring.active {
      animation: cesoir-evt-pulse 2.2s ease-out infinite;
    }
    .cesoir-evt-badge {
      position: absolute;
      top: -8px; right: -8px;
      background: var(--color-warn);
      color: white;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.4px;
      padding: 2px 6px;
      border-radius: 9999px;
      text-transform: uppercase;
      border: 1.5px solid white;
      box-shadow: 0 2px 6px color-mix(in srgb, var(--color-warn) 45%, transparent);
      pointer-events: none;
      z-index: 2;
    }
    .cesoir-evt-root.focused {
      transform: scale(1.2);
      z-index: 10;
      filter: drop-shadow(0 8px 24px color-mix(in srgb, var(--color-warn) 60%, transparent));
    }
    .cesoir-evt-root.hovered {
      transform: scale(1.12);
      filter: drop-shadow(0 6px 18px color-mix(in srgb, var(--color-warn) 45%, transparent));
    }
    .cesoir-evt-root.dimmed { opacity: 0.28; filter: grayscale(0.35); }
    @media (prefers-reduced-motion: reduce) {
      .cesoir-evt-root,
      .cesoir-evt-gradient,
      .cesoir-evt-inner,
      .cesoir-evt-bolt,
      .cesoir-evt-ring {
        animation: none !important;
        transition-duration: 0ms !important;
      }
      .cesoir-evt-ring.active { display: none; }
    }
  `;
  document.head.appendChild(style);
}

/** Returns true when startsAt is less than 3 hours away in the future. */
function isImminent(startsAtIso: string): boolean {
  const startMs = new Date(startsAtIso).getTime();
  if (Number.isNaN(startMs)) return false;
  const diffMs = startMs - Date.now();
  // Imminent window: event hasn't started yet OR started <30min ago, and <3h away.
  return diffMs > -30 * 60_000 && diffMs < 3 * 60 * 60_000;
}

export function createEventPin(opts: EventPinOptions): EventPinHandle {
  ensureEventPinStyles();

  const root = document.createElement("div");
  root.className = "cesoir-evt-root";
  root.setAttribute("role", "button");
  root.setAttribute("tabindex", "0");
  root.setAttribute("aria-label", `Soiree: ${opts.title}`);

  if (!opts.reduced) {
    const delay = opts.animationDelay ?? 0;
    root.style.animation = `cesoir-evt-burst 440ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both`;
  }

  // Gradient ring
  const gradient = document.createElement("div");
  gradient.className = "cesoir-evt-gradient";
  root.appendChild(gradient);

  // Inner dark disc with lightning bolt
  const inner = document.createElement("div");
  inner.className = "cesoir-evt-inner";
  const bolt = document.createElement("span");
  bolt.className = opts.reduced ? "cesoir-evt-bolt" : "cesoir-evt-bolt animated";
  bolt.textContent = "\u26A1"; // ⚡
  inner.appendChild(bolt);
  gradient.appendChild(inner);

  // Imminent pulse ring
  if (isImminent(opts.startsAt) && !opts.reduced) {
    const ring = document.createElement("div");
    ring.className = "cesoir-evt-ring active";
    root.appendChild(ring);
  }

  // Featured badge
  if (opts.featured) {
    const badge = document.createElement("span");
    badge.className = "cesoir-evt-badge";
    badge.textContent = "FEATURED";
    root.appendChild(badge);
  }

  // Event wiring
  if (opts.onClick) {
    root.addEventListener("click", (e) => {
      e.stopPropagation();
      opts.onClick!();
    });
    root.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        opts.onClick!();
      }
    });
  }
  if (opts.pointerFine) {
    if (opts.onEnter) root.addEventListener("pointerenter", opts.onEnter);
    if (opts.onLeave) root.addEventListener("pointerleave", opts.onLeave);
  }

  return {
    element: root,
    update(state) {
      root.classList.toggle("focused", Boolean(state.focused));
      root.classList.toggle("hovered", Boolean(state.hovered) && !state.focused);
      root.classList.toggle("dimmed", Boolean(state.dimmed));
    },
    destroy() {
      root.replaceChildren();
      root.remove();
    },
  };
}
