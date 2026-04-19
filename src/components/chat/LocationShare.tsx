"use client";

import { useState, useCallback } from "react";
import { m } from "motion/react";
import {
  CHAT_VIOLET_VERT_135,
  LOCATION_MAP_SOFT_TINT,
  LOCATION_MAP_GRID_COLOR,
  LOCATION_MAP_PIN_COLOR,
} from "@/lib/chat-content-colors";

// ---------- LocationShareButton ----------

interface LocationShareButtonProps {
  onShare: (lat: number, lng: number) => void;
}

export function LocationShareButton({ onShare }: LocationShareButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleShare = useCallback(() => {
    if (!navigator.geolocation) {
      // Fallback: mock Paris coords
      onShare(48.8566, 2.3522);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onShare(pos.coords.latitude, pos.coords.longitude);
        setLoading(false);
      },
      () => {
        // On error, use mock coords
        onShare(48.8566, 2.3522);
        setLoading(false);
      },
      { timeout: 5000 },
    );
  }, [onShare]);

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className="tap-target shrink-0 w-11 h-11 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-colors active:scale-95 disabled:opacity-50"
      aria-label="Partager ma position"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <path
            d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
    </button>
  );
}

// ---------- LocationCard (displayed in chat) ----------

interface LocationCardProps {
  lat: number;
  lng: number;
  isOwn: boolean;
  time: string;
  distance?: string;
}

export function LocationCard({ lat, lng, isOwn, time, distance = "1.2 km" }: LocationCardProps) {
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const gridPattern =
    `linear-gradient(${LOCATION_MAP_GRID_COLOR} 1px, transparent 1px), ` +
    `linear-gradient(90deg, ${LOCATION_MAP_GRID_COLOR} 1px, transparent 1px)`;

  return (
    <m.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
    >
      <div
        className="max-w-[75%] rounded-2xl overflow-hidden border-2"
        style={{
          border: "2px solid transparent",
          backgroundImage: `linear-gradient(white, white), ${CHAT_VIOLET_VERT_135}`,
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}
      >
        {/* Map placeholder */}
        <div
          className="h-28 relative overflow-hidden"
          style={{ background: LOCATION_MAP_SOFT_TINT }}
        >
          {/* Grid pattern for map feel */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: gridPattern,
              backgroundSize: "20px 20px",
            }}
          />
          {/* Pin icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center shadow-glow">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" fill="white" />
                <circle cx="12" cy="10" r="3" fill={LOCATION_MAP_PIN_COLOR} />
              </svg>
            </div>
          </div>
          {/* Coordinates */}
          <span className="absolute bottom-1 right-2 text-[9px] text-text-muted bg-white/80 rounded px-1">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>

        {/* Info */}
        <div className="p-3 bg-bg">
          <p className="font-bold text-[14px] text-text">Ma position</p>
          <p className="text-[12px] text-text-muted mt-0.5">
            a {distance} de toi
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] text-accent font-semibold mt-2 hover:underline"
          >
            Ouvrir dans Maps
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <span className="block text-[10px] text-text-muted mt-1 text-right">{time}</span>
        </div>
      </div>
    </m.div>
  );
}
