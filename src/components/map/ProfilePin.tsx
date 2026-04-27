"use client";

/**
 * ProfilePin — Imperative helper that builds a DOM element for use inside
 * a MapLibre GL `Marker` ({ element }). We can't use React inside the
 * MapLibre marker root (MapLibre owns the lifecycle + positioning), so
 * this is a plain-DOM factory that returns an `HTMLElement` plus an
 * `update()` method for state-driven style mutations.
 *
 * Design goals:
 * - Premium "Apple Maps × Strava × Find My" feel.
 * - Gradient ring (violet → green) around a circular avatar.
 * - Live pulse ring for online profiles (gated on reduced-motion).
 * - Event pins use a lightning / emoji variant with a stronger pulse.
 * - Pool-friendly — callers can reuse pins by calling `update()` instead
 *   of destroying the node.
 *
 * Usage:
 *   const pin = createProfilePin({ photo, color, online, reduced, onClick });
 *   const marker = new maplibregl.Marker({ element: pin.element }).setLngLat(...).addTo(map);
 *   // later:
 *   pin.update({ focused: true });
 */

export type ProfilePinVariant = "profile" | "event";

export interface ProfilePinOptions {
  photo?: string;
  color: string; // mode-specific hex or CSS var
  online?: boolean;
  /**
   * 2026-04-27 (mig 030): the user has tapped "Je suis dispo ce soir"
   * and the broadcast is still live. Adds a thick green pulse ring on
   * top of the regular online ring so they pop out on the map.
   */
  broadcastActive?: boolean;
  reduced: boolean;
  pointerFine: boolean;
  variant?: ProfilePinVariant;
  emoji?: string; // used when variant="event"
  onClick?: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
  animationDelay?: number; // seconds, for radial-burst cascade
  /**
   * a11y round 2 (2026-04-27): used as the pin's `aria-label`. Keyboard
   * users tab through pins, hear this label, and activate via Enter / Space.
   * If omitted, falls back to "Profil sur la carte".
   */
  ariaLabel?: string;
}

export interface ProfilePinState {
  focused?: boolean; // this pin is the selected one
  dimmed?: boolean; // another pin is selected, dim this one
  hovered?: boolean; // cursor over this pin
}

export interface ProfilePinHandle {
  element: HTMLDivElement;
  update: (state: ProfilePinState) => void;
  setVariant: (variant: ProfilePinVariant) => void;
  destroy: () => void;
}

/**
 * Injects the shared keyframes + reduced-motion guards into the document
 * once per session. Idempotent.
 */
export function ensurePinStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("cesoir-map-pin-styles")) return;
  const style = document.createElement("style");
  style.id = "cesoir-map-pin-styles";
  style.textContent = `
    @keyframes cesoir-pin-burst {
      0%   { transform: scale(0) rotate(-8deg); opacity: 0; }
      60%  { transform: scale(1.12) rotate(2deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes cesoir-pin-online {
      0%   { transform: scale(1);   opacity: 0.85; }
      70%  { transform: scale(1.9); opacity: 0;    }
      100% { transform: scale(1.9); opacity: 0;    }
    }
    @keyframes cesoir-pin-event {
      0%   { transform: scale(1);   opacity: 0.6; }
      70%  { transform: scale(2.3); opacity: 0;   }
      100% { transform: scale(2.3); opacity: 0;   }
    }
    @keyframes cesoir-cluster-burst {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.18); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    .cesoir-pin-root {
      position: relative;
      width: 48px; height: 48px;
      cursor: pointer;
      will-change: transform, opacity, filter;
      /* 2026-04-26 fix: start invisible. Without this, the pin paints once
         at its initial DOM position (top-left of the map container) BEFORE
         MapLibre applies the transform that moves it to the real lng/lat —
         that's the "moon-shaped incrustation" QA caught at the search bar's
         left edge on /map. The cesoir-pin-burst animation re-fades opacity
         to 1 within 420ms; reduced-motion gets a hard opacity:1 below. */
      opacity: 0;
      transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
                  opacity 200ms ease-out,
                  filter 200ms ease-out,
                  box-shadow 200ms ease-out;
    }
    .cesoir-pin-gradient {
      position: absolute; inset: 0;
      border-radius: 50%;
      padding: 2px;
      box-sizing: border-box;
      background: linear-gradient(135deg, var(--pin-color, var(--color-accent)), var(--color-accent-2, var(--color-accent)));
      box-shadow: 0 2px 10px rgba(0,0,0,0.25);
    }
    .cesoir-pin-inner {
      position: absolute; inset: 2px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      background-color: var(--color-bg-dark, var(--color-text, currentColor));
      border: 2px solid white;
      overflow: hidden;
    }
    .cesoir-pin-emoji {
      position: absolute; inset: 2px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--pin-color), var(--pin-color));
      color: white; font-size: 20px; font-weight: 700;
      border: 2px solid white;
    }
    .cesoir-pin-ring {
      position: absolute; inset: -6px;
      border-radius: 50%;
      border: 2px solid var(--pin-color, var(--color-accent-2));
      pointer-events: none;
      opacity: 0;
    }
    .cesoir-pin-ring.online { animation: cesoir-pin-online 2s ease-out infinite; }
    .cesoir-pin-ring.event  { animation: cesoir-pin-event 3s ease-out infinite; }
    /* "Je suis dispo ce soir" — thicker green ring, faster pulse so it
       reads as a stronger live signal than the regular online ring. */
    .cesoir-pin-ring.broadcast {
      inset: -8px;
      border-width: 3px;
      border-color: var(--color-accent-2, #00FF88);
      animation: cesoir-pin-online 1.5s ease-out infinite;
    }
    /* Broadcast badge pip (small green dot anchored bottom-right) — works
       even when the pulse ring is suppressed by reduced motion. */
    .cesoir-pin-broadcast-pip {
      position: absolute;
      right: -2px; bottom: -2px;
      width: 12px; height: 12px;
      border-radius: 50%;
      background: var(--color-accent-2, #00FF88);
      border: 2px solid white;
      box-shadow: 0 0 8px rgba(0,255,136,0.6);
      pointer-events: none;
    }
    .cesoir-pin-root.focused {
      transform: scale(1.18);
      z-index: 10;
      filter: drop-shadow(0 8px 24px rgba(139,92,246,0.55));
    }
    .cesoir-pin-root.hovered {
      transform: scale(1.12);
      filter: drop-shadow(0 6px 18px rgba(139,92,246,0.4));
    }
    .cesoir-pin-root.dimmed { opacity: 0.3; filter: grayscale(0.2); }
    /* a11y round 2 (2026-04-27): visible focus ring for keyboard pin nav.
       Uses :focus-visible so mouse clicks don't show the ring. */
    .cesoir-pin-root:focus { outline: none; }
    .cesoir-pin-root:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 70%, transparent);
      border-radius: 50%;
      z-index: 11;
    }
    @media (prefers-reduced-motion: reduce) {
      .cesoir-pin-root,
      .cesoir-pin-gradient,
      .cesoir-pin-inner,
      .cesoir-pin-emoji,
      .cesoir-pin-ring {
        animation: none !important;
        transition-duration: 0ms !important;
      }
      /* Without the burst animation, restore opacity so the pin is visible.
         Pair with the opacity:0 default added above. */
      .cesoir-pin-root { opacity: 1; }
      .cesoir-pin-ring.online,
      .cesoir-pin-ring.event { display: none; }
    }
  `;
  document.head.appendChild(style);
}

