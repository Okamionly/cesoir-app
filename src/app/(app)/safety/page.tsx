import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Securite",
  description: "Regles communautaires et fonctionnalites de securite de CeSoir. Ta securite est notre priorite absolue.",
};

const rules = [
  { icon: "📸", title: "Photos authentiques", desc: "Au moins une photo montrant clairement ton visage. Pas de filtres excessifs, pas de memes." },
  { icon: "✅", title: "Identite reelle", desc: "Ton prenom doit etre celui que tu utilises au quotidien. Pas de pseudos, pas de noms de celebrites." },
  { icon: "🔞", title: "18 ans minimum", desc: "CeSoir est reserve aux adultes. Nous pouvons demander une piece d'identite." },
  { icon: "🚫", title: "Zero harcelement", desc: "Insultes, intimidation, commentaires deplactes, chantage = ban immediat." },
  { icon: "🛡️", title: "Respect absolu", desc: "Discrimination basee sur la race, le genre, l'orientation sexuelle ou la religion = tolerance zero." },
  { icon: "💬", title: "Consentement", desc: "Tout comportement sexuel non sollicite est interdit. Cyberflash, images intimes non desirees." },
  { icon: "🚷", title: "Pas de faux profils", desc: "Catfishing, usurpation d'identite = suppression definitive du compte." },
  { icon: "💰", title: "Pas de commerce", desc: "CeSoir n'est pas un marketplace. Aucune activite commerciale ou promotionnelle." },
  { icon: "🧠", title: "Pas de desinformation", desc: "Contenu faux ou trompeur pouvant causer du tort = interdit." },
  { icon: "⚖️", title: "Application stricte", desc: "Moderateurs et systemes automatises surveillent en permanence. Violation = ban sans appel." },
];

const safetyTips = [
  "Retrouvez-vous toujours dans un lieu public et anime",
  "Prevenez un(e) ami(e) de votre rendez-vous (lieu, heure, nom)",
  "Utilisez le bouton SOS si vous vous sentez en danger",
  "Ne partagez jamais vos informations financieres",
  "Faites confiance a votre instinct — si ca semble bizarre, partez",
  "Signalez tout comportement suspect via l'app",
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl text-safe" aria-hidden="true">🛡️</span>
          <span className="text-lg font-bold">Securite</span>
        </div>
      </header>

      <main className="px-5 py-6 max-w-lg mx-auto">
        {/* Intro */}
        <div className="mb-8">
          <h1 className="font-display text-[28px] font-bold leading-tight mb-3 text-text">
            Ta securite est notre<br /><span className="text-safe">priorite absolue.</span>
          </h1>
          <p className="text-[14px] text-text-muted leading-relaxed">
            CeSoir est un espace bienveillant. Chaque regle existe pour te proteger.
          </p>
        </div>

        {/* SOS Feature */}
        <div className="bg-safe/5 border border-safe/15 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-safe/15 flex items-center justify-center text-xl" aria-hidden="true">🆘</div>
            <div>
              <h2 className="text-[15px] font-bold text-text">Bouton SOS</h2>
              <p className="text-[11px] text-text-muted">Disponible a tout moment</p>
            </div>
          </div>
          <p className="text-[13px] text-text-soft leading-relaxed">
            Un appui discret envoie ta position GPS a tes contacts d&apos;urgence. Invisible pour ton rendez-vous.
          </p>
        </div>

        {/* Rules */}
        <h2 className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-bold mb-4">Regles communautaires</h2>
        <div className="space-y-3 mb-10" role="list">
          {rules.map((r) => (
            <div key={r.title} className="bg-bg-card border border-border rounded-xl p-4" role="listitem">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">{r.icon}</span>
                <div>
                  <h3 className="text-[14px] font-bold mb-1 text-text">{r.title}</h3>
                  <p className="text-[12px] text-text-muted leading-relaxed">{r.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <h2 className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-bold mb-4">Conseils pour tes rendez-vous</h2>
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-10">
          <div className="space-y-3" role="list">
            {safetyTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3" role="listitem">
                <span className="text-safe font-bold text-[13px] shrink-0 mt-0.5" aria-hidden="true">✓</span>
                <p className="text-[13px] text-text-soft leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4 text-center">
          <p className="text-[11px] text-text-muted uppercase tracking-widest font-bold mb-2">Urgence</p>
          <p className="text-[24px] font-black text-danger mb-1">3919</p>
          <p className="text-[11px] text-text-muted">Violences conjugales — appel gratuit et anonyme</p>
        </div>

        {/* Report */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-8 text-center">
          <h3 className="text-[15px] font-bold mb-2 text-text">Un probleme ?</h3>
          <p className="text-[12px] text-text-muted mb-4">Signale tout comportement inapproprie.</p>
          <button className="gradient-bg text-white px-6 py-3 rounded-full text-[13px] font-bold active:scale-95 transition-transform tap-target">
            Signaler un profil
          </button>
        </div>

        <Link href="/browse" className="block text-center text-[13px] text-accent font-semibold mb-20 tap-target py-2">
          ← Retour a l&apos;exploration
        </Link>
      </main>
    </div>
  );
}
