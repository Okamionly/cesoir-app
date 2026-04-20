"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useSubscription } from "@/lib/useSubscription";
import { SUBSCRIPTION_PLANS, formatPrice, type SubscriptionPlan } from "@/lib/stripe/plans";
import { BENEFITS } from "@/lib/premium-benefits";
import { app as appTokens } from "@/lib/design-tokens";
import { MONETIZATION_ENABLED } from "@/lib/featureFlags";
import Link from "next/link";

// Premium gold shimmer — resolved via design tokens so the page stays
// hex-free while preserving the gold gradient identity.
const GOLD_SHIMMER = `linear-gradient(135deg, var(--color-warn), ${appTokens.gold}, var(--color-warn))`;
const GOLD_GRADIENT = `linear-gradient(135deg, var(--color-warn), ${appTokens.gold})`;

// ─────────────────────────────────────────
// FAQ data
// ─────────────────────────────────────────

const FAQ = [
  { question: "Puis-je annuler a tout moment ?", answer: "Oui, tu peux annuler ton abonnement quand tu veux depuis le portail de facturation. Tu conserves les avantages jusqu'a la fin de la periode payee." },
  { question: "L'essai gratuit est-il vraiment gratuit ?", answer: "Absolument. Pendant 7 jours, tu as acces a toutes les fonctionnalites Premium sans etre debite. Annule avant la fin si ca ne te convient pas." },
  { question: "Comment fonctionne le boost profil ?", answer: "Chaque semaine, tu peux activer un boost qui place ton profil en priorite pendant 30 minutes. Les autres utilisateurs te voient en premier." },
  { question: "Quels moyens de paiement acceptez-vous ?", answer: "Tous les paiements sont sécurisés via Stripe : carte bancaire, Apple Pay, Google Pay et plus. Aucune donnée bancaire n'est stockée chez nous." },
] as const;

