import { ImageResponse } from "next/og";

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
          backgroundColor: "#0A0A0A",
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
              color: "#8B5CF6",
            }}
          >
            ☾
          </span>
          <span
            style={{
              fontSize: "96px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #FFFFFF 0%, #8B5CF6 100%)",
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
            color: "#A1A1AA",
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
