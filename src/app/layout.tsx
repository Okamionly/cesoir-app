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
  description: "L'app qui te connecte avec des gens pres de toi, disponibles ce soir. 9 modes de rencontre. 100% gratuit.",
  metadataBase: new URL("https://cesoir-app.vercel.app"),
  openGraph: {
    title: "CeSoir — Trouve quelqu'un ce soir",
    description: "9 modes de rencontre pour ne plus etre seul(e) ce soir. Diner, langues, chiens, events... 100% gratuit.",
    url: "https://cesoir-app.vercel.app",
    siteName: "CeSoir",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CeSoir — Trouve quelqu'un ce soir",
    description: "9 modes de rencontre. Ce soir, pas demain.",
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
      <body className="min-h-full bg-bg text-text font-sans">{children}</body>
    </html>
  );
}
