"use client";

/**
 * /invites/mine — user's invite code dashboard.
 *
 * Powered by mig 021 + mig 025 (hybrid invite rewards).
 * Each user can hold up to 3 unused codes at a time. When someone signs
 * up via one of their codes, both sides get +5 roses and the new user
 * gets the 'founder' achievement badge.
 *
 * Page lists:
 *  - The user's active (unused, non-expired) codes with copy + share
 *  - Codes already claimed (audit trail)
 *  - Stats: total signups via my codes, total roses earned via referrals
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { m } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/ui/PageHeader";
import { springs } from "@/lib/motion-design";
import {
  useReferralInfo,
  ROSES_PER_CLAIM,
  type ReferralCodeEntry,
} from "@/lib/referral";

/**
 * Local InviteCode shape kept for the existing CodeCard which was written
 * against snake_case (matches the API response too). The dashboard now
 * derives codes from `useReferralInfo` and adapts them to this shape so
 * we don't have to refactor CodeCard's props.
 */
interface InviteCode {
  code: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

function fromEntry(e: ReferralCodeEntry): InviteCode {
  return {
    code: e.code,
    used_by: e.usedBy,
    used_at: e.usedAt,
    expires_at: e.expiresAt,
    created_at: e.createdAt,
  };
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "?";
  const diffMs = Date.now() - d;
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days}j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "?";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function shareUrl(code: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/signup-quick?invite=${code}`;
}

function CodeCard({ code, onCopy }: { code: InviteCode; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const used = code.used_by !== null;
  const expired = !used && new Date(code.expires_at) < new Date();
  const url = shareUrl(code.code);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      onCopy(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Older browsers / Safari quirks — fall back to selecting an element
      // would require an extra hidden input; for now we just leave the user
      // to paste manually.
    }
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Rejoins-moi sur CeSoir",
          text: "On va manger / sortir ce soir ? J'utilise CeSoir pour trouver quelqu'un. Mon code te donne +5 🌹 :",
          url,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // User cancelled the share sheet — silent.
      }
    } else {
      // Desktop — copy instead
      await handleCopy();
    }
  }

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.snap}
      className={`rounded-2xl border p-4 ${
        used
          ? "border-vert/30 bg-vert/5"
          : expired
            ? "border-border bg-card/50 opacity-60"
            : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="font-mono text-2xl font-bold tracking-wider text-text">
          {code.code}
        </div>
        {used && (
          <span className="text-[10px] font-semibold uppercase text-vert px-2 py-0.5 rounded-full bg-vert/10 border border-vert/30">
            ✓ Utilisé
          </span>
        )}
        {!used && expired && (
          <span className="text-[10px] font-semibold uppercase text-text-muted px-2 py-0.5 rounded-full bg-text-muted/10 border border-text-muted/30">
            Expiré
          </span>
        )}
        {!used && !expired && (
          <span className="text-[10px] font-semibold uppercase text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30">
            Actif · jusqu&apos;au {fmtDate(code.expires_at)}
          </span>
        )}
      </div>

      {used && code.used_at ? (
        <div className="text-xs text-text-muted">
          Utilisé {timeAgo(code.used_at)} (le {fmtDate(code.used_at)}). Tu as gagné{" "}
          <span className="font-semibold text-text">5 🌹</span>.
        </div>
      ) : !expired ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 px-3 py-2 rounded-full bg-card border border-border text-text text-xs font-semibold hover:border-accent transition-colors tap-target"
          >
            {copied ? "✓ Copié !" : "Copier le lien"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 px-3 py-2 rounded-full bg-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity tap-target"
          >
            {shared ? "✓ Envoyé" : "Partager"}
          </button>
        </div>
      ) : null}
    </m.div>
  );
}

export default function InvitesMinePage() {
  const { user, loading: authLoading } = useAuth();
  const { info, loading, refetch } = useReferralInfo(user?.id ?? null);
  const [minting, setMinting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Re-derive InviteCode list from the hook so the existing CodeCard JSX
  // doesn't need to change. Realtime updates flow in via useReferralInfo
  // (subscribed to invite_codes UPDATE/INSERT/DELETE for this user).
  const codes: InviteCode[] = info.myCodes.map(fromEntry);

  // Refetch when auth flips (token refresh, signin) — the hook's own
  // userId dep handles the bulk of this, but keeping a refetch here is
  // a no-op when info is already fresh and a useful safety net otherwise.
  useEffect(() => {
    if (!authLoading && user) void refetch();
  }, [authLoading, user, refetch]);

  async function handleMint() {
    setMinting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMinting(false);
      return;
    }
    await fetch("/api/invites/mine", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    // Realtime should pick up the INSERTs, but refetch immediately to
    // close the perceived latency window for the user who just clicked.
    await refetch();
    setMinting(false);
  }

  function flashToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 1800);
  }

  const active = codes.filter((c) => !c.used_by && new Date(c.expires_at) > new Date());
  const used = codes.filter((c) => c.used_by);
  const expired = codes.filter((c) => !c.used_by && new Date(c.expires_at) <= new Date());

  // Headline numbers come straight from the DB-backed hook so we get
  // the correct count even when codes paginate or RLS changes.
  const rosesEarned = info.totalRosesEarned;
  const totalReferrals = info.totalReferrals;
  const activeFounders = info.activeFounders;

