import { ImageResponse } from "next/og";
import { app, landing } from "@/lib/design-tokens";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export const alt = "Event CeSoir — ce soir à Montpellier";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ id: string }> };

/**
 * Event OG image — flyer-styled hero share card.
 *
 * Design:
 * - Flyer/venue image blurred as backdrop (via Supabase `events.flyer_url`).
 * - Dark gradient overlay bottom → transparent top for title readability.
 * - Event title + venue + date/time in bottom-left.
 * - Crescent moon watermark in top-right corner.
 * - Category chip (techno/house/jazz) in brand-accent color.
 *
 * Edge runtime for low-latency social preview fetches.
 */
export default async function EventOGImage({ params }: Params) {
  const { id } = await params;

  type EventRow = {
    title: string | null;
    flyer_url: string | null;
    starts_at: string | null;
    category: string | null;
    venue_name: string | null;
    city: string | null;
  };

  let event: EventRow | null = null;
  try {
    const supabase = await createClient();
    const result = await supabase
      .from("events")
      .select("title, flyer_url, starts_at, category, venue_name, city")
      .eq("id", id)
      .single();
    event = (result.data ?? null) as EventRow | null;
  } catch {
    event = null;
  }

  const title = event?.title ?? "Event à Montpellier";
  const venueName = event?.venue_name ?? "Venue";
  const city = event?.city ?? "Montpellier";
  const category = event?.category ?? null;
  const flyerUrl = event?.flyer_url ?? null;

  let dateLabel = "Ce soir";
  if (event?.starts_at) {
    try {
      const d = new Date(event.starts_at);
      dateLabel = d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      dateLabel = "Ce soir";
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: landing.bg,
          fontFamily: "sans-serif",
        }}
      >
        {/* Background flyer — blurred, scaled, dimmed */}
        {flyerUrl && (
          <img
            src={flyerUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(8px) brightness(0.55) saturate(1.1)",
              transform: "scale(1.05)",
            }}
          />
        )}

        {/* Dark gradient overlay bottom → top */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(10,10,13,0.2) 0%, rgba(10,10,13,0.55) 50%, rgba(10,10,13,0.95) 100%)`,
          }}
        />

        {/* Moon watermark top-right */}
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 48,
            display: "flex",
            alignItems: "center",
            gap: "14px",
            zIndex: 3,
          }}
        >
          <span
            style={{
              fontSize: "56px",
              color: landing.violet,
              lineHeight: 1,
              filter: `drop-shadow(0 0 12px rgba(139,92,246,0.6))`,
            }}
          >
            ☾
          </span>
          <span
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: landing.fg,
              letterSpacing: "-0.02em",
            }}
          >
            CeSoir
          </span>
        </div>

        {/* Content bottom-left */}
        <div
          style={{
            position: "absolute",
            left: 64,
            right: 64,
            bottom: 56,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            zIndex: 3,
          }}
        >
          {category && (
            <div
              style={{
                display: "flex",
                padding: "8px 16px",
                borderRadius: "9999px",
                backgroundColor: landing.violet,
                color: landing.fg,
                fontSize: "22px",
                fontWeight: 600,
                alignSelf: "flex-start",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {category}
            </div>
          )}
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: landing.fg,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              display: "flex",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: "32px",
              fontWeight: 400,
              color: app.ogSubtitle,
            }}
          >
            <span>{venueName}</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>{city}</span>
          </div>
          <div
            style={{
              fontSize: "28px",
              color: landing.vert,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {dateLabel}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
