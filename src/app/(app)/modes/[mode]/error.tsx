"use client";

/**
 * Local error boundary for /modes/[mode].
 *
 * Catches the "Maximum update depth exceeded" / hook-loop crashes that
 * surfaced in the 2026-04-26 audit so users see a branded fallback instead
 * of the generic root boundary. Reset retries the route; "Retour aux modes"
 * is a hard escape hatch when the mode itself is the cause.
 */

import Link from "next/link";

export default function ModeErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <span className="text-5xl mb-4" aria-hidden="true">
        🌙
      </span>
      <h1 className="text-xl font-bold mb-2">Mode indisponible</h1>
      <p className="text-sm text-text-muted mb-6 max-w-xs">
        Reessaie. Si ca persiste, reviens a la liste des modes.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={reset}
          className="gradient-bg text-white font-semibold py-3 px-8 rounded-full text-sm tap-target"
        >
          Reessayer
        </button>
        <Link
          href="/modes"
          className="text-sm text-text-muted hover:text-text transition-colors tap-target py-2"
        >
          Retour aux modes
        </Link>
      </div>
    </div>
  );
}
