"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "motion/react";
import { mapVariants, springs, micro } from "@/lib/motion-design";
import Link from "next/link";
import { useGeolocation } from "@/lib/useGeolocation";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/lib/useProfiles";
import { MOCK_PROFILES, Profile } from "@/lib/mock-profiles";
import { MODES, ModeKey } from "@/lib/modes";
import { MODE_COLORS } from "@/lib/mode-colors";
import { app as appTokens } from "@/lib/design-tokens";
import { useHotspots } from "@/lib/useHotspots";
import { HeatmapFallback } from "@/components/map/HeatmapOverlay";
import LiveActivityPanel from "@/components/map/LiveActivityPanel";
import CrossLinkCard from "@/components/app/CrossLinkCard";
import PageHeader from "@/components/ui/PageHeader";
import MotionImage from "@/components/motion/MotionImage";
import { ChevronRight } from "@/components/ui/lucide";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import MapSearchBar from "@/components/map/MapSearchBar";
import MapFiltersSheet, { DEFAULT_FILTERS, type MapFilters } from "@/components/map/MapFiltersSheet";
import MapFloatingActions from "@/components/map/MapFloatingActions";
import MapCarousel, { type MapCarouselItem } from "@/components/map/MapCarousel";

function fakePos(lat: number, lng: number, km: number) {
  const r = km / 111;
  return { lat: lat + (Math.random() - 0.5) * 2 * r, lng: lng + (Math.random() - 0.5) * 2 * r };
}

interface OpenEvent {
  id: string;
  title: string;
  time: string;
  spots: string;
  lat: number;
  lng: number;
}

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

