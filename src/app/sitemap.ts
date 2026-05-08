import type { MetadataRoute } from "next";

const SEO_ARTICLES = [
  "10-lieux-premier-rendez-vous-montpellier",
  "pourquoi-ce-soir-bat-long-term-rencontres-2026",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cesoir-app.vercel.app";
  const now = new Date();

  const blogEntries: MetadataRoute.Sitemap = SEO_ARTICLES.map((slug) => ({
    url: `${base}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    // SEO local — high priority for "rencontre Montpellier" keyword cluster
    { url: `${base}/montpellier`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...blogEntries,
    { url: `${base}/invite`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/browse`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/modes`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/safety`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
