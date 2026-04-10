import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CeSoir - Trouve quelqu'un ce soir",
    short_name: "CeSoir",
    description: "9 modes de rencontre pour ne plus etre seul(e) ce soir",
    start_url: "/browse",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
