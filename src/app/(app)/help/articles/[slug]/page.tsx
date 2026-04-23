import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CATEGORY_LABELS,
  getArticleBySlug,
  HELP_ARTICLES,
} from "../../articles-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article introuvable — CeSoir" };
  return {
    title: `${article.title} — Centre d'aide CeSoir`,
    description: article.summary,
  };
}

export default async function HelpArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const paragraphs = article.content.split("\n\n");
  const related = HELP_ARTICLES.filter(
    (a) => a.slug !== article.slug && a.category === article.category,
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-bg px-5 py-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/help"
          className="inline-flex items-center gap-1 text-accent text-[13px] font-semibold mb-4"
        >
          &larr; Centre d&apos;aide
        </Link>

        <span className="inline-block text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
          {CATEGORY_LABELS[article.category]}
        </span>

        <h1 className="text-[26px] font-black text-text mb-3 leading-tight">
          {article.title}
        </h1>
        <p className="text-[14px] text-text-muted leading-relaxed mb-6">
          {article.summary}
        </p>

        <article className="prose prose-sm max-w-none">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-[14px] text-text leading-relaxed mb-4 whitespace-pre-line"
            >
              {p}
            </p>
          ))}
        </article>

        {related.length > 0 && (
          <section className="mt-10 pt-6 border-t border-border">
            <h2 className="text-[15px] font-bold text-text mb-4">
              Articles lies
            </h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/help/articles/${r.slug}`}
                    className="block p-3 bg-bg-card border border-border rounded-xl hover:border-accent/30 transition-colors"
                  >
                    <p className="text-[13px] font-bold text-text">{r.title}</p>
                    <p className="text-[11px] text-text-muted mt-1">
                      {r.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 p-4 bg-accent/5 border border-accent/20 rounded-2xl text-center">
          <p className="text-[13px] text-text-muted mb-3">
            Cet article ne repond pas a ta question ?
          </p>
          <a
            href={`mailto:support@cesoir.app?subject=Question%20sur%20${encodeURIComponent(
              article.title,
            )}`}
            className="text-accent font-semibold text-[13px] underline"
          >
            Contacte notre equipe
          </a>
        </div>
      </div>
    </div>
  );
}
