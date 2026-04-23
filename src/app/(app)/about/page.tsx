import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "A propos de CeSoir",
  description:
    "Une equipe montpellieraine qui refuse l'isolement urbain. Notre mission, nos valeurs, l'equipe et les advisors.",
};

// ─────────────────────────────────────────────────────────────────────
// TEAM — Placeholders honnetes. User remplit au fur et a mesure.
// Structure prete : name, role, bio, linkedin (optionnel), initials.
// ─────────────────────────────────────────────────────────────────────
type TeamMember = {
  name: string;
  role: string;
  bio: string;
  linkedin?: string;
  initials: string;
};

const TEAM: TeamMember[] = [
  {
    name: "A completer",
    role: "CEO & Produit · Fondateur",
    bio: "5 ans dans le produit digital. Convaincu que la tech doit rapprocher, pas isoler. Construit CeSoir seul depuis janvier 2026.",
    initials: "F",
    // linkedin: "https://linkedin.com/in/...",
  },
  {
    name: "A recruter Q3 2026",
    role: "CTO · Technique & Infrastructure",
    bio: "Stack Next.js / Supabase / Vercel. Obsession perf + securite. Profil senior idealement ex-Doctolib, Alan ou Swile.",
    initials: "T",
  },
  {
    name: "A recruter Q4 2026",
    role: "Design Lead · UX & Direction Artistique",
    bio: "Minimaliste, Gen Z, mobile-first. Experience app mobile obligatoire. Amour du detail.",
    initials: "D",
  },
];

