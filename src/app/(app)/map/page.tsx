"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "motion/react";
import { mapVariants, springs, micro } from "@/lib/motion-design";
import Link from "next/link";
import { useGeolocation } from "@/lib/useGeolocation";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/lib/useProfiles";
import type { Profile } from "@/lib/mock-profiles";
import { ModeKey } from "@/lib/modes";
import { MODE_COLORS } from "@/lib/mode-colors";
import { app as appTokens } from "@/lib/design-tokens";
import { useHotspots } from "@/lib/useHotspots";
import { HeatmapFallback } from "@/components/map/HeatmapOverlay";
import LiveActivityPanel from "@/components/map/LiveActivityPanel";
import CrossLinkCard from "@/components/app/CrossLinkCard";
import PageHeader from "@/components/ui/PageHeader";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import { getActiveCityCenter } from "@/lib/cities";
import MapSearchBar from "@/components/map/MapSearchBar";
import MapFiltersSheet, { DEFAULT_FILTERS, type MapFilters } from "@/components/map/MapFiltersSheet";
import MapFloatingActions from "@/components/map/MapFloatingActions";
import MapCarousel, { type MapCarouselItem } from "@/components/map/MapCarousel";
import ProfileFlyInCard from "@/components/map/ProfileFlyInCard";
import { createProfilePin, ensurePinStyles, type ProfilePinHandle } from "@/components/map/ProfilePin";
import { createEventPin, type EventPinHandle } from "@/components/map/EventPin";
import EventFlyInCard from "@/components/map/EventFlyInCard";
import { useEvents } from "@/lib/useEvents";
import { supabase } from "@/lib/supabase";
import type { CesoirEvent, RsvpStatus } from "@/lib/events-types";

interface ProfileWithPos extends Profile {
  pos: { lat: number; lng: number };
  online?: boolean;
}

type ClusterFeature = Supercluster.ClusterFeature<{ cluster: true; point_count: number; point_count_abbreviated: number | string }>;
type PointFeature = Supercluster.PointFeature<{ profileId: string }>;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isPointerFineMedia(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: fine)").matches;
}

/** DOM zoom gate — below this zoom we collapse to cluster symbols and
 *  avoid spinning up dozens of DOM marker nodes. */
const DOM_PIN_ZOOM_THRESHOLD = 12;

/** Event pins are a separate layer (no clustering). Below this zoom we
 *  avoid rendering them to keep the canvas clean. */
const EVENT_PIN_ZOOM_THRESHOLD = 11;

