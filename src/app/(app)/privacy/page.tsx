import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialite",
  description: "Politique de confidentialite RGPD de CeSoir. Comment nous protegeons tes donnees.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg px-5 py-8 max-w-lg mx-auto">
      <Link href="/" className="text-sm text-accent mb-6 block">← Retour</Link>
      <h1 className="text-2xl font-bold mb-6">Politique de Confidentialite</h1>
      <p className="text-[11px] text-text-muted mb-8">Derniere mise a jour : 11 avril 2026</p>

      {[
        { t: "1. Donnees collectees", c: "Nous collectons : prenom, age, email, position geographique (avec ton consentement), preferences de rencontre, et les messages echanges sur la plateforme." },
        { t: "2. Utilisation des donnees", c: "Tes donnees servent a : creer ton profil, te suggerer des personnes proches, permettre la messagerie, et ameliorer le service." },
        { t: "3. Geolocalisation", c: "La position GPS est utilisee uniquement pour trouver des personnes pres de toi. Tu peux desactiver la geolocalisation a tout moment dans les parametres." },
        { t: "4. Partage des donnees", c: "Nous ne vendons jamais tes donnees. Seules les informations de ton profil public sont visibles par les autres utilisateurs. CeSoir etant 100% gratuit, aucune donnee n'est transmise a des processeurs de paiement tiers (Stripe, etc.) tant qu'aucune transaction n'est effectuee." },
        { t: "5. Securite", c: "Tes donnees sont chiffrees en transit et au repos. Les mots de passe sont haches et jamais stockes en clair." },
        { t: "6. Conservation", c: "Tes donnees sont conservees tant que ton compte est actif. A la suppression du compte, tes donnees sont effacees sous 30 jours." },
        { t: "7. Tes droits (RGPD)", c: "Tu as le droit d'acceder, modifier, exporter ou supprimer tes donnees a tout moment. Contacte-nous a privacy@cesoir.app." },
        { t: "8. Cookies", c: "Nous utilisons uniquement des cookies techniques necessaires au fonctionnement de l'application. Pas de cookies publicitaires." },
        { t: "9. Mineurs", c: "CeSoir est interdit aux moins de 18 ans. Si nous decouvrons qu'un mineur utilise le service, son compte sera immediatement supprime." },
        { t: "10. Contact DPO", c: "Delegue a la protection des donnees : dpo@cesoir.app" },
      ].map(s => (
        <div key={s.t} className="mb-6">
          <h2 className="text-sm font-bold mb-2">{s.t}</h2>
          <p className="text-[13px] text-text-muted leading-relaxed">{s.c}</p>
        </div>
      ))}
    </div>
  );
}
