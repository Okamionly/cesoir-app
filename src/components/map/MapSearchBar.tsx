"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { VENUES } from "@/lib/venues";
import { Search } from "@/components/ui/lucide";

interface MapSearchBarProps {
  onSelect: (lat: number, lng: number, label: string) => void;
  onOpenFilters: () => void;
}

/**
 * Top-anchored glassmorphic search pill. Expands on focus with a suggestion
 * list powered by the `venues.ts` mock database (40 venues, active city).
 * Submitting a suggestion recenters the map via `onSelect`.
 */
export default function MapSearchBar({ onSelect, onOpenFilters }: MapSearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return VENUES.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.address.toLowerCase().includes(q) ||
      v.arrondissement.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!focused) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [focused]);

  return (
    <div ref={wrapRef} className="absolute top-3 left-3 right-3 z-[950]">
      <div className="flex gap-2">
        <m.div
          className="flex-1 flex items-center gap-2 bg-bg/80 backdrop-blur-md border border-border rounded-full px-4 py-2.5 shadow-lg"
          animate={{ boxShadow: focused ? "0 8px 24px color-mix(in srgb, var(--color-accent) 25%, transparent)" : "0 4px 12px rgba(0,0,0,0.08)" }}
          transition={springs.snap}
        >
          <Search size={14} strokeWidth={2} className="text-text-muted shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Rechercher un lieu, bar, quartier..."
            className="flex-1 bg-transparent text-[13px] placeholder:text-text-muted outline-none"
            aria-label="Rechercher un lieu"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="text-[11px] text-text-muted hover:text-text px-1"
              aria-label="Effacer"
            >✕</button>
          )}
        </m.div>
        <m.button
          onClick={onOpenFilters}
          className="shrink-0 bg-bg/80 backdrop-blur-md border border-border rounded-full px-4 py-2.5 text-[11px] font-semibold text-text tap-target shadow-lg"
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -1 }}
          transition={springs.micro}
        >
          Filtres
        </m.button>
      </div>

      <AnimatePresence>
        {focused && suggestions.length > 0 && (
          <m.div
            className="mt-2 bg-bg/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springs.snap}
          >
            {suggestions.map((v) => (
              <m.button
                key={v.id}
                onClick={() => {
                  onSelect(v.lat, v.lng, v.name);
                  setFocused(false);
                  setQuery(v.name);
                  inputRef.current?.blur();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-card border-b border-border/30 last:border-b-0 text-left tap-target"
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-base shrink-0" aria-hidden="true">
                  {v.type === "restaurant" ? "🍽️" : v.type === "bar" ? "🍸" : v.type === "cafe" ? "☕" : v.type === "concert" ? "🎵" : v.type === "cinema" ? "🎬" : v.type === "musee" ? "🏛️" : v.type === "sport" ? "💪" : "🌳"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-text truncate">{v.name}</p>
                  <p className="text-[10px] text-text-muted truncate">{v.arrondissement} · {v.address}</p>
                </div>
              </m.button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
