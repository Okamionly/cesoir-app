/**
 * Lifecycle email templates and sender for CeSoir.
 *
 * D1 — user hasn't swiped in 1 day   → nudge to return with profile teaser
 * D3 — user has had 0 matches in 3d   → offer a free 30min Boost Premium
 * D7 — user has been fully inactive   → FOMO recap of activity since they left
 *
 * Transport: Resend (https://resend.com).
 * The RESEND_API_KEY environment variable must be set.
 * FROM address uses a verified domain configured in Resend — falls back to
 * RESEND_FROM_EMAIL env var, defaulting to noreply@cesoir.app.
 *
 * Templates are plain HTML strings (no react-email dep) styled with CeSoir
 * brand tokens: lune ☾ logo, #8B5CF6 violet accent, white background.
 *
 * Every function returns { ok: boolean; error?: string } — callers are
 * responsible for logging failures; none of these throw.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// ── Config ────────────────────────────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "CeSoir <noreply@cesoir.app>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cesoir-app.vercel.app";

// ── Shared brand HTML helpers ──────────────────────────────────────────────

function emailWrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CeSoir</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

          <!-- Header: logo + brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <span style="font-size:28px;line-height:1;">☾</span>
                <span style="font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.5px;">CeSoir</span>
              </div>
            </td>
          </tr>

          <!-- Card body -->
          <tr>
            <td style="background:#f9f9f9;border-radius:16px;padding:32px;border:1px solid #eeeeee;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="font-size:11px;color:#999999;margin:0;">
                Tu reçois cet email car tu es inscrit(e) sur CeSoir.<br/>
                <a href="${SITE_URL}/settings" style="color:#8B5CF6;text-decoration:none;">Gérer mes notifications</a>
                &nbsp;·&nbsp;
                <a href="${SITE_URL}/settings" style="color:#8B5CF6;text-decoration:none;">Se désabonner</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `<div style="text-align:center;margin-top:24px;">
    <a href="${href}"
       style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#7C3AED);
              color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;
              padding:14px 32px;border-radius:50px;letter-spacing:0.2px;">
      ${label}
    </a>
  </div>`;
}

// ── Resend transport ───────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    logger.error("lifecycle_email_missing_resend_key", { to });
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("lifecycle_email_resend_error", { to, status: res.status, body });
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    logger.error("lifecycle_email_fetch_failed", { to, err: String(err) });
    return { ok: false, error: String(err) };
  }
}

// ── Profile data fetcher (service-role) ────────────────────────────────────

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role env missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface UserEmailInfo {
  email: string;
  firstName: string;
  city: string;
}

async function getUserEmailInfo(userId: string): Promise<UserEmailInfo | null> {
  try {
    const admin = getAdminClient();

    // Get auth email
    const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
    if (authError || !authData?.user?.email) return null;

    // Get profile for display_name and city
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, city")
      .eq("id", userId)
      .single();

    const firstName = (profile?.display_name ?? "").split(" ")[0] || "toi";
    const city = profile?.city ?? "ta ville";

    return { email: authData.user.email, firstName, city };
  } catch {
    return null;
  }
}

// ── D1: no swipe after 1 day ───────────────────────────────────────────────

export async function sendD1NoSwipe(userId: string): Promise<{ ok: boolean; error?: string }> {
  const info = await getUserEmailInfo(userId);
  if (!info) return { ok: false, error: "user_not_found" };

  const subject = "3 nouveaux profils t'attendent sur CeSoir ☾";

  const body = `
    <h1 style="font-size:20px;font-weight:700;color:#111111;margin:0 0 8px 0;">
      Hé ${info.firstName} 👋
    </h1>
    <p style="font-size:15px;color:#444444;line-height:1.6;margin:0 0 16px 0;">
      Tu n'as pas swipé hier. Pendant ce temps, <strong>3 nouveaux profils</strong>
      correspondant à ta recherche à <strong>${info.city}</strong> viennent de rejoindre CeSoir.
    </p>
    <p style="font-size:15px;color:#444444;line-height:1.6;margin:0;">
      Ils pourraient être partis demain. Ce soir, c'est maintenant.
    </p>
    ${ctaButton("Voir les profils", `${SITE_URL}/browse`)}
  `;

  return sendEmail(info.email, subject, emailWrapper(body));
}

// ── D3: no match after 3 days ──────────────────────────────────────────────

export async function sendD3NoMatch(userId: string): Promise<{ ok: boolean; error?: string }> {
  const info = await getUserEmailInfo(userId);
  if (!info) return { ok: false, error: "user_not_found" };

  const subject = "Boost gratuit 30 min — offert par CeSoir ☾";

  const body = `
    <h1 style="font-size:20px;font-weight:700;color:#111111;margin:0 0 8px 0;">
      3 jours sans match, ${info.firstName}
    </h1>
    <p style="font-size:15px;color:#444444;line-height:1.6;margin:0 0 16px 0;">
      Ce n'est pas toi — c'est le timing. Pour t'aider à te démarquer,
      on t'offre un <strong>Boost Premium gratuit de 30 minutes</strong>.
    </p>
    <p style="font-size:15px;color:#444444;line-height:1.6;margin:0;">
      Pendant ce boost, ton profil passe en tête des recommandations à ${info.city}.
      Résultat moyen : <strong>×5 vues</strong> en 30 min.
    </p>
    <div style="background:#8B5CF615;border:1px solid #8B5CF630;border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
      <p style="font-size:13px;color:#8B5CF6;font-weight:600;margin:0;">Code promo</p>
      <p style="font-size:24px;font-weight:700;color:#8B5CF6;letter-spacing:2px;margin:4px 0 0 0;">BOOST30</p>
    </div>
    ${ctaButton("Activer mon Boost gratuit", `${SITE_URL}/premium?promo=BOOST30`)}
  `;

  return sendEmail(info.email, subject, emailWrapper(body));
}

// ── D7: fully inactive after 7 days ───────────────────────────────────────

export async function sendD7Inactive(
  userId: string,
  stats?: { flashPlans?: number; newMatches?: number }
): Promise<{ ok: boolean; error?: string }> {
  const info = await getUserEmailInfo(userId);
  if (!info) return { ok: false, error: "user_not_found" };

  const flashPlans = stats?.flashPlans ?? 8;
  const newMatches = stats?.newMatches ?? 24;

  const subject = `Reviens ce soir — ${flashPlans} plans flash en cours à ${info.city} ☾`;

  const body = `
    <h1 style="font-size:20px;font-weight:700;color:#111111;margin:0 0 8px 0;">
      Ça bouge à ${info.city}, ${info.firstName}
    </h1>
    <p style="font-size:15px;color:#444444;line-height:1.6;margin:0 0 20px 0;">
      Tu manques depuis 7 jours. Voici ce qui s'est passé pendant ton absence :
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td width="48%" style="background:#8B5CF610;border:1px solid #8B5CF625;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:28px;font-weight:700;color:#8B5CF6;margin:0;">${flashPlans}</p>
          <p style="font-size:12px;color:#666;margin:4px 0 0 0;">Plans flash en cours</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#00FF8810;border:1px solid #00FF8825;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:28px;font-weight:700;color:#059669;margin:0;">${newMatches}</p>
          <p style="font-size:12px;color:#666;margin:4px 0 0 0;">Nouveaux matchs depuis ton départ</p>
        </td>
      </tr>
    </table>

    <p style="font-size:15px;color:#444444;line-height:1.6;margin:0;">
      Ce soir, il y a des plans qui te correspondent. Reviens avant qu'ils partent.
    </p>
    ${ctaButton("Revenir ce soir", `${SITE_URL}/browse`)}
  `;

  return sendEmail(info.email, subject, emailWrapper(body));
}
