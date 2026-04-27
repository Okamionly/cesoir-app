"use client";

/**
 * useFocusTrap — A11y round 2 (2026-04-27).
 *
 * When `active` flips to true:
 *   1. Saves the currently focused element (so we can restore on close).
 *   2. Moves focus to the first focusable descendant of `containerRef`.
 *   3. Intercepts Tab / Shift+Tab to cycle focus inside the container.
 *   4. Listens for Escape and calls `onEscape` (if provided) — saves modal
 *      consumers from wiring their own keydown listener.
 *
 * When `active` flips to false:
 *   - Restores focus to whatever element was focused before activation.
 *
 * The hook is intentionally dependency-free and works for any modal/sheet
 * pattern: BottomSheet, MapFiltersSheet, ReportSheet, fullscreen overlays
 * in PhotoGallery, etc.
 *
 * Limitation: focusable elements are queried fresh on every Tab press, so
 * the trap auto-adapts to dynamic children (loading states, expand/collapse).
 * If the container is empty when `active` becomes true, focus is left on the
 * container itself (which is given `tabIndex=-1` if missing) so the user is
 * never stuck without a focus root.
 */

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(", ");

function getFocusable(container: HTMLElement): HTMLElement[] {
  const list = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  // Filter out hidden / inert elements — VoiceOver / NVDA both skip these.
  return Array.from(list).filter((el) => {
    if (el.hasAttribute("inert")) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    // offsetParent is null for `display: none` (cheap visibility heuristic).
    if (el.offsetParent === null && el !== document.activeElement) return false;
    return true;
  });
}

interface UseFocusTrapOptions {
  /**
   * Optional handler for Escape key. When omitted, Escape is left alone so
   * consumers can keep their own behaviour.
   */
  onEscape?: () => void;
  /**
   * If true (default), focus is restored to the element that was focused
   * before the trap was activated. Set to false for non-modal traps.
   */
  restoreFocus?: boolean;
  /**
   * Optional initial focus target. If omitted, the first focusable element
   * inside the container is focused. If the selector matches nothing, falls
   * back to the container itself.
   */
  initialFocusSelector?: string;
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options: UseFocusTrapOptions = {},
): void {
  const { onEscape, restoreFocus = true, initialFocusSelector } = options;

  // Stash whatever was focused before the trap activated, so we can put it
  // back. SSR guard: document is undefined on the server.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof document === "undefined") return;
    const container = containerRef.current;
    if (!container) return;

    // Capture previous focus before we move it.
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Initial focus: try selector → first focusable → container itself.
    let initialTarget: HTMLElement | null = null;
    if (initialFocusSelector) {
      initialTarget = container.querySelector<HTMLElement>(initialFocusSelector);
    }
    if (!initialTarget) {
      const list = getFocusable(container);
      initialTarget = list[0] ?? null;
    }
    if (!initialTarget) {
      // Fallback — make container itself focusable so SR users still land
      // somewhere meaningful inside the modal.
      if (!container.hasAttribute("tabindex")) {
        container.setAttribute("tabindex", "-1");
      }
      initialTarget = container;
    }
    // Use rAF so the focus call wins against motion entry animations that
    // briefly scroll the parent.
    requestAnimationFrame(() => {
      initialTarget!.focus();
    });

    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        if (onEscape) {
          e.stopPropagation();
          onEscape();
        }
        return;
      }
      if (e.key !== "Tab") return;
      if (!container) return;
      const list = getFocusable(container);
      if (list.length === 0) {
        // Nothing to cycle through — keep focus on the container itself.
        e.preventDefault();
        container.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      // Outside the container? (Can happen on quick re-focus events.) Pull
      // back into the trap.
      if (!container.contains(activeEl)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey) {
        if (activeEl === first || activeEl === container) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeEl === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (restoreFocus && previouslyFocusedRef.current) {
        // Skip restore if the previously-focused element was removed.
        if (document.contains(previouslyFocusedRef.current)) {
          previouslyFocusedRef.current.focus();
        }
        previouslyFocusedRef.current = null;
      }
    };
  }, [active, containerRef, onEscape, restoreFocus, initialFocusSelector]);
}
