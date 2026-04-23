import { ImageResponse } from "next/og";
import { app, landing } from "@/lib/design-tokens";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export const alt = "Profil CeSoir — trouve quelqu'un ce soir";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ id: string }> };

/**
 * Profile share OG image — White Fluo Minimal (app palette).
 *
 * Design:
 * - White backdrop `#FFFFFF` — app aesthetic.
 * - Avatar circle centered top, 240px, violet 4px ring.
 * - First name + age + mode chip below.
 * - Optional karma badge if karma_score >= 80.
 * - Moon watermark bottom-right in violet.
 *
 * Edge runtime for low-latency share previews.
 */
export default async function ProfileOGImage({ params }: Params) {
  const { id } = await params;

  type ProfileRow = {
    first_name: string | null;
    age: number | null;
    avatar_url: string | null;
    current_mode: string | null;
    karma_score: number | null;
  };

  let profile: ProfileRow | null = null;
  try {
    const supabase = await createClient();
    const result = await supabase
      .from("profiles")
      .select("first_name, age, avatar_url, current_mode, karma_score")
      .eq("id", id)
      .single();
    profile = (result.data ?? null) as ProfileRow | null;
  } catch {
    profile = null;
  }

  const firstName = profile?.first_name ?? "Quelqu'un";
  const age = profile?.age ?? null;
  const mode = profile?.current_mode ?? null;
  const karma = profile?.karma_score ?? 0;
  const avatarUrl = profile?.avatar_url ?? null;
  const showKarma = karma >= 80;

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
          backgroundColor: app.bg,
          fontFamily: "sans-serif",
        }}
      >
        {/* Subtle bg gradient violet → transparent */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 30%, rgba(139,92,246,0.08) 0%, rgba(255,255,255,0) 60%)`,
          }}
        />

        {/* Avatar circle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 260,
            height: 260,
            borderRadius: "9999px",
            backgroundColor: app.bgCard,
            border: `4px solid ${app.violet}`,
            boxShadow: `0 0 40px rgba(139,92,246,0.25)`,
            marginBottom: 36,
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              width={252}
              height={252}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 128,
                fontWeight: 700,
                color: app.violet,
                letterSpacing: "-0.03em",
              }}
            >
              {firstName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name + age */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "16px",
            marginBottom: 24,
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: app.text,
              letterSpacing: "-0.03em",
            }}
          >
            {firstName}
          </span>
          {age !== null && (
            <span
              style={{
                fontSize: 64,
                fontWeight: 400,
                color: app.textMuted,
              }}
            >
              {age}
            </span>
          )}
        </div>

        {/* Mode chip + karma badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            zIndex: 2,
          }}
        >
          {mode && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 28px",
                borderRadius: "9999px",
                backgroundColor: app.violet,
                color: app.bg,
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "0.02em",
                textTransform: "capitalize",
              }}
            >
              {mode}
            </div>
          )}
          {showKarma && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: "9999px",
                backgroundColor: app.vert,
                color: app.vertDark,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              <span>Karma {karma}</span>
            </div>
          )}
        </div>

        {/* Moon watermark bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            right: 48,
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: 44,
              color: app.violet,
              lineHeight: 1,
            }}
          >
            ☾
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: app.text,
              letterSpacing: "-0.02em",
            }}
          >
            CeSoir
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
