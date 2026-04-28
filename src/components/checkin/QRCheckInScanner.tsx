"use client";

/**
 * QRCheckInScanner — opens the camera and scans the peer's QR.
 *
 * Wave 17 spec:
 *   • Uses html5-qrcode (~280KB minified, lighter than @zxing/browser).
 *   • Permission flow:
 *       1. On mount, ask for `getUserMedia({ video: { facingMode: 'environment' } })`.
 *       2. If granted, hand the stream to html5-qrcode.
 *       3. If denied/unavailable, surface the 6-digit fallback inline.
 *   • The decoded payload `cesoir://checkin/{planId}/{userId}` is
 *     parsed via `decodeQrPayload`. The component refuses to call the
 *     API if the planId in the QR doesn't match the expected plan
 *     (anti-spoof: a stranger's QR for some other plan should not
 *     count for THIS check-in).
 *   • A debounce avoids firing the API multiple times while the camera
 *     keeps re-detecting the same code in successive frames.
 *
 * Server validation:
 *   • Even if the client is tricked into calling the API with a bad
 *     pair, the server (RPC `process_qr_scan`) re-checks plan
 *     membership and auth.uid() — the worst the client can do here is
 *     get a 4xx back.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { m } from "motion/react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import {
  decodeQrPayload,
  verifySixDigitCode,
} from "@/lib/checkin/qrPayload";

// Local typing — html5-qrcode ships its own types but importing them
// statically would pull the lib into the SSR bundle. We re-declare the
// minimal surface we use.
type Html5QrcodeScannerHandle = {
  start: (
    config: { facingMode: "environment" | "user" },
    options: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decoded: string) => void,
    onError: (msg: string) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
  isScanning?: boolean;
};

interface Props {
  /** Plan id the scanner is bound to. */
  planId: string;
  /** Expected peer user id (we only accept their QR). */
  peerUserId: string;
  /** Optional peer display name for friendlier copy. */
  peerName?: string;
  /** Fired after a successful API call (mutual or not). */
  onScanned?: (result: { mutual: boolean; awarded: boolean }) => void;
}

type Phase =
  | "asking" // requesting camera permission
  | "scanning" // camera live
  | "denied" // user denied / no camera
  | "submitting" // POST in flight
  | "ok" // success terminal
  | "error";