// ─────────────────────────────────────────────────────────────────────
// VALUES — 5 valeurs extraites du brand audit Wave 13 (2026-04).
// Ton : direct, chaleureux, honnete, local, impatient.
// Detail complet avec + examples : docs/VALUES.md
// ─────────────────────────────────────────────────────────────────────
const VALUES = [
  {
    title: "Direct",
    emoji: "🎯",
    text: "On dit ce qu'on fait. On fait ce qu'on dit. Pas de corporate, pas de langue de bois.",
    yes: "Ce soir, pres de toi",
    no: "Decouvrez une experience relationnelle reinventee",
  },
  {
    title: "Chaleureux",
    emoji: "🔥",
    text: "La technologie doit rapprocher. Chaque decision produit est testee contre : est-ce que ca aide les gens a se rencontrer pour de vrai ?",
    yes: "Salut toi ! On matche ?",
    no: "Bienvenue sur votre espace personnel",
  },
  {
    title: "Honnete",
    emoji: "💯",
    text: "Zero dark pattern. Zero paywall qui ment sur la gratuite. On explique comment on gagne de l'argent (page Pourquoi gratuit).",
    yes: "Tu payes rien. Jamais.",
    no: "L'essai gratuit est vraiment gratuit ?",
  },
  {
    title: "Local",
    emoji: "📍",
    text: "On construit pour les quartiers, pas les villes. Densite locale > vanity metrics. Montpellier d'abord, le reste apres.",
    yes: "Bar a Figuerolles ? Place de la Comedie ?",
    no: "Choisissez un lieu dans votre ville",
  },
  {
    title: "Impatient",
    emoji: "⚡",
    text: "Ship fast. Itere vite. On prefere livrer 80% aujourd'hui que 100% dans 3 mois. L'attente tue le produit.",
    yes: "Match → chat → RDV dans la soiree",
    no: "Nouveaux matchs affiches chaque 24h",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────
// JOBS — 4 postes ouverts. Fiches detaillees : docs/hiring/
// ─────────────────────────────────────────────────────────────────────
type Job = {
  title: string;
  type: string;
  priority: "urgent" | "open";
  summary: string;
};

const JOBS: Job[] = [
  {
    title: "Product Designer — Female-first UX",
    type: "Freelance 2-3j/semaine",
    priority: "urgent",
    summary:
      "Ex-Bumble/Hinge/Fruitz ideal. Safety UX feminine, onboarding female-first, messaging anti-harcelement.",
  },
  {
    title: "Tech Lead Full-stack",
    type: "Freelance 3j/semaine",
    priority: "open",
    summary:
      "Next.js + Supabase senior. Ex-scaleup B2C (Doctolib, Alan, Back Market). CI/CD, type safety, scale.",
  },
  {
    title: "DPO Externe Fractional",
    type: "2j/mois",
    priority: "urgent",
    summary:
      "Certifie CNIL, experience dating apps (Happn, Meetic, Fruitz). DPIA, RAT, incidents RGPD.",
  },
  {
    title: "Community Manager",
    type: "Part-time 15h/semaine",
    priority: "open",
    summary:
      "Gen Z Montpellieraine. TikTok, Discord, events mensuels CeSoir Sessions.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// ADVISORS — Structure vide. User remplit quand contacts signes.
// ─────────────────────────────────────────────────────────────────────
type Advisor = {
  name: string;
  title: string;
  company?: string;
};

const ADVISORS: Advisor[] = [
  // Exemples de profils cibles (a remplir quand engages) :
  // { name: "TBD", title: "ex-Head of Growth", company: "Tinder FR" },
  // { name: "TBD", title: "Fondateur", company: "Big Mamma Group" },
  // { name: "TBD", title: "Ex-Product Lead", company: "LaFourchette" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="A propos" backHref="/profile" />

      {/* Mission hero */}
      <div className="px-5 pt-10 pb-6 max-w-lg mx-auto text-center">
        <div className="text-[36px] font-black mb-2">
          <span className="gradient-text">CeSoir</span>
        </div>
        <p className="text-[18px] font-black text-text mt-4 max-w-[340px] mx-auto leading-tight">
          Personne ne dine seul ce soir a Montpellier.
        </p>
        <p className="text-[13px] text-text-muted mt-3 max-w-[360px] mx-auto leading-relaxed">
          CeSoir connecte les gens qui sont disponibles ce soir, pres de chez eux.
          Pas demain, pas la semaine prochaine. Ce soir.
        </p>

        {/* Manifesto link CTA */}
        <Link
          href="/manifesto"
          className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-bg-card border border-border hover:border-accent/40 transition-colors text-[12px] font-bold text-text"
        >
          Lire le manifesto
          <span aria-hidden="true" className="text-accent">→</span>
        </Link>
      </div>

      {/* Nos valeurs (5 valeurs, ton humain + YES/NO exemples) */}
      <section className="px-5 py-6 max-w-lg mx-auto">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-4">
          Nos valeurs
        </p>
        <div className="space-y-3">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-[22px] shrink-0" aria-hidden="true">
                  {v.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-black text-text">{v.title}</p>
                  <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                    {v.text}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[11px] text-emerald-500 leading-snug">
                      <span className="font-black">YES</span>
                      <span className="text-text-muted"> — </span>
                      {v.yes}
                    </p>
                    <p className="text-[11px] text-red-400/70 leading-snug">
                      <span className="font-black">NO</span>
                      <span className="text-text-muted"> — </span>
                      <span className="line-through decoration-red-400/40">
                        {v.no}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* L'equipe (avec placeholders + LinkedIn structure ready) */}
      <section className="px-5 py-6 max-w-lg mx-auto">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-4">
          L&apos;equipe
        </p>
        <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
          Petite, lean, focus. Une equipe montpellieraine qui ship vite.
        </p>
        <div className="space-y-3">
          {TEAM.map((member) => (
            <div
              key={member.role}
              className="bg-bg-card border border-border rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="w-12 h-12 rounded-full gradient-bg-subtle border border-accent/10 flex items-center justify-center shrink-0">
                <span className="text-[16px] font-black text-accent">
                  {member.initials}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-bold text-text">{member.name}</p>
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-accent hover:underline font-semibold"
                    >
                      LinkedIn →
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-accent font-semibold">
                  {member.role}
                </p>
                <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nos advisors (vide pour futur ajout) */}
      <section className="px-5 py-6 max-w-lg mx-auto">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-4">
          Nos advisors
        </p>
        {ADVISORS.length === 0 ? (
          <div className="bg-bg-card border border-dashed border-border rounded-2xl p-5 text-center">
            <p className="text-[13px] font-bold text-text">
              Advisors a venir
            </p>
            <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
              On construit progressivement notre board d&apos;advisors :
              <br />
              ex-Tinder FR, operateurs restauration, experts growth Gen Z.
            </p>
            <a
              href="mailto:contact@cesoir.app?subject=Advisor%20CeSoir"
              className="inline-block mt-4 text-[11px] font-bold text-accent hover:underline"
            >
              Tu veux nous rejoindre ? Ecris-nous →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {ADVISORS.map((advisor) => (
              <div
                key={advisor.name}
                className="bg-bg-card border border-border rounded-2xl p-4"
              >
                <p className="text-[14px] font-bold text-text">{advisor.name}</p>
                <p className="text-[11px] text-text-muted mt-1">
                  {advisor.title}
                  {advisor.company && (
                    <>
                      {" · "}
                      <span className="font-semibold text-text">
                        {advisor.company}
                      </span>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* On recrute (4 JDs — fiches completes dans docs/hiring/) */}
      <section className="px-5 py-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">
            On recrute
          </p>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            {JOBS.length} postes
          </span>
        </div>
        <div className="space-y-3">
          {JOBS.map((j) => (
            <div
              key={j.title}
              className="bg-bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-text">{j.title}</p>
                  <p className="text-[11px] text-accent font-semibold mt-0.5">
                    {j.type}
                  </p>
                </div>
                {j.priority === "urgent" && (
                  <span className="text-[9px] bg-red-500/10 text-red-500 font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    Urgent
                  </span>
                )}
              </div>
              <p className="text-[12px] text-text-muted mt-2 leading-relaxed">
                {j.summary}
              </p>
            </div>
          ))}
        </div>
        <a
          href="mailto:contact@cesoir.app?subject=%5BCandidature%5D"
          className="mt-4 block w-full text-center py-3 rounded-xl bg-accent text-white font-black text-[13px] hover:opacity-90 transition-opacity"
        >
          Candidater → contact@cesoir.app
        </a>
        <p className="text-[10px] text-text-muted/70 mt-2 text-center leading-relaxed">
          Fiches completes disponibles dans{" "}
          <span className="text-accent/80 font-mono">docs/hiring/</span>
        </p>
      </section>

      {/* Stats */}
      <section className="px-5 py-6 max-w-lg mx-auto">
        <div className="flex gap-2">
          {[
            { n: "14", l: "Modes" },
            { n: "0 EUR", l: "Pour toujours" },
            { n: "100%", l: "Gratuit" },
          ].map((s) => (
            <div
              key={s.l}
              className="flex-1 bg-bg-card border border-border rounded-xl py-4 text-center"
            >
              <p className="text-[20px] font-black gradient-text">{s.n}</p>
              <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="px-5 pb-24 max-w-lg mx-auto">
        <div className="bg-bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">
            Contact
          </p>
          <a
            href="mailto:contact@cesoir.app"
            className="text-[15px] font-bold text-accent hover:underline"
          >
            contact@cesoir.app
          </a>
          <p className="text-[12px] text-text-muted mt-2">
            Une question, une suggestion, un partenariat ?
            <br />
            On repond sous 24h.
          </p>
        </div>
      </section>
    </div>
  );
}
