import { ImageResponse } from "next/og";
import { app, landing } from "@/lib/design-tokens";

export const runtime = "edge";

export const alt = "CeSoir — Personne ne dîne seul ce soir à Montpellier";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default OG image — cinematic landing palette.
 *
 * Design:
 * - Dark backdrop `#0A0A0D` with radial gradient violet → vert at center.
 * - Decorative stars scattered (small SVG circles) for the "ce soir" mood.
 * - Crescent moon mark + wordmark centered, big and cinematic.
 * - Tagline below in ogSubtitle gray.
 *
 * Runs on Edge Runtime so it ships fast from any region.
 */
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: landing.bg,
          fontFamily: "sans-serif",
          backgroundImage: `radial-gradient(circle at 50% 45%, rgba(139,92,246,0.35) 0%, rgba(0,255,136,0.08) 35%, rgba(10,10,13,0) 70%)`,
        }}
      >
        {/* Star particles — small offset circles */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
          }}
        >
          {[
            { x: 120, y: 90, s: 3 },
            { x: 240, y: 180, s: 2 },
            { x: 380, y: 70, s: 2 },
            { x: 520, y: 140, s: 3 },
            { x: 660, y: 55, s: 2 },
            { x: 820, y: 160, s: 3 },
            { x: 980, y: 100, s: 2 },
            { x: 1080, y: 220, s: 3 },
            { x: 150, y: 470, s: 2 },
            { x: 310, y: 520, s: 3 },
            { x: 490, y: 560, s: 2 },
            { x: 680, y: 510, s: 3 },
            { x: 860, y: 540, s: 2 },
            { x: 1050, y: 485, s: 3 },
          ].map((p, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                width: p.s,
                height: p.s,
                borderRadius: "50%",
                background: landing.fg,
                opacity: 0.7,
              }}
            />
          ))}
        </div>

        {/* Moon + wordmark block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            marginBottom: "40px",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: "140px",
              color: landing.violet,
              lineHeight: 1,
              filter: `drop-shadow(0 0 40px rgba(139,92,246,0.6))`,
            }}
          >
            ☾
          </span>
          <span
            style={{
              fontSize: "120px",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: landing.fg,
              lineHeight: 1,
            }}
          >
            CeSoir
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: "36px",
            fontWeight: 400,
            color: app.ogSubtitle,
            margin: 0,
            letterSpacing: "0.01em",
            zIndex: 2,
          }}
        >
          Personne ne dîne seul ce soir à Montpellier.
        </p>

        {/* Brand footer */}
        <p
          style={{
            position: "absolute",
            bottom: 40,
            right: 48,
            fontSize: "22px",
            color: app.ogSubtitle,
            margin: 0,
            opacity: 0.7,
            zIndex: 2,
          }}
        >
          cesoir.app
        </p>
      </div>
    ),
    { ...size }
  );
}
