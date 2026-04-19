"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { mapVariants, springs, micro, ambient } from "@/lib/motion-design";
import Link from "next/link";
import { useGeolocation } from "@/lib/useGeolocation";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/lib/useProfiles";
import { MOCK_PROFILES, Profile } from "@/lib/mock-profiles";
import { MODES, ModeKey, MODE_KEYS } from "@/lib/modes";
import { useHotspots } from "@/lib/useHotspots";
import HeatmapOverlay, { HeatmapFallback } from "@/components/map/HeatmapOverlay";
import LiveActivityPanel from "@/components/map/LiveActivityPanel";
import CrossLinkCard from "@/components/app/CrossLinkCard";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function fakePos(lat: number, lng: number, km: number) {
  const r = km / 111;
  return { lat: lat + (Math.random() - 0.5) * 2 * r, lng: lng + (Math.random() - 0.5) * 2 * r };
}

// Per-mode brand colors — domain meta array (matches src/lib/modes.ts semantics,
// kept as raw hex because they encode product-specific mode identity, not UI
// surface tokens. Do NOT map to the W&B palette.)
const MODE_COLORS: Record<string, string> = {
  "solo-diner": "#8B5CF6", "plus-one": "#EC4899", "tourist": "#06B6D4",
  "night-owl": "#6366F1", "breakup": "#22C55E", "new-in-town": "#F59E0B",
  "langue": "#06B6D4", "dog-date": "#F59E0B", "seasonal": "#EF4444",
  "fit-date": "#F97316", "foodie-quest": "#DC2626", "culture-club": "#7C3AED",
  "sober-tonight": "#059669", "gamer-night": "#2563EB",
};

interface OpenEvent {
  id: string;
  title: string;
  time: string;
  spots: string;
  lat: number;
  lng: number;
}

