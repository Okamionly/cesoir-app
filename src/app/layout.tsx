import type { Metadata, Viewport } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", weight: ["500", "700"] });

export const metadata: Metadata = {
  title: {
    default: "CeSoir — Trouve quelqu'un pour ce soir",
    template: "%s | CeSoir",
  },
  description: "L'app qui connecte les gens seuls ce soir. 14 modes, matching en temps reel, gratuit.",
  keywords: "rencontre, sortie, ce soir, dating, plan, soiree, Paris",
  metadataBase: new URL("https://cesoir-app.vercel.app"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "CeSoir — Trouve quelqu'un pour ce soir",
    description: "L'app qui connecte les gens seuls ce soir. 14 modes, matching en temps reel, gratuit.",
    url: "https://cesoir-app.vercel.app",
    siteName: "CeSoir",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CeSoir — Trouve quelqu'un pour ce soir" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CeSoir — Trouve quelqu'un pour ce soir",
    description: "L'app qui connecte les gens seuls ce soir. 14 modes, matching en temps reel, gratuit.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CeSoir",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${outfit.variable} ${spaceGrotesk.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "CeSoir",
              "url": "https://cesoir-app.vercel.app",
              "description": "14 modes de rencontre pour ne plus etre seul(e) ce soir. 100% gratuit.",
              "applicationCategory": "SocialNetworkingApplication",
              "operatingSystem": "All",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
              "publisher": { "@type": "Organization", "name": "CeSoir", "logo": "https://cesoir-app.vercel.app/icon.svg" },
            }),
          }}
        />
      </head>
      <body className="min-h-full text-text font-sans" style={{ backgroundColor: "var(--color-bg, #FFFFFF)" }}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-full focus:gradient-bg focus:text-white focus:text-sm focus:font-semibold">
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
