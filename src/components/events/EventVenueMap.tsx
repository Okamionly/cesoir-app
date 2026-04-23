"use client";

/**
 * EventVenueMap — Mini MapLibre viewport centered on the venue lat/lng.
 *
 * Intentionally tiny (h-40) with no user interaction beyond the single pin.
 * Falls back to a static address card if the venue has no geo or MapLibre
 * fails to init.
 *
 * We keep the map non-interactive (zoom disabled) to reduce CPU on cards
 * that scroll past the viewport.
 */

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { m } from "motion/react";
import { MapPin, Navigation } from "@/components/ui/lucide";

export interface EventVenueMapProps {
  name: string;
  address?: string | null;
  lat: number;
  lng: number;
  /** Optional label displayed below the map (usually the address line). */
  subtitle?: string | null;
}

export default function EventVenueMap({
  name,
  address,
  lat,
  lng,
  subtitle,
}: EventVenueMapProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    let map: maplibregl.Map | null = null;
    let cancelled = false;

    // Build the map in a defer-to-next-tick so a `setFailed(true)` on error
    // is applied in a React-owned update instead of inside the effect body
    // (avoids cascading render warnings).
    const raf = requestAnimationFrame(() => {
      if (cancelled || !container.current) return;
      try {
        map = new maplibregl.Map({
          container: container.current,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: [
                  "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                ],
                tileSize: 256,
                attribution: "© OpenStreetMap",
              },
            },
            layers: [
              {
                id: "osm",
                type: "raster",
                source: "osm",
                minzoom: 0,
                maxzoom: 19,
              },
            ],
          },
          center: [lng, lat],
          zoom: 14,
          attributionControl: false,
          interactive: false,
          dragPan: false,
          scrollZoom: false,
          doubleClickZoom: false,
          touchZoomRotate: false,
        });

        const el = document.createElement("div");
        el.style.width = "26px";
        el.style.height = "26px";
        el.style.borderRadius = "50%";
        el.style.background =
          "radial-gradient(circle, rgba(139,92,246,0.95) 0%, rgba(0,255,136,0.65) 100%)";
        el.style.boxShadow =
          "0 0 0 3px rgba(255,255,255,0.9), 0 6px 18px rgba(139,92,246,0.35)";
        el.setAttribute("aria-hidden", "true");

        new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);

        mapRef.current = map;
      } catch {
        if (!cancelled) setFailed(true);
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      try {
        map?.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
    };
  }, [lat, lng]);

  const directionsHref = `https://www.openstreetmap.org/directions?to=${lat}%2C${lng}`;

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card h-40">
        {!failed && (
          <div
            ref={container}
            className="absolute inset-0"
            aria-label={`Carte situant ${name}`}
            role="img"
          />
        )}
        {failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent/15 to-accent/5">
            <MapPin size={22} className="text-accent/70" aria-hidden />
          </div>
        )}
      </div>

      <m.div
        className="flex items-start justify-between gap-3 rounded-2xl bg-card border border-border p-3"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text truncate">{name}</p>
          {(subtitle || address) && (
            <p className="text-[11px] text-text-muted truncate">
              {subtitle ?? address}
            </p>
          )}
        </div>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-bg border border-border px-3 py-1.5 text-[11px] font-semibold text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
          aria-label="Itineraire vers le lieu"
        >
          <Navigation size={12} strokeWidth={2} aria-hidden />
          Itineraire
        </a>
      </m.div>
    </div>
  );
}