export default function MapPage() {
  const { user } = useAuth();
  const { latitude, longitude, error, loading } = useGeolocation();
  const [filter, setFilter] = useState<ModeKey | "all">("all");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<OpenEvent | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const eventMarkersRef = useRef<maplibregl.Marker[]>([]);
  const center = latitude && longitude ? { lat: latitude, lng: longitude } : { lat: 48.8566, lng: 2.3522 };
  const { profiles: realProfiles } = useProfiles(latitude ?? undefined, longitude ?? undefined, filter === "all" ? undefined : filter);
  const { hotspots: liveHotspots, loading: hotspotsLoading, refresh: refreshHotspots, lastUpdated } = useHotspots();

  const profilesWithPos = useMemo(() => {
    if (realProfiles.length > 0) {
      return realProfiles.map(p => ({ ...p, pos: { lat: center.lat + (Math.random() - 0.5) * 0.02, lng: center.lng + (Math.random() - 0.5) * 0.02 } }));
    }
    return MOCK_PROFILES.map(p => ({ ...p, pos: fakePos(center.lat, center.lng, p.distance) }));
  }, [realProfiles, center.lat, center.lng]);

  const filtered = filter === "all" ? profilesWithPos : profilesWithPos.filter(p => p.mode === filter);

  // Mock open events
  const openEvents = useMemo<OpenEvent[]>(() => [
    { id: "ev1", title: "Apero chez Marie", time: "20h", spots: "3/8 places", lat: center.lat + 0.005, lng: center.lng + 0.008 },
    { id: "ev2", title: "Soiree jeux Oberkampf", time: "19h30", spots: "5/10 places", lat: center.lat - 0.004, lng: center.lng + 0.003 },
    { id: "ev3", title: "Concert rooftop", time: "21h", spots: "12/20 places", lat: center.lat + 0.007, lng: center.lng - 0.006 },
    { id: "ev4", title: "Diner partage Belleville", time: "20h30", spots: "4/6 places", lat: center.lat - 0.006, lng: center.lng - 0.004 },
  ], [center.lat, center.lng]);

  useEffect(() => { setMounted(true); }, []);

  // Init map
  useEffect(() => {
    if (!mounted || !mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      // Carto Positron = light basemap, matches the White Fluo Minimal
      // palette. Was dark-matter-gl-style before which rendered as
      // "half black" on the light app (UI audit 2026-04-19).
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [center.lng, center.lat],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;

    // Fallback: if tiles fail to load within 3s, show offline map
    const fallbackTimer = setTimeout(() => {
      if (mapRef.current && !mapRef.current.isStyleLoaded()) {
        setMapFailed(true);
      }
    }, 3000);

    map.on("load", () => {
      clearTimeout(fallbackTimer);
      setMapFailed(false);
    });

    map.on("error", () => {
      setMapFailed(true);
    });

    return () => { clearTimeout(fallbackTimer); map.remove(); mapRef.current = null; };
  }, [mounted, center.lat, center.lng]);

  // Update profile markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Inject radial-burst keyframes once for MapLibre DOM markers
    if (!document.getElementById("radial-burst-styles")) {
      const burstStyle = document.createElement("style");
      burstStyle.id = "radial-burst-styles";
      burstStyle.textContent = `
        @keyframes radial-burst {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(burstStyle);
    }

    filtered.forEach((p, idx) => {
      const color = MODE_COLORS[p.mode] || "var(--color-accent)";

      const el = document.createElement("div");
      el.style.cssText = `
        width: 40px; height: 40px; border-radius: 50%; overflow: hidden;
        border: 3px solid ${color}; cursor: pointer;
        box-shadow: 0 0 12px ${color}44;
        transform: scale(0); opacity: 0;
        animation: radial-burst 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.05}s forwards;
      `;
      el.innerHTML = `<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;" />`;
      el.onmouseenter = () => { el.style.transform = "scale(1.2)"; };
      el.onmouseleave = () => { el.style.transform = "scale(1)"; };
      el.onclick = () => { setSelected(p); setSelectedEvent(null); };

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.pos.lng, p.pos.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filtered]);

  // Update open event markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    eventMarkersRef.current.forEach(m => m.remove());
    eventMarkersRef.current = [];

    openEvents.forEach(ev => {
      const el = document.createElement("div");
      el.style.cssText = `
        width: 48px; height: 48px; border-radius: 50%; cursor: pointer;
        background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 20px color-mix(in srgb, var(--color-accent) 40%, transparent);
        animation: pulse-event 2s ease-in-out infinite;
      `;
      el.innerHTML = `<span style="font-size:22px;">🎉</span>`;
      el.onclick = () => { setSelectedEvent(ev); setSelected(null); };

      // Add pulse animation via style tag
      if (!document.getElementById("event-marker-styles")) {
        const style = document.createElement("style");
        style.id = "event-marker-styles";
        style.textContent = `
          @keyframes pulse-event {
            0%, 100% { transform: scale(1); box-shadow: 0 0 20px color-mix(in srgb, var(--color-accent) 40%, transparent); }
            50% { transform: scale(1.1); box-shadow: 0 0 30px color-mix(in srgb, var(--color-accent) 60%, transparent); }
          }
        `;
        document.head.appendChild(style);
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([ev.lng, ev.lat])
        .addTo(map);

      eventMarkersRef.current.push(marker);
    });
  }, [openEvents]);

  if (!mounted) return (
    <div className="h-screen bg-bg flex items-center justify-center">
      <span className="text-3xl text-accent animate-pulse">☾</span>
    </div>
  );

  return (
    <div className="h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 pt-2 pb-1 border-b border-border z-[1000] bg-bg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg text-accent" aria-hidden="true">☾</span>
            <span className="text-base font-bold">Carte</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={micro.hoverLift} whileTap={micro.tapScale}>
              <Link
                href="/discover"
                className="flex items-center gap-1 bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full tap-target"
              >
                <span className="text-[10px]" aria-hidden="true">🔍</span>
                <span className="text-[10px] text-accent font-semibold">Decouvrir</span>
              </Link>
            </motion.div>
            <motion.div whileHover={micro.hoverLift} whileTap={micro.tapScale}>
              <Link
                href="/plans?type=flash"
                className="flex items-center gap-1 bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full tap-target"
              >
                <span className="text-[10px]" aria-hidden="true">⚡</span>
                <span className="text-[10px] text-accent font-semibold">Flash Plans</span>
              </Link>
            </motion.div>
            <motion.button
              onClick={() => setShowHeatMap(!showHeatMap)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border tap-target transition-all ${
                showHeatMap
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-text-muted"
              }`}
              aria-pressed={showHeatMap}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              transition={springs.micro}
            >
              Zones chaudes {showHeatMap ? "●" : "○"}
            </motion.button>
            <div className="text-[11px] text-text-muted">
              {loading ? "Localisation..." : error ? <span className="text-danger">{error}</span> : <><span className="w-1.5 h-1.5 rounded-full bg-safe inline-block mr-1" /><motion.span key={`count-${filtered.length}`} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={springs.snap}>{filtered.length}</motion.span></>}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
          <motion.button
            onClick={() => setFilter("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold border tap-target ${filter === "all" ? "border-accent gradient-bg-subtle text-accent" : "border-border text-text-muted"}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.snap, delay: 0 }}
            whileTap={micro.tapScale}
          >
            Tout ({MOCK_PROFILES.length})
          </motion.button>
          {MODE_KEYS.map((k, i) => {
            const count = MOCK_PROFILES.filter(p => p.mode === k).length;
            if (count === 0) return null;
            return (
              <motion.button
                key={k}
                onClick={() => setFilter(k)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold border tap-target ${filter === k ? "border-accent gradient-bg-subtle text-accent" : "border-border text-text-muted"}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.snap, delay: (i + 1) * 0.04 }}
                whileTap={micro.tapScale}
              >
                {MODES[k].icon} <motion.span key={`${k}-${count}`} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={springs.snap}>{count}</motion.span>
              </motion.button>
            );
          })}
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative z-0" style={{ minHeight: "calc(100vh - 120px)" }}>
        <div ref={mapContainer} className="w-full h-full" style={{ display: mapFailed ? "none" : "block" }} />

        {/* User position pulsing dot */}
        {latitude && longitude && !mapFailed && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
            style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--color-accent)" }}
            animate={mapVariants.userDot.idle}
          />
        )}

        {/* Live heatmap overlay on MapLibre */}
        <HeatmapOverlay
          hotspots={liveHotspots}
          map={mapRef.current}
          visible={showHeatMap}
          onToggle={() => setShowHeatMap(!showHeatMap)}
        />

        {/* Live activity panel */}
        {!selected && !selectedEvent && (
          <LiveActivityPanel
            hotspots={liveHotspots}
            loading={hotspotsLoading}
            lastUpdated={lastUpdated}
            onRefresh={refreshHotspots}
            userLat={latitude ?? undefined}
            userLng={longitude ?? undefined}
          />
        )}

        {/* Offline fallback map */}
        {mapFailed && (
          <div className="w-full h-full relative overflow-hidden" style={{ background: "#1a1a2e" /* dark atmospheric map tint — intentional out-of-palette offline fallback */ }}>
            {/* CSS Grid lines */}
            <div className="absolute inset-0" style={{
              backgroundImage: "linear-gradient(color-mix(in srgb, var(--color-accent) 6%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 6%, transparent) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }} />
            {/* Larger grid */}
            <div className="absolute inset-0" style={{
              backgroundImage: "linear-gradient(color-mix(in srgb, var(--color-accent) 12%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 12%, transparent) 1px, transparent 1px)",
              backgroundSize: "300px 300px",
            }} />

            {/* Heatmap fallback layer */}
            <HeatmapFallback hotspots={liveHotspots} visible={showHeatMap} center={center} />

            {/* Profile markers on fallback — radial burst */}
            {filtered.slice(0, 12).map((p, i) => {
              const color = MODE_COLORS[p.mode] || "var(--color-accent)";
              return (
                <motion.button
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
                  whileHover={{ scale: 1.25, transition: springs.snap }}
                  whileTap={micro.tapScale}
                  onClick={() => { setSelected(p); setSelectedEvent(null); }}
                >
                  <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </motion.button>
              );
            })}

            {/* Open events on fallback — radial burst */}
            {openEvents.map((ev, i) => (
              <motion.button
                key={`fb-ev-${i}`}
                className="absolute flex items-center justify-center cursor-pointer"
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                  boxShadow: "0 0 20px color-mix(in srgb, var(--color-accent) 40%, transparent)",
                  top: `${20 + ((ev.lat - center.lat + 0.015) / 0.03) * 60}%`,
                  left: `${10 + ((ev.lng - center.lng + 0.015) / 0.03) * 80}%`,
                }}
                variants={mapVariants.marker}
                initial="hidden"
                animate="visible"
                custom={filtered.length + i}
                whileTap={micro.tapScale}
                onClick={() => { setSelectedEvent(ev); setSelected(null); }}
              >
                <span style={{ fontSize: 22 }}>🎉</span>
              </motion.button>
            ))}

            {/* Offline notice — slide up */}
            <motion.div
              className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...springs.heavy, delay: 0.3 }}
            >
              <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
                <span className="text-[11px] text-white/70 whitespace-nowrap">Carte hors-ligne — connecte-toi pour la carte complete</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Cross-link button — Plans */}
        {!selected && !selectedEvent && (
          <div className="absolute bottom-28 left-3 right-3 z-[900] flex gap-2">
            <motion.div className="flex-1" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...springs.heavy, delay: 0.4 }}>
              <CrossLinkCard emoji="🔥" title="Plans ce soir" subtitle={`${openEvents.length} plans`} href="/plans" />
            </motion.div>
          </div>
        )}

        {/* Selected profile — bottom sheet with springs.heavy */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="absolute bottom-24 left-3 right-3 z-[1000]"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={springs.heavy}
            >
              <div className="bg-bg border border-border rounded-2xl p-4 shadow-glow">
                <motion.button
                  onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-xs text-text-muted tap-target"
                  aria-label="Fermer"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springs.micro}
                >✕</motion.button>

                <div className="flex items-center gap-3 mb-3">
                  <motion.img
                    src={selected.photo}
                    alt={selected.name}
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
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                  <motion.span
                    className="bg-accent/10 border border-accent/15 px-2.5 py-0.5 rounded-full text-[10px] text-accent font-medium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...springs.snap, delay: 0.15 }}
                  >
                    {MODES[selected.mode].icon} {MODES[selected.mode].name}
                  </motion.span>
                  {selected.cuisine && <motion.span className="bg-bg-card border border-border px-2 py-0.5 rounded-full text-[10px] text-text-muted" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...springs.snap, delay: 0.2 }}>🍽️ {selected.cuisine}</motion.span>}
                  {selected.dog && <motion.span className="bg-bg-card border border-border px-2 py-0.5 rounded-full text-[10px] text-text-muted" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...springs.snap, delay: 0.25 }}>🐶 {selected.dog}</motion.span>}
                </div>

                <p className="text-[12px] text-text-muted leading-relaxed line-clamp-2 mb-3">{selected.bio}</p>

                <motion.div
                  className="flex gap-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...springs.heavy, delay: 0.2 }}
                >
                  <motion.button
                    className="flex-1 gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold tap-target"
                    whileTap={micro.tapScale}
                  >♥ Like</motion.button>
                  <motion.button
                    className="px-4 py-2.5 border border-border rounded-full text-[12px] font-medium text-text-muted tap-target"
                    whileTap={micro.tapScale}
                  >Profil</motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected open event — bottom sheet with springs.heavy */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              className="absolute bottom-24 left-3 right-3 z-[1000]"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={springs.heavy}
            >
              <div className="bg-bg border border-accent/20 rounded-2xl p-4 shadow-glow">
                <motion.button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-xs text-text-muted tap-target"
                  aria-label="Fermer"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springs.micro}
                >✕</motion.button>

                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-[22px] shadow-glow"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...springs.elastic, delay: 0.1 }}
                  >
                    🎉
                  </motion.div>
                  <div>
                    <h3 className="text-[15px] font-bold text-text">{selectedEvent.title}</h3>
                    <p className="text-[11px] text-text-muted">{selectedEvent.time} · <motion.span key={`spots-${selectedEvent.id}`} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={springs.snap}>{selectedEvent.spots}</motion.span></p>
                  </div>
                </div>

                <p className="text-[12px] text-text-muted mb-3">Soiree ouverte pres de toi</p>

                <motion.button
                  className="w-full gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold shadow-glow tap-target"
                  whileTap={micro.tapScale}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...springs.heavy, delay: 0.15 }}
                >
                  Demander a rejoindre
                </motion.button>

                {/* Nearby events */}
                {openEvents.filter(ev => ev.id !== selectedEvent.id).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-2">
                      Aussi a proximite
                    </p>
                    <div className="space-y-1.5">
                      {openEvents.filter(ev => ev.id !== selectedEvent.id).slice(0, 2).map(ev => (
                        <motion.button
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
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-muted shrink-0" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
