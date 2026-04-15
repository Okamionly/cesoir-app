"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useGeolocation } from "@/lib/useGeolocation";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/lib/useProfiles";
import { MOCK_PROFILES, Profile } from "@/lib/mock-profiles";
import { MODES, ModeKey, MODE_KEYS } from "@/lib/modes";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function fakePos(lat: number, lng: number, km: number) {
  const r = km / 111;
  return { lat: lat + (Math.random() - 0.5) * 2 * r, lng: lng + (Math.random() - 0.5) * 2 * r };
}

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

interface HeatZone {
  lat: number;
  lng: number;
  intensity: "low" | "medium" | "high";
  radius: number;
}

export default function MapPage() {
  const { user } = useAuth();
  const { position, error, loading } = useGeolocation(user?.id);
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
  const heatMarkersRef = useRef<HTMLDivElement[]>([]);

  const center = position ? { lat: position.lat, lng: position.lng } : { lat: 48.8566, lng: 2.3522 };
  const { profiles: realProfiles } = useProfiles(position?.lat, position?.lng, filter === "all" ? undefined : filter);

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

  // Mock heat zones
  const heatZones = useMemo<HeatZone[]>(() => [
    { lat: center.lat + 0.003, lng: center.lng + 0.005, intensity: "high", radius: 120 },
    { lat: center.lat - 0.005, lng: center.lng + 0.002, intensity: "medium", radius: 90 },
    { lat: center.lat + 0.008, lng: center.lng - 0.003, intensity: "high", radius: 100 },
    { lat: center.lat - 0.002, lng: center.lng - 0.007, intensity: "low", radius: 80 },
    { lat: center.lat + 0.001, lng: center.lng + 0.009, intensity: "medium", radius: 110 },
    { lat: center.lat - 0.007, lng: center.lng + 0.006, intensity: "low", radius: 70 },
    { lat: center.lat + 0.006, lng: center.lng + 0.001, intensity: "high", radius: 130 },
    { lat: center.lat - 0.003, lng: center.lng - 0.002, intensity: "medium", radius: 85 },
  ], [center.lat, center.lng]);

  useEffect(() => { setMounted(true); }, []);

  // Init map
  useEffect(() => {
    if (!mounted || !mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
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

    filtered.forEach(p => {
      const color = MODE_COLORS[p.mode] || "#8B5CF6";

      const el = document.createElement("div");
      el.style.cssText = `
        width: 40px; height: 40px; border-radius: 50%; overflow: hidden;
        border: 3px solid ${color}; cursor: pointer;
        box-shadow: 0 0 12px ${color}44;
        transition: transform 0.2s;
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
        background: linear-gradient(135deg, #8B5CF6, #00FF88);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 20px rgba(139,92,246,0.4);
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
            0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(139,92,246,0.4); }
            50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(139,92,246,0.6); }
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

  // Heat map overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old heat markers
    heatMarkersRef.current.forEach(el => el.remove());
    heatMarkersRef.current = [];

    if (!showHeatMap) return;

    heatZones.forEach(zone => {
      const colors: Record<string, { bg: string; border: string; glow: string }> = {
        low: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", glow: "0 0 20px rgba(59,130,246,0.15)" },
        medium: { bg: "rgba(139,92,246,0.18)", border: "rgba(139,92,246,0.35)", glow: "0 0 30px rgba(139,92,246,0.25)" },
        high: { bg: "rgba(236,72,153,0.22)", border: "rgba(139,92,246,0.45)", glow: "0 0 40px rgba(236,72,153,0.35)" },
      };
      const style = colors[zone.intensity];

      const el = document.createElement("div");
      el.style.cssText = `
        width: ${zone.radius * 2}px; height: ${zone.radius * 2}px;
        border-radius: 50%; pointer-events: none;
        background: radial-gradient(circle, ${style.bg} 0%, transparent 70%);
        border: 1px solid ${style.border};
        box-shadow: ${style.glow};
        ${zone.intensity === "high" ? "animation: heat-pulse 3s ease-in-out infinite;" : ""}
      `;

      if (zone.intensity === "high" && !document.getElementById("heat-pulse-styles")) {
        const styleTag = document.createElement("style");
        styleTag.id = "heat-pulse-styles";
        styleTag.textContent = `
          @keyframes heat-pulse {
            0%, 100% { opacity: 0.7; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }
        `;
        document.head.appendChild(styleTag);
      }

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([zone.lng, zone.lat])
        .addTo(map);

      heatMarkersRef.current.push(el);
      markersRef.current.push(marker);
    });
  }, [showHeatMap, heatZones]);

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
            <Link
              href="/flash-plans"
              className="flex items-center gap-1 bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full tap-target"
            >
              <span className="text-[10px]" aria-hidden="true">⚡</span>
              <span className="text-[10px] text-accent font-semibold">Flash Plans</span>
            </Link>
            <button
              onClick={() => setShowHeatMap(!showHeatMap)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border tap-target transition-all ${
                showHeatMap
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-text-muted"
              }`}
              aria-pressed={showHeatMap}
            >
              Zones chaudes {showHeatMap ? "●" : "○"}
            </button>
            <div className="text-[11px] text-text-muted">
              {loading ? "Localisation..." : error ? <span className="text-danger">{error}</span> : <><span className="w-1.5 h-1.5 rounded-full bg-safe inline-block mr-1" />{filtered.length}</>}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setFilter("all")} className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold border tap-target ${filter === "all" ? "border-accent gradient-bg-subtle text-accent" : "border-border text-text-muted"}`}>
            Tout ({MOCK_PROFILES.length})
          </button>
          {MODE_KEYS.map(k => {
            const count = MOCK_PROFILES.filter(p => p.mode === k).length;
            if (count === 0) return null;
            return (
              <button key={k} onClick={() => setFilter(k)} className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold border tap-target ${filter === k ? "border-accent gradient-bg-subtle text-accent" : "border-border text-text-muted"}`}>
                {MODES[k].icon} {count}
              </button>
            );
          })}
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative z-0" style={{ minHeight: "calc(100vh - 120px)" }}>
        <div ref={mapContainer} className="w-full h-full" style={{ display: mapFailed ? "none" : "block" }} />

        {/* Offline fallback map */}
        {mapFailed && (
          <div className="w-full h-full relative overflow-hidden" style={{ background: "#1a1a2e" }}>
            {/* CSS Grid lines */}
            <div className="absolute inset-0" style={{
              backgroundImage: "linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }} />
            {/* Larger grid */}
            <div className="absolute inset-0" style={{
              backgroundImage: "linear-gradient(rgba(139,92,246,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.12) 1px, transparent 1px)",
              backgroundSize: "300px 300px",
            }} />

            {/* Heat zones */}
            {showHeatMap && heatZones.map((zone, i) => {
              const colors = {
                low: "rgba(59,130,246,0.15)",
                medium: "rgba(139,92,246,0.22)",
                high: "rgba(236,72,153,0.28)",
              };
              return (
                <div
                  key={`heat-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: zone.radius * 2,
                    height: zone.radius * 2,
                    background: `radial-gradient(circle, ${colors[zone.intensity]} 0%, transparent 70%)`,
                    top: `${30 + (zone.lat - center.lat) * 5000}%`,
                    left: `${50 + (zone.lng - center.lng) * 5000}%`,
                    transform: "translate(-50%, -50%)",
                    animation: zone.intensity === "high" ? "pulse-dot 3s ease-in-out infinite" : undefined,
                  }}
                />
              );
            })}

            {/* Profile markers on fallback */}
            {filtered.slice(0, 12).map((p, i) => {
              const color = MODE_COLORS[p.mode] || "#8B5CF6";
              return (
                <button
                  key={`fb-${i}`}
                  className="absolute flex items-center justify-center cursor-pointer transition-transform hover:scale-125"
                  style={{
                    width: 40, height: 40, borderRadius: "50%", overflow: "hidden",
                    border: `3px solid ${color}`,
                    boxShadow: `0 0 12px ${color}44`,
                    top: `${20 + ((p.pos.lat - center.lat + 0.015) / 0.03) * 60}%`,
                    left: `${10 + ((p.pos.lng - center.lng + 0.015) / 0.03) * 80}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => { setSelected(p); setSelectedEvent(null); }}
                >
                  <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              );
            })}

            {/* Open events on fallback */}
            {openEvents.map((ev, i) => (
              <button
                key={`fb-ev-${i}`}
                className="absolute flex items-center justify-center cursor-pointer"
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  boxShadow: "0 0 20px rgba(139,92,246,0.4)",
                  top: `${20 + ((ev.lat - center.lat + 0.015) / 0.03) * 60}%`,
                  left: `${10 + ((ev.lng - center.lng + 0.015) / 0.03) * 80}%`,
                  transform: "translate(-50%, -50%)",
                  animation: "pulse-dot 2s ease-in-out infinite",
                }}
                onClick={() => { setSelectedEvent(ev); setSelected(null); }}
              >
                <span style={{ fontSize: 22 }}>🎉</span>
              </button>
            ))}

            {/* Offline notice */}
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
                <span className="text-[11px] text-white/70 whitespace-nowrap">Carte hors-ligne — connecte-toi pour la carte complete</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected profile */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="absolute bottom-24 left-3 right-3 z-[1000]"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="bg-bg border border-border rounded-2xl p-4 shadow-glow">
                <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-xs text-text-muted tap-target" aria-label="Fermer">✕</button>

                <div className="flex items-center gap-3 mb-3">
                  <img src={selected.photo} alt={selected.name} className="w-14 h-14 rounded-full object-cover border-2" style={{ borderColor: MODE_COLORS[selected.mode] }} />
                  <div>
                    <h3 className="text-[15px] font-bold">{selected.name}, {selected.age}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <span>📍 {selected.distance} km</span>
                      <span className="text-accent font-semibold">{selected.time}</span>
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
                  <button className="flex-1 gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold active:scale-95 transition-transform tap-target">♥ Like</button>
                  <button className="px-4 py-2.5 border border-border rounded-full text-[12px] font-medium text-text-muted active:scale-95 transition-transform tap-target">Profil</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected open event */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              className="absolute bottom-24 left-3 right-3 z-[1000]"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="bg-bg border border-accent/20 rounded-2xl p-4 shadow-glow">
                <button onClick={() => setSelectedEvent(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-xs text-text-muted tap-target" aria-label="Fermer">✕</button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-[22px] shadow-glow">
                    🎉
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-text">{selectedEvent.title}</h3>
                    <p className="text-[11px] text-text-muted">{selectedEvent.time} · {selectedEvent.spots}</p>
                  </div>
                </div>

                <p className="text-[12px] text-text-muted mb-3">Soiree ouverte pres de toi</p>

                <motion.button
                  className="w-full gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold shadow-glow tap-target"
                  whileTap={{ scale: 0.96 }}
                >
                  Demander a rejoindre
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