  return (
    <div className="min-h-screen bg-bg pb-20">
      <PageHeader
        title="Mes invitations"
        backHref="/profile"
        subtitle="Partage tes codes — 5 🌹 pour toi et ton ami à chaque inscription"
      />

      <div className="px-4 pt-4 max-w-md mx-auto space-y-6">
        {/* Stats banner — numbers come from DB-backed `useReferralInfo` */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.snap}
          className="rounded-2xl border border-accent/30 bg-accent/5 p-4 flex items-center justify-around text-center"
        >
          <div>
            <div className="font-display text-2xl font-bold text-text">{totalReferrals}</div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">Parrainés</div>
          </div>
          <div className="w-px h-8 bg-border" aria-hidden="true" />
          <div>
            <div className="font-display text-2xl font-bold text-accent">{rosesEarned}</div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">🌹 gagnées</div>
          </div>
          <div className="w-px h-8 bg-border" aria-hidden="true" />
          <div>
            <div className="font-display text-2xl font-bold text-text">{active.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">Codes actifs</div>
          </div>
        </m.div>

        {/* Plain-language stats lines — required by Wave 16 Bet #2 */}
        <m.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.snap}
          className="rounded-2xl border border-border bg-card p-4 space-y-1.5 text-sm text-text"
          aria-live="polite"
        >
          {totalReferrals === 0 ? (
            <p className="text-text-muted">
              Personne n&apos;a encore utilisé un de tes codes. Partages-en un pour démarrer ta chaîne.
            </p>
          ) : (
            <>
              <p>
                Tu as parrainé <span className="font-semibold text-accent">{totalReferrals}</span>{" "}
                {totalReferrals === 1 ? "ami" : "amis"}.
              </p>
              <p>
                Tu as gagné <span className="font-semibold text-accent">{rosesEarned} 🌹</span>{" "}
                grâce à tes invitations
                <span className="text-text-muted">
                  {" "}
                  ({ROSES_PER_CLAIM} 🌹 par inscription).
                </span>
              </p>
              {activeFounders > 0 && (
                <p>
                  <span className="font-semibold text-accent">{activeFounders}</span> de tes amis{" "}
                  {activeFounders === 1 ? "porte" : "portent"} le badge{" "}
                  <span className="font-semibold">Fondateur ☾</span>.
                </p>
              )}
            </>
          )}
        </m.div>

        {/* Active codes section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Codes actifs
            </h2>
            {active.length < 3 && (
              <button
                type="button"
                onClick={handleMint}
                disabled={minting}
                className="text-[11px] font-semibold text-accent hover:opacity-80 disabled:opacity-50 tap-target"
              >
                {minting ? "…" : `Générer ${3 - active.length} de plus`}
              </button>
            )}
          </div>

          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-card animate-pulse" aria-hidden="true" />
              ))}
            </div>
          )}

          {!loading && active.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-text-muted mb-3">
                Tu n&apos;as pas de code actif.
              </p>
              <button
                type="button"
                onClick={handleMint}
                disabled={minting}
                className="px-4 py-2 rounded-full bg-accent text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 tap-target"
              >
                {minting ? "Génération…" : "Générer mes 3 codes"}
              </button>
            </div>
          )}

          {!loading && active.length > 0 && (
            <div className="space-y-2">
              {active.map((c) => (
                <CodeCard key={c.code} code={c} onCopy={() => flashToast("Lien copié")} />
              ))}
            </div>
          )}
        </section>

        {/* Used codes (audit trail) */}
        {used.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
              Déjà utilisés
            </h2>
            <div className="space-y-2">
              {used.map((c) => (
                <CodeCard key={c.code} code={c} onCopy={() => flashToast("Lien copié")} />
              ))}
            </div>
          </section>
        )}

        {/* Expired (collapsed) */}
        {expired.length > 0 && (
          <details className="text-xs text-text-muted">
            <summary className="cursor-pointer">
              {expired.length} code{expired.length > 1 ? "s" : ""} expiré{expired.length > 1 ? "s" : ""}
            </summary>
            <div className="space-y-2 mt-2">
              {expired.map((c) => (
                <CodeCard key={c.code} code={c} onCopy={() => flashToast("Lien copié")} />
              ))}
            </div>
          </details>
        )}

        {/* How it works */}
        <section className="rounded-2xl border border-border bg-card/50 p-4 text-xs text-text-muted leading-relaxed">
          <h3 className="font-semibold text-text mb-2">Comment ça marche</h3>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li>Tu partages un de tes codes (lien ou texte oral &laquo; CESOIRXX &raquo;)</li>
            <li>Ton ami s&apos;inscrit sur cesoir-app.vercel.app et entre le code</li>
            <li>Vous recevez chacun <span className="text-accent font-semibold">5 🌹</span> et lui débloque le badge <span className="text-accent font-semibold">Founder ☾</span></li>
          </ol>
          <p className="mt-3">
            <Link href="/profile" className="text-accent font-semibold">← Retour au profil</Link>
          </p>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-text text-bg text-xs font-semibold shadow-xl"
        >
          {toast}
        </m.div>
      )}
    </div>
  );
}
