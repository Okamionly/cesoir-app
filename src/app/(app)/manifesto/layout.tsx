import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manifesto CeSoir",
  description:
    "Personne ne dine seul ce soir a Montpellier. Le manifesto fondateur : pourquoi CeSoir, le probleme de l'isolement urbain, l'insight plan-first, vision 5 ans.",
};

export default function ManifestoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
