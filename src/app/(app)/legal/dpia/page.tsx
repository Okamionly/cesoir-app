import Link from "next/link";

/**
 * /legal/dpia — Resume public de l'analyse d'impact (DPIA CNIL).
 * Le document complet est dans `docs/legal/DPIA.md` et servi a la demande
 * via `/docs/legal/DPIA.md` (a copier dans `public/` si besoin).
 */

export const metadata = {
  title: "DPIA & protection des données - CeSoir",
  description:
    "Analyse d'Impact Relative à la Protection des Données de CeSoir. Finalités, bases légales, sécurité, droits des utilisateurs.",
};

export default function DpiaPage() {
  return (
    <div className="min-h-screen bg-bg px-5 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/settings" className="text-accent text-[13px] font-semibold">
          &larr; Paramètres
        </Link>

        <h1 className="text-[28px] font-black text-text mt-4 mb-2">
          Protection des données
        </h1>
        <p className="text-[14px] text-text-muted leading-relaxed mb-8">
          Résumé de notre Analyse d&apos;Impact Relative à la Protection des
          Données (DPIA). La version complète est disponible en téléchargement.
        </p>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            1. À quoi servent tes données ?
          </h2>
          <ul className="text-[13px] text-text-muted leading-relaxed space-y-1 list-disc pl-5">
            <li>Créer ton compte et te connecter</li>
            <li>Te proposer des profils compatibles près de toi</li>
            <li>Permettre les conversations</li>
            <li>Protéger la communauté (modération, signalements)</li>
            <li>Améliorer le produit (analytics anonymisés)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            2. Sur quelle base légale ?
          </h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Nous utilisons <strong>ton consentement</strong> (géolocalisation,
            photos), <strong>le contrat</strong> (ton compte et la messagerie)
            et <strong>notre intérêt légitime</strong> (modération). Tu peux
            retirer ton consentement à tout moment dans les paramètres.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            3. Combien de temps ?
          </h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Ton compte reste actif tant que tu l&apos;utilises. Après{" "}
            <strong>3 ans d&apos;inactivité</strong>, il est automatiquement
            supprimé. Tu peux supprimer ton compte instantanément depuis les
            paramètres (effacement sous 30 jours).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">4. Tes droits</h2>
          <ul className="text-[13px] text-text-muted leading-relaxed space-y-1 list-disc pl-5">
            <li>
              <Link href="/profile/privacy" className="text-accent underline">
                Accéder à tes données
              </Link>{" "}
              (export)
            </li>
            <li>
              <Link href="/profile/edit" className="text-accent underline">
                Rectifier
              </Link>{" "}
              ton profil
            </li>
            <li>
              <Link href="/profile/delete" className="text-accent underline">
                Supprimer ton compte
              </Link>
            </li>
            <li>Portabilité (export JSON)</li>
            <li>
              Opposition : écris à{" "}
              <a
                href="mailto:privacy@cesoir.app"
                className="text-accent underline"
              >
                privacy@cesoir.app
              </a>
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            5. Sécurité technique
          </h2>
          <ul className="text-[13px] text-text-muted leading-relaxed space-y-1 list-disc pl-5">
            <li>Chiffrement TLS 1.3 en transit, AES-256 au repos</li>
            <li>Row-Level Security (RLS) Supabase sur toutes les tables</li>
            <li>Mots de passe hachés (Argon2 + bcrypt legacy)</li>
            <li>Rate limiting Upstash Redis sur les endpoints critiques</li>
            <li>Sentry PII-scrubbed pour les erreurs</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            6. Transferts hors UE
          </h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Nos serveurs (Supabase, Vercel) sont en UE. Seuls OpenAI (modération)
            et Resend (emails) sont aux USA, encadrés par les{" "}
            <strong>Clauses Contractuelles Types</strong> (SCC) + DPA.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            7. Version complète
          </h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Le document DPIA intégral (10 sections, registre RAT, plan
            d&apos;action) est disponible pour consultation sur demande.{" "}
            <a
              href="mailto:privacy@cesoir.app?subject=Demande%20DPIA%20complete"
              className="text-accent underline"
            >
              privacy@cesoir.app
            </a>
          </p>
        </section>

        <section className="mt-8 pt-6 border-t border-border">
          <p className="text-[11px] text-text-muted">
            Dernière mise à jour : 23 avril 2026.
            <br />
            Responsable du traitement : CeSoir SAS (immatriculation en cours).
          </p>
        </section>
      </div>
    </div>
  );
}