export default function QRCheckInScanner({
  planId,
  peerUserId,
  peerName,
  onScanned,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5QrcodeScannerHandle | null>(null);

  // Phase + UI state
  const [phase, setPhase] = useState<Phase>("asking");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  // Manual 6-digit input
  const [manualCode, setManualCode] = useState("");

  // Debounce: within ~3s after a successful scan, ignore further detections.
  const lastFireRef = useRef<number>(0);

  // Stable id for the html5-qrcode region (the lib needs a DOM id).
  const regionId = useMemo(
    () =>
      `qr-region-${Math.random().toString(36).slice(2)}-${Date.now().toString(
        36,
      )}`,
    [],
  );

  /** POST to /api/checkins/qr with the given (planId, targetUserId). */
  const submitScan = useCallback(
    async (targetUserId: string) => {
      setPhase("submitting");

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      try {
        const res = await fetch("/api/checkins/qr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ planId, targetUserId }),
        });

        const json = (await res.json().catch(() => null)) as
          | {
              ok?: true;
              data?: { mutual: boolean; awarded: boolean };
              error?: string;
              code?: string;
            }
          | null;

        if (!res.ok) {
          logger.warn("qr_checkin_api_rejected", {
            status: res.status,
            code: json?.code,
            error: json?.error,
          });
          setErrorMsg(json?.error ?? "Erreur lors de la validation");
          setPhase("error");
          return;
        }

        const mutual = json?.data?.mutual ?? false;
        const awarded = json?.data?.awarded ?? false;
        setResultMsg(
          mutual
            ? "Date verifie ! +30 karma + badge debloque."
            : "C'est note. On attend que ton match scanne aussi.",
        );
        setPhase("ok");
        onScanned?.({ mutual, awarded });
      } catch (err) {
        logger.warn("qr_checkin_api_threw", {
          err: err instanceof Error ? err.message : String(err),
        });
        setErrorMsg("Probleme reseau. Reessaie.");
        setPhase("error");
      }
    },
    [planId, onScanned],
  );

  /** Handle a QR detection (debounced + payload-validated). */
  const handleDetected = useCallback(
    (raw: string) => {
      const now = Date.now();
      if (now - lastFireRef.current < 3000) return;
      lastFireRef.current = now;

      const decoded = decodeQrPayload(raw);
      if (!decoded) {
        // Not our scheme — keep scanning silently.
        return;
      }
      // Anti-spoof: must be the EXPECTED plan + peer.
      if (decoded.planId !== planId) {
        setErrorMsg(
          "Ce QR appartient a un autre plan. Demande le QR de ce soir.",
        );
        setPhase("error");
        return;
      }
      if (decoded.userId !== peerUserId) {
        setErrorMsg(
          "Ce QR n'est pas celui de ton match. Verifie de qui tu scannes.",
        );
        setPhase("error");
        return;
      }

      // Stop the camera once we have a valid hit — saves battery.
      void (async () => {
        try {
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
          }
        } catch {
          /* noop */
        }
      })();

      void submitScan(decoded.userId);
    },
    [planId, peerUserId, submitScan],
  );

  /** Try to start the camera. Sets phase to 'denied' on failure. */
  useEffect(() => {
    let cancelled = false;
    let scanner: Html5QrcodeScannerHandle | null = null;

    (async () => {
      // First, an explicit getUserMedia probe so we handle the denial
      // path BEFORE the lib instantiates and pollutes the DOM.
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        if (!cancelled) setPhase("denied");
        return;
      }
      try {
        const probe = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        // Release the probe stream — html5-qrcode will reopen it.
        probe.getTracks().forEach((t) => t.stop());
      } catch (err) {
        logger.warn("qr_checkin_camera_denied", {
          err: err instanceof Error ? err.message : String(err),
        });
        if (!cancelled) setPhase("denied");
        return;
      }

      if (cancelled) return;

      try {
        // Dynamic import: keep html5-qrcode out of the SSR bundle.
        const mod = await import("html5-qrcode");
        if (cancelled) return;
        const Html5Qrcode = (
          mod as unknown as {
            Html5Qrcode: new (id: string) => Html5QrcodeScannerHandle;
          }
        ).Html5Qrcode;

        scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
          },
          (decoded) => handleDetected(decoded),
          () => {
            // Per-frame decode misses are noisy; ignore.
          },
        );

        if (!cancelled) setPhase("scanning");
      } catch (err) {
        logger.warn("qr_checkin_scanner_init_failed", {
          err: err instanceof Error ? err.message : String(err),
        });
        if (!cancelled) {
          setErrorMsg("Impossible d'acceder a la camera.");
          setPhase("denied");
        }
      }
    })();

    return () => {
      cancelled = true;
      // Best-effort teardown.
      void (async () => {
        try {
          if (scanner?.isScanning) {
            await scanner.stop();
          }
          scanner?.clear();
        } catch {
          /* noop */
        }
      })();
    };
  }, [regionId, handleDetected]);

  /** Manual 6-digit submit. */
  const handleManualSubmit = useCallback(() => {
    const cleaned = manualCode.replace(/\D/g, "");
    if (cleaned.length !== 6) {
      setErrorMsg("Le code doit avoir exactement 6 chiffres.");
      return;
    }
    if (!verifySixDigitCode(cleaned, planId, peerUserId)) {
      setErrorMsg("Code incorrect. Verifie les chiffres avec ton match.");
      return;
    }
    setErrorMsg(null);
    void submitScan(peerUserId);
  }, [manualCode, planId, peerUserId, submitScan]);

  // ── Render ──────────────────────────────────────────────────────────

  const subjectName = peerName ?? "ton match";

  return (
    <div className="px-6 py-6 flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-bold text-text mb-1">
          Scanne le QR de {subjectName}
        </h2>
        <p className="text-[12px] text-text-muted">
          Pointez la camera vers le code de {subjectName}. Quand vous vous
          etes scannes mutuellement, +30 karma et le badge Date Verifie sont
          debloques.
        </p>
      </div>

      {/* Camera viewport — always rendered so html5-qrcode has a target.
          Visibility is toggled by the phase. */}
      <div
        className={`relative rounded-2xl overflow-hidden border border-border bg-black ${
          phase === "scanning" ? "block" : "hidden"
        }`}
        style={{ aspectRatio: "1 / 1" }}
      >
        <div
          id={regionId}
          ref={containerRef}
          className="absolute inset-0"
          aria-label="Camera arriere"
        />
        {/* Reticle overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-2/3 h-2/3 rounded-2xl border-2 border-accent/70 shadow-glow" />
        </div>
      </div>

      {phase === "asking" && (
        <div className="flex items-center gap-3 text-[13px] text-text-muted">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Demande d&apos;acces a la camera...
        </div>
      )}

      {phase === "submitting" && (
        <div className="flex items-center gap-3 text-[13px] text-text-muted">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Validation en cours...
        </div>
      )}

      {phase === "ok" && resultMsg && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-accent/10 border border-accent/30 px-4 py-3 text-[13px] text-text"
        >
          {resultMsg}
        </m.div>
      )}

      {phase === "error" && errorMsg && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-[13px] text-red-500"
        >
          {errorMsg}
        </m.div>
      )}

      {/* 6-digit fallback — shown when camera is denied OR after an error,
          and always available as a "Tape le code" affordance below the
          camera viewport. */}
      <div className="rounded-2xl border border-border bg-bg-card px-5 py-4">
        <p className="text-[12px] text-text-muted uppercase tracking-wide font-semibold mb-2">
          {phase === "denied"
            ? "Camera indisponible — tape le code a 6 chiffres"
            : "Ou tape le code a 6 chiffres"}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="123456"
            value={manualCode}
            onChange={(e) => {
              setManualCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (errorMsg) setErrorMsg(null);
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-bg border border-border text-text font-mono text-[16px] tracking-[0.4em] text-center"
            aria-label="Code a 6 chiffres"
          />
          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={manualCode.length !== 6 || phase === "submitting"}
            className="px-4 py-3 rounded-xl gradient-bg text-white font-bold text-[13px] shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
