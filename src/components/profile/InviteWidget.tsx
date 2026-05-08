"use client";

/**
 * InviteWidget — viral loop surface point (W2-7).
 *
 * Mounts on /profile between MasteryStrip and VibePicker.
 * Reads invite codes from useReferralInfo (DB-backed, mig 021 + mig 025).
 *
 * Revenue impact: K-factor target 0.4-0.6 (from 0.05).
 * Each visible share CTA that triggers a real share = +1 referral candidate.
 *
 * Pre-filled message uses the pattern optimized for WhatsApp / iMessage:
 * - Short hook (<80 chars before the URL)
 * - Code prominent + URL clickable
 * - Moon glyph for brand consistency (no emoji unless it renders ☾)
 */

import { useState } from "react";
import { m } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useReferralInfo, ROSES_PER_CLAIM, buildInviteUrl } from "@/lib/referral";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Share message builder
// ─────────────────────────────────────────

function buildShareMessage(code: string): string {
  const url = buildInviteUrl(code);
  return `Rejoins-moi sur CeSoir, l'app pour trouver quelqu'un ce soir a Montpellier ☾ Code : ${code} → ${url}`;
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function RosesCount({ count }: { count: number }) {
  return (
    <m.span
      key={count}
      initial={{ scale: 1.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={springs.elastic}
      className="inline-flex items-center gap-1 font-bold tabular-nums"
      style={{ color: "var(--color-accent)" }}
    >
      {count}
      <span aria-hidden="true" className="text-[15px]">
        🌹
      </span>
    </m.span>
  );
}

// ─────────────────────────────────────────
// Main widget
// ─────────────────────────────────────────

export default function InviteWidget() {
  const { user } = useAuth();
  const { info, loading } = useReferralInfo(user?.id ?? null);
  const [toast, setToast] = useState<string | null>(null);

  // Pick the first active code to expose in the widget.
  const activeCode = info.myCodes.find(
    (c) => !c.usedBy && new Date(c.expiresAt) > new Date()
  );

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function handleShare() {
    if (!activeCode) return;
    const message = buildShareMessage(activeCode.code);
    const url = buildInviteUrl(activeCode.code);

    if ("share" in navigator) {
      try {
        await navigator.share({
          title: "CeSoir — rejoins-moi ce soir",
          text: message,
          url,
        });
        flash("Partage envoyé");
      } catch {
        // User cancelled — silent.
      }
    } else {
      // Desktop fallback: copy the full message.
      try {
        await window.navigator.clipboard.writeText(message);
        flash("Message copié");
      } catch {
        flash("Code : " + activeCode.code);
      }
    }
  }

  async function handleCopy() {
    if (!activeCode) return;
    try {
      await window.navigator.clipboard.writeText(buildInviteUrl(activeCode.code));
      flash("Lien copié");
    } catch {
      flash("Code : " + activeCode.code);
    }
  }

  // Skeleton while loading
  if (loading) {
    return (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-6 mb-8 rounded-2xl border border-border bg-bg-card h-[96px] animate-pulse"
        aria-hidden="true"
      />
    );
  }

  return (
    <m.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="mx-6 mb-8"
      aria-label="Inviter des amis"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em]">
          Invite tes amis
        </h3>
        <Link
          href="/invites/mine"
          className="text-[11px] font-semibold tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-md transition-colors hover:opacity-70"
          style={{ color: "var(--color-accent)" }}
        >
          Voir tout
        </Link>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl border p-4 space-y-3"
        style={{
          background: "var(--color-accent)08",
          borderColor: "var(--color-accent)30",
        }}
      >
        {/* Stats row */}
        <div className="flex items-center gap-4 text-[13px]">
          {/* Friends count */}
          <div className="flex flex-col items-center min-w-[52px]">
            <m.span
              key={info.totalReferrals}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springs.elastic}
              className="text-[22px] font-bold tracking-tight text-text"
            >
              {info.totalReferrals}
            </m.span>
            <span className="text-[10px] text-text-muted leading-tight text-center">
              ami{info.totalReferrals !== 1 ? "s" : ""} inscrit{info.totalReferrals !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="w-px h-8 bg-border" aria-hidden="true" />

          {/* Roses earned */}
          <div className="flex flex-col items-center min-w-[52px]">
            <RosesCount count={info.totalRosesEarned} />
            <span className="text-[10px] text-text-muted leading-tight text-center">
              roses gagnees
            </span>
          </div>

          <div className="w-px h-8 bg-border" aria-hidden="true" />

          {/* Per-referral pill */}
          <div className="flex-1 text-[11px] text-text-muted leading-tight">
            <span className="font-semibold text-text">
              +{ROSES_PER_CLAIM} 🌹
            </span>{" "}
            par ami inscrit, pour vous deux
          </div>
        </div>

        {/* Code display + CTA */}
        {activeCode ? (
          <div className="flex items-center gap-2">
            {/* Code badge */}
            <button
              type="button"
              onClick={handleCopy}
              aria-label={`Copier le code ${activeCode.code}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-bg font-mono text-[15px] font-bold tracking-widest text-text hover:border-accent/50 transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <span aria-hidden="true" style={{ color: "var(--color-accent)" }}>
                ☾
              </span>
              {activeCode.code}
            </button>

            {/* Share CTA */}
            <m.button
              type="button"
              onClick={handleShare}
              whileTap={{ scale: 0.95 }}
              transition={springs.snap}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-[13px] text-white tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              style={{
                background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
              }}
            >
              <svg
                width={15}
                height={15}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Partager
            </m.button>
          </div>
        ) : (
          /* No code yet — nudge to /invites/mine to generate */
          <Link
            href="/invites/mine"
            className="block w-full text-center py-2 rounded-xl border border-dashed border-border text-[13px] font-medium text-text-muted hover:border-accent/40 hover:text-text transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Generer mon code invite
          </Link>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <m.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-2 text-center text-[12px] font-semibold"
          style={{ color: "var(--color-accent)" }}
          role="status"
          aria-live="polite"
        >
          {toast}
        </m.div>
      )}
    </m.section>
  );
}
