"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  HELP_ARTICLES,
  searchArticles,
  type HelpCategory,
} from "./articles-data";

const CATEGORY_EMOJI: Record<HelpCategory, string> = {
  "getting-started": "🚀",
  profile: "👤",
  matching: "💘",
  safety: "🛡️",
  events: "🎉",
  premium: "⭐",
  privacy: "🔐",
  troubleshooting: "🔧",
};

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<HelpCategory | "all">("all");

  const filtered = useMemo(() => {
    let articles = query.trim() ? searchArticles(query) : HELP_ARTICLES;
    if (activeCategory !== "all") {
      articles = articles.filter((a) => a.category === activeCategory);
    }
    return articles;
  }, [query, activeCategory]);

  const categories = Object.entries(CATEGORY_LABELS) as [HelpCategory, string][];

  return (
    <div className="min-h-screen bg-bg px-5 py-8 pb-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-[28px] font-black text-text mb-1">Centre d&apos;aide</h1>
        <p className="text-[13px] text-text-muted mb-6">
          Reponses aux questions les plus frequentes. Si tu ne trouves pas,
          ecris-nous a{" "}
          <a
            href="mailto:support@cesoir.app"
            className="text-accent underline font-semibold"
          >
            support@cesoir.app
          </a>
          .
        </p>

        <div className="relative mb-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl text-[14px] text-text placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
              activeCategory === "all"
                ? "gradient-bg text-white"
                : "bg-bg-card border border-border text-text-muted hover:text-text"
            }`}
          >
            Tout ({HELP_ARTICLES.length})
          </button>
          {categories.map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                activeCategory === cat
                  ? "gradient-bg text-white"
                  : "bg-bg-card border border-border text-text-muted hover:text-text"
              }`}
            >
              {CATEGORY_EMOJI[cat]} {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[14px] text-text-muted mb-2">
              Aucun article ne correspond a &quot;{query}&quot;.
            </p>
            <p className="text-[13px] text-text-muted">
              Essaie d&apos;autres mots-cles ou{" "}
              <a
                href="mailto:support@cesoir.app"
                className="text-accent underline"
              >
                contacte-nous
              </a>
              .
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/help/articles/${article.slug}`}
                  className="block p-4 bg-bg-card border border-border rounded-xl hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[20px] shrink-0">
                      {CATEGORY_EMOJI[article.category]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-text mb-1">
                        {article.title}
                      </p>
                      <p className="text-[12px] text-text-muted leading-relaxed">
                        {article.summary}
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-semibold text-accent uppercase tracking-wider">
                        {CATEGORY_LABELS[article.category]}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 p-5 bg-accent/5 border border-accent/20 rounded-2xl text-center">
          <p className="text-[14px] font-bold text-text mb-2">
            Besoin d&apos;aide supplementaire ?
          </p>
          <p className="text-[13px] text-text-muted mb-4">
            Notre equipe te repond sous 24h en semaine.
          </p>
          <a
            href="mailto:support@cesoir.app"
            className="inline-block gradient-bg text-white px-6 py-2 rounded-full text-[13px] font-semibold shadow-glow"
          >
            Ecrire a l&apos;equipe
          </a>
        </div>
      </div>
    </div>
  );
}
