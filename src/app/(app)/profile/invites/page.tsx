"use client";

/**
 * /profile/invites — user's personal invite codes (Wave 15 CRO 10/10).
 *
 * Lists the 3 codes minted on signup, shows the ones already claimed,
 * and offers Web Share API "Share" buttons. If a user has less than 3
 * unused codes we POST /api/invites/mine to mint fresh ones.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { m } from "motion/react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/ui/PageHeader";
import { app } from "@/lib/design-tokens";

interface InviteCodeRow {
  code: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

async function bearerHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function buildShareUrl(code: string): string {
  if (typeof window === "undefined") return `/invite/${code}`;
  return `${window.location.origin}/invite/${code}`;
}

function buildShareMessage(code: string): string {
  return `J'ai un code CeSoir pour toi. Rejoins-moi → ${buildShareUrl(code)}`;
}

export default function InvitesPage() {
  const { user } = useAuth();
  const [codes, setCodes] = useState<InviteCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const headers = await bearerHeader();
    const res = await fetch("/api/invites/mine", { headers });
    if (!res.ok) {
      setError(`HTTP ${res.status}`);
      setLoading(false);
      return;
    }
    const body = (await res.json()) as { codes?: InviteCodeRow[] };
    setCodes(body.codes ?? []);

    // If fewer than 3 unused codes, auto-mint (idempotent server-side).
    const unused = (body.codes ?? []).filter((c) => !c.used_by);
    if (unused.length < 3) {
      const mintRes = await fetch("/api/invites/mine", {
        method: "POST",
        headers,
      });
      if (mintRes.ok) {
        // Re-fetch the list with the new rows merged in.
        const again = await fetch("/api/invites/mine", { headers });
        if (again.ok) {
          const body2 = (await again.json()) as { codes?: InviteCodeRow[] };
          setCodes(body2.codes ?? []);
        }
      }
    }

    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  const activeCodes = useMemo(
    () => codes.filter((c) => !c.used_by),
    [codes],
  );
  const claimedCodes = useMemo(
    () => codes.filter((c) => !!c.used_by),
    [codes],
  );

  async function handleShare(code: string) {
    const msg = buildShareMessage(code);
    const url = buildShareUrl(code);
    // Use Web Share API when available (mobile-native sheet).
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "CeSoir",
          text: msg,
          url,
        });
        return;
      } catch {
        // User cancelled — fall back to clipboard.
      }
    }
    await handleCopy(code);
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(buildShareMessage(code));
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      // Safari over http fallback: older prompt hack would be ugly — skip.
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader
        title="Mes invitations"
        subtitle="3 codes offerts"
        icon={<span aria-hidden>☾</span>}
        iconAnimation="float"
      />

      <main className="px-5 pt-4 pb-24">
        <section className="mb-6">
          <h2 className="font-display text-lg font-bold text-text">
            Invite tes amis
          </h2>
          <p className="text-sm text-text-muted mt-1">
            CeSoir est en invitation uniquement pendant les 3 premiers mois.
            Tu as {activeCodes.length} code{activeCodes.length > 1 ? "s" : ""} a
            partager.
          </p>
        </section>

        {loading ? (
          <div className="text-center py-8 text-sm text-text-muted">
            Chargement...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-sm text-red-500">{error}</div>
        ) : (
          <>
            {activeCodes.length > 0 && (
              <section aria-label="Codes actifs" className="space-y-3 mb-8">
                {activeCodes.map((c, i) => (
                  <m.div
                    key={c.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-lg font-bold text-text tracking-widest">
                          {c.code}
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          Expire{" "}
                          {new Date(c.expires_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(c.code)}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-text/40"
                        >
                          {copiedCode === c.code ? "Copie !" : "Copier"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare(c.code)}
                          className="rounded-full px-4 py-1.5 text-xs font-semibold text-white"
                          style={{ background: app.violet }}
                        >
                          Partager
                        </button>
                      </div>
                    </div>
                  </m.div>
                ))}
              </section>
            )}

            {claimedCodes.length > 0 && (
              <section aria-label="Codes utilises">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Deja utilises
                </h3>
                <ul className="space-y-2">
                  {claimedCodes.map((c) => (
                    <li
                      key={c.code}
                      className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 flex items-center justify-between"
                    >
                      <span className="font-mono text-sm text-text-muted line-through">
                        {c.code}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {c.used_at
                          ? new Date(c.used_at).toLocaleDateString("fr-FR")
                          : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
                <div
                  className="mt-6 rounded-xl p-4"
                  style={{ background: `${app.vert}1A`, border: `1px solid ${app.vert}55` }}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: app.vertDark }}>
                    Referral
                  </div>
                  <div className="text-sm text-text mt-1">
                    Tu as invite {claimedCodes.length} personne
                    {claimedCodes.length > 1 ? "s" : ""}.
                  </div>
                </div>
              </section>
            )}

            {activeCodes.length === 0 && claimedCodes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
                Aucun code pour le moment.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