// ─────────────────────────────────────────
// FAQ Item
// ─────────────────────────────────────────

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.elastic, delay: 0.8 + index * 0.1 }}
      className="border border-border rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left tap-target"
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold text-text pr-4">{question}</span>
        <m.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={springs.snap}
          className="text-text-muted text-[18px] shrink-0"
          aria-hidden="true"
        >
          ▾
        </m.span>
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.snap}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-[13px] text-text-muted leading-relaxed">{answer}</p>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function PremiumPage() {
  const router = useRouter();
  const { isPremium, subscription, isLoading, error, startCheckout, openPortal } = useSubscription();
  const [busy, setBusy] = useState<string | null>(null);

  // Free-first launch: redirect to /why-free when monetization is off.
  // The page itself stays compiled so Wave N+1 can flip the flag without a rebuild.
  // IMPORTANT: the early `return null` comes *after* all hooks so React's
  // rules-of-hooks invariant is preserved.
  useEffect(() => {
    if (!MONETIZATION_ENABLED) {
      router.replace("/why-free");
    }
  }, [router]);

  // Only show paid plans in the picker
  const paidPlans = useMemo(
    () => SUBSCRIPTION_PLANS.filter((p) => p.tier === "premium"),
    [],
  );

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const recommended = paidPlans.find((p) => p.recommended);
    return recommended?.id ?? paidPlans[0]?.id ?? "premium_annual";
  });

  const selectedPlan: SubscriptionPlan | undefined = paidPlans.find((p) => p.id === selectedPlanId);

  if (!MONETIZATION_ENABLED) {
    return null;
  }

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setBusy("checkout");
    try {
      await startCheckout(selectedPlan.priceId);
    } finally {
      setBusy(null);
    }
  };

  const handleManage = async () => {
    setBusy("portal");
    try {
      await openPortal();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-safe">
      {/* ── Header ── */}
      <div className="relative px-6 pt-14 pb-10 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, var(--color-warn) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.elastic}
          className="text-[48px] mb-3"
          aria-hidden="true"
        >
          👑
        </m.div>
        <m.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.elastic, delay: 0.1 }}
          className="text-[28px] font-display font-bold"
          style={{
            background: GOLD_SHIMMER,
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          CeSoir Premium
        </m.h1>
        <m.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.elastic, delay: 0.2 }}
          className="text-[14px] text-text-muted mt-2"
        >
          Debloques toutes les fonctionnalites. Fais la difference.
        </m.p>

        {isPremium && (
          <m.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{ background: "color-mix(in srgb, var(--color-warn) 12%, transparent)", color: "var(--color-warn)" }}
          >
            <span>✨</span>
            <span>
              Premium actif
              {subscription?.cancel_at_period_end ? " (annulation programmée)" : ""}
            </span>
          </m.div>
        )}
      </div>

      {/* ── Benefits ── */}
      <div className="px-6 space-y-3">
        {BENEFITS.map((benefit, i) => (
          <m.div
            key={benefit.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.elastic, delay: 0.15 + i * 0.08 }}
            className="flex items-start gap-4 p-4 rounded-2xl bg-bg-card border border-border"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0"
              style={{ backgroundColor: `${benefit.iconColor}15` }}
              aria-hidden="true"
            >
              {benefit.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-text">{benefit.title}</p>
              <p className="text-[12px] text-text-muted mt-0.5 leading-relaxed">{benefit.description}</p>
            </div>
          </m.div>
        ))}
      </div>

      {/* ── Pricing / Manage ── */}
      {isPremium ? (
        <div className="px-6 mt-10">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.elastic}
            className="p-5 rounded-2xl bg-bg-card border border-border text-center"
          >
            <p className="text-[13px] text-text-muted mb-1">Ton abonnement est actif</p>
            {subscription?.current_period_end && (
              <p className="text-[12px] text-text-muted">
                {subscription.cancel_at_period_end ? "Se termine" : "Prochain renouvellement"} le{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("fr-FR")}
              </p>
            )}
            <m.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              disabled={busy === "portal"}
              onClick={handleManage}
              className="mt-4 w-full py-3 rounded-full text-[14px] font-bold text-white disabled:opacity-60"
              style={{ background: GOLD_GRADIENT }}
            >
              {busy === "portal" ? "Ouverture..." : "Gérer ma subscription"}
            </m.button>
          </m.div>
        </div>
      ) : (
        <>
          <div className="px-6 mt-10">
            <m.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-[18px] font-display font-bold text-center mb-5"
            >
              Choisis ton plan
            </m.h2>

            <div className="grid grid-cols-2 gap-3">
              {paidPlans.map((plan, idx) => {
                const selected = selectedPlanId === plan.id;
                const monthlyEquivalent =
                  plan.interval === "year"
                    ? plan.amountCents / 12
                    : plan.amountCents;
                return (
                  <m.button
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.elastic, delay: 0.65 + idx * 0.05 }}
                    whileHover={{ rotateY: 3, transition: springs.gentle }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="relative p-5 rounded-2xl border-2 text-left transition-colors"
                    style={{
                      perspective: "800px",
                      borderColor: selected ? "var(--color-warn)" : "var(--color-border)",
                      backgroundColor: selected ? "color-mix(in srgb, var(--color-warn) 5%, transparent)" : "transparent",
                      boxShadow: selected ? "0 0 20px color-mix(in srgb, var(--color-warn) 15%, transparent)" : "none",
                    }}
                    aria-pressed={selected}
                    aria-label={`${plan.name}, ${formatPrice(plan.amountCents, plan.currency)} ${plan.interval === "month" ? "par mois" : "par an"}`}
                  >
                    {plan.savePercent ? (
                      <div
                        className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: "var(--color-accent-2)", color: "var(--color-bg-dark)" }}
                      >
                        Economise {plan.savePercent}%
                      </div>
                    ) : null}
                    <p className="text-[12px] text-text-muted font-medium">{plan.name}</p>
                    <p className="text-[24px] font-display font-bold text-text mt-1">
                      {formatPrice(monthlyEquivalent, plan.currency)}
                      <span className="text-[14px] font-normal text-text-muted">/mois</span>
                    </p>
                    {plan.interval === "year" && (
                      <p className="text-[11px] text-text-muted mt-1">
                        Facturé {formatPrice(plan.amountCents, plan.currency)}/an
                      </p>
                    )}
                  </m.button>
                );
              })}
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="px-6 mt-8">
            {error && (
              <p className="text-[12px] text-red-500 text-center mb-3">{error}</p>
            )}
            <m.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.elastic, delay: 0.75 }}
              whileHover={{ y: -3, boxShadow: "0 8px 30px color-mix(in srgb, var(--color-warn) 35%, transparent)" }}
              whileTap={{ scale: 0.95 }}
              disabled={busy === "checkout" || isLoading}
              onClick={handleSubscribe}
              className="w-full py-4 rounded-full text-[16px] font-bold text-white disabled:opacity-60"
              style={{ background: GOLD_GRADIENT }}
              aria-label={`S'abonner à ${selectedPlan?.name ?? "Premium"}`}
            >
              {busy === "checkout"
                ? "Redirection..."
                : selectedPlan?.trialDays
                  ? `Essai gratuit ${selectedPlan.trialDays} jours`
                  : "S'abonner"}
            </m.button>
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="text-[11px] text-text-muted text-center mt-3"
            >
              Annule a tout moment. Aucun engagement. Paiement sécurisé Stripe.
            </m.p>
          </div>
        </>
      )}

      {/* ── Social proof ── */}
      <m.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.elastic, delay: 0.9 }}
        className="mx-6 mt-8 py-4 px-5 rounded-2xl bg-bg-card border border-border text-center"
      >
        <div className="flex items-center justify-center gap-1 mb-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-[14px]" style={{ color: "var(--color-warn)" }} aria-hidden="true">
              ★
            </span>
          ))}
        </div>
        <p className="text-[13px] font-semibold text-text">
          Rejoint par <span style={{ color: "var(--color-warn)" }}>1,247</span> membres premium
        </p>
        <p className="text-[11px] text-text-muted mt-0.5">Les membres premium ont 3x plus de matchs</p>
      </m.div>

      {/* ── FAQ ── */}
      <div className="px-6 mt-10 mb-8">
        <m.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-[16px] font-display font-bold mb-4"
        >
          Questions frequentes
        </m.h2>
        <div className="space-y-2">
          {FAQ.map((faq, i) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} index={i} />
          ))}
        </div>
      </div>

      {/* ── Back link ── */}
      <div className="px-6 pb-6 text-center">
        <Link href="/browse" className="text-[13px] text-text-muted underline underline-offset-2">
          Retour
        </Link>
      </div>
    </div>
  );
}
