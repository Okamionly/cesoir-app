import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Animated orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[400px] h-[400px] rounded-full bg-[#a855f7] opacity-20 blur-[120px] -top-20 -right-20"
          style={{ animation: "float 8s ease-in-out infinite" }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full bg-[#ec4899] opacity-15 blur-[100px] -bottom-16 -left-20"
          style={{ animation: "float 10s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute w-[200px] h-[200px] rounded-full bg-[#6366f1] opacity-10 blur-[80px] top-1/2 left-1/4"
          style={{ animation: "float 12s ease-in-out infinite" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Moon with float */}
        <span
          className="text-7xl mb-6 drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]"
          style={{ animation: "float 6s ease-in-out infinite" }}
        >
          ☾
        </span>

        {/* 404 in gradient text */}
        <h1
          className="text-[120px] font-black tracking-tighter leading-none mb-4"
          style={{
            background: "linear-gradient(135deg, #a855f7, #00FF88)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </h1>

        {/* Tagline */}
        <p className="text-[16px] sm:text-[18px] text-white/50 font-light mb-10 max-w-xs leading-relaxed">
          Cette page n&apos;existe pas... mais ta soiree, si.
        </p>

        {/* CTA button */}
        <Link
          href="/"
          className="px-8 py-3.5 rounded-full text-[15px] font-semibold text-white transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #a855f7, #00FF88)",
            boxShadow: "0 0 40px rgba(139,92,246,0.3)",
          }}
        >
          Retour a l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
