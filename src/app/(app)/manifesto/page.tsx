"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";

/**
 * /manifesto — founder manifesto, long-form cinematic article.
 *
 * Scene pattern: each section is a full-screen vh block with entrance
 * animation. Reader scrolls through like a cinematic essay. Ton direct,
 * Gen Z-friendly, zero corporate.
 *
 * Sections:
 *   1. Pourquoi CeSoir (intro hero)
 *   2. Le problème (isolement urbain post-COVID)
 *   3. L'insight (matcher sur un plan pas un profil)
 *   4. Vision 5 ans
 *   5. Pourquoi maintenant
 *   6. Outro / CTA retour
 *
 * Design: palette CeSoir (#FFF · #111 · #8B5CF6 · #00FF88). Tailwind v4.
 * motion/react (pas framer-motion).
 */

// Metadata cannot be exported from a client component. See layout or a wrapper if needed.
// For now we rely on the PageHeader title + document.title pattern (handled by Next layout).

const SECTIONS = [
  {
    kicker: "01 · Pourquoi CeSoir",
    title: "Personne ne devrait dîner seul ce soir parce qu'il n'a pas trouvé comment écrire le premier message.",
    body: [
      "On a grandi dans la promesse d'un monde hyper-connecté.",
      "Aujourd'hui, un étudiant de Montpellier a 1200 amis sur Instagram, 47 matches Tinder dormants, 12 discussions WhatsApp archivées — et personne avec qui boire un verre ce soir.",
      "La technologie de rencontre s'est trompée d'objectif. Elle a optimisé pour le swipe, pas pour la soirée. Pour le funnel, pas pour l'humain. Pour la rétention, pas pour la rencontre.",
      "CeSoir n'est pas une énième app de dating. C'est un outil pour que ta soirée existe.",
    ],
    accent: "#8B5CF6",
  },
  {
    kicker: "02 · Le problème",
    title: "L'isolement urbain post-COVID est silencieux mais massif.",
    body: [
      "1 Français sur 4 déclare se sentir régulièrement seul (INSEE 2024).",
      "60% des 18-35 ans ont réduit leurs sorties spontanées depuis 2020.",
      "Les apps de dating classiques ont un taux de conversion match → rencontre IRL de 3%.",
      "La plupart des conversations meurent avant même de proposer quelque chose.",
      "Le problème n'est pas le manque de gens. C'est le manque de prétexte, de spontanéité, de proximité.",
    ],
    accent: "#EC4899",
  },
  {
    kicker: "03 · L'insight",
    title: "On ne se matche pas sur un profil. On se rencontre sur un plan.",
    body: [
      "Un verre. Un dîner. Une soirée en coloc. Une balade au Peyrou. Un concert au Rockstore.",
      "Quand tu proposes un plan concret ce soir, tu filtres 10x mieux qu'avec 200 photos et une bio de 5 lignes. Parce que les gens qui disent oui à ton plan sont des gens qui veulent réellement te voir.",
      "Apps classiques : match d'abord → (peut-être) plan plus tard.",
      "CeSoir : plan d'abord → rencontre maintenant.",
      "C'est un shift mental simple mais radical. Tu ne cherches plus « l'âme sœur ». Tu cherches « quelqu'un avec qui prendre un verre ce soir à 21h au Calmette ».",
    ],
    accent: "#00FF88",
  },
  {
    kicker: "04 · Vision 5 ans",
    title: "Le mot « cesoir » devient un verbe.",
    body: [
      "2026 — Montpellier. CeSoir devient l'outil par défaut de la Gen Z montpelliéraine pour sortir le soir. 10k users actifs. 50+ venues partenaires. Zéro paywall côté utilisateur.",
      "2027 — France. Déploiement ville par ville : Toulouse, Lyon, Bordeaux, Paris. Focus densité locale, pas vanity metrics.",
      "2028 — Europe latine. Barcelone, Lisbonne, Milan. Partout où la culture du « on sort ce soir » existe déjà culturellement.",
      "2029 — Platform. CeSoir devient l'infrastructure que les venues utilisent pour remplir leurs soirées creuses. Les users paient zéro.",
      "2030 — Catégorie. « On cesoire au Panama ce soir ? » CeSoir n'est plus une app, c'est un comportement social.",
    ],
    accent: "#8B5CF6",
  },
  {
    kicker: "05 · Pourquoi maintenant",
    title: "Trois vagues convergent en 2026.",
    body: [
      "Fatigue des apps de dating classiques — Tinder, Bumble et Hinge perdent des utilisateurs actifs pour la première fois. Les Gen Z déclarent être « en burnout de swipe ».",
      "Retour du local — Post-COVID et tension écologique, les soirées de proximité redeviennent la norme. Les gens sortent dans leur quartier, pas à l'autre bout de la ville.",
      "Saturation des réseaux sociaux — Instagram, TikTok, BeReal : on se lasse de consommer des vies. On veut vivre la sienne.",
      "CeSoir capte ces trois vagues en même temps. Un an plus tôt c'était trop tôt. Un an plus tard c'est trop tard — quelqu'un d'autre le fera.",
    ],
    accent: "#00FF88",
  },
] as const;

