/**
 * /blog — blog index page (W2-8).
 *
 * Lists all seed articles + link to /montpellier.
 * Static server component — pure SEO.
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog CeSoir — conseils rencontre a Montpellier",
  description:
    "Conseils pour rencontrer quelqu'un ce soir a Montpellier. Lieux, modes de rencontre, pourquoi l'immediat bat le planifie.",
  alternates: { canonical: "https://cesoir-app.vercel.app/blog" },
  openGraph: {
    title: "Blog CeSoir — conseils rencontre a Montpellier",
    description: "Guides et conseils pour la rencontre immedite a Montpellier.",
    locale: "fr_FR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const posts = [
  {
    slug: "10-lieux-premier-rendez-vous-montpellier",
    title: "10 lieux pour un premier rendez-vous a Montpellier",
    excerpt:
      "Place de la Comedie, Arceaux, Palavas — les 10 spots valides par la communaute CeSoir pour un premier RDV reussi.",
    minutes: 7,
    tag: "Lieux",
  },
  {
    slug: "pourquoi-ce-soir-bat-long-term-rencontres-2026",
    title: "Pourquoi 'ce soir' bat 'long-term' pour les rencontres en 2026",
    excerpt:
      "Les apps de dating ont tue l'impulsion. Voici pourquoi la generation 2026 abandonne le matching a long terme.",
    minutes: 6,
    tag: "Culture",
  },
];

export default function BlogIndexPage() {
  return (
    <main
      id="main-content"
      role="main"
      className="min-h-screen bg-white"
      style={{ fontFamily: "var(--font-outfit, system-ui), sans-serif" }}
    >
      <div className="max-w-2xl mx-auto px-6 pt-14 pb-20">
        {/* Header */}
        <header className="mb-12 text-center">
          <Link
            href="/"
            className="inline-block text-[28px] mb-4"
            aria-label="CeSoir accueil"
          >
            ☾
          </Link>
          <h1
            className="text-[32px] font-bold tracking-tight mb-3"
            style={{ color: "#111111" }}
          >
            Blog CeSoir
          </h1>
          <p className="text-[16px]" style={{ color: "#666666" }}>
            Conseils pour rencontrer quelqu&apos;un ce soir a Montpellier.
          </p>
        </header>

        {/* Articles */}
        <section aria-labelledby="articles-heading">
          <h2 id="articles-heading" className="sr-only">
            Articles
          </h2>
          <div className="space-y-5">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="rounded-2xl border p-6 transition-colors hover:border-violet-300"
                style={{ borderColor: "#EBEBEB" }}
              >
                <Link href={`/blog/${post.slug}`} className="block group">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: "#8B5CF615", color: "#8B5CF6" }}
                    >
                      {post.tag}
                    </span>
                    <span className="text-[12px]" style={{ color: "#AAAAAA" }}>
                      {post.minutes} min de lecture
                    </span>
                  </div>
                  <h2
                    className="text-[19px] font-bold mb-2 group-hover:underline"
                    style={{ color: "#111111", textDecorationColor: "#8B5CF6" }}
                  >
                    {post.title}
                  </h2>
                  <p className="text-[14px] leading-relaxed" style={{ color: "#666666" }}>
                    {post.excerpt}
                  </p>
                  <p
                    className="mt-3 text-[13px] font-semibold"
                    style={{ color: "#8B5CF6" }}
                  >
                    Lire l&apos;article →
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Local SEO link */}
        <section className="mt-12 rounded-2xl border p-6" style={{ borderColor: "#EBEBEB", background: "#FAFAFA" }}>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: "#111111" }}>
            Guide complet — Rencontre a Montpellier
          </h2>
          <p className="text-[14px] mb-4" style={{ color: "#666666" }}>
            Tout ce qu&apos;il faut savoir sur CeSoir a Montpellier : comment ca marche,
            les lieux populaires, les temoignages locaux et la FAQ.
          </p>
          <Link
            href="/montpellier"
            className="inline-block px-5 py-2.5 rounded-full font-semibold text-[13px] text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
          >
            Voir le guide Montpellier
          </Link>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-[16px] mb-4" style={{ color: "#444444" }}>
            Pret a trouver quelqu&apos;un ce soir ?
          </p>
          <Link
            href="/register"
            className="inline-block px-7 py-3.5 rounded-full text-white font-bold text-[15px] shadow-md transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
          >
            Creer mon compte — gratuit
          </Link>
        </div>
      </div>
    </main>
  );
}