export function createProfilePin(opts: ProfilePinOptions): ProfilePinHandle {
  ensurePinStyles();

  const root = document.createElement("div");
  root.className = "cesoir-pin-root";
  root.style.setProperty("--pin-color", opts.color);

  // a11y round 2 (2026-04-27): make pin focusable + reachable via Tab and
  // activatable via Enter / Space. Without this, MapLibre markers were
  // mouse-only and keyboard / SR users couldn't interact with the map.
  root.setAttribute("role", "button");
  root.setAttribute("tabindex", "0");
  root.setAttribute(
    "aria-label",
    opts.ariaLabel ?? (opts.variant === "event" ? "Soirée sur la carte" : "Profil sur la carte"),
  );

  if (!opts.reduced) {
    const delay = opts.animationDelay ?? 0;
    root.style.animation = `cesoir-pin-burst 420ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both`;
  }

  const gradient = document.createElement("div");
  gradient.className = "cesoir-pin-gradient";
  root.appendChild(gradient);

  let inner: HTMLDivElement;
  if (opts.variant === "event") {
    inner = document.createElement("div");
    inner.className = "cesoir-pin-emoji";
    inner.textContent = opts.emoji ?? "⚡";
    gradient.appendChild(inner);
  } else {
    inner = document.createElement("div");
    inner.className = "cesoir-pin-inner";
    if (opts.photo) {
      inner.style.backgroundImage = `url("${opts.photo}")`;
    }
    gradient.appendChild(inner);
  }

  // Pulse ring — online-only for profiles, always-on for events.
  const ring = document.createElement("div");
  if (opts.variant === "event") {
    ring.className = "cesoir-pin-ring event";
    ring.style.borderColor = opts.color;
    root.appendChild(ring);
  } else if (opts.online) {
    ring.className = "cesoir-pin-ring online";
    ring.style.borderColor = opts.color;
    root.appendChild(ring);
  }

  // 2026-04-27 (mig 030): when the user is broadcasting "dispo ce soir",
  // overlay an extra green ring + a small pip. The pip is always rendered
  // (even with reduced motion) so the signal is never lost.
  if (opts.variant === "profile" && opts.broadcastActive) {
    const broadcastRing = document.createElement("div");
    broadcastRing.className = "cesoir-pin-ring broadcast";
    root.appendChild(broadcastRing);

    const pip = document.createElement("div");
    pip.className = "cesoir-pin-broadcast-pip";
    pip.setAttribute("aria-hidden", "true");
    root.appendChild(pip);
  }

  // Event wiring — only bind hover on pointer-fine devices.
  if (opts.onClick) {
    root.addEventListener("click", (e) => {
      e.stopPropagation();
      opts.onClick!();
    });
    // a11y round 2: keyboard activation. Enter/Space match button semantics.
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

  const handle: ProfilePinHandle = {
    element: root,
    update(state) {
      root.classList.toggle("focused", Boolean(state.focused));
      root.classList.toggle("hovered", Boolean(state.hovered) && !state.focused);
      root.classList.toggle("dimmed", Boolean(state.dimmed));
    },
    setVariant(variant) {
      if (variant === "event" && !inner.classList.contains("cesoir-pin-emoji")) {
        inner.className = "cesoir-pin-emoji";
        inner.textContent = opts.emoji ?? "⚡";
        inner.style.backgroundImage = "";
      } else if (variant === "profile" && !inner.classList.contains("cesoir-pin-inner")) {
        inner.className = "cesoir-pin-inner";
        inner.textContent = "";
        if (opts.photo) inner.style.backgroundImage = `url("${opts.photo}")`;
      }
    },
    destroy() {
      root.replaceChildren();
      root.remove();
    },
  };

  return handle;
}
