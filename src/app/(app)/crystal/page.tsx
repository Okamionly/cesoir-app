"use client";

/**
 * /crystal — Daily blind match (Wave 17 · Crystal Ball).
 *
 * Renders one of three states:
 *   1. No match generated yet today → empty state with "Reviens à 20h".
 *   2. Match present → CrystalBallCard (handles prompt / waiting /
 *      revealed transitions internally).
 *   3. Loading → minimal full-screen shimmer.
 *
 * The route is dedicated and full-bleed: BottomNav is hidden via
 * className override on the outer div so the cinematic reveal owns
 * the entire viewport. The user navigates back via the close button
 * on the card.
 *
 * Hooked into BottomNav via the optional 7th tab "Crystal" — the badge
 * pings only when there's a today's match the user hasn't decided on,
 * driven by `useCrystalBall().available`.
 */

import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "motion/react";
import { Sparkles, ArrowLeft } from "@/components/ui/lucide";
import { useCrystalBall } from "@/lib/useCrystalBall";
import CrystalBallCard from "@/components/crystal-ball/CrystalBallCard";

export default function CrystalPage() {
  const router = useRouter();
  const { match, loading, error, like, pass } = useCrystalBall();

  // ────────────────────────────────────────────
  // Loading skeleton
  // ────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(139,92,246,0.18) 0%, transparent 70%), var(--color-bg, #111)",
        }}
      >
        <m.div
          className="flex flex-col items-center gap-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={32} className="text-accent" />
          <span className="text-text-muted text-sm">Consultation de la boule…</span>
        </m.div>
      </div>
    );
  }

  // ────────────────────────────────────────────
  // Empty state — no match for today yet
  // ────────────────────────────────────────────
  if (!match) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(139,92,246,0.18) 0%, transparent 65%), var(--color-bg, #111)",
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Retour"
          className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white"
          style={{ marginTop: "env(safe-area-inset-top)" }}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center max-w-[320px]">
          <m.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(139,92,246,0.05) 70%, transparent 100%)",
            }}
          >
            <m.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={36} className="text-[#8B5CF6]" />
            </m.div>
          </m.div>
          <h1 className="text-2xl font-semibold text-white mb-3">
            Crystal Ball
          </h1>
          <p className="text-text-muted text-sm leading-relaxed">
            Chaque soir à 20h, l&apos;algo te réserve un seul profil. Photo
            floutée, prénom caché. Si vous vous likez tous les deux dans les
            24h, vos visages se révèlent et le chat s&apos;ouvre.
          </p>
          <p className="mt-6 text-text-muted/60 text-xs">
            Reviens à 20h pour ton match du jour ☾
          </p>
          {error && (
            <p className="mt-4 text-red-400 text-xs">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────
  // Active match — full-bleed reveal card
  // ────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button always available top-left */}
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Fermer"
        className="absolute top-5 left-5 z-30 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <ArrowLeft size={18} />
      </button>

      <AnimatePresence mode="wait">
        <CrystalBallCard
          key={match.id}
          match={match}
          onLike={like}
          onPass={() => {
            pass();
            router.back();
          }}
          // After the reveal, the chat row may not exist yet (the two
          // users haven't been swiping each other). For the MVP we
          // simply send them to /matches — the card's internal CTA
          // surfaces only on revealed state.
          chatHref={match.revealedAt !== null ? "/matches" : undefined}
        />
      </AnimatePresence>
    </div>
  );
}
