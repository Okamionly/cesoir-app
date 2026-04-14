import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <span className="text-5xl mb-4">☾</span>
      <h1 className="font-display text-3xl font-bold mb-2">404</h1>
      <p className="text-sm text-text-muted mb-6">Cette page n&apos;existe pas. Peut-etre qu&apos;elle sort ce soir ?</p>
      <Link href="/" className="gradient-bg text-white font-semibold py-3 px-8 rounded-full text-sm">
        Retour a l&apos;accueil
      </Link>
    </div>
  );
}
