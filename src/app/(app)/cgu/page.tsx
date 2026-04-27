import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "CGU de CeSoir. Règles d'utilisation de la plateforme de rencontres.",
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-bg px-5 py-8 max-w-lg mx-auto">
      <Link href="/" className="text-sm text-accent mb-6 block">← Retour</Link>
      <h1 className="text-2xl font-bold mb-6">Conditions Générales d&apos;Utilisation</h1>
      <p className="text-[11px] text-text-muted mb-8">Dernière mise à jour : 11 avril 2026</p>

      {[
        { t: "1. Acceptation", c: "En utilisant CeSoir, tu acceptes ces conditions. Si tu n'es pas d'accord, n'utilise pas l'application." },
        { t: "2. Éligibilité", c: "Tu dois avoir au moins 18 ans pour utiliser CeSoir. En t'inscrivant, tu confirmes avoir l'âge légal." },
        { t: "3. Ton compte", c: "Tu es responsable de la sécurité de ton compte. Utilise des informations exactes. Un seul compte par personne." },
        { t: "4. Utilisation acceptable", c: "CeSoir est une plateforme de rencontres sociales. Tu t'engages à respecter les autres utilisateurs, à ne pas harceler, discriminer, ou publier du contenu inapproprié." },
        { t: "5. Contenu", c: "Tu es responsable du contenu que tu publies. CeSoir se réserve le droit de supprimer tout contenu qui viole nos règles communautaires." },
        { t: "6. Sécurité", c: "CeSoir met en place des mesures de sécurité (vérification, modération, signalement) mais ne peut garantir l'identité ou le comportement des utilisateurs." },
        { t: "7. Propriété intellectuelle", c: "CeSoir et son contenu (logo, design, code) sont protégés par le droit de la propriété intellectuelle." },
        { t: "8. Service gratuit", c: "CeSoir est actuellement gratuit à 100%. Aucun achat in-app, aucun abonnement, aucune fonctionnalité payante. Si un modèle payant est introduit à l'avenir, les utilisateurs seront notifiés au moins 30 jours à l'avance et pourront choisir de ne jamais être facturés." },
        { t: "9. Résiliation", c: "Tu peux supprimer ton compte à tout moment. CeSoir peut suspendre ou supprimer un compte qui viole ces conditions." },
        { t: "10. Limitation de responsabilité", c: "CeSoir est fourni 'tel quel'. Nous ne garantissons pas les résultats des rencontres ni la disponibilité continue du service." },
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
