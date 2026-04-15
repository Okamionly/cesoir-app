"use client";

import { motion, AnimatePresence } from "motion/react";
import { useCallback } from "react";

interface SafeRouteProps {
  /** Destination venue name */
  venue?: string;
  /** Distance in meters */
  distance?: number;
  /** Estimated walking time in minutes */
  walkTime?: number;
  /** Whether the route is visible */
  visible?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Destination coordinates for Google Maps link */
  destinationLat?: number;
  destinationLng?: number;
}

interface SafetyBadge {
  label: string;
  color: string;
  icon: string;
}

const SAFETY_BADGES: SafetyBadge[] = [
  { label: "Rues eclairees", color: "#00FF88", icon: "\u{1F4A1}" },
  { label: "Zone frequentee", color: "#00FF88", icon: "\u{1F6B6}" },
  { label: "Cameras de securite", color: "#60A5FA", icon: "\u{1F4F9}" },
];

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export default function SafeRoute({
  venue = "Le rendez-vous",
  distance = 850,
  walkTime = 11,
  visible = true,
  onClose,
  destinationLat = 48.8566,
  destinationLng = 2.3522,
}: SafeRouteProps) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=walking`;

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `Mon itineraire vers ${venue}`,
      text: `Je me rends a ${venue} (${formatDistance(distance)}, ~${walkTime} min a pied). Je te partage mon itineraire.`,
      url: googleMapsUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed silently
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
      } catch {
        // Clipboard access denied
      }
    }
  }, [venue, distance, walkTime, googleMapsUrl]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
          />

          {/* Card */}
          <motion.div
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6"
            role="dialog"
            aria-label="Itineraire securise"
          >
            <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B5CF6]/15">
                  <span className="text-lg" aria-hidden="true">
                    {"\u{1F6E1}\u{FE0F}"}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Itineraire securise
                  </h3>
                  <p className="text-xs text-white/40">
                    Vers {venue}
                  </p>
                </div>
              </div>

              <div className="p-5">
                {/* Route info */}
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-center">
                    <p className="text-xs text-white/40">Distance</p>
                    <p className="text-lg font-black text-white">
                      {formatDistance(distance)}
                    </p>
                  </div>
                  <div className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-center">
                    <p className="text-xs text-white/40">A pied</p>
                    <p className="text-lg font-black text-white">
                      ~{walkTime} min
                    </p>
                  </div>
                </div>

                {/* Safety badges */}
                <div className="mb-5 flex flex-wrap gap-2">
                  {SAFETY_BADGES.map((badge) => (
                    <span
                      key={badge.label}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{
                        backgroundColor: `${badge.color}15`,
                        color: badge.color,
                      }}
                    >
                      <span aria-hidden="true">{badge.icon}</span>
                      {badge.label}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="mb-4 flex flex-col gap-2.5">
                  <button
                    onClick={handleShare}
                    className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                    }}
                    aria-label="Partager l'itineraire avec un ami"
                  >
                    Partager avec un ami
                  </button>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    aria-label="Ouvrir l'itineraire dans Google Maps"
                  >
                    Ouvrir dans Google Maps
                  </a>
                </div>

                {/* Safety tip */}
                <div className="rounded-xl bg-[#8B5CF6]/8 px-4 py-3">
                  <p className="text-xs text-white/50">
                    <span className="mr-1.5" aria-hidden="true">
                      {"\u{1F4A1}"}
                    </span>
                    Restez dans les zones bien eclairees et partagez votre
                    itineraire avec un proche.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
