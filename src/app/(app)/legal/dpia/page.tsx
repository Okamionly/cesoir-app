import Link from "next/link";

/**
 * /legal/dpia — Resume public de l'analyse d'impact (DPIA CNIL).
 * Le document complet est dans `docs/legal/DPIA.md` et servi a la demande
 * via `/docs/legal/DPIA.md` (a copier dans `public/` si besoin).
 */

export const metadata = {
  title: "DPIA & protection des donnees - CeSoir",
  description:
    "Analyse d'Impact Relative a la Protection des Donnees de CeSoir. Finalites, bases legales, securite, droits des utilisateurs.",
};

export default function DpiaPage() {
  return (
    <div className="min-h-screen bg-bg px-5 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/settings" className="text-accent text-[13px] font-semibold">
          &larr; Parametres
        </Link>

        <h1 className="text-[28px] font-black text-text mt-4 mb-2">
          Protection des donnees
        </h1>
        <p className="text-[14px] text-text-muted leading-relaxed mb-8">
          Resume de notre Analyse d&apos;Impact Relative a la Protection des
          Donnees (DPIA). La version complete est disponible en telechargement.
        </p>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            1. A quoi servent tes donnees ?
          </h2>
          <ul className="text-[13px] text-text-muted leading-relaxed space-y-1 list-disc pl-5">
            <li>Creer ton compte et te connecter</li>
            <li>Te proposer des profils compatibles pres de toi</li>
            <li>Permettre les conversations</li>
            <li>Proteger la communaute (moderation, signalements)</li>
            <li>Ameliorer le produit (analytics anonymises)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            2. Sur quelle base legale ?
          </h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Nous utilisons <strong>ton consentement</strong> (geolocalisation,
            photos), <strong>le contrat</strong> (ton compte et la messagerie)
            et <strong>notre interet legitime</strong> (moderation). Tu peux
            retirer ton consentement a tout moment dans les parametres.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            3. Combien de temps ?
          </h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Ton compte reste actif tant que tu l&apos;utilises. Apres{" "}
            <strong>3 ans d&apos;inactivite</strong>, il est automatiquement
            supprime. Tu peux supprimer ton compte instantanement depuis les
            parametres (effacement sous 30 jours).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">4. Tes droits</h2>
          <ul className="text-[13px] text-text-muted leading-relaxed space-y-1 list-disc pl-5">
            <li>
              <Link href="/profile/privacy" className="text-accent underline">
                Acceder a tes donnees
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
            <li>Portabilite (export JSON)</li>
            <li>
              Opposition : ecris a{" "}
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
            5. Securite technique
          </h2>
          <ul className="text-[13px] text-text-muted leading-relaxed space-y-1 list-disc pl-5">
            <li>Chiffrement TLS 1.3 en transit, AES-256 au repos</li>
            <li>Row-Level Security (RLS) Supabase sur toutes les tables</li>
            <li>Mots de passe haches (Argon2 + bcrypt legacy)</li>
            <li>Rate limiting Upstash Redis sur les endpoints critiques</li>
            <li>Sentry PII-scrubbed pour les erreurs</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            6. Transferts hors UE
          </h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Nos serveurs (Supabase, Vercel) sont en UE. Seuls OpenAI (moderation)
            et Resend (emails) sont aux USA, encadres par les{" "}
            <strong>Clauses Contractuelles Types</strong> (SCC) + DPA.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-text mb-2">
            7. Version complete
          </h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Le document DPIA integral (10 sections, registre RAT, plan
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
            Derniere mise a jour : 23 avril 2026.
            <br />
            Responsable du traitement : CeSoir SAS (immatriculation en cours).
          </p>
        </section>
      </div>
    </div>
  );
}
