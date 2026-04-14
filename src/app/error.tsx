"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <span className="text-4xl mb-4">😕</span>
      <h1 className="text-xl font-bold mb-2">Oups, quelque chose a plante</h1>
      <p className="text-sm text-text-muted mb-6">Pas de panique, ca arrive meme aux meilleurs.</p>
      <button onClick={reset} className="gradient-bg text-white font-semibold py-3 px-8 rounded-full text-sm">
        Reessayer
      </button>
    </div>
  );
}
