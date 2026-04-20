"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence, type Variants } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useToast } from "@/components/ui/Toast";
import { useRoses } from "@/lib/useRoses";
import { useSubscription } from "@/lib/useSubscription";
import { usePurchases } from "@/lib/usePurchases";
import { SHOP_PRODUCTS, formatPrice, type ShopProduct } from "@/lib/stripe/plans";
import { MONETIZATION_ENABLED } from "@/lib/featureFlags";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { app as appTokens } from "@/lib/design-tokens";
import { ChevronRight } from "@/components/ui/lucide";

// ─────────────────────────────────────────
// Variants
// ─────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 25, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springs.heavy },
};
const floatVariants: Variants = {
  idle: {
    y: [0, -6, 0],
    rotate: [0, 3, -3, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function ShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { roses, nextFreeRose } = useRoses();
  const { isPremium } = useSubscription();
  const { buy, error: purchasesError } = usePurchases();
  const [buying, setBuying] = useState<string | null>(null);

  // Free-first launch: redirect to /why-free when monetization is off.
  // IMPORTANT: keep the hook-order stable — do the redirect via useEffect
  // (side effect) and only short-circuit rendering *after* all hooks run.
  useEffect(() => {
    if (!MONETIZATION_ENABLED) {
      router.replace("/why-free");
    }
  }, [router]);

  const rosePacks = useMemo(
    () => SHOP_PRODUCTS.filter((p) => p.productType === "roses"),
    [],
  );
  const boostPacks = useMemo(
    () => SHOP_PRODUCTS.filter((p) => p.productType === "boosts"),
    [],
  );

  if (!MONETIZATION_ENABLED) {
    return null;
  }

  const handleBuy = async (item: ShopProduct) => {
    setBuying(item.id);
    try {
      await buy(item.priceId);
      // On redirige déjà via `buy` → window.location.href
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur d'achat";
      toast(msg, "error");
      setBuying(null);
    }
  };

  // Time until next free rose
  const nextRoseLabel = nextFreeRose
    ? (() => {
        const diff = nextFreeRose.getTime() - Date.now();
        if (diff <= 0) return "Disponible !";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return days > 0 ? `${days}j ${hours}h` : `${hours}h`;
      })()
    : "7 jours";

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="Boutique"
        icon={<span className="text-lg" aria-hidden="true">🛍️</span>}
        actions={
          <span className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-[11px] font-semibold text-pink-400">
            🌹 {roses} Roses
          </span>
        }
      />

      <m.div
        className="px-5 pt-6 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ═══ Balance card ═══ */}
        <m.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-accent/20 p-5"
          style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, ${appTokens.rose} 8%, transparent))` }}
        >
          <m.span
            variants={floatVariants}
            animate="idle"
            className="absolute top-3 right-4 text-3xl opacity-20"
            aria-hidden="true"
          >
            🌹
          </m.span>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center">
              <span className="text-2xl">🌹</span>
            </div>
            <div>
              <p className="text-xs text-text-muted">Ton solde</p>
              <p className="text-2xl font-display font-bold text-text">{roses} Roses</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                Prochaine rose gratuite : {nextRoseLabel}
                {isPremium && <span className="text-accent ml-1">(Premium: 5/sem)</span>}
              </p>
            </div>
          </div>
        </m.div>

        {/* ═══ Error ═══ */}
        <AnimatePresence>
          {purchasesError && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
            >
              {purchasesError}
            </m.div>
          )}
        </AnimatePresence>

        {/* ═══ Roses section ═══ */}
        <div>
          <m.div variants={itemVariants} className="flex items-center gap-2 mb-3">
            <span className="text-base" aria-hidden="true">🌹</span>
            <h2 className="text-sm font-display font-bold text-text">Acheter des Roses</h2>
          </m.div>
          <p className="text-xs text-text-muted mb-4">
            Like les Standouts, envoie des FlashNotes, like les profils tendance
          </p>

          <div className="space-y-3">
            {rosePacks.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                buying={buying === pack.id}
                onBuy={() => handleBuy(pack)}
                iconBg="bg-pink-500/10 border-pink-500/20"
              />
            ))}
          </div>
        </div>

        {/* ═══ Boosts section ═══ */}
        <div>
          <m.div variants={itemVariants} className="flex items-center gap-2 mb-3">
            <span className="text-base" aria-hidden="true">⚡</span>
            <h2 className="text-sm font-display font-bold text-text">Acheter des Boosts</h2>
          </m.div>
          <p className="text-xs text-text-muted mb-4">
            30 minutes de visibilite maximale sur ton profil
          </p>

          <div className="space-y-3">
            {boostPacks.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                buying={buying === pack.id}
                onBuy={() => handleBuy(pack)}
                iconBg="bg-accent/10 border-accent/20"
              />
            ))}
          </div>
        </div>

        {/* ═══ Premium card ═══ */}
        <m.div variants={itemVariants}>
          <Link href="/premium">
            <m.div
              whileHover={{ y: -3, boxShadow: "0 12px 30px color-mix(in srgb, var(--color-accent) 20%, transparent)" }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl border border-accent/30 p-5"
              style={{
                background:
                  `linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 12%, transparent), color-mix(in srgb, ${appTokens.purple} 8%, transparent), color-mix(in srgb, ${appTokens.rose} 6%, transparent))`,
              }}
            >
              <m.div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
                style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 15%, transparent), transparent 70%)" }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-glow">
                  <span className="text-2xl" aria-hidden="true">💎</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-display font-bold text-text">CeSoir Premium</h3>
                    <m.span
                      animate={{ rotate: [0, -5, 5, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs"
                      aria-hidden="true"
                    >
                      👑
                    </m.span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {isPremium
                      ? "Tu es Premium — gère ton abonnement"
                      : "5 Roses/sem, 1 Boost/jour, likes illimités et plus"}
                  </p>
                  <p className="text-xs text-accent font-semibold mt-1">
                    {isPremium ? "Gérer →" : "À partir de 4,99€/mois"}
                  </p>
                </div>
                <ChevronRight size={20} strokeWidth={2} className="text-accent shrink-0" aria-hidden="true" />
              </div>
            </m.div>
          </Link>
        </m.div>

        {/* ═══ How Roses work ═══ */}
        <m.div variants={itemVariants} className="pb-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Comment fonctionnent les Roses ?
          </h3>
          <div className="space-y-3">
            {[
              { icon: "🌟", title: "Like un Standout", desc: "Montre ton interet pour un profil exceptionnel" },
              { icon: "📝", title: "Envoie une FlashNote", desc: "Un message personnalise qui se demarque" },
              { icon: "🔥", title: "Like un profil tendance", desc: "Distingue-toi parmi les profils populaires" },
            ].map((item, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.snap, delay: 0.5 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <span className="text-base mt-0.5" aria-hidden="true">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-text">{item.title}</p>
                  <p className="text-[10px] text-text-muted">{item.desc}</p>
                </div>
              </m.div>
            ))}
          </div>
        </m.div>
      </m.div>
    </div>
  );
}

// ─────────────────────────────────────────
// PackCard component
// ─────────────────────────────────────────

function PackCard({
  pack,
  buying,
  onBuy,
  iconBg,
}: {
  pack: ShopProduct;
  buying: boolean;
  onBuy: () => void;
  iconBg: string;
}) {
  const badge = pack.bestValue ? "Meilleur prix" : pack.popular ? "Populaire" : null;
  return (
    <m.div
      variants={itemVariants}
      className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        buying ? "border-accent bg-accent/5 scale-[0.98]" : "border-border bg-card hover:border-accent/20"
      }`}
    >
      {badge && (
        <div className="absolute -top-2 right-3">
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${
              pack.bestValue ? "gradient-bg" : "bg-amber-500"
            }`}
          >
            {badge}
          </span>
        </div>
      )}
      <m.div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border ${iconBg}`}
        animate={buying ? { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.6 }}
      >
        {pack.icon}
      </m.div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text">{pack.name}</p>
        <p className="text-xs text-text-muted">
          {pack.quantity} {pack.productType === "roses" ? "Roses" : "Boosts"}
        </p>
      </div>
      <m.button
        onClick={onBuy}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        disabled={buying}
        className="px-4 py-2 rounded-full gradient-bg text-white text-xs font-bold shadow-glow disabled:opacity-60"
        aria-label={`Acheter ${pack.name} pour ${formatPrice(pack.amountCents, pack.currency)}`}
      >
        {buying ? (
          <m.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            ✨
          </m.span>
        ) : (
          formatPrice(pack.amountCents, pack.currency)
        )}
      </m.button>
    </m.div>
  );
}
