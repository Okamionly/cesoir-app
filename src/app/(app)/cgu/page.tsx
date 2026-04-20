import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Generales d'Utilisation",
  description: "CGU de CeSoir. Regles d'utilisation de la plateforme de rencontres.",
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-bg px-5 py-8 max-w-lg mx-auto">
      <Link href="/" className="text-sm text-accent mb-6 block">← Retour</Link>
      <h1 className="text-2xl font-bold mb-6">Conditions Generales d&apos;Utilisation</h1>
      <p className="text-[11px] text-text-muted mb-8">Derniere mise a jour : 11 avril 2026</p>

      {[
        { t: "1. Acceptation", c: "En utilisant CeSoir, tu acceptes ces conditions. Si tu n'es pas d'accord, n'utilise pas l'application." },
        { t: "2. Eligibilite", c: "Tu dois avoir au moins 18 ans pour utiliser CeSoir. En t'inscrivant, tu confirmes avoir l'age legal." },
        { t: "3. Ton compte", c: "Tu es responsable de la securite de ton compte. Utilise des informations exactes. Un seul compte par personne." },
        { t: "4. Utilisation acceptable", c: "CeSoir est une plateforme de rencontres sociales. Tu t'engages a respecter les autres utilisateurs, a ne pas harceler, discriminer, ou publier du contenu inapproprie." },
        { t: "5. Contenu", c: "Tu es responsable du contenu que tu publies. CeSoir se reserve le droit de supprimer tout contenu qui viole nos regles communautaires." },
        { t: "6. Securite", c: "CeSoir met en place des mesures de securite (verification, moderation, signalement) mais ne peut garantir l'identite ou le comportement des utilisateurs." },
        { t: "7. Propriete intellectuelle", c: "CeSoir et son contenu (logo, design, code) sont proteges par le droit de la propriete intellectuelle." },
        { t: "8. Service gratuit", c: "CeSoir est actuellement gratuit a 100%. Aucun achat in-app, aucun abonnement, aucune fonctionnalite payante. Si un modele payant est introduit a l'avenir, les utilisateurs seront notifies au moins 30 jours a l'avance et pourront choisir de ne jamais etre factures." },
        { t: "9. Resiliation", c: "Tu peux supprimer ton compte a tout moment. CeSoir peut suspendre ou supprimer un compte qui viole ces conditions." },
        { t: "10. Limitation de responsabilite", c: "CeSoir est fourni 'tel quel'. Nous ne garantissons pas les resultats des rencontres ni la disponibilite continue du service." },
        { t: "11. Contact", c: "Pour toute question : contact@cesoir.app" },
      ].map(s => (
        <div key={s.t} className="mb-6">
          <h2 className="text-sm font-bold mb-2">{s.t}</h2>
          <p className="text-[13px] text-text-muted leading-relaxed">{s.c}</p>
        </div>
      ))}
    </div>
  );
}