export default function ManifestoPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const progressBar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="min-h-screen bg-bg text-text">
      <PageHeader title="Manifesto" backHref="/about" />

      {/* Scroll progress bar at top */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-50 origin-left pointer-events-none"
        style={{
          width: progressBar,
          background: "linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #00FF88 100%)",
          boxShadow: "0 0 12px rgba(139,92,246,0.5)",
        }}
      />

      {/* Hero */}
      <motion.section
        className="px-5 pt-16 pb-12 max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted mb-4">
          Manifesto
        </p>
        <h1 className="font-display text-[36px] sm:text-[52px] md:text-[64px] font-black leading-[1.02] tracking-tight mb-6">
          Personne ne dîne seul ce soir à{" "}
          <span className="gradient-text">Montpellier</span>.
        </h1>
        <p className="text-[14px] sm:text-[16px] text-text-muted leading-relaxed max-w-lg mx-auto">
          Un manifeste fondateur. Direct, sans filtre.
          <br />
          Pourquoi on construit CeSoir. Pourquoi maintenant. Pourquoi jamais payant.
        </p>
      </motion.section>

      {/* Sections */}
      <div className="px-5 pb-16 max-w-2xl mx-auto space-y-20 sm:space-y-24">
        {SECTIONS.map((section, i) => (
          <ManifestoSection key={section.kicker} section={section} index={i} />
        ))}
      </div>

      {/* Outro CTA */}
      <motion.section
        className="px-5 py-16 max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="font-display text-[24px] sm:text-[32px] font-black leading-[1.15] tracking-tight mb-3">
          On construit CeSoir pour que personne ne dîne seul ce soir à
          Montpellier,
          <br />
          puis en France,
          <br />
          puis partout.
        </p>
        <p className="text-[14px] text-text-muted mb-8">
          <span className="gradient-text font-bold">Gratuit.</span> Près de chez
          toi. <span className="font-bold text-text">Pour de vrai.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link
            href="/signup-quick"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-display text-[15px] font-black text-white"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
              boxShadow: "0 0 40px rgba(139,92,246,0.35)",
            }}
          >
            Rejoindre CeSoir
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/why-free"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-[13px] font-bold text-text-muted hover:text-text transition-colors"
          >
            Pourquoi gratuit ?
          </Link>
        </div>
        <p className="text-[10px] text-text-muted/60 uppercase tracking-[0.3em] mt-10">
          L&apos;équipe CeSoir · Montpellier · 2026
        </p>
      </motion.section>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Individual section — reusable scene-like block with reveal animation
// ───────────────────────────────────────────────────────────────────
function ManifestoSection({
  section,
  index,
}: {
  section: (typeof SECTIONS)[number];
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.05,
      }}
      className="relative"
    >
      {/* Accent line */}
      <motion.div
        className="h-[3px] w-12 rounded-full mb-5"
        style={{ background: section.accent, boxShadow: `0 0 16px ${section.accent}60` }}
        initial={{ width: 0 }}
        whileInView={{ width: 48 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      />

      <p
        className="text-[10px] font-bold uppercase tracking-[0.3em] mb-3"
        style={{ color: section.accent }}
      >
        {section.kicker}
      </p>

      <h2 className="font-display text-[26px] sm:text-[34px] md:text-[40px] font-black leading-[1.1] tracking-tight text-text mb-6">
        {section.title}
      </h2>

      <div className="space-y-4">
        {section.body.map((paragraph, i) => (
          <p
            key={i}
            className="text-[15px] sm:text-[16px] text-text-muted leading-[1.65]"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </motion.article>
  );
}
