import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/montpellier",
        "/blog/",
        "/invite",
      ],
      disallow: [
        "/api/",
        // App-internal routes — not useful for crawlers
        "/(app)/",
        "/admin/",
      ],
    },
    sitemap: "https://cesoir-app.vercel.app/sitemap.xml",
  };
}
