"use client";

/**
 * QRCheckInDisplay — shows the CURRENT user's QR for a given plan.
 *
 * Wave 17 spec:
 *   • The QR encodes `cesoir://checkin/{planId}/{userId}`. Both peers
 *     scan EACH OTHER'S QR to confirm an IRL meet at the venue.
 *   • A 6-digit numeric fallback is also displayed so users who can't
 *     scan (camera denied, broken camera) can type the code on the
 *     other side. The 6-digit code is derived deterministically from
 *     the same (planId, userId) pair so both sides agree without an
 *     extra round-trip — see `deriveSixDigitCode` in `qrPayload.ts`.
 *
 * Privacy:
 *   • The QR encodes a UUID pair only. Neither name nor avatar leaks.
 *   • `cesoir://` is a custom scheme; if pasted into a generic scanner
 *     outside the app, the URL won't navigate anywhere meaningful.
 *
 * Sizing:
 *   • The QR is rendered as a 256x256 PNG dataURL via the `qrcode` lib.
 *     We keep the size fixed in JS (not CSS) so screen-zoom doesn't
 *     blur low-density scanners.
 */

import { useEffect, useState } from "react";
import { m } from "motion/react";
import { buildQrPayload, deriveSixDigitCode } from "@/lib/checkin/qrPayload";

interface Props {
  /** Plan id (uuid). */
  planId: string;
  /** Current user id (uuid). */
  userId: string;
  /** Optional display name shown above the QR. */
  selfName?: string;
}

const QR_SIZE_PX = 256;

export default function QRCheckInDisplay({ planId, userId, selfName }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = buildQrPayload(planId, userId);
  const sixDigit = deriveSixDigitCode(planId, userId);

  // Render the QR client-side only — `qrcode` pulls in a few KB and
  // there's no SSR benefit (the data depends on user identity).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Dynamic import keeps qrcode out of the SSR bundle.
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(payload, {
          width: QR_SIZE_PX,
          margin: 2,
          errorCorrectionLevel: "M",
          color: {
            // CeSoir brand: violet on white. Avoid pure black for tone.
            dark: "#111111",
            light: "#FFFFFF",
          },
        });
        if (!cancelled) setDataUrl(url);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur QR");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <div className="flex flex-col items-center gap-5 px-6 py-8">
      {selfName && (
        <p className="text-[12px] text-text-muted uppercase tracking-wide font-semibold">
          Code de {selfName}
        </p>
      )}

      {/* QR code card */}
      <m.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="rounded-3xl bg-white p-5 shadow-glow border border-border"
        style={{ width: QR_SIZE_PX + 40, height: QR_SIZE_PX + 40 }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt="QR code de check-in"
            width={QR_SIZE_PX}
            height={QR_SIZE_PX}
            className="block"
          />
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-center text-[11px] text-red-500 px-4">
            {error}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </m.div>

      {/* 6-digit fallback */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-[11px] text-text-muted uppercase tracking-wide font-semibold">
          Ou tape ce code a 6 chiffres
        </p>
        <div className="flex gap-1.5" aria-label={`Code numerique: ${sixDigit}`}>
          {sixDigit.split("").map((digit, i) => (
            <span
              key={`${digit}-${i}`}
              className="w-9 h-11 flex items-center justify-center rounded-xl bg-bg-card border border-border text-[20px] font-black text-text"
            >
              {digit}
            </span>
          ))}
        </div>
      </div>

      <p className="text-[12px] text-text-muted text-center max-w-xs">
        Montre ton ecran a {selfName ?? "ton match"} pour qu&apos;il/elle scanne,
        ou tape mutuellement le code.
      </p>
    </div>
  );
}
