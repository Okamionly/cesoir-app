import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pourquoi CeSoir est gratuit",
  description: "CeSoir est 100% gratuit. Pas de paywall, pas de data mining. On t'explique comment.",
};

const SECTIONS = [
  {
    icon: "🎯",
    title: "Notre mission",
    text: "CeSoir existe pour un seul objectif : que personne ne passe une soiree seul(e) par manque d'option. La connexion humaine ne devrait pas avoir de prix.",
  },
  {
    icon: "🏪",
    title: "Partenariats avec les lieux",
    text: "Nos revenus viennent de partenariats avec des restaurants, bars et lieux culturels. Quand tu decouvres un nouvel endroit via CeSoir, le lieu nous reverse une petite commission. Tu ne paies rien de plus.",
  },
  {
    icon: "🚫",
    title: "Zero data mining",
    text: "On ne vend pas tes donnees. Jamais. Pas de pub ciblee, pas de profiling, pas de revente a des tiers. Tes donnees restent les tiennes.",
  },
  {
    icon: "💳",
    title: "Pas de paywall",
    text: "Tous les modes, toutes les fonctionnalites, pour tout le monde. Pas de version premium qui cache les meilleures features. Pas de super-likes payants.",
  },
  {
    icon: "🤝",
    title: "Un modele vertueux",
    text: "Plus tu sors, plus les lieux partenaires sont contents, plus on peut financer l'app. C'est un cercle vertueux ou tout le monde gagne.",
  },
  {
    icon: "🔮",
    title: "Et demain ?",
    text: "On envisage des options premium 100% optionnelles (themes, badges custom) qui n'affectent pas l'experience de base. Le coeur de CeSoir restera toujours gratuit.",
  },
];

export default function WhyFreePage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center tap-target"
            aria-label="Retour"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-[16px] font-black text-text tracking-tight">Pourquoi gratuit ?</h1>
        </div>
      </div>

      {/* Hero */}
      <div className="px-5 pt-8 pb-4 max-w-lg mx-auto text-center">
        <p className="text-[40px] mb-3" aria-hidden="true">💯</p>
        <h2 className="text-[22px] font-black tracking-tight text-text">
          CeSoir est <span className="gradient-text">100% gratuit</span>
        </h2>
        <p className="text-[14px] text-text-muted mt-2 max-w-[320px] mx-auto">
          Et ca ne changera pas. Voici comment on fait.
        </p>
      </div>

      {/* Sections */}
      <div className="px-5 py-6 max-w-lg mx-auto space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center shrink-0">
                <span className="text-[18px]" aria-hidden="true">{section.icon}</span>
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-text mb-1">{section.title}</h3>
                <p className="text-[13px] text-text-muted leading-relaxed">{section.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Closing */}
      <div className="px-5 pb-24 max-w-lg mx-auto">
        <div className="gradient-bg-subtle border border-accent/10 rounded-2xl p-5 text-center">
          <p className="text-[14px] text-text font-semibold">
            &quot;Si c&apos;est gratuit, c&apos;est toi le produit&quot; ?
          </p>
          <p className="text-[13px] text-text-muted mt-2">
            Pas ici. Chez CeSoir, le produit c&apos;est la rencontre. Et le client, c&apos;est le restaurant du coin.
          </p>
        </div>
      </div>
    </div>
  );
}
