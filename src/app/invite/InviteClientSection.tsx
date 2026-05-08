"use client";

/**
 * Client section for /invite — handles auth state + share API.
 *
 * Layout:
 *  - Hero: "Invite tes amis" headline + value prop
 *  - CTA share block (authenticated) or sign-up nudge (anon)
 *  - How it works — 3 steps
 *  - Top inviters leaderboard (anonymized: first name + badge count)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { m } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { useReferralInfo, ROSES_PER_CLAIM, buildInviteUrl } from "@/lib/referral";
import { supabase } from "@/lib/supabase";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Leaderboard types
// ─────────────────────────────────────────

interface LeaderEntry {
  name: string;
  referrals: number;
}

function useTopInviters(): LeaderEntry[] {
  const [top, setTop] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    // Top 5 inviters by referral count — join invite_codes + profiles.
    // RLS allows public read on profiles (name only — no sensitive fields).
    supabase
      .rpc("get_top_inviters", { limit_n: 5 })
      .then(({ data }: { data: Array<{ name: string; referral_count: number }> | null }) => {
        if (data) {
          setTop(
            data.map((r) => ({
              name: r.name,
              referrals: r.referral_count,
            }))
          );
        }
      })
      .catch(() => {
        // RPC may not exist yet — leaderboard degrades gracefully.
      });
  }, []);

  return top;
}

// ─────────────────────────────────────────
// Share handler (re-usable)
// ─────────────────────────────────────────

async function shareCode(code: string, onDone: (msg: string) => void) {
  const url = buildInviteUrl(code);
  const message = `Rejoins-moi sur CeSoir, l'app pour trouver quelqu'un ce soir a Montpellier ☾ Code : ${code} → ${url}`;

  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ title: "CeSoir — rejoins-moi ce soir", text: message, url });
      onDone("Partage envoyé");
    } catch {
      // User cancelled.
    }
  } else {
    try {
      await navigator.clipboard.writeText(message);
      onDone("Message copie");
    } catch {
      onDone("Code : " + code);
    }
  }
}

// ─────────────────────────────────────────
// Step component
// ─────────────────────────────────────────

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
        style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
        aria-hidden="true"
      >
        {n}
      </div>
      <div className="flex-1 pt-1">
        <p className="text-[14px] font-semibold text-text leading-snug">{title}</p>
        <p className="text-[12px] text-text-muted mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main
// ─────────────────────────────────────────

export default function InviteClientSection() {
  const { user } = useAuth();
  const { info, loading } = useReferralInfo(user?.id ?? null);
  const leaderboard = useTopInviters();
  const [toast, setToast] = useState<string | null>(null);

  const activeCode = info.myCodes.find(
    (c) => !c.usedBy && new Date(c.expiresAt) > new Date()
  );

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-10 space-y-8">
      {/* ── HERO ── */}
      <m.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.cinematic}
        className="text-center"
      >
        <p className="text-[42px] leading-none" aria-hidden="true">☾</p>
        <h1 className="mt-3 text-[28px] font-bold tracking-tight text-text leading-tight">
          Invite tes amis,<br />gagne des roses
        </h1>
        <p className="mt-3 text-[15px] text-text-muted max-w-[300px] mx-auto leading-relaxed">
          Chaque ami qui s&apos;inscrit avec ton code vous rapporte{" "}
          <strong className="text-text">{ROSES_PER_CLAIM} roses</strong> a chacun.
          Roses = super-likes et acces aux plans exclusifs.
        </p>
      </m.div>

      {/* ── SHARE BLOCK ── */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: 0.1 }}
        className="rounded-2xl border p-5 space-y-4"
        style={{ borderColor: "var(--color-accent)35", background: "var(--color-accent)06" }}
      >
        {user ? (
          loading ? (
            <div className="h-12 rounded-xl bg-bg-card animate-pulse" aria-hidden="true" />
          ) : activeCode ? (
            <>
              <div className="text-center">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-1">
                  Ton code
                </p>
                <p
                  className="font-mono text-[32px] font-bold tracking-[0.18em] text-text"
                >
                  {activeCode.code}
                </p>
              </div>
              <m.button
                type="button"
                onClick={() => shareCode(activeCode.code, flash)}
                whileTap={{ scale: 0.97 }}
                transition={springs.snap}
                className="w-full py-3.5 rounded-xl font-bold text-[15px] text-white tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                style={{
                  background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                }}
              >
                Partager mon code invite
              </m.button>
              <p className="text-center text-[11px] text-text-muted">
                {info.totalReferrals} ami{info.totalReferrals !== 1 ? "s" : ""} inscrit{info.totalReferrals !== 1 ? "s" : ""} ·{" "}
                <strong style={{ color: "var(--color-accent)" }}>
                  {info.totalRosesEarned} 🌹
                </strong>{" "}
                gagnees
              </p>
            </>
          ) : (
            <Link
              href="/invites/mine"
              className="block w-full py-3 text-center rounded-xl font-semibold text-[14px] text-white tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              style={{
                background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
              }}
            >
              Generer mon code invite
            </Link>
          )
        ) : (
          /* Unauthenticated: sign-up CTA */
          <div className="space-y-3 text-center">
            <p className="text-[14px] text-text">
              Cree ton compte pour obtenir ton code et commencer a inviter.
            </p>
            <Link
              href="/register"
              className="block py-3 rounded-xl font-bold text-[15px] text-white tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              style={{
                background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
              }}
            >
              Rejoindre CeSoir gratuitement
            </Link>
            <p className="text-[11px] text-text-muted">
              Deja membre ?{" "}
              <Link href="/login" className="font-semibold" style={{ color: "var(--color-accent)" }}>
                Connexion
              </Link>
            </p>
          </div>
        )}
      </m.div>

      {/* ── HOW IT WORKS ── */}
      <m.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: 0.2 }}
        aria-labelledby="how-it-works"
      >
        <h2
          id="how-it-works"
          className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-4"
        >
          Comment ca marche
        </h2>
        <div className="space-y-4">
          <Step
            n={1}
            title="Tu partages ton code"
            desc="Envoie ton lien par WhatsApp, SMS ou bouche-a-oreille. Ton code est unique."
          />
          <Step
            n={2}
            title="Ton ami s'inscrit"
            desc="Il cree son compte et entre ton code lors de l'inscription. 30 secondes."
          />
          <Step
            n={3}
            title="Vous gagnez tous les deux"
            desc={`+${ROSES_PER_CLAIM} roses pour toi, +${ROSES_PER_CLAIM} roses pour lui, badge Fondateur ☾ pour lui.`}
          />
        </div>
      </m.section>

      {/* ── LEADERBOARD (top inviters) ── */}
      {leaderboard.length > 0 && (
        <m.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.gentle, delay: 0.3 }}
          aria-labelledby="top-inviters"
        >
          <h2
            id="top-inviters"
            className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-4"
          >
            Top inviters ce mois
          </h2>
          <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
            {leaderboard.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < leaderboard.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{
                    background:
                      i === 0
                        ? "linear-gradient(135deg, #FFD700, #FFA500)"
                        : i === 1
                        ? "linear-gradient(135deg, #C0C0C0, #A0A0A0)"
                        : i === 2
                        ? "linear-gradient(135deg, #CD7F32, #A05020)"
                        : "var(--color-border)",
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-[14px] font-medium text-text truncate">
                  {entry.name}
                </span>
                <span className="text-[12px] font-semibold" style={{ color: "var(--color-accent)" }}>
                  {entry.referrals} ami{entry.referrals !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </m.section>
      )}

      {/* ── BACK LINK (if authenticated) ── */}
      {user && (
        <div className="text-center pb-4">
          <Link
            href="/profile"
            className="text-[13px] text-text-muted hover:text-text transition-colors tap-target"
          >
            ← Retour au profil
          </Link>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-[13px] font-semibold text-bg shadow-xl"
          style={{ background: "var(--color-text)" }}
          role="status"
          aria-live="polite"
        >
          {toast}
        </m.div>
      )}
    </div>
  );
}
