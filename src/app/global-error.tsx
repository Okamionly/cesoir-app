"use client";

/**
 * Global error boundary — fires only when the root layout itself crashes.
 *
 * MUST render its own <html>/<body> because the root layout is unavailable.
 * NO Tailwind classes (no globals.css), NO design-tokens, NO motion/react —
 * any of those could be the thing that crashed. Inline styles only.
 *
 * Next 16 contract: receives `unstable_retry`, not `reset`.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Best-effort log — logger module may itself be the crash, so swallow.
    try {
      // eslint-disable-next-line no-console
      console.error("global_error_boundary", {
        message: error.message,
        name: error.name,
        digest: error.digest,
      });
    } catch {
      /* ignore */
    }
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0A0A0D",
          color: "#FFFFFF",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: 360,
          }}
          role="alert"
          aria-live="assertive"
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: 64,
              marginBottom: 16,
              filter: "drop-shadow(0 0 28px rgba(139,92,246,0.5))",
              color: "#8B5CF6",
            }}
          >
            ☾
          </span>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
            }}
          >
            Quelque chose a coince
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 300,
              margin: "0 0 28px",
              lineHeight: 1.5,
            }}
          >
            On a un souci profond. Reessaie, ou recharge la page.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              width: "100%",
            }}
          >
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                width: "100%",
                padding: "14px 24px",
                border: "none",
                borderRadius: 9999,
                fontSize: 15,
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: "pointer",
                background:
                  "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
                boxShadow: "0 0 32px rgba(139,92,246,0.3)",
              }}
            >
              Reessayer
            </button>

            <a
              href="/"
              style={{
                width: "100%",
                padding: "13px 24px",
                borderRadius: 9999,
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.18)",
                boxSizing: "border-box",
              }}
            >
              Retour a l&apos;accueil
            </a>
          </div>

          {error.digest ? (
            <p
              style={{
                marginTop: 24,
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
                userSelect: "all",
              }}
            >
              ref: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
