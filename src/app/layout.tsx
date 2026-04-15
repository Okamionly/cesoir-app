import type { Metadata, Viewport } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", weight: ["500", "700"] });

export const metadata: Metadata = {
  title: {
    default: "CeSoir — Trouve quelqu'un ce soir",
    template: "%s | CeSoir",
  },
  description: "L'app qui te connecte avec des gens pres de toi, disponibles ce soir. 14 modes de rencontre. 100% gratuit.",
  metadataBase: new URL("https://cesoir-app.vercel.app"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "CeSoir — Trouve quelqu'un ce soir",
    description: "14 modes de rencontre pour ne plus etre seul(e) ce soir. Diner, sport, langues, chiens, gaming... 100% gratuit.",
    url: "https://cesoir-app.vercel.app",
    siteName: "CeSoir",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/icon.svg", width: 512, height: 512, alt: "CeSoir logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CeSoir — Trouve quelqu'un ce soir",
    description: "14 modes de rencontre. Ce soir, pas demain.",
    images: ["/icon.svg"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CeSoir",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
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
      <body className="min-h-full bg-bg text-text font-sans">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-full focus:gradient-bg focus:text-white focus:text-sm focus:font-semibold">
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
