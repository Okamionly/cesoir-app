import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité",
  description: "Politique de confidentialité RGPD de CeSoir. Comment nous protégeons tes données.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg px-5 py-8 max-w-lg mx-auto">
      <Link href="/" className="text-sm text-accent mb-6 block">← Retour</Link>
      <h1 className="text-2xl font-bold mb-6">Politique de Confidentialité</h1>
      <p className="text-[11px] text-text-muted mb-8">Dernière mise à jour : 11 avril 2026</p>

      {[
        { t: "1. Données collectées", c: "Nous collectons : prénom, âge, email, position géographique (avec ton consentement), préférences de rencontre, et les messages échangés sur la plateforme." },
        { t: "2. Utilisation des données", c: "Tes données servent à : créer ton profil, te suggérer des personnes proches, permettre la messagerie, et améliorer le service." },
        { t: "3. Géolocalisation", c: "La position GPS est utilisée uniquement pour trouver des personnes près de toi. Tu peux désactiver la géolocalisation à tout moment dans les paramètres." },
        { t: "4. Partage des données", c: "Nous ne vendons jamais tes données. Seules les informations de ton profil public sont visibles par les autres utilisateurs. CeSoir étant 100% gratuit, aucune donnée n'est transmise à des processeurs de paiement tiers (Stripe, etc.) tant qu'aucune transaction n'est effectuée." },
        { t: "5. Sécurité", c: "Tes données sont chiffrées en transit et au repos. Les mots de passe sont hachés et jamais stockés en clair." },
        { t: "6. Conservation", c: "Tes données sont conservées tant que ton compte est actif. À la suppression du compte, tes données sont effacées sous 30 jours." },
        { t: "7. Tes droits (RGPD)", c: "Tu as le droit d'accéder, modifier, exporter ou supprimer tes données à tout moment. Contacte-nous à privacy@cesoir.app." },
        { t: "8. Cookies", c: "Nous utilisons uniquement des cookies techniques nécessaires au fonctionnement de l'application. Pas de cookies publicitaires." },
        { t: "9. Mineurs", c: "CeSoir est interdit aux moins de 18 ans. Si nous découvrons qu'un mineur utilise le service, son compte sera immédiatement supprimé." },
        { t: "10. Contact DPO", c: "Délégué à la protection des données : dpo@cesoir.app" },
      ].map(s => (
        <div key={s.t} className="mb-6">
          <h2 className="text-sm font-bold mb-2">{s.t}</h2>
          <p className="text-[13px] text-text-muted leading-relaxed">{s.c}</p>
        </div>
      ))}
    </div>
  );
}