export default function MapPage() {
  // useAuth consumed for future gating (e.g. only show crush pin for signed-in users).
  useAuth();
  const { latitude, longitude, error, loading } = useGeolocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CesoirEvent | null>(null);
  const [flyInAnchor, setFlyInAnchor] = useState<{ x: number; y: number } | null>(null);
  const [eventAnchor, setEventAnchor] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [zoom, setZoom] = useState(13);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [geoStale, setGeoStale] = useState(false);
  const [lastGeoAt, setLastGeoAt] = useState<number | null>(null);
  const [activityUpdatedAt, setActivityUpdatedAt] = useState<Date>(() => new Date());
  const [activityRefreshing, setActivityRefreshing] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pinHandlesRef = useRef<Map<string, { handle: ProfilePinHandle; marker: maplibregl.Marker }>>(new Map());
  const clusterMarkersRef = useRef<maplibregl.Marker[]>([]);
  const eventMarkersRef = useRef<Map<string, { handle: EventPinHandle; marker: maplibregl.Marker }>>(new Map());
  const center = latitude && longitude ? { lat: latitude, lng: longitude } : getActiveCityCenter();
  const currentModeFilter: ModeKey | undefined = filters.modes.length === 1 ? filters.modes[0] : undefined;
  const { profiles: realProfiles } = useProfiles(latitude ?? undefined, longitude ?? undefined, currentModeFilter);
  const { hotspots: liveHotspots } = useHotspots();

  // Montpellier events (U2 hook) — shown on /map via a dedicated layer
  // distinct from profile pins. Toggle via `filters.showEvents` (sheet).
  const { events: montpellierEvents, refetch: refetchEvents } = useEvents({
    when: "all",
    category: null,
  });

  // 2026-04-24 (CPO-003 fix + SEC-001 alignment):
  // The `nearby_profiles` RPC currently returns `distance_km` but NOT the
  // per-profile coordinates — we only know each match is, say, 0.8 km away,
  // not where. Previously we jitter-placed pins with Math.random() around
  // the city center, which was a trust-killer AND re-shuffled on every
  // render (a user could watch pins "walk").
  //
  // Until the RPC is upgraded to return `ST_SnapToGrid(location, 0.005)`
  // (500 m resolution — privacy-safe per SEC-001), we:
  //   1. Seed the jitter from a deterministic hash of the profile id so
  //      a pin stays put between renders (no more ghost walking).
  //   2. Keep the radius at ~500 m (0.005°) matching the target grid
  //      granularity — the same a real snap would allow.
  //   3. Surface a banner explaining positions are approximate (see
  //      JSX below) so we're honest with users that the map is fuzzy.
  const profilesWithPos = useMemo<ProfileWithPos[]>(() => {
    return realProfiles.map((p, i) => {
      // Simple 32-bit FNV-like hash of the profile id → 2 stable pseudo-
      // randoms in [-0.5, 0.5]. Not cryptographic, just stable.
      let h = 2166136261;
      for (let k = 0; k < p.id.length; k++) {
        h = Math.imul(h ^ p.id.charCodeAt(k), 16777619);
      }
      const r1 = ((h >>> 0) % 10000) / 10000 - 0.5; // [-0.5, 0.5]
      const r2 = (((h >>> 16) ^ h) >>> 0) % 10000 / 10000 - 0.5;
      return {
        ...p,
        pos: {
          lat: center.lat + r1 * 0.01, // ≈ 500m jitter at 45°N
          lng: center.lng + r2 * 0.01,
        },
        online: i % 3 !== 0,
      };
    });
  }, [realProfiles, center.lat, center.lng]);

  // Apply filters (modes + age + distance + online + profiles-layer toggle)
  const filtered = useMemo<ProfileWithPos[]>(() => {
    // U4: the "Voir les profils" toggle short-circuits the profile layer
    // entirely, which also hides profile pins + clusters in one move.
    if (!filters.showProfiles) return [];
    return profilesWithPos.filter(p => {
      if (filters.modes.length > 0 && !filters.modes.includes(p.mode)) return false;
      if (p.age < filters.ageMin || p.age > filters.ageMax) return false;
      if (p.distance > filters.distanceKm) return false;
      if (filters.showOnlineOnly && !p.online) return false;
      return true;
    });
  }, [profilesWithPos, filters]);

  // Events derived from Montpellier feed — only those with real geo, visible
  // in current bounds. Filtered by `filters.showEvents` toggle.
  const geoEvents = useMemo<CesoirEvent[]>(() => {
    if (!filters.showEvents) return [];
    return montpellierEvents.filter(
      (e) => e.venue.lat != null && e.venue.lng != null,
    );
  }, [montpellierEvents, filters.showEvents]);

  const eventById = useMemo(() => {
    const m = new Map<string, CesoirEvent>();
    geoEvents.forEach((e) => m.set(e.id, e));
    return m;
  }, [geoEvents]);

  // --- Build supercluster index for profile points --------------------------
  const clusterIndex = useMemo(() => {
    const idx = new Supercluster<{ profileId: string }, { cluster: true; point_count: number; point_count_abbreviated: number | string }>({
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
    });
    const features: PointFeature[] = filtered.map(p => ({
      type: "Feature",
      properties: { profileId: p.id },
      geometry: { type: "Point", coordinates: [p.pos.lng, p.pos.lat] },
    }));
    idx.load(features);
    return idx;
  }, [filtered]);

  const profileById = useMemo(() => {
    const m = new Map<string, ProfileWithPos>();
    filtered.forEach(p => m.set(p.id, p));
    return m;
  }, [filtered]);

  const selected = selectedId ? profileById.get(selectedId) ?? null : null;

  useEffect(() => { setMounted(true); }, []);

  // Inject pin CSS once on mount so initial pins render correctly.
  useEffect(() => {
    if (!mounted) return;
    ensurePinStyles();
  }, [mounted]);

  // Init map once when mounted
  useEffect(() => {
    if (!mounted || !mapContainer.current || mapRef.current) return;

    // Prefer dark tiles when the OS asks for dark mode; fall back to positron.
    const darkMode = typeof window !== "undefined"
      && window.matchMedia
      && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const styleUrl = darkMode
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [center.lng, center.lat],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;

    const fallbackTimer = setTimeout(() => {
      if (mapRef.current && !mapRef.current.isStyleLoaded()) setMapFailed(true);
    }, 3000);

    const updateViewport = () => {
      const b = map.getBounds();
      setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      setZoom(map.getZoom());
    };

    // Debounced viewport update via rAF
    let rafId: number | null = null;
    const onMove = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => { updateViewport(); rafId = null; });
    };

    map.on("load", () => {
      clearTimeout(fallbackTimer);
      setMapFailed(false);
      updateViewport();

      if (!map.getSource("activity-heat")) {
        map.addSource("activity-heat", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "activity-heat-layer",
          type: "heatmap",
          source: "activity-heat",
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "intensity"], 0, 0, 1, 1],
            "heatmap-intensity": 1,
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(139,92,246,0)",
              0.3, "rgba(236,72,153,0.4)",
              0.6, "rgba(0,255,136,0.6)",
              1, "rgba(0,255,136,0.9)",
            ],
            "heatmap-radius": 40,
            "heatmap-opacity": 0.7,
          },
          layout: { visibility: "none" },
        });
      }
    });

    map.on("move", onMove);
    map.on("zoom", onMove);
    map.on("error", () => setMapFailed(true));

    // Clicking the bare map clears selection (focus mode reset).
    map.on("click", () => {
      setSelectedId(null);
      setSelectedEvent(null);
      setFlyInAnchor(null);
    });

    return () => {
      clearTimeout(fallbackTimer);
      if (rafId !== null) cancelAnimationFrame(rafId);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Recenter when geolocation becomes available (once)
  const didFirstCenterRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !latitude || !longitude) return;
    setLastGeoAt(Date.now());
    setGeoStale(false);
    if (!didFirstCenterRef.current) {
      map.easeTo({ center: [longitude, latitude], zoom: 14, duration: 600 });
      didFirstCenterRef.current = true;
    }
  }, [latitude, longitude]);

  // Mark geolocation as stale if >5min since last fix (breathing glow cue).
  useEffect(() => {
    if (lastGeoAt === null) return;
    const id = window.setInterval(() => {
      setGeoStale(Date.now() - lastGeoAt > 5 * 60 * 1000);
    }, 30_000);
    return () => window.clearInterval(id);
  }, [lastGeoAt]);

  // --- Feed heatmap source from live hotspots -------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const source = map.getSource("activity-heat") as maplibregl.GeoJSONSource | undefined;
      if (!source) return;
      const intensityVal: Record<typeof liveHotspots[number]["intensity"], number> = { low: 0.3, medium: 0.6, high: 1 };
      source.setData({
        type: "FeatureCollection",
        features: liveHotspots.map(h => ({
          type: "Feature",
          properties: { intensity: intensityVal[h.intensity] },
          geometry: { type: "Point", coordinates: [h.lng, h.lat] },
        })),
      });
      if (map.getLayer("activity-heat-layer")) {
        map.setLayoutProperty("activity-heat-layer", "visibility", filters.showHeatmap ? "visible" : "none");
      }
      // Reduce heatmap prominence when a pin is selected (focus mode).
      if (map.getLayer("activity-heat-layer")) {
        map.setPaintProperty(
          "activity-heat-layer",
          "heatmap-opacity",
          selectedId || selectedEvent ? 0.4 : 0.7,
        );
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [liveHotspots, filters.showHeatmap, selectedId, selectedEvent]);

  // --- Render clustered profile markers with ProfilePin ---------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;

    const reduced = prefersReducedMotion();
    const pointerFine = isPointerFineMedia();
    const useDomPins = zoom >= DOM_PIN_ZOOM_THRESHOLD;

    const clusters = clusterIndex.getClusters(bounds, Math.round(zoom));

    // --- Clusters are always DOM (small count) --------------------------
    clusterMarkersRef.current.forEach(m => m.remove());
    clusterMarkersRef.current = [];

    const nextPinIds = new Set<string>();

    clusters.forEach((c, idx) => {
      const [lng, lat] = c.geometry.coordinates;
      const isCluster = (c.properties as { cluster?: boolean }).cluster;

      if (isCluster) {
        const cf = c as ClusterFeature;
        const count = cf.properties.point_count;
        const size = Math.min(64, 36 + count * 2);
        const el = document.createElement("div");
        el.className = "cesoir-cluster-pin";
        // 2026-04-26 fix: same pre-positioning incrustation bug as
        // ProfilePin — start invisible until MapLibre applies the marker
        // transform. cesoir-cluster-burst keyframes already start at
        // opacity:0; reduced-motion users get opacity:1 explicitly.
        el.style.cssText = `
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
          color: white; font-weight: 700; font-size: ${count > 99 ? 11 : 13}px;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          box-shadow: 0 0 24px color-mix(in srgb, var(--color-accent) 40%, transparent);
          border: 2px solid white;
          opacity: ${reduced ? "1" : "0"};
          ${reduced ? "" : `animation: cesoir-cluster-burst 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.min(idx * 0.02, 0.4)}s both;`}
        `;
        el.textContent = `${count}`;

        el.onclick = async (e) => {
          e.stopPropagation();
          const clusterId = cf.properties.cluster_id as unknown as number;
          const expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);

          // Fan-out animation: fetch leaves, project them to screen, animate
          // them briefly toward their final positions before flying in.
          if (!reduced) {
            try {
              const leaves = clusterIndex.getLeaves(clusterId, 12, 0) as PointFeature[];
              const rootPoint = map.project([lng, lat]);
              const fanNodes = leaves.map((leaf) => {
                const node = document.createElement("div");
                node.className = "cesoir-cluster-fan-node";
                const [leafLng, leafLat] = leaf.geometry.coordinates;
                const leafPoint = map.project([leafLng, leafLat]);
                const dx = leafPoint.x - rootPoint.x;
                const dy = leafPoint.y - rootPoint.y;
                const dist = Math.hypot(dx, dy) || 1;
                const nx = (dx / dist) * 20;
                const ny = (dy / dist) * 20;
                node.style.cssText = `
                  position: absolute;
                  left: ${rootPoint.x - 6}px;
                  top: ${rootPoint.y - 6}px;
                  width: 12px; height: 12px; border-radius: 50%;
                  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
                  opacity: 0; pointer-events: none;
                  transition: transform 280ms cubic-bezier(0.2,0.8,0.2,1), opacity 280ms ease-out;
                  z-index: 5;
                `;
                return { node, tx: nx, ty: ny };
              });
              const container = map.getContainer();
              fanNodes.forEach(({ node }) => container.appendChild(node));
              requestAnimationFrame(() => {
                fanNodes.forEach(({ node, tx, ty }) => {
                  node.style.opacity = "0.85";
                  node.style.transform = `translate(${tx}px, ${ty}px) scale(1)`;
                });
              });
              setTimeout(() => {
                fanNodes.forEach(({ node }) => {
                  node.style.opacity = "0";
                });
              }, 260);
              setTimeout(() => {
                fanNodes.forEach(({ node }) => node.remove());
              }, 520);
            } catch {
              // ignore fan-out failures
            }
          }

          map.easeTo({ center: [lng, lat], zoom: Math.min(expansionZoom + 0.5, 18), duration: 500 });
        };

        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        clusterMarkersRef.current.push(marker);
        return;
      }

      if (!useDomPins) return;

      const pf = c as PointFeature;
      const profile = profileById.get(pf.properties.profileId);
      if (!profile) return;
      nextPinIds.add(profile.id);

      const existing = pinHandlesRef.current.get(profile.id);
      if (existing) {
        // Pool reuse: move the existing marker to the new coords.
        existing.marker.setLngLat([lng, lat]);
        return;
      }

      const color = MODE_COLORS[profile.mode] || "var(--color-accent)";
      const handle = createProfilePin({
        photo: profile.photo,
        color,
        online: profile.online,
        reduced,
        pointerFine,
        variant: "profile",
        animationDelay: Math.min(idx * 0.02, 0.3),
        onClick: () => {
          const screenPt = map.project([lng, lat]);
          const container = map.getContainer().getBoundingClientRect();
          setFlyInAnchor({ x: container.left + screenPt.x, y: container.top + screenPt.y });
          setSelectedId(profile.id);
          setSelectedEvent(null);
        },
      });
      const marker = new maplibregl.Marker({ element: handle.element }).setLngLat([lng, lat]).addTo(map);
      pinHandlesRef.current.set(profile.id, { handle, marker });
    });

    // Remove any pins that are no longer in the current cluster set.
    Array.from(pinHandlesRef.current.entries()).forEach(([id, { handle, marker }]) => {
      if (!nextPinIds.has(id)) {
        handle.destroy();
        marker.remove();
        pinHandlesRef.current.delete(id);
      }
    });
  }, [bounds, zoom, clusterIndex, profileById]);

  // --- Apply focus mode styles imperatively on every selection change ------
  useEffect(() => {
    pinHandlesRef.current.forEach(({ handle }, id) => {
      handle.update({
        focused: id === selectedId,
        dimmed: Boolean(selectedId || selectedEvent) && id !== selectedId,
      });
    });
    eventMarkersRef.current.forEach(({ handle }, id) => {
      handle.update({
        focused: selectedEvent?.id === id,
        dimmed: Boolean(selectedId || selectedEvent) && selectedEvent?.id !== id,
      });
    });
  }, [selectedId, selectedEvent]);

  // --- Render event markers in a dedicated layer (no clustering) -----------
  // Pool-friendly: reuse existing pin handles via `setLngLat`, only destroy
  // pins that drop out of the new event set.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;

    const reduced = prefersReducedMotion();
    const pointerFine = isPointerFineMedia();
    const show = filters.showEvents && zoom >= EVENT_PIN_ZOOM_THRESHOLD;

    if (!show) {
      // Destroy everything — we're below threshold or toggled off.
      eventMarkersRef.current.forEach(({ handle, marker }) => {
        handle.destroy();
        marker.remove();
      });
      eventMarkersRef.current.clear();
      return;
    }

    const [w, s, e, n] = bounds;
    const visible = geoEvents.filter((ev) => {
      const lat = ev.venue.lat!;
      const lng = ev.venue.lng!;
      return lng >= w && lng <= e && lat >= s && lat <= n;
    });

    const nextIds = new Set<string>();
    visible.forEach((ev, idx) => {
      nextIds.add(ev.id);
      const lat = ev.venue.lat!;
      const lng = ev.venue.lng!;

      const existing = eventMarkersRef.current.get(ev.id);
      if (existing) {
        existing.marker.setLngLat([lng, lat]);
        return;
      }

      const handle = createEventPin({
        title: ev.title,
        startsAt: ev.startAt,
        // Featured flag not yet in CesoirEvent; hoist it when U2 adds it.
        featured: false,
        reduced,
        pointerFine,
        animationDelay: Math.min(idx * 0.03, 0.25),
        onClick: () => {
          const screenPt = map.project([lng, lat]);
          const rect = map.getContainer().getBoundingClientRect();
          setEventAnchor({ x: rect.left + screenPt.x, y: rect.top + screenPt.y });
          setSelectedEvent(ev);
          setSelectedId(null);
          setFlyInAnchor(null);
        },
      });
      const marker = new maplibregl.Marker({ element: handle.element })
        .setLngLat([lng, lat])
        .addTo(map);
      eventMarkersRef.current.set(ev.id, { handle, marker });
    });

    // Destroy pins no longer in the visible set.
    Array.from(eventMarkersRef.current.entries()).forEach(([id, { handle, marker }]) => {
      if (!nextIds.has(id)) {
        handle.destroy();
        marker.remove();
        eventMarkersRef.current.delete(id);
      }
    });
  }, [geoEvents, bounds, zoom, filters.showEvents]);

  // --- Cleanup all markers on unmount --------------------------------------
  useEffect(() => {
    const pinHandles = pinHandlesRef.current;
    const eventMarkers = eventMarkersRef.current;
    const clusterMarkers = clusterMarkersRef.current;
    return () => {
      pinHandles.forEach(({ handle, marker }) => {
        handle.destroy();
        marker.remove();
      });
      pinHandles.clear();
      eventMarkers.forEach(({ handle, marker }) => {
        handle.destroy();
        marker.remove();
      });
      eventMarkers.clear();
      clusterMarkers.forEach(m => m.remove());
    };
  }, []);

  // --- Carousel items -------------------------------------------------------
  const carouselItems = useMemo<MapCarouselItem[]>(() => {
    const items: MapCarouselItem[] = [];
    if (bounds) {
      const [w, s, e, n] = bounds;
      filtered.forEach(p => {
        if (p.pos.lng >= w && p.pos.lng <= e && p.pos.lat >= s && p.pos.lat <= n) {
          items.push({
            type: "profile",
            id: p.id,
            title: `${p.name}, ${p.age}`,
            subtitle: `${p.distance} km`,
            lat: p.pos.lat,
            lng: p.pos.lng,
            photo: p.photo,
            mode: p.mode,
          });
        }
      });
      geoEvents.forEach((ev) => {
        const lat = ev.venue.lat!;
        const lng = ev.venue.lng!;
        if (lng >= w && lng <= e && lat >= s && lat <= n) {
          const d = new Date(ev.startAt);
          const time = Number.isNaN(d.getTime())
            ? ev.venue.name
            : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          items.push({
            type: "event",
            id: ev.id,
            title: ev.title,
            subtitle: `${time} · ${ev.venue.name}`,
            lat,
            lng,
            emoji: "\u26A1",
          });
        }
      });
    }
    return items.slice(0, 20);
  }, [bounds, filtered, geoEvents]);

  // --- Handlers -------------------------------------------------------------
  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map || !latitude || !longitude) return;
    map.easeTo({ center: [longitude, latitude], zoom: 14, duration: 600 });
    setLastGeoAt(Date.now());
    setGeoStale(false);
  }, [latitude, longitude]);

  const handleSearchSelect = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: [lng, lat], zoom: 15, duration: 600 });
  }, []);

  const handleActivityRefresh = useCallback(() => {
    if (activityRefreshing) return;
    setActivityRefreshing(true);
    // Simulate a brief refresh — real hook will wire in when backend lands.
    window.setTimeout(() => {
      setActivityUpdatedAt(new Date());
      setActivityRefreshing(false);
    }, 800);
  }, [activityRefreshing]);

  const handleCarouselSelect = useCallback((item: MapCarouselItem) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: [item.lng, item.lat], zoom: 16, duration: 500 });
    if (item.type === "profile") {
      const p = profileById.get(item.id);
      if (p) {
        const screenPt = map.project([item.lng, item.lat]);
        const container = map.getContainer().getBoundingClientRect();
        setFlyInAnchor({ x: container.left + screenPt.x, y: container.top + screenPt.y });
        setSelectedId(p.id);
        setSelectedEvent(null);
      }
    } else if (item.type === "event") {
      const ev = eventById.get(item.id);
      if (ev) {
        const screenPt = map.project([item.lng, item.lat]);
        const container = map.getContainer().getBoundingClientRect();
        setEventAnchor({ x: container.left + screenPt.x, y: container.top + screenPt.y });
        setSelectedEvent(ev);
        setSelectedId(null);
        setFlyInAnchor(null);
      }
    }
  }, [profileById, eventById]);

  const handleCloseFlyIn = useCallback(() => {
    setSelectedId(null);
    setFlyInAnchor(null);
  }, []);

  const handleCloseEvent = useCallback(() => {
    setSelectedEvent(null);
    setEventAnchor(null);
  }, []);

  /**
   * Optimistic quick-RSVP handler. Patches `selectedEvent` right away,
   * writes to `event_rsvps`, then refetches so counts stay fresh elsewhere.
   */
  const handleEventRsvp = useCallback(
    async (ev: CesoirEvent, next: RsvpStatus | null) => {
      setSelectedEvent((prev) =>
        prev && prev.id === ev.id
          ? {
              ...prev,
              myRsvp: next,
              counts: {
                going:
                  prev.counts.going +
                  (next === "going" ? 1 : 0) -
                  (prev.myRsvp === "going" ? 1 : 0),
                maybe: prev.counts.maybe,
              },
            }
          : prev,
      );

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        if (next === null) {
          await supabase
            .from("event_rsvps")
            .delete()
            .match({ event_id: ev.id, user_id: user.id });
        } else {
          await supabase.from("event_rsvps").upsert(
            { event_id: ev.id, user_id: user.id, status: next },
            { onConflict: "event_id,user_id" },
          );
        }
        void refetchEvents();
      } catch {
        // Silently swallow — optimistic UI already updated. Next fetch reconciles.
      }
    },
    [refetchEvents],
  );

  // Keep fly-in anchor tracking the pin on map move (so card slides with pin).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    const update = () => {
      const pt = map.project([selected.pos.lng, selected.pos.lat]);
      const rect = map.getContainer().getBoundingClientRect();
      setFlyInAnchor({ x: rect.left + pt.x, y: rect.top + pt.y });
    };
    map.on("move", update);
    map.on("zoom", update);
    return () => {
      map.off("move", update);
      map.off("zoom", update);
    };
  }, [selected]);

  // Keep event fly-in anchor tracking its pin on map move.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedEvent || selectedEvent.venue.lat == null || selectedEvent.venue.lng == null) return;
    const lat = selectedEvent.venue.lat;
    const lng = selectedEvent.venue.lng;
    const update = () => {
      const pt = map.project([lng, lat]);
      const rect = map.getContainer().getBoundingClientRect();
      setEventAnchor({ x: rect.left + pt.x, y: rect.top + pt.y });
    };
    map.on("move", update);
    map.on("zoom", update);
    return () => {
      map.off("move", update);
      map.off("zoom", update);
    };
  }, [selectedEvent]);

  const activeFilterCount =
    filters.modes.length +
    (filters.showEvents ? 0 : 1) +
    (filters.showProfiles ? 0 : 1) +
    (filters.showFlash ? 0 : 1) +
    (filters.showHeatmap ? 1 : 0) +
    (filters.showOnlineOnly ? 1 : 0) +
    (filters.ageMin !== DEFAULT_FILTERS.ageMin || filters.ageMax !== DEFAULT_FILTERS.ageMax ? 1 : 0) +
    (filters.distanceKm !== DEFAULT_FILTERS.distanceKm ? 1 : 0);

  if (!mounted) return (
    <div className="h-screen bg-bg flex items-center justify-center">
      <span className="text-3xl text-accent animate-pulse">☾</span>
    </div>
  );

  return (
    <div className="h-screen bg-bg flex flex-col">
      <PageHeader
        sticky={false}
        borderless={false}
        className="shrink-0 !z-[1000] bg-bg"
        leftSlot={
          <div className="flex items-center gap-2">
            <span className="text-lg text-accent" aria-hidden="true">☾</span>
            <span className="text-base font-bold">Carte</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <m.div whileHover={micro.hoverLift} whileTap={micro.tapScale}>
              <Link
                href="/discover"
                className="flex items-center gap-1 bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full tap-target"
              >
                <span className="text-[10px]" aria-hidden="true">🔍</span>
                <span className="text-[10px] text-accent font-semibold">Decouvrir</span>
              </Link>
            </m.div>
            <div className="text-[11px] text-text-muted">
              {loading ? "Localisation..." : error ? <span className="text-danger">{error}</span> : <><span className="w-1.5 h-1.5 rounded-full bg-safe inline-block mr-1" /><m.span key={`count-${filtered.length}`} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={springs.snap}>{filtered.length}</m.span></>}
            </div>
          </div>
        }
      />

      {/* Trust banner (CPO-003) — we surface the privacy compromise openly.
          The RPC `nearby_profiles` returns `distance_km` but not exact coords,
          so pins are placed with a deterministic 500 m jitter around the city
          center. Being honest about this is better than pretending otherwise. */}
      <div className="shrink-0 px-3 py-1.5 bg-accent/5 border-b border-accent/10 text-[10px] text-text-muted flex items-center gap-1.5">
        <span className="text-accent" aria-hidden="true">☾</span>
        <span>
          Positions floutées à ~500 m pour ta sécurité — précises uniquement avec ton consentement après match
        </span>
      </div>

      <div className="flex-1 relative z-0">
        <div ref={mapContainer} className="w-full h-full" style={{ display: mapFailed ? "none" : "block" }} />

        {/* Search bar + filters trigger (top) */}
        {!mapFailed && (
          <>
            <MapSearchBar
              onSelect={handleSearchSelect}
              onOpenFilters={() => setShowFilters(true)}
            />
            {activeFilterCount > 0 && (
              <m.div
                className="absolute top-16 left-3 z-[940] bg-accent text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-lg"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springs.snap}
              >
                {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""} actif{activeFilterCount > 1 ? "s" : ""}
              </m.div>
            )}
          </>
        )}

        {/* User position pulsing dot */}
        {latitude && longitude && !mapFailed && (
          <m.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
            style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--color-accent)" }}
            animate={mapVariants.userDot.idle}
          />
        )}

        {!mapFailed && (
          <LiveActivityPanel
            hotspots={liveHotspots}
            loading={activityRefreshing}
            lastUpdated={activityUpdatedAt}
            userLat={latitude ?? undefined}
            userLng={longitude ?? undefined}
          />
        )}

        {/* Offline fallback map */}
        {mapFailed && (
          <div className="w-full h-full relative overflow-hidden" style={{ background: appTokens.dark }}>
            <div className="absolute inset-0" style={{
              backgroundImage: "linear-gradient(color-mix(in srgb, var(--color-accent) 6%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 6%, transparent) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }} />
            <HeatmapFallback hotspots={liveHotspots} visible={filters.showHeatmap} center={center} />
            {filtered.slice(0, 12).map((p, i) => {
              const color = MODE_COLORS[p.mode] || "var(--color-accent)";
              return (
                <m.button
                  key={`fb-${i}`}
                  className="absolute flex items-center justify-center cursor-pointer"
                  style={{
                    width: 40, height: 40, borderRadius: "50%", overflow: "hidden",
                    border: `3px solid ${color}`,
                    boxShadow: `0 0 12px ${color}44`,
                    top: `${20 + ((p.pos.lat - center.lat + 0.015) / 0.03) * 60}%`,
                    left: `${10 + ((p.pos.lng - center.lng + 0.015) / 0.03) * 80}%`,
                  }}
                  variants={mapVariants.marker}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  whileTap={micro.tapScale}
                  onClick={() => { setSelectedId(p.id); setSelectedEvent(null); setFlyInAnchor(null); }}
                >
                  <Image src={p.photo} alt={p.name} fill sizes="40px" style={{ objectFit: "cover" }} />
                </m.button>
              );
            })}
            <m.div
              className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...springs.heavy, delay: 0.3 }}
            >
              <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
                <span className="text-[11px] text-white/70 whitespace-nowrap">Carte hors-ligne</span>
              </div>
            </m.div>
          </div>
        )}

        {/* Floating actions bottom-right — single consolidated column */}
        {!selected && !selectedEvent && !mapFailed && (
          <MapFloatingActions
            onRecenter={handleRecenter}
            onRoute={() => setShowRouteModal(true)}
            onRefresh={handleActivityRefresh}
            canRecenter={Boolean(latitude && longitude)}
            geoStale={geoStale}
            refreshing={activityRefreshing}
          />
        )}

        {/* Horizontal carousel of on-map items */}
        {!selected && !selectedEvent && !mapFailed && carouselItems.length > 0 && (
          <MapCarousel items={carouselItems} onSelect={handleCarouselSelect} />
        )}

        {/* Cross-link to Plans (only if no carousel content) */}
        {!selected && !selectedEvent && !mapFailed && carouselItems.length === 0 && (
          <div
            className="absolute left-3 right-3 z-[900] flex gap-2"
            style={{ bottom: "calc(260px + env(safe-area-inset-bottom))" }}
          >
            <m.div className="flex-1" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...springs.heavy, delay: 0.4 }}>
              <CrossLinkCard emoji="🔥" title="Soirees ce soir" subtitle={`${geoEvents.length} events`} href="/events" />
            </m.div>
          </div>
        )}

        {/* Cinematic fly-in card for selected profile */}
        <AnimatePresence>
          {selected && (
            <ProfileFlyInCard
              key={selected.id}
              profile={selected}
              anchor={flyInAnchor}
              onClose={handleCloseFlyIn}
            />
          )}
        </AnimatePresence>

        {/* Cinematic fly-in card for selected event (U4 Wave 14) */}
        <AnimatePresence>
          {selectedEvent && (
            <EventFlyInCard
              key={selectedEvent.id}
              event={selectedEvent}
              anchor={eventAnchor}
              onClose={handleCloseEvent}
              onRsvp={handleEventRsvp}
            />
          )}
        </AnimatePresence>

        {/* Route modal (stub) */}
        <AnimatePresence>
          {showRouteModal && (
            <>
              <m.div
                className="fixed inset-0 z-[1200] bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRouteModal(false)}
              />
              <m.div
                className="fixed bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 z-[1201] bg-bg border border-border rounded-2xl p-6 shadow-2xl max-w-sm w-[90%]"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={springs.heavy}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🎯</div>
                  <h3 className="text-[16px] font-bold mb-2">Itineraire</h3>
                  <p className="text-[12px] text-text-muted mb-4">
                    Bientot disponible. Tu pourras naviguer jusqu&apos;a ton plan avec les transports en commun.
                  </p>
                  <m.button
                    onClick={() => setShowRouteModal(false)}
                    className="w-full gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold tap-target"
                    whileTap={micro.tapScale}
                  >
                    Compris
                  </m.button>
                </div>
              </m.div>
            </>
          )}
        </AnimatePresence>

        {/* Filters bottom-sheet */}
        <MapFiltersSheet
          open={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onChange={setFilters}
        />
      </div>
    </div>
  );
}