export default function MapPage() {
  const { user } = useAuth();
  const { latitude, longitude, error, loading } = useGeolocation();
  const [selected, setSelected] = useState<ProfileWithPos | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<OpenEvent | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [zoom, setZoom] = useState(13);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const eventMarkersRef = useRef<maplibregl.Marker[]>([]);
  const center = latitude && longitude ? { lat: latitude, lng: longitude } : { lat: 48.8566, lng: 2.3522 };
  const currentModeFilter: ModeKey | undefined = filters.modes.length === 1 ? filters.modes[0] : undefined;
  const { profiles: realProfiles } = useProfiles(latitude ?? undefined, longitude ?? undefined, currentModeFilter);
  const { hotspots: liveHotspots } = useHotspots();

  // Combine real + mock profiles with positions
  const profilesWithPos = useMemo<ProfileWithPos[]>(() => {
    const src: Profile[] = realProfiles.length > 0 ? realProfiles : MOCK_PROFILES;
    return src.map((p, i) => ({
      ...p,
      pos: realProfiles.length > 0
        ? { lat: center.lat + (Math.random() - 0.5) * 0.02, lng: center.lng + (Math.random() - 0.5) * 0.02 }
        : fakePos(center.lat, center.lng, p.distance),
      // Mark ~60% of profiles as online for live pulse demo
      online: i % 3 !== 0,
    }));
  }, [realProfiles, center.lat, center.lng]);

  // Apply filters (modes + age + distance + online)
  const filtered = useMemo<ProfileWithPos[]>(() => {
    return profilesWithPos.filter(p => {
      if (filters.modes.length > 0 && !filters.modes.includes(p.mode)) return false;
      if (p.age < filters.ageMin || p.age > filters.ageMax) return false;
      if (p.distance > filters.distanceKm) return false;
      if (filters.showOnlineOnly && !p.online) return false;
      return true;
    });
  }, [profilesWithPos, filters]);

  // Mock open events (filtered by toggle)
  const openEvents = useMemo<OpenEvent[]>(() => {
    if (!filters.showEvents) return [];
    return [
      { id: "ev1", title: "Apero chez Marie", time: "20h", spots: "3/8 places", lat: center.lat + 0.005, lng: center.lng + 0.008 },
      { id: "ev2", title: "Soiree jeux Oberkampf", time: "19h30", spots: "5/10 places", lat: center.lat - 0.004, lng: center.lng + 0.003 },
      { id: "ev3", title: "Concert rooftop", time: "21h", spots: "12/20 places", lat: center.lat + 0.007, lng: center.lng - 0.006 },
      { id: "ev4", title: "Diner partage Belleville", time: "20h30", spots: "4/6 places", lat: center.lat - 0.006, lng: center.lng - 0.004 },
    ];
  }, [center.lat, center.lng, filters.showEvents]);

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

  useEffect(() => { setMounted(true); }, []);

  // Init map once when mounted
  useEffect(() => {
    if (!mounted || !mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
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

      // Native heatmap source + layer for the hotspots data.
      // Added once; visibility toggled via layout property on filter change.
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
    if (!map || didFirstCenterRef.current || !latitude || !longitude) return;
    map.easeTo({ center: [longitude, latitude], zoom: 14, duration: 600 });
    didFirstCenterRef.current = true;
  }, [latitude, longitude]);

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
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [liveHotspots, filters.showHeatmap]);

  // --- Render clustered profile markers -------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;

    // Inject marker keyframes once
    if (!document.getElementById("map-marker-styles")) {
      const style = document.createElement("style");
      style.id = "map-marker-styles";
      style.textContent = `
        @keyframes radial-burst {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes online-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes event-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .map-marker, .event-marker { animation: none !important; }
          .online-pulse-ring { display: none !important; }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const clusters = clusterIndex.getClusters(bounds, Math.round(zoom));
    const reduced = prefersReducedMotion();

    clusters.forEach((c, idx) => {
      const [lng, lat] = c.geometry.coordinates;
      const isCluster = (c.properties as { cluster?: boolean }).cluster;

      if (isCluster) {
        const cf = c as ClusterFeature;
        const count = cf.properties.point_count;
        const size = Math.min(64, 36 + count * 2);
        const el = document.createElement("div");
        el.className = "map-marker";
        el.style.cssText = `
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
          color: white; font-weight: 700; font-size: ${count > 99 ? 11 : 13}px;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          box-shadow: 0 0 24px color-mix(in srgb, var(--color-accent) 40%, transparent);
          border: 2px solid white;
          ${reduced ? "" : `animation: radial-burst 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.min(idx * 0.02, 0.4)}s both;`}
        `;
        el.textContent = `${count}`;
        el.onclick = () => {
          const expansionZoom = clusterIndex.getClusterExpansionZoom(cf.properties.cluster_id as unknown as number);
          map.easeTo({ center: [lng, lat], zoom: Math.min(expansionZoom + 0.5, 18), duration: 500 });
        };
        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        markersRef.current.push(marker);
      } else {
        const pf = c as PointFeature;
        const profile = profileById.get(pf.properties.profileId);
        if (!profile) return;
        const color = MODE_COLORS[profile.mode] || "var(--color-accent)";

        const el = document.createElement("div");
        el.className = "map-marker";
        el.style.cssText = `
          position: relative;
          width: 40px; height: 40px; border-radius: 50%; overflow: visible;
          cursor: pointer;
          ${reduced ? "" : `animation: radial-burst 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.min(idx * 0.02, 0.3)}s both;`}
        `;

        const img = document.createElement("div");
        img.style.cssText = `
          width: 40px; height: 40px; border-radius: 50%; overflow: hidden;
          border: 3px solid ${color}; box-shadow: 0 0 12px ${color}44;
          background-image: url("${profile.photo}"); background-size: cover; background-position: center;
          transition: transform 0.2s;
        `;
        el.appendChild(img);

        // Live pulse ring for online profiles
        if (profile.online && !reduced) {
          const ring = document.createElement("div");
          ring.className = "online-pulse-ring";
          ring.style.cssText = `
            position: absolute; inset: -6px; border-radius: 50%;
            border: 2px solid ${color};
            animation: online-pulse 2s ease-out infinite;
            pointer-events: none;
          `;
          el.appendChild(ring);
        }

        el.onmouseenter = () => { img.style.transform = "scale(1.15)"; };
        el.onmouseleave = () => { img.style.transform = "scale(1)"; };
        el.onclick = () => { setSelected(profile); setSelectedEvent(null); };

        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        markersRef.current.push(marker);
      }
    });
  }, [bounds, zoom, clusterIndex, profileById]);

  // --- Render event markers -------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    eventMarkersRef.current.forEach(m => m.remove());
    eventMarkersRef.current = [];

    const reduced = prefersReducedMotion();

    openEvents.forEach(ev => {
      const el = document.createElement("div");
      el.className = "event-marker";
      el.style.cssText = `
        width: 48px; height: 48px; border-radius: 50%; cursor: pointer;
        background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 20px color-mix(in srgb, var(--color-accent) 40%, transparent);
        border: 2px solid white;
        font-size: 22px;
        ${reduced ? "" : "animation: event-pulse 2s ease-in-out infinite;"}
      `;
      el.textContent = "🎉";
      el.onclick = () => { setSelectedEvent(ev); setSelected(null); };

      const marker = new maplibregl.Marker({ element: el }).setLngLat([ev.lng, ev.lat]).addTo(map);
      eventMarkersRef.current.push(marker);
    });
  }, [openEvents]);

  // --- Carousel items: profiles + events currently in viewport bounds -------
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
      openEvents.forEach(ev => {
        if (ev.lng >= w && ev.lng <= e && ev.lat >= s && ev.lat <= n) {
          items.push({
            type: "event",
            id: ev.id,
            title: ev.title,
            subtitle: `${ev.time} · ${ev.spots}`,
            lat: ev.lat,
            lng: ev.lng,
            emoji: "🎉",
          });
        }
      });
    }
    return items.slice(0, 20);
  }, [bounds, filtered, openEvents]);

  // --- Handlers -------------------------------------------------------------
  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map || !latitude || !longitude) return;
    map.easeTo({ center: [longitude, latitude], zoom: 14, duration: 600 });
  }, [latitude, longitude]);

  const handleSearchSelect = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: [lng, lat], zoom: 15, duration: 600 });
  }, []);

  const handleCarouselSelect = useCallback((item: MapCarouselItem) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: [item.lng, item.lat], zoom: 16, duration: 500 });
    if (item.type === "profile") {
      const p = profileById.get(item.id);
      if (p) { setSelected(p); setSelectedEvent(null); }
    } else if (item.type === "event") {
      const ev = openEvents.find(e => e.id === item.id);
      if (ev) { setSelectedEvent(ev); setSelected(null); }
    }
  }, [profileById, openEvents]);

  const activeFilterCount =
    filters.modes.length +
    (filters.showEvents ? 0 : 1) +
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

        <LiveActivityPanel
          hotspots={liveHotspots}
          loading={false}
          lastUpdated={new Date()}
          onRefresh={() => {}}
          userLat={latitude ?? undefined}
          userLng={longitude ?? undefined}
        />

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
                  onClick={() => { setSelected(p); setSelectedEvent(null); }}
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

        {/* Floating actions bottom-right */}
        {!selected && !selectedEvent && !mapFailed && (
          <MapFloatingActions
            onRecenter={handleRecenter}
            onRoute={() => setShowRouteModal(true)}
            canRecenter={Boolean(latitude && longitude)}
          />
        )}

        {/* Horizontal carousel of on-map items */}
        {!selected && !selectedEvent && !mapFailed && carouselItems.length > 0 && (
          <MapCarousel items={carouselItems} onSelect={handleCarouselSelect} />
        )}

        {/* Cross-link to Plans (only if no carousel content) */}
        {!selected && !selectedEvent && !mapFailed && carouselItems.length === 0 && (
          <div className="absolute bottom-28 left-3 right-3 z-[900] flex gap-2">
            <m.div className="flex-1" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...springs.heavy, delay: 0.4 }}>
              <CrossLinkCard emoji="🔥" title="Plans ce soir" subtitle={`${openEvents.length} plans`} href="/plans" />
            </m.div>
          </div>
        )}

        {/* Selected profile sheet */}
        <AnimatePresence>
          {selected && (
            <m.div
              className="absolute bottom-24 left-3 right-3 z-[1000]"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={springs.heavy}
            >
              <div className="bg-bg border border-border rounded-2xl p-4 shadow-glow">
                <m.button
                  onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-xs text-text-muted tap-target"
                  aria-label="Fermer"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springs.micro}
                >✕</m.button>

                <div className="flex items-center gap-3 mb-3">
                  <MotionImage
                    src={selected.photo}
                    alt={selected.name}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover border-2"
                    style={{ borderColor: MODE_COLORS[selected.mode] }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...springs.elastic, delay: 0.1 }}
                  />
                  <div>
                    <h3 className="text-[15px] font-bold">{selected.name}, {selected.age}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <span>📍 {selected.distance} km</span>
                      <span className="text-accent font-semibold">{selected.time}</span>
                      {selected.online && <span className="flex items-center gap-1 text-safe"><span className="w-1.5 h-1.5 rounded-full bg-safe inline-block animate-pulse" />Actif</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                  <span className="bg-accent/10 border border-accent/15 px-2.5 py-0.5 rounded-full text-[10px] text-accent font-medium">
                    {MODES[selected.mode].icon} {MODES[selected.mode].name}
                  </span>
                  {selected.cuisine && <span className="bg-bg-card border border-border px-2 py-0.5 rounded-full text-[10px] text-text-muted">🍽️ {selected.cuisine}</span>}
                  {selected.dog && <span className="bg-bg-card border border-border px-2 py-0.5 rounded-full text-[10px] text-text-muted">🐶 {selected.dog}</span>}
                </div>

                <p className="text-[12px] text-text-muted leading-relaxed line-clamp-2 mb-3">{selected.bio}</p>

                <div className="flex gap-2">
                  <m.button
                    className="flex-1 gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold tap-target"
                    whileTap={micro.tapScale}
                  >♥ Like</m.button>
                  <m.button
                    className="px-4 py-2.5 border border-border rounded-full text-[12px] font-medium text-text-muted tap-target"
                    whileTap={micro.tapScale}
                  >Profil</m.button>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Selected event sheet */}
        <AnimatePresence>
          {selectedEvent && (
            <m.div
              className="absolute bottom-24 left-3 right-3 z-[1000]"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={springs.heavy}
            >
              <div className="bg-bg border border-accent/20 rounded-2xl p-4 shadow-glow">
                <m.button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-xs text-text-muted tap-target"
                  aria-label="Fermer"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springs.micro}
                >✕</m.button>

                <div className="flex items-center gap-3 mb-3">
                  <m.div
                    className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-[22px] shadow-glow"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...springs.elastic, delay: 0.1 }}
                  >🎉</m.div>
                  <div>
                    <h3 className="text-[15px] font-bold text-text">{selectedEvent.title}</h3>
                    <p className="text-[11px] text-text-muted">{selectedEvent.time} · {selectedEvent.spots}</p>
                  </div>
                </div>

                <p className="text-[12px] text-text-muted mb-3">Soiree ouverte pres de toi</p>

                <m.button
                  className="w-full gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold shadow-glow tap-target"
                  whileTap={micro.tapScale}
                >
                  Demander a rejoindre
                </m.button>

                {openEvents.filter(ev => ev.id !== selectedEvent.id).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-2">
                      Aussi a proximite
                    </p>
                    <div className="space-y-1.5">
                      {openEvents.filter(ev => ev.id !== selectedEvent.id).slice(0, 2).map(ev => (
                        <m.button
                          key={ev.id}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-bg-card border border-border/30 text-left"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setSelectedEvent(ev); }}
                        >
                          <span className="text-sm">🎉</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-text truncate">{ev.title}</p>
                            <p className="text-[9px] text-text-muted">{ev.time} · {ev.spots}</p>
                          </div>
                          <ChevronRight size={10} strokeWidth={2} className="text-text-muted shrink-0" aria-hidden="true" />
                        </m.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </m.div>
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
