"use client";

/**
 * LiveRegion — global SR announcement singleton (a11y round 2, 2026-04-27).
 *
 * Mounted ONCE in the (app) layout root. Anywhere in the app you can call:
 *
 *   import { announceToSR } from "@/components/ui/LiveRegion";
 *   announceToSR("Match avec Sophie !");
 *   announceToSR("Erreur réseau", "assertive");
 *
 * Two visually-hidden <div>s are rendered:
 *   - polite (default) — used for state updates that don't need to interrupt
 *     the current narration (filter result counts, swipe action confirmations,
 *     "N résultats", typing indicators).
 *   - assertive — used for time-critical updates (match cinematics, toast
 *     errors, SOS triggered).
 *
 * Why this pattern?
 * Putting `aria-live` on the live ticker element itself works but is messy
 * because (a) NVDA & VoiceOver chunk announcements differently per region
 * and (b) some regions toggle between "no content" and content, which can
 * cause double-fires. A single dedicated singleton with two channels is the
 * recommended pattern from WAI-ARIA APG (https://www.w3.org/WAI/ARIA/apg/practices/notifications/).
 *
 * Implementation note:
 * We swap text rather than appending — most screen readers re-announce the
 * region whenever its text content mutates. To force re-announcement of an
 * identical message (e.g. consecutive "1 résultat"), we briefly clear then
 * re-set after a microtask (also recommended by WAI-ARIA APG).
 */

import { useEffect, useState } from "react";

type Politeness = "polite" | "assertive";

interface QueuedAnnouncement {
  id: number;
  text: string;
  politeness: Politeness;
}

// Module-level subscriber registry — a tiny pub/sub so the singleton can
// receive announcements from anywhere without prop-drilling through the React
// tree. We only ever expect one subscriber (the mounted LiveRegion).
type Subscriber = (a: QueuedAnnouncement) => void;
const subscribers = new Set<Subscriber>();
let counter = 0;

/**
 * Announce a string to screen readers.
 *
 * @param text  the message to speak (kept short; SR users get fatigued fast)
 * @param politeness  "polite" (default) or "assertive". Use assertive ONLY
 *                    for time-critical events: matches, errors, SOS.
 */
export function announceToSR(text: string, politeness: Politeness = "polite"): void {
  if (typeof window === "undefined") return;
  if (!text || subscribers.size === 0) return;
  counter += 1;
  const a: QueuedAnnouncement = { id: counter, text, politeness };
  subscribers.forEach((fn) => fn(a));
}

/**
 * Singleton component that renders the two live regions and manages the
 * clear-then-set toggle to force re-announcement of identical messages.
 *
 * Mounted in src/app/(app)/layout.tsx — does NOT need to be rendered more
 * than once. If accidentally mounted twice, the duplicate will still work but
 * announcements will be doubled.
 */
export default function LiveRegion() {
  const [polite, setPolite] = useState<string>("");
  const [assertive, setAssertive] = useState<string>("");

  useEffect(() => {
    const handler: Subscriber = (a) => {
      // Force re-announcement: clear first, then set after a microtask. SRs
      // detect the reset and the new value as two distinct mutations and
      // will re-speak even when the content is identical to the previous
      // announcement.
      if (a.politeness === "polite") {
        setPolite("");
        queueMicrotask(() => setPolite(a.text));
      } else {
        setAssertive("");
        queueMicrotask(() => setAssertive(a.text));
      }
    };
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, []);

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {polite}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertive}
      </div>
    </>
  );
}
