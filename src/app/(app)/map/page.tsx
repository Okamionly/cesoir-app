"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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

export default function MapPage() {
  const { user } = useAuth();
  const { position, error, loading } = useGeolocation(user?.id);
  const [filter, setFilter] = useState<ModeKey | "all">("all");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [mounted, setMounted] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const center = position ? { lat: position.lat, lng: position.lng } : { lat: 48.8566, lng: 2.3522 };
  const { profiles: realProfiles } = useProfiles(position?.lat, position?.lng, filter === "all" ? undefined : filter);

  // Use real profiles if available, fallback to mock with fake positions
  const profilesWithPos = useMemo(() => {
    if (realProfiles.length > 0) {
      return realProfiles.map(p => ({ ...p, pos: { lat: center.lat + (Math.random() - 0.5) * 0.02, lng: center.lng + (Math.random() - 0.5) * 0.02 } }));
    }
    return MOCK_PROFILES.map(p => ({ ...p, pos: fakePos(center.lat, center.lng, p.distance) }));
  }, [realProfiles, center.lat, center.lng]);

  const filtered = filter === "all" ? profilesWithPos : profilesWithPos.filter(p => p.mode === filter);

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

    return () => { map.remove(); mapRef.current = null; };
  }, [mounted, center.lat, center.lng]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filtered.forEach(p => {
      const color = MODE_COLORS[p.mode] || "#8B5CF6";

      // Custom marker element
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
      el.onclick = () => setSelected(p);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.pos.lng, p.pos.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filtered]);

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
          <div className="text-[11px] text-text-muted">
            {loading ? "Localisation..." : error ? <span className="text-danger">{error}</span> : <><span className="w-1.5 h-1.5 rounded-full bg-safe inline-block mr-1" />{filtered.length} pres de toi</>}
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
      <div className="flex-1 relative z-0">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Selected profile */}
        {selected && (
          <div className="absolute bottom-24 left-3 right-3 z-[1000] animate-slide-up">
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
          </div>
        )}
      </div>
    </div>
  );
}
