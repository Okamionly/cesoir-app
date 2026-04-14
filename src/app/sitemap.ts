import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cesoir-app.vercel.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/browse`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/modes`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/safety`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/cgu`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
