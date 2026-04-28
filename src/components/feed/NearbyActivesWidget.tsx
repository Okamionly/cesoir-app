"use client";

/**
 * NearbyActivesWidget — Wave 17 "Près de toi maintenant" rail on /feed.
 *
 * Shows up to 5 profiles that are broadcasting availability right now,
 * sorted by distance. Each pill is { avatar (40px) + first name + km
 * away }. Tap a pill -> /map?focusId=<profileId> deep link.
 *
 * Layout sizing — matches the spec:
 *   - 5 pills × 40px avatar + gap-3 (12px) + ≈48px name+km column
 *     ≈ fits in a 390px-wide viewport without horizontal scroll.
 *     (`flex-1 min-w-0` per pill so they distribute evenly when 5 fit.)
 *   - On smaller screens or when names are long, the row falls back to
 *     `overflow-x-auto` with snap, so nothing gets clipped.
 *
 * States:
 *   - loading       -> 5 pulsing avatar skeletons
 *   - empty         -> "Personne d'actif autour pour le moment" + bell icon
 *   - populated     -> pills + "Voir la carte →" CTA
 *
 * Auto-refresh + realtime are handled in `useNearbyActives` (60s tick +
 * postgres_changes on profiles + availability_broadcasts).
 */

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { m } from "motion/react";
import { useGeolocation } from "@/lib/useGeolocation";
import { useNearbyActives } from "@/lib/useNearbyActives";
import { useAccessibility } from "@/components/ui/ReducedMotion";
import { Sparkles, Bell, ArrowRight } from "@/components/ui/lucide";
import { springs, micro } from "@/lib/motion-design";

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

/** "Marie Anaïs" → "Marie", "M." → "M." */
function firstNameOf(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  const space = trimmed.indexOf(" ");
  return space === -1 ? trimmed : trimmed.slice(0, space);
}

/** 0.4 → "0.4 km", 12 → "12 km". Keeps a single decimal under 10 km, none
 *  above (matches the rest of the app's distance copy). */
function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// ---------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------

function NearbyActivesSkeleton() {
  return (
    <div
      className="flex items-center gap-3"
      role="status"
      aria-label="Chargement des profils actifs autour"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 min-w-0 flex flex-col items-center gap-1.5"
        >
          <div className="w-10 h-10 rounded-full bg-card border border-border animate-pulse" />
          <div className="w-12 h-2.5 rounded-full bg-card border border-border animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------

function NearbyActivesEmpty() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card border border-border px-3 py-3">
      <div className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center flex-shrink-0">
        <Bell size={16} strokeWidth={2} className="text-text-muted" aria-hidden="true" />
      </div>
      <p className="text-[12px] text-text-muted leading-snug">
        Personne d&apos;actif autour pour le moment — viens à 19h
      </p>
    </div>
  );
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------

interface NearbyActivesWidgetProps {
  /** Optional override; defaults to live geolocation. Useful for tests
   *  or for surfaces that already have lat/lng resolved. */
  lat?: number | null;
  lng?: number | null;
}

export default function NearbyActivesWidget({
  lat: latProp,
  lng: lngProp,
}: NearbyActivesWidgetProps = {}) {
  const { reducedMotion } = useAccessibility();
  const geo = useGeolocation();
  const lat = latProp ?? geo.latitude;
  const lng = lngProp ?? geo.longitude;

  const { actives, loading, ready } = useNearbyActives(lat, lng, {
    limit: 5,
    pollIntervalMs: 60_000,
  });

  // Pre-compute the 5 pills so we can decide between empty/populated
  // without re-iterating the array.
  const pills = useMemo(() => actives.slice(0, 5), [actives]);

  // While we have no GPS at all, render nothing rather than flashing
  // "Personne d'actif" — the user hasn't even granted permission yet.
  if (!ready && (lat == null || lng == null)) {
    return null;
  }

  return (
    <section
      className="px-4 pt-3"
      aria-labelledby="nearby-actives-title"
    >
      {/* Header row: title + CTA */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <h2
          id="nearby-actives-title"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text uppercase tracking-wide"
        >
          <Sparkles
            size={14}
            strokeWidth={2}
            className="text-accent"
            aria-hidden="true"
          />
          Près de toi maintenant
        </h2>
        {pills.length > 0 && (
          <Link
            href="/map"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full px-2 py-0.5"
          >
            Voir la carte
            <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* Body: skeleton, empty, or pills */}
      {loading ? (
        <NearbyActivesSkeleton />
      ) : pills.length === 0 ? (
        <NearbyActivesEmpty />
      ) : (
        <ul
          className="flex items-start gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
          aria-label={`${pills.length} profil${pills.length > 1 ? "s" : ""} actif${pills.length > 1 ? "s" : ""} autour de toi`}
        >
          {pills.map((p) => {
            const first = firstNameOf(p.name);
            const distLabel = formatDistance(p.distance);
            return (
              <li
                key={p.id}
                className="flex-1 min-w-0 snap-start"
              >
                <m.div
                  whileHover={reducedMotion ? undefined : { y: -2, transition: springs.gentle }}
                  whileTap={reducedMotion ? undefined : { scale: 0.96, transition: micro }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Link
                    href={`/map?focusId=${encodeURIComponent(p.id)}`}
                    className="group flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
                    aria-label={`Voir ${first} sur la carte — à ${distLabel}`}
                  >
                    <div className="relative">
                      {p.photo ? (
                        <Image
                          src={p.photo}
                          alt=""
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border border-border group-hover:border-accent/50 transition-colors"
                          unoptimized={p.photo.includes("ui-avatars.com")}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted text-sm font-medium">
                          {first.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      {/* Live broadcast pulse — always on for this widget
                          (we only render broadcast_active=true profiles). */}
                      <span
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-accent-2 border-2 border-bg"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-text leading-tight max-w-full truncate">
                      {first}
                    </span>
                    <span className="text-[10px] text-text-muted leading-tight">
                      {distLabel}
                    </span>
                  </Link>
                </m.div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
