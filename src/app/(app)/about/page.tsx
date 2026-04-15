import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A propos de CeSoir",
  description: "La mission de CeSoir : que personne ne passe une soiree seul(e). Decouvrez l'equipe et notre vision.",
};

const TEAM = [
  {
    name: "Fondateur",
    role: "CEO & Produit",
    bio: "Convaincu que la technologie doit rapprocher les gens, pas les isoler.",
  },
  {
    name: "CTO",
    role: "Technique & Infrastructure",
    bio: "Full-stack, obsede par la performance et la securite.",
  },
  {
    name: "Design Lead",
    role: "UX & Direction Artistique",
    bio: "Minimaliste. Chaque pixel compte.",
  },
];

const VALUES = [
  { icon: "🤝", title: "Connexion reelle", text: "On ne compte pas les likes, on compte les rencontres." },
  { icon: "🔒", title: "Respect total", text: "Tes donnees, ta vie privee, ta securite : non negociables." },
  { icon: "💯", title: "Gratuit pour tous", text: "Pas de paywall. La connexion humaine n'a pas de prix." },
  { icon: "🌍", title: "Inclusif", text: "14 modes pour 14 facons de se retrouver. Pour tout le monde." },
];

export default function AboutPage() {
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
          <h1 className="text-[16px] font-black text-text tracking-tight">A propos</h1>
        </div>
      </div>

      {/* Mission hero */}
      <div className="px-5 pt-10 pb-6 max-w-lg mx-auto text-center">
        <div className="text-[36px] font-black mb-2">
          <span className="gradient-text">CeSoir</span>
        </div>
        <p className="text-[16px] font-bold text-text mt-4 max-w-[340px] mx-auto">
          Que personne ne passe une soiree seul(e).
        </p>
        <p className="text-[13px] text-text-muted mt-3 max-w-[360px] mx-auto leading-relaxed">
          CeSoir connecte les gens qui sont disponibles ce soir, pres de chez eux. Pas demain, pas la semaine prochaine. Ce soir.
        </p>
      </div>

      {/* Values */}
      <div className="px-5 py-6 max-w-lg mx-auto">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-4">Nos valeurs</p>
        <div className="grid grid-cols-2 gap-3">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-bg-card border border-border rounded-2xl p-4">
              <span className="text-[24px]" aria-hidden="true">{v.icon}</span>
              <p className="text-[13px] font-bold text-text mt-2">{v.title}</p>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="px-5 py-6 max-w-lg mx-auto">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-4">L&apos;equipe</p>
        <div className="space-y-3">
          {TEAM.map((member) => (
            <div key={member.name} className="bg-bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
              <div className="w-12 h-12 rounded-full gradient-bg-subtle border border-accent/10 flex items-center justify-center shrink-0">
                <span className="text-[16px] font-black text-accent">{member.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-[14px] font-bold text-text">{member.name}</p>
                <p className="text-[11px] text-accent font-semibold">{member.role}</p>
                <p className="text-[12px] text-text-muted mt-1">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-6 max-w-lg mx-auto">
        <div className="flex gap-2">
          {[
            { n: "14", l: "Modes" },
            { n: "0 EUR", l: "Pour toujours" },
            { n: "100%", l: "Gratuit" },
          ].map((s) => (
            <div key={s.l} className="flex-1 bg-bg-card border border-border rounded-xl py-4 text-center">
              <p className="text-[20px] font-black gradient-text">{s.n}</p>
              <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="px-5 pb-24 max-w-lg mx-auto">
        <div className="bg-bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Contact</p>
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
      </div>
    </div>
  );
}
