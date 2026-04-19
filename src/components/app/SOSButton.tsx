"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "motion/react";
import { useSafety } from "@/lib/useSafety";
import { AlertTriangle } from "@/components/ui/lucide";

export default function SOSButton() {
  const { triggerSOS, sosActive } = useSafety();
  const [activated, setActivated] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [sent, setSent] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Triple-tap detection on any moon logo element
  useEffect(() => {
    let tapCount = 0;
    let tapTimer: ReturnType<typeof setTimeout> | null = null;

    function handleTap(e: Event) {
      const target = e.target as HTMLElement;
      const isMoonLogo =
        target.closest("[data-logo-moon]") !== null ||
        target.textContent?.trim() === "\u263E"; // ☾ character

      if (!isMoonLogo) return;

      tapCount++;
      if (tapTimer) clearTimeout(tapTimer);

      if (tapCount >= 3) {
        tapCount = 0;
        setActivated(true);
      }

      tapTimer = setTimeout(() => {
        tapCount = 0;
      }, 600);
    }

    document.addEventListener("click", handleTap);
    document.addEventListener("touchend", handleTap);

    return () => {
      document.removeEventListener("click", handleTap);
      document.removeEventListener("touchend", handleTap);
      if (tapTimer) clearTimeout(tapTimer);
    };
  }, []);

  // Geolocation when activated
  useEffect(() => {
    if (!activated) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setPosition(null);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, [activated]);

  // Countdown timer -- when it hits 0, trigger the real SOS via useSafety
  useEffect(() => {
    if (!activated) {
      setCountdown(30);
      setSent(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setCountdown(30);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          // Fire the centralized SOS
          triggerSOS();
          setSent(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activated, triggerSOS]);

  const handleCancel = useCallback(() => {
    setActivated(false);
    setCountdown(30);
    setPosition(null);
    setSent(false);
  }, []);

  return (
    <AnimatePresence>
      {activated && (
        <m.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-red-600/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="alert"
          aria-live="assertive"
          aria-label="Alerte SOS activee"
        >
          {/* SOS Icon */}
          <m.div
            className="mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <AlertTriangle size={64} strokeWidth={2} color="white" aria-hidden="true" />
          </m.div>

          <h2 className="text-2xl font-bold text-white font-display mb-2">
            SOS Active
          </h2>

          <p className="text-white/90 text-center px-8 mb-6 text-sm leading-relaxed">
            {sent
              ? "Alerte envoyee a tes contacts de confiance."
              : "Envoi de ta position a tes contacts d'urgence..."}
          </p>

          {/* Countdown */}
          {countdown > 0 && !sent ? (
            <div className="mb-8">
              <div className="text-6xl font-bold text-white font-display tabular-nums">
                {countdown}
              </div>
              <p className="text-white/70 text-xs mt-1 text-center">
                secondes avant l&apos;appel
              </p>
            </div>
          ) : (
            <div className="mb-8 text-center">
              <p className="text-white text-lg font-semibold">
                {sosActive
                  ? "Envoi en cours..."
                  : "Tes contacts ont ete alertes."}
              </p>
              {position && (
                <p className="text-white/70 text-xs mt-2">
                  Position: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                </p>
              )}
            </div>
          )}

          {/* Progress bar */}
          {countdown > 0 && !sent && (
            <div className="w-64 h-1.5 bg-white/20 rounded-full overflow-hidden mb-8">
              <m.div
                className="h-full bg-white rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 30, ease: "linear" }}
              />
            </div>
          )}

          {/* Cancel button */}
          <button
            onClick={handleCancel}
            className="tap-target px-8 py-3 rounded-full border-2 border-white text-white font-semibold text-sm transition-colors hover:bg-white hover:text-red-600 active:scale-95"
            aria-label="Annuler l'alerte SOS"
          >
            {sent ? "Fermer" : "Annuler"}
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
