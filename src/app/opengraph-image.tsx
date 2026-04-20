import { ImageResponse } from "next/og";
import { app } from "@/lib/design-tokens";

export const runtime = "edge";

export const alt = "CeSoir — Trouve quelqu'un pour ce soir";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          backgroundColor: app.ogBg,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "96px",
              color: app.violet,
            }}
          >
            ☾
          </span>
          <span
            style={{
              fontSize: "96px",
              fontWeight: 700,
              background: `linear-gradient(135deg, ${app.bg} 0%, ${app.violet} 100%)`,
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            CeSoir
          </span>
        </div>
        <p
          style={{
            fontSize: "36px",
            color: app.ogSubtitle,
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          {"Trouve quelqu'un. Ce soir."}
        </p>
      </div>
    ),
    { ...size }
  );
}
