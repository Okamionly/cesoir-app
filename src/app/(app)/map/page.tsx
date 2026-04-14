"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/lib/useGeolocation";
import { MOCK_PROFILES, Profile } from "@/lib/mock-profiles";
import { MODES, ModeKey, MODE_KEYS } from "@/lib/modes";

// Dynamic import for Leaflet (SSR incompatible)
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

// Generate fake positions around Paris for demo
function fakePosition(baseLat: number, baseLng: number, radiusKm: number) {
  const r = radiusKm / 111;
  return {
    lat: baseLat + (Math.random() - 0.5) * 2 * r,
    lng: baseLng + (Math.random() - 0.5) * 2 * r,
  };
}

export default function MapPage() {
  const { position, error, loading } = useGeolocation();
  const [filter, setFilter] = useState<ModeKey | "all">("all");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Default to Paris center if no GPS
  const center = position ? { lat: position.lat, lng: position.lng } : { lat: 48.8566, lng: 2.3522 };

  // Generate positions for mock profiles
  const profilesWithPos = useMemo(() =>
    MOCK_PROFILES.map(p => ({
      ...p,
      pos: fakePosition(center.lat, center.lng, p.distance),
    })),
    [center.lat, center.lng]
  );

  const filtered = filter === "all" ? profilesWithPos : profilesWithPos.filter(p => p.mode === filter);

  if (!mounted) return (
    <div className="h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-3xl text-accent animate-pulse">☾</span>
        <p className="text-xs text-text-muted">Chargement de la carte...</p>
      </div>
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
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            {loading ? (
              <span>Localisation...</span>
            ) : error ? (
              <span className="text-danger text-[10px]">{error}</span>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-safe" aria-hidden="true" />
                <span>{filtered.length} pres de toi</span>
              </>
            )}
          </div>
        </div>

        {/* Mode filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all tap-target ${filter === "all" ? "border-accent gradient-bg-subtle text-accent" : "border-border text-text-muted"}`}
          >
            Tout ({MOCK_PROFILES.length})
          </button>
          {MODE_KEYS.map(k => {
            const count = MOCK_PROFILES.filter(p => p.mode === k).length;
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all tap-target ${filter === k ? "border-accent gradient-bg-subtle text-accent" : "border-border text-text-muted"}`}
              >
                {MODES[k].icon} {count}
              </button>
            );
          })}
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative z-0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={14}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

          {filtered.map((p) => (
            <Marker
              key={p.id}
              position={[p.pos.lat, p.pos.lng]}
              eventHandlers={{ click: () => setSelected(p) }}
            />
          ))}
        </MapContainer>

        {/* Selected profile card */}
        {selected && (
          <div className="absolute bottom-24 left-3 right-3 z-[1000] animate-slide-up">
            <div className="bg-bg border border-border rounded-2xl p-4 shadow-glow">
              {/* Close */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-xs text-text-muted tap-target"
                aria-label="Fermer"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ background: selected.color }}>
                  {selected.name[0]}
                </div>
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
                <button className="flex-1 gradient-bg text-white py-2.5 rounded-full text-[12px] font-semibold active:scale-95 transition-transform tap-target">
                  ♥ Like
                </button>
                <button className="px-4 py-2.5 border border-border rounded-full text-[12px] font-medium text-text-muted active:scale-95 transition-transform tap-target">
                  Profil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
