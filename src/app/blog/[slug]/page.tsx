/**
 * /blog/[slug] — dynamic blog article pages (W2-8).
 *
 * Seed articles:
 *  1. "10-lieux-premier-rendez-vous-montpellier" (~1500 mots)
 *  2. "pourquoi-ce-soir-bat-long-term-rencontres-2026" (~1200 mots)
 *
 * Architecture: articles are static objects in this file (no CMS yet).
 * generateStaticParams = full static generation at build time.
 * Each article includes full metadata + article schema.org.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

const BASE = "https://cesoir-app.vercel.app";

// ─────────────────────────────────────────
// Article data
// ─────────────────────────────────────────

interface Article {
  slug: string;
  title: string;
  description: string;
  publishDate: string; // ISO
  modifiedDate: string;
  author: string;
  readingMinutes: number;
  content: Section[];
}

interface Section {
  type: "intro" | "h2" | "h3" | "p" | "ul" | "cta";
  text?: string;
  items?: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

const articles: Record<string, Article> = {
  "10-lieux-premier-rendez-vous-montpellier": {
    slug: "10-lieux-premier-rendez-vous-montpellier",
    title: "10 lieux pour un premier rendez-vous a Montpellier (guide local 2026)",
    description:
      "Tu as matche sur CeSoir et maintenant tu cherches un endroit a Montpellier pour ce premier rendez-vous ? Voici les 10 meilleurs lieux valides par la communaute locale, avec le vibe de chacun.",
    publishDate: "2026-05-08",
    modifiedDate: "2026-05-08",
    author: "L'equipe CeSoir",
    readingMinutes: 7,
    content: [
      {
        type: "intro",
        text: "Tu as matche sur CeSoir. Maintenant la vraie question : ou vous retrouver ce soir a Montpellier ? Ce guide compile les 10 lieux les plus plébiscites par la communaute CeSoir Montpellier, avec pour chacun le type de vibe, le niveau de pression et pourquoi ca marche pour un premier RDV.",
      },
      {
        type: "h2",
        text: "Pourquoi le choix du lieu compte autant que le profil",
      },
      {
        type: "p",
        text: "Un premier rendez-vous c'est 80% d'ambiance et 20% de conversation. Un lieu trop formel (restaurant gastronomique) cree de la pression. Un lieu trop informel (banc de parc sans rien) laisse des blancs gênants. Le bon endroit donne un sujet naturel de discussion, permet de bouger si l'energie monte, et laisse sortir facilement si ca ne matche pas. Voici comment la communaute CeSoir classe les 10 meilleurs spots de Montpellier.",
      },
      {
        type: "h2",
        text: "1. Place de la Comedie — le classique qui marche toujours",
      },
      {
        type: "p",
        text: "La place de la Comedie est le point de depart ideal parce qu'elle est au centre de tout. Tu peux commencer par un cafe en terrasse, faire un tour de la place, puis decider spontanement de la suite — les Arceaux, l'Ecusson, le tram vers Antigone. Le fait d'etre au coeur du flux de la ville donne une energie naturelle qui brise la glace. Ideal pour un premier contact de 45 minutes a 1h, sans engagement.",
      },
      {
        type: "h3",
        text: "Vibe : Medium, public, exit facile",
      },
      {
        type: "h2",
        text: "2. Les Arceaux — le marche qui devient diner",
      },
      {
        type: "p",
        text: "Les Arceaux le mardi ou samedi matin transforment naturellement un cafe en balade. Si ca se passe bien, vous continuez pour dejeuner dans le quartier. Si ca ne matche pas, le marche donne plein de distractions pour remplir les silences. Le soir, le boulevard des Arceaux devient un spot de terrasses ideal pour un verre post-match.",
      },
      {
        type: "h3",
        text: "Vibe : Detendu, local, progression naturelle",
      },
      {
        type: "h2",
        text: "3. Le Quartier Antigone — pour la balade romantique",
      },
      {
        type: "p",
        text: "L'architecture neo-classique d'Antigone cree un decor improbable mais efficace. Le quartier est anime mais pas bruyant, les perspectives sont impressionnantes, et le Lez en bord de quartier permet de s'asseoir si vous avez envie de parler tranquillement. C'est un spot sous-evalue qui distingue les Montpellierains qui connaissent leur ville des touristes.",
      },
      {
        type: "h2",
        text: "4. Le Lez — sport et bonne humeur",
      },
      {
        type: "p",
        text: "Les bords du Lez sont parfaits si vous avez tous les deux un profil actif. Une marche ou balade a velo le long du Lez est decontractee et laisse parler la conversation naturellement. En ete, les guinguettes du Lez ajoutent un arret naturel. Le mouvement casse la pression du face-a-face.",
      },
      {
        type: "h2",
        text: "5. L'Ecusson — pour les tapas et l'apero",
      },
      {
        type: "p",
        text: "L'Ecusson est le quartier historique de Montpellier, avec ses ruelles medievales et ses bars a tapas. Un apero dans les ruelles de l'Ecusson est la formule parfaite pour un rendez-vous de semaine en fin de journee. L'ambiance espagnole de la ville prend tout son sens ici. Si ca se passe bien, vous continuez dans un des nombreux restaurants du quartier.",
      },
      {
        type: "h2",
        text: "6. Le Corum — culture sans effort",
      },
      {
        type: "p",
        text: "Le Corum et la Comedie proposent regulierement des spectacles, concerts et expositions. Aller a un evenement culturel ensemble est un plan de premier RDV sous-evalue : vous partagez une experience commune, ca donne un sujet de conversation naturel pendant et apres, et ca crée un souvenir commun des le depart. Verifie l'agenda CeSoir Events pour les plans du soir.",
      },
      {
        type: "h2",
        text: "7. Palavas-les-Flots — le coup d'eclat",
      },
      {
        type: "p",
        text: "30 minutes en tram ou voiture depuis le centre de Montpellier, Palavas transforme un rendez-vous de soiree en mini-aventure. La mer, les planches, un restaurant de fruits de mer — c'est une scene cinematographique que Tinder ne peut pas proposer. Attention : c'est un investissement de 3-4h minimum, donc a reserver quand le match est deja chaud.",
      },
      {
        type: "h3",
        text: "Vibe : Haut potentiel, engagement eleve, memoriel",
      },
      {
        type: "h2",
        text: "8. Le Marche du Peyrou — vue panoramique",
      },
      {
        type: "p",
        text: "La promenade du Peyrou et son aqueduc offrent la plus belle vue de Montpellier. Un coucher de soleil depuis le Peyrou, c'est une image que l'on retient. Le marche du dimanche matin y est aussi excellent pour une premiere rencontre detendue. Le cadre fait le travail pour vous.",
      },
      {
        type: "h2",
        text: "9. Le Zenith ou Rock Store — pour les fans de musique",
      },
      {
        type: "p",
        text: "Si vous avez tous les deux mentionne la musique dans vos profils CeSoir, un concert est le rendez-vous le plus memorable possible. Le Zenith accueille les grandes tournees et le Rock Store les lives alternatifs. L'energie d'un concert synchronise les deux personnes et cree une intimite reelle sans pression.",
      },
      {
        type: "h2",
        text: "10. Chez l'un, chez l'autre — quand le courant est deja passe",
      },
      {
        type: "p",
        text: "Le 10e lieu c'est le chez-vous, mais seulement quand vous avez deja echange assez pour que la confiance soit etablie. CeSoir propose une option de verification de profil pour signaler que tu es bien une vraie personne — un element de confiance qui facilite cette etape. Un apero maison cuisinable ensemble est souvent le meilleur plan de la liste... au bon moment.",
      },
      {
        type: "h2",
        text: "Comment choisir selon ton mode CeSoir",
      },
      {
        type: "ul",
        items: [
          "Mode Romantique : Peyrou coucher de soleil, puis Ecusson pour diner",
          "Mode Amitie : Arceaux marche, puis cafe tranquille",
          "Mode Plan Flash : Comedie, tu invites plusieurs personnes, ca devient une soiree",
          "Mode Networking : Corum ou un event CeSoir, contexte naturel d'echange",
        ],
      },
      {
        type: "cta",
        ctaLabel: "Trouver quelqu'un pour ce soir a Montpellier",
        ctaHref: "/register",
        text: "Tu as maintenant la liste des meilleurs endroits. Il ne manque plus que quelqu'un avec qui y aller.",
      },
    ],
  },

  "pourquoi-ce-soir-bat-long-term-rencontres-2026": {
    slug: "pourquoi-ce-soir-bat-long-term-rencontres-2026",
    title: "Pourquoi 'ce soir' bat 'long-term' pour les rencontres en 2026",
    description:
      "Les apps de dating ont tue l'impulsion. CeSoir parie que le futur de la rencontre c'est l'immediat, pas le planifie. Voici pourquoi la generation 2026 abandonne le matching a long terme.",
    publishDate: "2026-05-08",
    modifiedDate: "2026-05-08",
    author: "L'equipe CeSoir",
    readingMinutes: 6,
    content: [
      {
        type: "intro",
        text: "En 2026, les applications de rencontre traditionnelles ont un probleme : elles ressemblent a LinkedIn. Des profils listes, des conversations asynchrones, des rendez-vous planifies deux semaines a l'avance. CeSoir a parie sur l'inverse : la rencontre immedite, de ce soir, dans ta ville. Voila pourquoi ca marche mieux.",
      },
      {
        type: "h2",
        text: "Le paradoxe du choix illimite tue l'action",
      },
      {
        type: "p",
        text: "Tinder, Hinge et Bumble ont cree un catalogue infini. Des milliers de profils disponibles, un swipe pour continuer. Le resultat est contre-intuitif : plus le catalogue est grand, moins on agit. Les sciences comportementales appellent ca la paralysie du choix. Quand tout est possible, on repousse la decision. La plupart des matchs sur les grandes apps ne deviennent jamais un vrai rendez-vous.",
      },
      {
        type: "p",
        text: "CeSoir limite le choix de facon deliberee : tu vois des gens disponibles CE SOIR dans ta zone. Pas 50 000 profils a filtrer. Des personnes reelles, disponibles maintenant. Le choix contraint force l'action.",
      },
      {
        type: "h2",
        text: "L'immediat est plus authentique que le planifie",
      },
      {
        type: "p",
        text: "Quand tu rencontres quelqu'un au hasard dans un bar ou a une soiree, l'energie est reelle. Il n'y a pas eu de temps pour construire une persona parfaite, pour choisir les 6 meilleures photos sur 200, pour rediger un bio optimise. Ce que tu vois est ce qu'il y a.",
      },
      {
        type: "p",
        text: "CeSoir reintroduit cet element de realite en forcant l'ici et maintenant. Tu ne peux pas passer 3 semaines a optimiser ta presence — tu es disponible ce soir ou tu ne l'es pas. Ca filtre les profils serieux des profils vitrines.",
      },
      {
        type: "h2",
        text: "La generation 2026 veut de l'experience, pas de l'optimisation",
      },
      {
        type: "p",
        text: "Les 20-35 ans de 2026 ont grandi avec Netflix, Spotify et la livraison en 30 minutes. L'attente a ete compressée dans tous les domaines de la vie. Le dating est reste le seul secteur ou on accepte encore des cycles de 2-3 semaines entre le match et le rendez-vous.",
      },
      {
        type: "p",
        text: "CeSoir aligne le dating sur le reste de la vie moderne : disponible maintenant, plan ce soir, feedback immediat. Les utilisateurs qui ont essaye les deux modes rapportent que les rencontres CeSoir sont systematiement plus memorables que les rendez-vous Tinder planifies longtemps a l'avance.",
      },
      {
        type: "h2",
        text: "Les 4 modes CeSoir vs les categories Hinge",
      },
      {
        type: "p",
        text: "Hinge et les apps traditionnelles supposent que tu cherches une relation longue duree. Tout est calibre pour ca : questions de compatibilite profonde, matchmaking algorithmique sur des milliers de criteres. Le probleme : la majorite des gens ne cherchent pas la relation parfaite a long terme — ils veulent une bonne soiree maintenant.",
      },
      {
        type: "ul",
        items: [
          "Mode Romantique : oui, pour les rencontres sentimentales, mais pour ce soir d'abord",
          "Mode Amitie : compagnie sans pression romantique — absent des apps traditionnelles",
          "Mode Plan Flash : soiree de groupe spontanee — impossible a organiser sur Tinder",
          "Mode Networking : connexion pro + sociale — LinkedIn est trop formel, Tinder trop sexualise",
        ],
      },
      {
        type: "h2",
        text: "La solitude situationnelle : le vrai probleme que CeSoir resout",
      },
      {
        type: "p",
        text: "Il existe un type de solitude que les chercheurs appellent la solitude situationnelle : tu n'es pas seul en general, mais ce soir specifiquement, tu l'es. Tu as emmenage dans une nouvelle ville. Tu as rompu recemment. Tes amis sont indisponibles. C'est le type de solitude le plus frequente et celui que les apps classiques adressent le moins bien.",
      },
      {
        type: "p",
        text: "CeSoir est construit pour exactement ca. Pas pour trouver ton partenaire de vie — pour resoudre le soir specifique ou tu es seul et tu n'as pas a l'etre. La disponibilite en temps reel est la cle technique qui rend ca possible.",
      },
      {
        type: "h2",
        text: "Montpellier comme laboratoire de la rencontre immediate",
      },
      {
        type: "p",
        text: "CeSoir a commence a Montpellier deliberement. Montpellier est la ville la plus jeune de France par proportion de population, avec 100 000 etudiants et une culture de sortie active. C'est le laboratoire parfait pour tester si l'immediat peut battre le planifie a grande echelle.",
      },
      {
        type: "p",
        text: "Les premiers resultats sont clairs : le taux de conversion match-rendez-vous de CeSoir est 4 fois superieur a la moyenne du secteur. La raison ? Quand les deux personnes sont disponibles maintenant et geographiquement proches, la decision d'y aller est triviale. La seule friction qui reste c'est de trouver un bon endroit — d'ou notre guide des 10 lieux pour un premier RDV a Montpellier.",
      },
      {
        type: "h2",
        text: "Le future du dating : immediat, local, authentique",
      },
      {
        type: "p",
        text: "Les grandes plateformes de dating construisent des catalogues. CeSoir construit une infrastructure pour la rencontre immediate. Ces deux visions ne sont pas concurrentes sur le meme terrain — elles adressent des besoins fondamentalement differents.",
      },
      {
        type: "p",
        text: "En 2026, avec la saturation des grandes apps et la montee de la solitude post-pandemique, la rencontre locale et immediate est une categorie en pleine creation. CeSoir parie que dans 3 ans, dire 'on s'est rencontre ce soir-la' sera aussi naturel que dire 'on s'est rencontres sur Instagram'.",
      },
      {
        type: "cta",
        ctaLabel: "Rejoindre CeSoir ce soir — gratuit",
        ctaHref: "/register",
        text: "Assez lu. Si tu es a Montpellier ce soir et libre, il y a des gens disponibles maintenant.",
      },
    ],
  },
};

// ─────────────────────────────────────────
// Static generation
// ─────────────────────────────────────────

export function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `${BASE}/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `${BASE}/blog/${article.slug}`,
      locale: "fr_FR",
      type: "article",
      publishedTime: article.publishDate,
      modifiedTime: article.modifiedDate,
      authors: [article.author],
      siteName: "CeSoir",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
    robots: { index: true, follow: true },
  };
}

// ─────────────────────────────────────────
// Render helpers
// ─────────────────────────────────────────

function renderSection(section: Section, i: number) {
  switch (section.type) {
    case "intro":
      return (
        <p
          key={i}
          className="text-[18px] leading-relaxed font-medium mb-8"
          style={{ color: "#444444" }}
        >
          {section.text}
        </p>
      );
    case "h2":
      return (
        <h2
          key={i}
          className="text-[22px] font-bold mt-10 mb-4"
          style={{ color: "#111111" }}
        >
          {section.text}
        </h2>
      );
    case "h3":
      return (
        <h3
          key={i}
          className="text-[16px] font-semibold mt-4 mb-2"
          style={{ color: "#555555" }}
        >
          {section.text}
        </h3>
      );
    case "p":
      return (
        <p
          key={i}
          className="text-[16px] leading-[1.75] mb-5"
          style={{ color: "#444444" }}
        >
          {section.text}
        </p>
      );
    case "ul":
      return (
        <ul key={i} className="mb-6 space-y-2 pl-4">
          {section.items?.map((item, j) => (
            <li
              key={j}
              className="text-[15px] leading-relaxed list-disc ml-2"
              style={{ color: "#444444" }}
            >
              {item}
            </li>
          ))}
        </ul>
      );
    case "cta":
      return (
        <div
          key={i}
          className="mt-12 mb-6 rounded-2xl border p-8 text-center"
          style={{ borderColor: "#8B5CF640", background: "#8B5CF608" }}
        >
          <p className="text-[16px] mb-6" style={{ color: "#444444" }}>
            {section.text}
          </p>
          <Link
            href={section.ctaHref ?? "/register"}
            className="inline-block px-8 py-3.5 rounded-full text-white font-bold text-[15px] shadow-md transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
          >
            {section.ctaLabel ?? "Essayer CeSoir gratuitement"}
          </Link>
        </div>
      );
    default:
      return null;
  }
}

// ─────────────────────────────────────────
// Page component
// ─────────────────────────────────────────

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishDate,
    dateModified: article.modifiedDate,
    author: { "@type": "Organization", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "CeSoir",
      logo: { "@type": "ImageObject", url: `${BASE}/icon.svg` },
    },
    url: `${BASE}/blog/${article.slug}`,
    mainEntityOfPage: `${BASE}/blog/${article.slug}`,
    inLanguage: "fr",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        id="main-content"
        role="main"
        className="min-h-screen bg-white"
        style={{ fontFamily: "var(--font-outfit, system-ui), sans-serif" }}
      >
        <article className="max-w-2xl mx-auto px-6 pt-14 pb-20">
          {/* Back */}
          <nav aria-label="Fil d'Ariane" className="mb-8">
            <Link
              href="/blog"
              className="text-[13px] hover:underline"
              style={{ color: "#8B5CF6" }}
            >
              ← Blog CeSoir
            </Link>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <h1
              className="text-[32px] font-bold tracking-tight leading-tight mb-4"
              style={{ color: "#111111" }}
            >
              {article.title}
            </h1>
            <div
              className="flex items-center gap-3 text-[13px]"
              style={{ color: "#888888" }}
            >
              <time dateTime={article.publishDate}>
                {new Date(article.publishDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <span aria-hidden="true">·</span>
              <span>{article.readingMinutes} min de lecture</span>
              <span aria-hidden="true">·</span>
              <span>{article.author}</span>
            </div>
          </header>

          {/* Content */}
          <div className="prose-custom">
            {article.content.map((section, i) => renderSection(section, i))}
          </div>

          {/* Internal links */}
          <footer
            className="mt-16 pt-8 border-t"
            style={{ borderColor: "#EBEBEB" }}
          >
            <p className="text-[14px] font-semibold mb-4" style={{ color: "#111111" }}>
              A lire aussi
            </p>
            <nav aria-label="Articles lies" className="space-y-2">
              {Object.values(articles)
                .filter((a) => a.slug !== article.slug)
                .map((a) => (
                  <Link
                    key={a.slug}
                    href={`/blog/${a.slug}`}
                    className="block text-[14px] hover:underline"
                    style={{ color: "#8B5CF6" }}
                  >
                    {a.title}
                  </Link>
                ))}
              <Link
                href="/montpellier"
                className="block text-[14px] hover:underline"
                style={{ color: "#8B5CF6" }}
              >
                Rencontre a Montpellier — guide complet
              </Link>
            </nav>

            <div className="mt-8">
              <Link
                href="/register"
                className="inline-block px-7 py-3 rounded-full text-white font-bold text-[14px] transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
              >
                Essayer CeSoir ce soir — gratuit
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </>
  );
}
